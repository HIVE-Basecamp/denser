'use client';

import { useQuery } from '@tanstack/react-query';
import { getChain } from '@transaction/lib/chain';
import { operationTypeIdOf } from './operation-types';
import { StaleTime } from '@/blog/lib/react-query';
import {
  createVoteTally,
  EMPTY_VOTE_SUMMARY,
  foldVoteEvents,
  isCountCapped,
  summarizeTally,
  type VoteDirection,
  type VoteEvent,
  type VoteSummary
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

async function effectiveVoteOpTypeId(): Promise<number> {
  const id = await operationTypeIdOf(EFFECTIVE_VOTE_OPERATION_NAME);
  if (id === undefined)
    throw new Error('Missing Hive operation type id for effective_comment_vote_operation');
  return id;
}

export interface VotePageRequest {
  /** Which page of the window; omitted asks for the newest. Page 1 is the oldest. */
  page?: number;
  /** Only votes strictly older than this instant. Omitted starts at today. */
  beforeMs?: number;
}

/**
 * One page of this account's votes, in one direction.
 *
 * `participation-mode` is what separates the two directions: the account that
 * begins a vote is the voter, so 'exclude' drops the votes this account began
 * and leaves the ones it was **given**, and 'include' keeps only the ones it
 * **gave**. Only HAfAH's copy of this endpoint takes that parameter — the
 * hivemind copy returns both directions mixed together, with no way to tell
 * them apart. Each event names the other party: the voter on a vote received,
 * the author on a vote given.
 */
export async function fetchVotePage(
  account: string,
  request: VotePageRequest = {},
  direction: VoteDirection = 'received'
): Promise<VotePage> {
  const chain = await getChain();
  const opTypeId = await effectiveVoteOpTypeId();
  const otherParty = direction === 'received' ? 'voter' : 'author';

  const response = await chain.restApi['hafah-api'].accountsOperations({
    'account-name': account,
    'operation-types': String(opTypeId),
    'transacting-account-name': account,
    'participation-mode': direction === 'received' ? 'exclude' : 'include',
    'page-size': VOTE_PAGE_SIZE,
    ...(request.page === undefined ? {} : { page: request.page }),
    ...(request.beforeMs === undefined ? {} : { 'to-block': toBlockTimestamp(request.beforeMs) })
  });

  const events: VotePageEvent[] = [];
  for (const operation of response.operations_result ?? []) {
    const value = operation.op?.value as Record<string, unknown> | undefined;
    if (!value) continue;
    const other = typeof value[otherParty] === 'string' ? (value[otherParty] as string) : '';
    if (other === '') continue;
    events.push({
      account: other,
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

export function votesGivenQueryKey(account: string) {
  return ['basecampVotesGiven', account] as const;
}

/**
 * The newest page of this account's votes in one direction: enough for a
 * number, and enough of a ranking to fill a panel the moment it opens.
 *
 * One request. Where there are fewer votes than the chain's counting ceiling,
 * this single read is the whole life and the number is exact; above it the
 * chain stops counting and the figure is a floor until somebody asks for the
 * full read.
 */
export async function fetchVoteSummary(account: string, direction: VoteDirection): Promise<VoteSummary> {
  const page = await fetchVotePage(account, {}, direction);
  const tally = foldVoteEvents(createVoteTally(), page.events);
  const complete = !isCountCapped(page.total) && tally.counted >= page.total;
  return summarizeTally(tally, page.total, complete);
}

function useVoteSummary(account: string, direction: VoteDirection, enabled: boolean) {
  const isEnabled = enabled && Boolean(account);
  const { data, isError } = useQuery({
    queryKey: direction === 'received' ? votesReceivedQueryKey(account) : votesGivenQueryKey(account),
    queryFn: () => fetchVoteSummary(account, direction),
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

  return { votes: status === 'ready' && data ? data : EMPTY_VOTE_SUMMARY, status };
}

/**
 * The votes this account was given, and who gave them: the petal's number and
 * the first list in the panel. `enabled` defers the read until the card is
 * near the viewport, so a long feed does not fire one per row up front.
 */
export function useVotesReceived(account: string, enabled = true) {
  return useVoteSummary(account, 'received', enabled);
}

/**
 * The votes this account cast, and who on: the second list in the panel. Not
 * read by the card — only once the panel is open.
 */
export function useVotesGiven(account: string, enabled = true) {
  return useVoteSummary(account, 'given', enabled);
}
