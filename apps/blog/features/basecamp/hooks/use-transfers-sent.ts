'use client';

import { useQuery } from '@tanstack/react-query';
import { getChain } from '@transaction/lib/chain';
import { operationTypeIdOf } from './operation-types';
import { StaleTime } from '@/blog/lib/react-query';
import {
  createTransferSheet,
  EMPTY_TRANSFERS,
  foldTransfers,
  summarizeTransfers,
  type TransferEvent
} from '../lib/transfers';

/**
 * The money this account has sent to other people.
 *
 * The mirror of the payers read, and it turns on the same one parameter:
 * `participation-mode: 'include'` keeps only the operations this account
 * *began*, and the account that begins a transfer is the one paying. Measured
 * on an account with 3,937 transfer records, the two modes split them 243 sent
 * and 3,694 received with nothing landing on the wrong side.
 */
const TRANSFER_OPERATION_NAME = 'transfer_operation';

/** The node refuses anything larger. */
const TRANSFER_PAGE_SIZE = 1000;

/**
 * How many pages the panel will read before it stops and says so. The same
 * ceiling the payers read uses: this is a research panel opened on one account
 * at a time, but one account must still not cost twenty thousand rows.
 */
const MAX_TRANSFER_PAGES = 5;

/** The asset identifiers Hive stamps on an amount. */
const NAI_HIVE = '@@000000021';
const NAI_HBD = '@@000000013';

interface NaiAsset {
  nai?: unknown;
  amount?: unknown;
  precision?: unknown;
}

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

async function transferOpTypeId(): Promise<number> {
  const id = await operationTypeIdOf(TRANSFER_OPERATION_NAME);
  if (id === undefined) throw new Error('Missing Hive operation type id for transfers');
  return id;
}

/** One outgoing record, or nothing where it is not one. */
function toTransfer(
  operation: { op?: { value?: unknown }; timestamp?: unknown },
  account: string
): TransferEvent | null {
  const value = operation.op?.value as Record<string, unknown> | undefined;
  if (!value) return null;
  const to = typeof value.to === 'string' ? value.to : '';
  // A transfer to themselves is not money going anywhere.
  if (value.from !== account || to === '' || to === account) return null;
  const nai = assetNai(value.amount);
  const amount = assetValue(value.amount);
  if (amount === null || (nai !== NAI_HIVE && nai !== NAI_HBD)) return null;
  return {
    counterparty: to,
    kind: nai === NAI_HBD ? 'hbd' : 'hive',
    amount,
    timestampMs: parseHiveTimestamp(operation.timestamp),
    memo: typeof value.memo === 'string' ? value.memo : ''
  };
}

interface TransferPage {
  events: TransferEvent[];
  returned: number;
  total: number;
  pages: number;
}

async function fetchTransferPage(account: string, opTypeId: number, page?: number): Promise<TransferPage> {
  const chain = await getChain();
  const response = await chain.restApi['hafah-api'].accountsOperations({
    'account-name': account,
    'operation-types': String(opTypeId),
    'transacting-account-name': account,
    'participation-mode': 'include',
    'page-size': TRANSFER_PAGE_SIZE,
    ...(page === undefined ? {} : { page })
  });

  const operations = response.operations_result ?? [];
  const events: TransferEvent[] = [];
  for (const operation of operations) {
    const transfer = toTransfer(operation, account);
    if (transfer) events.push(transfer);
  }

  return {
    events,
    returned: operations.length,
    total: Number.isFinite(response.total_operations) ? response.total_operations : operations.length,
    pages: Number.isFinite(response.total_pages) ? response.total_pages : 1
  };
}

export async function fetchTransfersSent(account: string) {
  const opTypeId = await transferOpTypeId();
  const read = (page?: number) => fetchTransferPage(account, opTypeId, page);

  // The endpoint pages from the OLDEST record, so asking with no page returns
  // the newest — a remainder, and the only page whose number is not known in
  // advance. The full pages behind it are then read together.
  const newest = await read();
  const older: Promise<TransferPage>[] = [];
  for (let page = newest.pages - 1; page >= 1 && older.length < MAX_TRANSFER_PAGES - 1; page--) {
    older.push(read(page));
  }
  const rest = await Promise.all(older);

  const sheet = createTransferSheet();
  let returned = newest.returned;
  foldTransfers(sheet, newest.events);
  for (const page of rest) {
    returned += page.returned;
    foldTransfers(sheet, page.events);
  }

  return summarizeTransfers(sheet, newest.total > returned);
}

export type TransfersSentStatus = 'idle' | 'loading' | 'ready' | 'unavailable';

/**
 * Where this account's money goes, ranked. Only read when the panel is open.
 */
export function useTransfersSent(account: string, enabled = true) {
  const isEnabled = enabled && Boolean(account);
  const { data, isError } = useQuery({
    queryKey: ['basecampTransfersSent', account] as const,
    queryFn: () => fetchTransfersSent(account),
    enabled: isEnabled,
    staleTime: StaleTime.MEDIUM,
    // One retry, as on the other thousand-operation reads: a single timeout on
    // a busy public node would otherwise leave the panel blank.
    retry: 1
  });

  let status: TransfersSentStatus;
  if (isError) status = 'unavailable';
  else if (data) status = 'ready';
  else if (isEnabled) status = 'loading';
  else status = 'idle';

  return { sent: status === 'ready' && data ? data : EMPTY_TRANSFERS, status };
}
