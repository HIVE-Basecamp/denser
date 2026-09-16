'use client';

import { useQuery } from '@tanstack/react-query';
import { getChain } from '@transaction/lib/chain';
import { StaleTime } from '@/blog/lib/react-query';
import {
  createVoteTally,
  EMPTY_VOTES_RECEIVED,
  foldVoteEvents,
  isCountCapped,
  summarizeTally,
  type VoteEvent
} from '../lib/voters';

/**
 * The virtual operation the chain writes once a vote has been applied, rather
 * than the `vote_operation` the voter signed. Both name the voter and the
 * author, but only this one carries `rshares` — the weight the vote really
 * landed with, after the voter's mana and the post's age were taken into
 * account. Without it there is no way to say what a vote was worth.
 */
const EFFECTIVE_VOTE_OPERATION_NAME = 'effective_comment_vote_operation';

/** The node refuses anything larger: "page-size of 5000 is greater than maximum allowed". */
export const VOTE_PAGE_SIZE = 1000;

/**
 * One vote as it comes off the chain. The operation id rides along only so the
 * deep read can tell a vote it has already counted from one it has not, where
 * two windows meet; nothing draws it.
 */
export interface VotePageEvent extends VoteEvent {
  id: string;
}

export interface VotePage {
  events: VotePageEvent[];
  /** What the chain says the window holds. At the ceiling it has stopped counting. */
  total: number;
  pages: number;
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

/** The form the node wants a block boundary in: `YYYY-MM-DD HH:MM:SS`, UTC. */
export function toBlockTimestamp(ms: number): string {
  return new Date(ms).toISOString().slice(0, 19).replace('T', ' ');
}

let cachedOpTypeId: number | null = null;

async function effectiveVoteOpTypeId(): Promise<number> {
  if (cachedOpTypeId !== null) return cachedOpTypeId;
  const chain = await getChain();
  const opTypes = await chain.restApi['hafah-api']['operation-types']();
  const id = opTypes.find((opType) => opType.operation_name === EFFECTIVE_VOTE_OPERATION_NAME)?.op_type_id;
  if (id === undefined)
    throw new Error('Missing Hive operation type id for effective_comment_vote_operation');
  cachedOpTypeId = id;
  return id;
}

export interface VotePageRequest {
  /** Which page of the window; omitted asks for the newest. Page 1 is the oldest. */
  page?: number;
  /** Only votes strictly older than this instant. Omitted starts at today. */
  beforeMs?: number;
}

/**
 * One page of the votes this account was **given**.
 *
 * `participation-mode: 'exclude'` is what makes that possible: it drops the
 * operations this account itself began, and the account that begins a vote is
 * the voter. Only HAfAH's copy of this endpoint takes that parameter — the
 * hivemind copy returns both directions mixed together, with no way to tell
 * them apart.
 */
export async function fetchVotePage(account: string, request: VotePageRequest = {}): Promise<VotePage> {
  const chain = await getChain();
  const opTypeId = await effectiveVoteOpTypeId();

  const response = await chain.restApi['hafah-api'].accountsOperations({
    'account-name': account,
    'operation-types': String(opTypeId),
    'transacting-account-name': account,
    'participation-mode': 'exclude',
    'page-size': VOTE_PAGE_SIZE,
    ...(request.page === undefined ? {} : { page: request.page }),
    ...(request.beforeMs === undefined ? {} : { 'to-block': toBlockTimestamp(request.beforeMs) })
  });

  const events: VotePageEvent[] = [];
  for (const operation of response.operations_result ?? []) {
    const value = operation.op?.value as Record<string, unknown> | undefined;
    if (!value) continue;
    const voter = typeof value.voter === 'string' ? value.voter : '';
    if (voter === '') continue;
    events.push({
      voter,
      rshares: Number(value.rshares),
      timestampMs: parseHiveTimestamp(operation.timestamp),
      id: String(operation.operation_id ?? `${operation.block}-${operation.op_pos}`)
    });
  }

  return {
    events,
    total: Number.isFinite(response.total_operations) ? response.total_operations : events.length,
    pages: Number.isFinite(response.total_pages) ? response.total_pages : 1
  };
}

export type VotesReceivedStatus = 'idle' | 'loading' | 'ready' | 'unavailable';

export function votesReceivedQueryKey(account: string) {
  return ['basecampVotesReceived', account] as const;
}

/**
 * The newest page of the votes this account was given: the petal's number, and
 * enough of a ranking to fill the panel the moment it opens.
 *
 * One request per card. Where the account has been given fewer votes than the
 * chain's counting ceiling, this single read is their whole life and the number
 * is exact; above it the chain stops counting and the figure is a floor until
 * somebody asks for the full read.
 */
export async function fetchVotesReceived(account: string) {
  const page = await fetchVotePage(account);
  const tally = foldVoteEvents(createVoteTally(), page.events);
  const complete = !isCountCapped(page.total) && tally.counted >= page.total;
  return summarizeTally(tally, page.total, complete);
}

/**
 * `enabled` defers the read until the card is near the viewport, so a long feed
 * does not fire one per row up front.
 */
export function useVotesReceived(account: string, enabled = true) {
  const isEnabled = enabled && Boolean(account);
  const { data, isError } = useQuery({
    queryKey: votesReceivedQueryKey(account),
    queryFn: () => fetchVotesReceived(account),
    enabled: isEnabled,
    staleTime: StaleTime.MEDIUM,
    // One retry, as on the history read: this is a thousand operations from a
    // public node, and a single timeout would otherwise leave the petal blank.
    retry: 1
  });

  let status: VotesReceivedStatus;
  if (isError) status = 'unavailable';
  else if (data) status = 'ready';
  else if (isEnabled) status = 'loading';
  else status = 'idle';

  return { votes: status === 'ready' && data ? data : EMPTY_VOTES_RECEIVED, status };
}
