'use client';

import { useQuery } from '@tanstack/react-query';
import { getChain } from '@transaction/lib/chain';
import { StaleTime } from '@/blog/lib/react-query';
import {
  createStakeFlows,
  EMPTY_STAKE_FLOWS,
  foldStakeFlows,
  type StakeFlowEvent
} from '../lib/stake-sources';

/**
 * The records that move stake in or out under the account's own hand.
 *
 * The reward claim is the important one. The account record keeps lifetime
 * author and curation totals, but those are the whole payout in HIVE, half of
 * which never became stake — and they miss beneficiary rewards entirely, which
 * is how a project account can hold thousands of Hive Power while its author
 * total reads nothing. The claim operation states the VESTS that actually
 * landed, whatever kind of reward they were. Measured on three accounts: what
 * was claimed plus what was powered up came to what they hold, to the last
 * whole unit.
 *
 * Money other people put in is read separately, by the payers hook, which can
 * use the chain's direction filter to find it. These three cannot: a power-up
 * an account makes for itself is one it began, and the two virtual operations
 * were begun by nobody at all. So they are read without a direction filter and
 * sorted out by who is named in each record.
 */
const FLOW_OPERATION_NAMES = [
  'transfer_to_vesting_operation',
  'fill_vesting_withdraw_operation',
  'fill_order_operation',
  'claim_reward_balance_operation'
];

/** The node refuses anything larger. */
const FLOW_PAGE_SIZE = 1000;

/**
 * How many pages the panel will read before it stops and says so.
 *
 * These are rare events — powering up, finishing a power-down, a trade filling
 * — so five thousand records is a whole life for any account this panel is
 * opened on, and a ceiling rather than an expectation.
 */
const MAX_FLOW_PAGES = 5;

/** The asset identifier Hive stamps on a HIVE amount. */
const NAI_HIVE = '@@000000021';

interface NaiAsset {
  nai?: unknown;
  amount?: unknown;
  precision?: unknown;
}

/** `{ nai, amount: "125000", precision: 3 }` -> 125. Null when it is not an amount. */
function assetValue(asset: unknown): number | null {
  if (typeof asset !== 'object' || asset === null) return null;
  const { amount, precision } = asset as NaiAsset;
  const raw = Number(amount);
  const places = Number(precision);
  if (!Number.isFinite(raw) || !Number.isFinite(places)) return null;
  return raw / 10 ** places;
}

function isHive(asset: unknown): boolean {
  if (typeof asset !== 'object' || asset === null) return false;
  return (asset as NaiAsset).nai === NAI_HIVE;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Hive history timestamps are UTC but arrive with no timezone designator, so a
 * reader would take them as local time. The 'Z' is added here once.
 */
function parseHiveTimestamp(timestamp: unknown): number {
  if (timestamp instanceof Date) return timestamp.getTime();
  if (typeof timestamp !== 'string') return Number.NaN;
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/.test(timestamp) ? timestamp : `${timestamp}Z`;
  return new Date(normalized).getTime();
}

let cachedOpTypeIds: number[] | null = null;

async function flowOpTypeIds(): Promise<number[]> {
  if (cachedOpTypeIds !== null) return cachedOpTypeIds;
  const chain = await getChain();
  const opTypes = await chain.restApi['hafah-api']['operation-types']();
  const ids = FLOW_OPERATION_NAMES.map(
    (name) => opTypes.find((opType) => opType.operation_name === name)?.op_type_id
  ).filter((id): id is number => id !== undefined);
  if (ids.length === 0) throw new Error('Missing Hive operation type ids for stake flows');
  cachedOpTypeIds = ids;
  return ids;
}

/** A trade that filled: what the account paid, and what it got back. */
function toTrade(
  value: Record<string, unknown>,
  account: string,
  timestampMs: number
): StakeFlowEvent | null {
  const isCurrent = text(value.current_owner) === account;
  const isOpen = text(value.open_owner) === account;
  if (!isCurrent && !isOpen) return null;
  const received = isCurrent ? value.open_pays : value.current_pays;
  const paid = isCurrent ? value.current_pays : value.open_pays;
  const counterparty = text(isCurrent ? value.open_owner : value.current_owner) || null;

  if (isHive(received)) {
    const amount = assetValue(received);
    return amount === null ? null : { kind: 'marketBuy', counterparty, amount, timestampMs };
  }
  if (isHive(paid)) {
    const amount = assetValue(paid);
    return amount === null ? null : { kind: 'marketSell', counterparty, amount, timestampMs };
  }
  return null;
}

/** One record, turned into the shape lib/stake-sources.ts folds, or dropped. */
function toFlow(
  operation: { op?: { type?: string; value?: unknown }; timestamp?: unknown },
  account: string
): StakeFlowEvent | null {
  const value = operation.op?.value as Record<string, unknown> | undefined;
  if (!value) return null;
  const timestampMs = parseHiveTimestamp(operation.timestamp);

  if (operation.op?.type === 'transfer_to_vesting_operation') {
    const from = text(value.from);
    if (from !== account) return null;
    // An empty `to` is the chain's way of saying "to myself".
    const to = text(value.to) || from;
    const amount = assetValue(value.amount);
    if (amount === null) return null;
    return to === account
      ? { kind: 'powerUpSelf', counterparty: null, amount, timestampMs }
      : { kind: 'powerUpGiven', counterparty: to, amount, timestampMs };
  }

  if (operation.op?.type === 'fill_vesting_withdraw_operation') {
    if (text(value.from_account) !== account) return null;
    const vests = assetValue(value.withdrawn);
    if (vests === null) return null;
    return {
      kind: 'powerDown',
      counterparty: text(value.to_account) || null,
      amount: vests,
      timestampMs
    };
  }

  if (operation.op?.type === 'claim_reward_balance_operation') {
    if (text(value.account) !== account) return null;
    const vests = assetValue(value.reward_vests);
    if (vests === null || vests <= 0) return null;
    return { kind: 'rewardClaim', counterparty: null, amount: vests, timestampMs };
  }

  if (operation.op?.type === 'fill_order_operation') return toTrade(value, account, timestampMs);
  return null;
}

interface FlowPage {
  events: StakeFlowEvent[];
  returned: number;
  /** What the node says the whole filtered history holds. */
  total: number;
  pages: number;
}

/**
 * One page of the account's own stake movements.
 *
 * No `participation-mode` here, unlike every other read in this feature: two
 * of the three operations are virtual, with no account that "began" them, so
 * filtering by who transacted would quietly drop them. The records are sorted
 * out afterwards by the names inside them instead.
 */
async function fetchFlowPage(account: string, opTypeIds: number[], page?: number): Promise<FlowPage> {
  const chain = await getChain();
  const response = await chain.restApi['hafah-api'].accountsOperations({
    'account-name': account,
    'operation-types': opTypeIds.join(','),
    'page-size': FLOW_PAGE_SIZE,
    ...(page === undefined ? {} : { page })
  });

  const operations = response.operations_result ?? [];
  const events: StakeFlowEvent[] = [];
  for (const operation of operations) {
    const flow = toFlow(operation, account);
    if (flow) events.push(flow);
  }

  return {
    events,
    returned: operations.length,
    total: Number.isFinite(response.total_operations) ? response.total_operations : operations.length,
    pages: Number.isFinite(response.total_pages) ? response.total_pages : 1
  };
}

export async function fetchStakeFlows(account: string) {
  const opTypeIds = await flowOpTypeIds();
  const read = (page?: number) => fetchFlowPage(account, opTypeIds, page);

  // The endpoint pages from the OLDEST record, so asking with no page returns
  // the newest — a remainder page, and the only one whose number is not known
  // in advance. The full pages behind it are then read together.
  const newest = await read();
  const older: Promise<FlowPage>[] = [];
  for (let page = newest.pages - 1; page >= 1 && older.length < MAX_FLOW_PAGES - 1; page--) {
    older.push(read(page));
  }
  const rest = await Promise.all(older);

  const flows = createStakeFlows();
  let returned = newest.returned;
  foldStakeFlows(flows, newest.events);
  for (const page of rest) {
    returned += page.returned;
    foldStakeFlows(flows, page.events);
  }
  flows.complete = returned >= newest.total;
  return flows;
}

export type StakeFlowsStatus = 'idle' | 'loading' | 'ready' | 'unavailable';

/**
 * What the account itself did with its stake: powered up, powered down, traded.
 *
 * `enabled` keeps this off the feed entirely — it is only ever asked for when
 * somebody opens the panel.
 */
export function useStakeFlows(account: string, enabled = true) {
  const isEnabled = enabled && Boolean(account);
  const { data, isError } = useQuery({
    queryKey: ['basecampStakeFlows', account] as const,
    queryFn: () => fetchStakeFlows(account),
    enabled: isEnabled,
    staleTime: StaleTime.MEDIUM,
    // One retry, as on the other thousand-operation reads: a single timeout on
    // a busy public node would otherwise leave the panel blank.
    retry: 1
  });

  let status: StakeFlowsStatus;
  if (isError) status = 'unavailable';
  else if (data) status = 'ready';
  else if (isEnabled) status = 'loading';
  else status = 'idle';

  return { flows: status === 'ready' && data ? data : EMPTY_STAKE_FLOWS, status };
}
