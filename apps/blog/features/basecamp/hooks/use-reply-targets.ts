'use client';

import { useQuery } from '@tanstack/react-query';
import { getChain } from '@transaction/lib/chain';
import { StaleTime } from '@/blog/lib/react-query';
import {
  createReplyTargetSheet,
  EMPTY_REPLY_TARGETS,
  foldReplies,
  foldRewards,
  summarizeReplyTargets,
  type ReplyRecord,
  type RewardRecord
} from '../lib/reply-targets';

/**
 * The two halves of the question.
 *
 * `comment_operation` says who a reply was addressed to; `author_reward_operation`
 * says what one of the account's permlinks was paid. Neither answers on its
 * own, so both are read and joined on the permlink.
 */
const COMMENT_OPERATION_NAME = 'comment_operation';
const AUTHOR_REWARD_OPERATION_NAME = 'author_reward_operation';

/** The node refuses anything larger. */
const PAGE_SIZE = 1000;

/**
 * How many pages of each are read before the panel stops and says so.
 *
 * Comments are the expensive half: the endpoint returns every body in full and
 * there is no way to ask it not to — `data-size-limit` replaces the whole
 * operation with a placeholder rather than trimming the body, so the fields
 * this needs would go with it. Five pages is a few megabytes on a talkative
 * account, which is why none of it happens until somebody opens the panel.
 */
const MAX_PAGES = 5;

interface NaiAsset {
  amount?: unknown;
  precision?: unknown;
}

/** `{ amount: "125000", precision: 3 }` -> 125. Zero where it is not an amount. */
function assetValue(asset: unknown): number {
  if (typeof asset !== 'object' || asset === null) return 0;
  const { amount, precision } = asset as NaiAsset;
  const raw = Number(amount);
  const places = Number(precision);
  if (!Number.isFinite(raw) || !Number.isFinite(places)) return 0;
  return raw / 10 ** places;
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

const cachedOpTypeIds = new Map<string, number>();

async function opTypeId(name: string): Promise<number> {
  const cached = cachedOpTypeIds.get(name);
  if (cached !== undefined) return cached;
  const chain = await getChain();
  const opTypes = await chain.restApi['hafah-api']['operation-types']();
  const id = opTypes.find((opType) => opType.operation_name === name)?.op_type_id;
  if (id === undefined) throw new Error(`Missing Hive operation type id for ${name}`);
  cachedOpTypeIds.set(name, id);
  return id;
}

interface Page<T> {
  records: T[];
  returned: number;
  total: number;
  pages: number;
}

async function fetchPage<T>(
  account: string,
  opTypeId: number,
  /** 'include' keeps only the operations the account began; omitted for virtual ops, which nobody began. */
  mode: 'include' | undefined,
  toRecord: (operation: { op?: { value?: unknown }; timestamp?: unknown }) => T | null,
  page?: number
): Promise<Page<T>> {
  const chain = await getChain();
  const response = await chain.restApi['hafah-api'].accountsOperations({
    'account-name': account,
    'operation-types': String(opTypeId),
    'page-size': PAGE_SIZE,
    ...(mode === undefined ? {} : { 'transacting-account-name': account, 'participation-mode': mode }),
    ...(page === undefined ? {} : { page })
  });

  const operations = response.operations_result ?? [];
  const records: T[] = [];
  for (const operation of operations) {
    const record = toRecord(operation);
    if (record) records.push(record);
  }

  return {
    records,
    returned: operations.length,
    total: Number.isFinite(response.total_operations) ? response.total_operations : operations.length,
    pages: Number.isFinite(response.total_pages) ? response.total_pages : 1
  };
}

/**
 * Every page the ceiling allows, newest first.
 *
 * The endpoint pages from the OLDEST record, so asking with no page returns the
 * newest — a remainder, and the only page whose number is not known in advance.
 * The full pages behind it are then read one after another.
 *
 * One after another, not together. A page of a thousand comments carries every
 * body in full, and asking for four of those at once leaves the client with
 * megabytes to deserialise in one go: measured here, two of the four pages
 * never came back at all, long after the network had finished with them. Read
 * in turn they all arrive, and the panel is open while it happens.
 */
async function fetchPages<T>(read: (page?: number) => Promise<Page<T>>) {
  const newest = await read();
  const records = [...newest.records];
  let returned = newest.returned;

  let page = newest.pages - 1;
  for (let readPages = 1; page >= 1 && readPages < MAX_PAGES; page--, readPages++) {
    const older = await read(page);
    returned += older.returned;
    records.push(...older.records);
  }

  return { records, capped: newest.total > returned };
}

function toReply(
  operation: { op?: { value?: unknown }; timestamp?: unknown },
  account: string
): ReplyRecord | null {
  const value = operation.op?.value as Record<string, unknown> | undefined;
  if (!value || value.author !== account) return null;
  const permlink = typeof value.permlink === 'string' ? value.permlink : '';
  if (permlink === '') return null;
  return {
    permlink,
    parentAuthor: typeof value.parent_author === 'string' ? value.parent_author : '',
    timestampMs: parseHiveTimestamp(operation.timestamp)
  };
}

function toReward(
  operation: { op?: { value?: unknown }; timestamp?: unknown },
  account: string
): RewardRecord | null {
  const value = operation.op?.value as Record<string, unknown> | undefined;
  if (!value || value.author !== account) return null;
  const permlink = typeof value.permlink === 'string' ? value.permlink : '';
  if (permlink === '') return null;
  return {
    permlink,
    hbd: assetValue(value.hbd_payout),
    hive: assetValue(value.hive_payout),
    vests: assetValue(value.vesting_payout),
    timestampMs: parseHiveTimestamp(operation.timestamp)
  };
}

export async function fetchReplyTargets(account: string) {
  const [commentTypeId, rewardTypeId] = await Promise.all([
    opTypeId(COMMENT_OPERATION_NAME),
    opTypeId(AUTHOR_REWARD_OPERATION_NAME)
  ]);

  const [replies, rewards] = await Promise.all([
    fetchPages((page) =>
      fetchPage(account, commentTypeId, 'include', (operation) => toReply(operation, account), page)
    ),
    fetchPages((page) =>
      fetchPage(account, rewardTypeId, undefined, (operation) => toReward(operation, account), page)
    )
  ]);

  // Replies first, always: a reward can only be placed through a permlink the
  // sheet has already seen.
  const sheet = createReplyTargetSheet(account);
  foldReplies(sheet, replies.records);
  foldRewards(sheet, rewards.records);
  return summarizeReplyTargets(sheet, replies.capped);
}

export type ReplyTargetsStatus = 'idle' | 'loading' | 'ready' | 'unavailable';

/**
 * Who this account replies to, ranked, with what the chain paid for it.
 *
 * No price in the query key. The money column is worked out from the reading
 * rather than baked into it, so a feed rate landing mid-read does not cancel
 * several megabytes of history and start it again.
 */
export function useReplyTargets(account: string, enabled = true) {
  const isEnabled = enabled && Boolean(account);
  const { data, isError } = useQuery({
    queryKey: ['basecampReplyTargets', account] as const,
    queryFn: () => fetchReplyTargets(account),
    enabled: isEnabled,
    staleTime: StaleTime.MEDIUM,
    // One retry, as on the other thousand-operation reads: a single timeout on
    // a busy public node would otherwise leave the panel blank.
    retry: 1
  });

  let status: ReplyTargetsStatus;
  if (isError) status = 'unavailable';
  else if (data) status = 'ready';
  else if (isEnabled) status = 'loading';
  else status = 'idle';

  return { targets: status === 'ready' && data ? data : EMPTY_REPLY_TARGETS, status };
}
