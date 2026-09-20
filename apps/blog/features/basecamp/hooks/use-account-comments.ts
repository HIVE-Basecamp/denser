'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAccountPosts, DATA_LIMIT } from '@transaction/lib/bridge-api';
import { useUserClient } from '@smart-signer/lib/auth/use-user-client';
import { DEFAULT_OBSERVER } from '@/blog/lib/utils';
import { StaleTime } from '@/blog/lib/react-query';
import type { Entry } from '@hive/common-hiveio-packages/wax';
import type { CommentVote } from '../lib/comment-payouts';

/**
 * How many of an account's most recent replies are read. Bryan's number: a
 * curator wants enough to see a pattern and few enough to scroll through in
 * one sitting.
 */
export const ACCOUNT_COMMENTS_LIMIT = 25;

/**
 * One reply this account wrote, kept whole.
 *
 * The body is never shortened here. What a reply is made of — how long it is,
 * whether it repeats, whether it is only a bot trigger — is the clue, and a
 * data layer that truncates has thrown the clue away before anyone looks. Any
 * shortening is a decision for the thing doing the drawing, not for this.
 */
export interface AccountComment {
  author: string;
  permlink: string;
  /** The full body, exactly as it was written to the chain. */
  body: string;
  createdIso: string | null;
  parentAuthor: string | null;
  parentPermlink: string | null;
  category: string | null;
  /** Where the reply sits on this site. */
  url: string;
  /**
   * What the reply is worth, in HBD. Settled once it has paid out, an estimate
   * from the current reward pool until then — the chain's own figure either
   * way, not one worked out here.
   */
  payout: number;
  /** False while the payout is still an estimate. */
  paidOut: boolean;
  /** Every vote on the reply. Empty where nobody has voted. */
  votes: CommentVote[];
}

/**
 * Hive history timestamps are UTC but arrive with no timezone designator, so
 * a reader would take them as local time and every reply would look hours
 * out. The 'Z' is added here once, so every consumer parses the same instant.
 */
function normalizeIso(created: unknown): string | null {
  if (typeof created !== 'string' || created.length === 0) return null;
  return /(?:Z|[+-]\d{2}:?\d{2})$/.test(created) ? created : `${created}Z`;
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/**
 * Built from the category, author and permlink rather than the entry's own
 * `url`: for a reply the chain's `url` points at the parent thread with the
 * reply as an anchor, and this app routes a reply at its own address.
 */
function commentUrl(entry: Entry): string {
  const category = optionalString(entry.category) ?? 'hive';
  return `/${category}/@${entry.author}/${entry.permlink}`;
}

/**
 * The votes the bridge already hands over with the reply. They arrive with the
 * reply itself, so who voted and what their vote was worth costs no extra read.
 */
function toVotes(entry: Entry): CommentVote[] {
  if (!Array.isArray(entry.active_votes)) return [];
  const votes: CommentVote[] = [];
  for (const vote of entry.active_votes) {
    if (typeof vote?.voter !== 'string' || vote.voter.length === 0) continue;
    votes.push({ voter: vote.voter, rshares: Number(vote.rshares) });
  }
  return votes;
}

function toAccountComment(entry: Entry): AccountComment {
  return {
    author: entry.author,
    permlink: entry.permlink,
    body: typeof entry.body === 'string' ? entry.body : '',
    createdIso: normalizeIso(entry.created),
    parentAuthor: optionalString(entry.parent_author),
    parentPermlink: optionalString(entry.parent_permlink),
    category: optionalString(entry.category),
    url: commentUrl(entry),
    payout: Number.isFinite(entry.payout) ? entry.payout : 0,
    paidOut: Boolean(entry.is_paidout),
    votes: toVotes(entry)
  };
}

export function accountCommentsQueryKey(account: string, observer: string) {
  return ['basecampAccountComments', account, observer] as const;
}

/**
 * Twenty-five in one call is refused: the chain's own limit on this read is
 * twenty ("limit = 25 outside valid range [1:20]"), so the rest is fetched as
 * a second page starting after the last reply of the first. Two small reads,
 * cached together as one answer.
 */
export async function fetchAccountComments(account: string, observer: string): Promise<AccountComment[]> {
  const collected: AccountComment[] = [];
  const seen = new Set<string>();
  let startAuthor = '';
  let startPermlink = '';

  while (collected.length < ACCOUNT_COMMENTS_LIMIT) {
    const wanted = Math.min(DATA_LIMIT, ACCOUNT_COMMENTS_LIMIT - collected.length);
    const entries = await getAccountPosts('comments', account, observer, startAuthor, startPermlink, wanted);
    if (!entries || entries.length === 0) break;

    for (const entry of entries) {
      const key = `${entry.author}/${entry.permlink}`;
      // Some Hive cursors hand the anchor back as the first result of the
      // next page; one reply must never be printed twice.
      if (seen.has(key)) continue;
      seen.add(key);
      collected.push(toAccountComment(entry));
    }

    const last = entries[entries.length - 1];
    // The page came back short, so there is nothing older to ask for.
    if (entries.length < wanted) break;
    if (last.author === startAuthor && last.permlink === startPermlink) break;
    startAuthor = last.author;
    startPermlink = last.permlink;
  }

  return collected.slice(0, ACCOUNT_COMMENTS_LIMIT);
}

/**
 * The account's last replies, read from the chain once and shared by everyone
 * who asks for them.
 *
 * Deliberately a hook with its own query key rather than something the
 * postcard owns: the same pull is wanted in several places, and React Query
 * hands every caller the one result instead of each asking the chain again.
 *
 * `enabled` defers the read, so a feed of cards does not fire one request per
 * row before anyone has asked to see a single reply.
 */
export function useAccountComments(account: string, enabled = true) {
  const { user } = useUserClient();
  const observer = user.isLoggedIn ? user.username : DEFAULT_OBSERVER;
  const isEnabled = enabled && Boolean(account);

  const { data, isLoading, isError } = useQuery({
    queryKey: accountCommentsQueryKey(account, observer),
    queryFn: () => fetchAccountComments(account, observer),
    enabled: isEnabled,
    staleTime: StaleTime.MEDIUM,
    // One retry: public Hive nodes go slow under load, and a single timeout
    // would otherwise leave the panel reading "nothing here" for an account
    // that has plenty.
    retry: 1
  });

  const comments = useMemo(() => data ?? [], [data]);

  return {
    comments,
    /**
     * True once a read has actually come back. An empty list means different
     * things before and after that — nobody has looked yet, or they have
     * written nothing — and a caller printing a number must not print a zero
     * for the first of them.
     */
    known: data !== undefined,
    // A read that has not been asked for yet is not loading.
    isLoading: isEnabled && isLoading,
    isError
  };
}
