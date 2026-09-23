'use client';

import { useQuery } from '@tanstack/react-query';
import { getChain } from '@transaction/lib/chain';
import { operationTypeIdsOf } from './operation-types';
import { StaleTime } from '@/blog/lib/react-query';
import { withRetry } from '../lib/retry';
import {
  createPayerSheet,
  EMPTY_PAYERS,
  foldPayments,
  summarizePayers,
  type MoneyRates,
  type PaymentEvent
} from '../lib/payers';

/**
 * The four ways money arrives from somebody else.
 *
 * `recurrent_transfer_operation` is deliberately not here: that is the
 * instruction to pay, not a payment. The fill is the money actually moving,
 * and counting both would count every scheduled payment twice — once before it
 * happened.
 */
const PAYMENT_OPERATION_NAMES = [
  'transfer_operation',
  'transfer_to_vesting_operation',
  'delegate_vesting_shares_operation',
  'fill_recurrent_transfer_operation'
];

/** The node refuses anything larger. */
const PAYMENT_PAGE_SIZE = 1000;

/**
 * How many pages the panel will read before it stops and says so.
 *
 * The endpoint pages from the OLDEST record: asking with no page returns the
 * newest page, which on an account with 1,308 records is a remainder of 308 —
 * showing that alone would badly understate who has paid. So the newest page
 * is read first to learn how many there are, and the full pages behind it are
 * then read together. Five is a deliberate ceiling: this is a research panel
 * that opens on one account at a time, not a feed, but a single account must
 * still not cost twenty thousand rows.
 */
const MAX_PAYMENT_PAGES = 5;

/** The asset identifiers Hive stamps on an amount. */
const NAI_HIVE = '@@000000021';
const NAI_HBD = '@@000000013';

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

function assetNai(asset: unknown): string | null {
  if (typeof asset !== 'object' || asset === null) return null;
  const { nai } = asset as NaiAsset;
  return typeof nai === 'string' ? nai : null;
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

async function paymentOpTypeIds(): Promise<number[]> {
  const ids = (await operationTypeIdsOf(PAYMENT_OPERATION_NAMES)).filter(
    (id): id is number => id !== undefined
  );
  if (ids.length === 0) throw new Error('Missing Hive operation type ids for incoming payments');
  return ids;
}

/** One incoming money record, turned into the shape lib/payers.ts folds. */
function toPayment(operation: { op?: { type?: string; value?: unknown }; timestamp?: unknown }, account: string) {
  const value = operation.op?.value as Record<string, unknown> | undefined;
  if (!value) return null;
  const timestampMs = parseHiveTimestamp(operation.timestamp);

  if (operation.op?.type === 'delegate_vesting_shares_operation') {
    const delegator = typeof value.delegator === 'string' ? value.delegator : '';
    if (value.delegatee !== account || delegator === '' || delegator === account) return null;
    const vests = assetValue(value.vesting_shares);
    if (vests === null) return null;
    return { payer: delegator, kind: 'delegation', amount: vests, timestampMs } satisfies PaymentEvent;
  }

  const from = typeof value.from === 'string' ? value.from : '';
  if (value.to !== account || from === '' || from === account) return null;

  if (operation.op?.type === 'transfer_to_vesting_operation') {
    const hive = assetValue(value.amount);
    if (hive === null) return null;
    return { payer: from, kind: 'powerUp', amount: hive, timestampMs } satisfies PaymentEvent;
  }

  const nai = assetNai(value.amount);
  const amount = assetValue(value.amount);
  if (amount === null || (nai !== NAI_HIVE && nai !== NAI_HBD)) return null;
  return {
    payer: from,
    kind: nai === NAI_HBD ? 'hbd' : 'hive',
    amount,
    timestampMs,
    memo: typeof value.memo === 'string' ? value.memo : ''
  } satisfies PaymentEvent;
}

interface PaymentPage {
  events: PaymentEvent[];
  /** How many records the node returned, valid or not. */
  returned: number;
  /** What the node says the whole filtered history holds. */
  total: number;
  pages: number;
}

/**
 * One page of the money other people have put into this account.
 *
 * `participation-mode: 'exclude'` is what makes that possible: it drops the
 * operations this account itself began, and the account that begins a transfer
 * or a delegation is the one paying. Only HAfAH's copy of this endpoint takes
 * that parameter — the hivemind copy returns both directions mixed together,
 * so money sent out would be counted as money coming in.
 */
async function fetchPaymentPage(
  account: string,
  opTypeIds: number[],
  page?: number
): Promise<PaymentPage> {
  const chain = await getChain();
  const response = await chain.restApi['hafah-api'].accountsOperations({
    'account-name': account,
    'operation-types': opTypeIds.join(','),
    'transacting-account-name': account,
    'participation-mode': 'exclude',
    'page-size': PAYMENT_PAGE_SIZE,
    ...(page === undefined ? {} : { page })
  });

  const operations = response.operations_result ?? [];
  const events: PaymentEvent[] = [];
  for (const operation of operations) {
    const payment = toPayment(operation, account);
    if (payment) events.push(payment);
  }

  return {
    events,
    returned: operations.length,
    total: Number.isFinite(response.total_operations) ? response.total_operations : operations.length,
    pages: Number.isFinite(response.total_pages) ? response.total_pages : 1
  };
}

/**
 * Who is paying for this account, from as much of its incoming history as the
 * panel is willing to read.
 */
export async function fetchAccountPayers(account: string, rates: MoneyRates) {
  const opTypeIds = await paymentOpTypeIds();
  // Asked again when the node drops a page, so one dropped connection does
  // not cost the whole panel (lib/retry.ts).
  const read = (page?: number) => withRetry(() => fetchPaymentPage(account, opTypeIds, page));

  // The newest page first: it is the one a reader most wants and the only one
  // whose number is not known in advance.
  const newest = await read();
  const older: Promise<PaymentPage>[] = [];
  for (let page = newest.pages - 1; page >= 1 && older.length < MAX_PAYMENT_PAGES - 1; page--) {
    older.push(read(page));
  }
  const rest = await Promise.all(older);

  const sheet = createPayerSheet();
  let returned = newest.returned;
  // Newest first, so a delegator's standing figure is seen before the older
  // ones that must not replace it (lib/payers.ts).
  foldPayments(sheet, newest.events);
  for (const page of rest) {
    returned += page.returned;
    foldPayments(sheet, page.events);
  }

  return summarizePayers(sheet, rates, newest.total > returned);
}

export type PayersStatus = 'idle' | 'loading' | 'ready' | 'unavailable';

/**
 * Who is paying for this account, ranked.
 *
 * The rates are part of the query key on purpose: the ranking and the shares
 * are computed from them, so an answer worked out before the price feed
 * arrived must not be served afterwards as though it had one.
 */
export function useAccountPayers(account: string, rates: MoneyRates, enabled = true) {
  const isEnabled = enabled && Boolean(account);
  const { data, isError } = useQuery({
    queryKey: ['basecampAccountPayers', account, rates.hbdPerHive, rates.hivePerVest] as const,
    queryFn: () => fetchAccountPayers(account, rates),
    enabled: isEnabled,
    staleTime: StaleTime.MEDIUM,
    // One retry, as on the other thousand-operation reads: a single timeout on
    // a busy public node would otherwise leave the panel blank.
    retry: 1
  });

  let status: PayersStatus;
  if (isError) status = 'unavailable';
  else if (data) status = 'ready';
  else if (isEnabled) status = 'loading';
  else status = 'idle';

  return { payers: status === 'ready' && data ? data : EMPTY_PAYERS, status };
}
