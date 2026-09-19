'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { StaleTime } from '@/blog/lib/react-query';
import { useNewcomers } from '../../hooks/use-newcomers';
import { accountHistoryQueryKey, fetchAccountHistory } from '../../hooks/use-account-history';
import { isFirstEverPost } from '../../lib/first-post';
import { readNewbieVerdicts } from '../../lib/newbie-or-not';

/** One first ever post waiting to be looked at. */
export interface FirstPost {
  account: string;
  permlink: string;
  createdIso: string;
  /** Shown in the list below the game, so a player can pick by what it is about. */
  title: string;
}

export interface FirstPostQueue {
  queue: FirstPost[];
  /** False only while the first read of the feed is still in the air. */
  loaded: boolean;
  loadMore: () => void;
  /** True while the feed still has pages INSIDE the window worth reading. */
  hasMore: boolean;
}

const NONE: FirstPost[] = [];

/** The window: everything posted in the last day (Bryan, 2026-09-19). */
export const WINDOW_HOURS = 24;
const WINDOW_MS = WINDOW_HOURS * 60 * 60 * 1000;

/**
 * How many writings an account can have before it is not worth checking.
 *
 * `post_count` counts posts AND replies, so a first-time poster who answered a
 * few comments on their own post can sit anywhere in the low numbers. Well
 * above that, a history read would only ever come back "no", and spending the
 * heaviest call in the app to learn that is waste.
 */
const WORTH_CHECKING = 25;
/**
 * How many history reads are allowed in the air AT ONCE.
 *
 * Not a cap on how many get checked. These are the heaviest calls this app
 * makes, so they go in waves: this many, then the next this many when those
 * come back, until every candidate in the window has been asked about. The
 * first version treated it as a cap, which meant only the ten newest accounts
 * were ever checked and every first post behind them was invisible.
 */
const CHECK_AT_ONCE = 10;

/** Hive writes post times without a zone; they are UTC. */
export function postedMs(createdIso: string): number {
  if (!createdIso) return Number.NaN;
  const iso = createdIso.endsWith('Z') ? createdIso : `${createdIso}Z`;
  return Date.parse(iso);
}

/**
 * The queue for Newbie or Not to Be: first ever posts, and nothing else.
 *
 * EXACTLY THE POSTS THE FEED THROWS CONFETTI AT (Bryan, 2026-09-19), which
 * means the WHOLE of `isFirstEverPost` in `lib/first-post.ts` and not half of
 * it.
 *
 * This was got wrong once and it is worth writing down. The cheap half of the
 * rule is "the chain says this account has published exactly one thing". It
 * reads like the obvious test and it almost never fires, because Hive's
 * `post_count` counts REPLIES as well as posts: somebody who writes their
 * first post and then answers one comment on it is already at two. So a queue
 * built on that half alone finds nothing, which is exactly what happened.
 *
 * The half that actually catches them is the expensive one: read the account's
 * history, and if it covered the account's whole life and found exactly one
 * post of their own among the replies, that post is their first. That is what
 * the feed's confetti is really running on.
 *
 * So the reading is done in two passes. Everything the cheap half can settle
 * for free is settled for free. What is left goes through a history read each
 * — the same read the postcard makes, under the same key, so anything the
 * feed has already looked at costs nothing at all — and only a handful are in
 * the air at once, because these are the heaviest calls this app makes.
 *
 * The queue is thin by nature, because first posts ARE thin. That is not a
 * fault to pad out with other people's posts — it is the game.
 *
 * THE WINDOW IS THE LAST DAY, and it also says when to STOP reading. The feed
 * is the "created" stream, newest first, so paging always walks backwards in
 * time; the moment the oldest post read is older than a day, there is nothing
 * further inside the window and `hasMore` goes false. That is a real end,
 * not a cap someone picked.
 *
 * A post already answered on never comes back. A verdict is finished work.
 *
 * Read on the client only. The server has no localStorage, and a queue that
 * is empty on the server and full in the browser is a hydration mismatch.
 */
export function useFirstPosts(): FirstPostQueue {
  const [judged, setJudged] = useState<Set<string> | null>(null);
  const { newcomers, isLoading, isFetching, fetchNextPage, hasNextPage } = useNewcomers();

  useEffect(() => {
    setJudged(new Set(readNewbieVerdicts().map((verdict) => verdict.account)));
  }, []);

  // Memoised, and not only for speed: the game holds the post it is on in an
  // effect keyed on that object, so a queue rebuilt every render re-runs it.
  /**
   * PASS ONE. Everyone inside the window who has not been answered on, with
   * whichever of them the cheap half already settles marked as certain.
   */
  const candidates = useMemo(() => {
    if (judged === null) return [];
    const cutoff = Date.now() - WINDOW_MS;
    const seen = new Set<string>();
    const rows: { post: FirstPost; postCount: number | null; certain: boolean }[] = [];
    for (const newcomer of newcomers) {
      const account = newcomer.post.author;
      const createdIso = typeof newcomer.post.created === 'string' ? newcomer.post.created : '';
      if (judged.has(account) || seen.has(account)) continue;
      // A post with no readable time is left out rather than guessed at: it
      // cannot be SHOWN to be inside the window.
      const at = postedMs(createdIso);
      if (!Number.isFinite(at) || at < cutoff) continue;
      const postCount = newcomer.account.postCount;
      const certain = isFirstEverPost(postCount, null);
      if (!certain && (postCount === null || postCount > WORTH_CHECKING)) continue;
      seen.add(account);
      rows.push({
        post: {
          account,
          permlink: newcomer.post.permlink,
          createdIso,
          title: typeof newcomer.post.title === 'string' ? newcomer.post.title : ''
        },
        postCount,
        certain
      });
    }
    return rows;
  }, [judged, newcomers]);

  /**
   * PASS TWO. A history read for every one the cheap half could not settle.
   *
   * The key is the postcard's own, so a history the feed has already read is
   * served from the cache and costs nothing. They go in WAVES rather than all
   * at once — a queue that fired thirty of these together would take the node
   * down with it — and the wave grows until every candidate has been asked
   * about. Nobody is skipped; they are only made to wait their turn.
   */
  const unsettled = useMemo(() => candidates.filter((row) => !row.certain), [candidates]);
  const [checkLimit, setCheckLimit] = useState(CHECK_AT_ONCE);
  const toCheck = useMemo(() => unsettled.slice(0, checkLimit), [unsettled, checkLimit]);

  const histories = useQueries({
    queries: toCheck.map((row) => ({
      queryKey: accountHistoryQueryKey(row.post.account),
      queryFn: () => fetchAccountHistory(row.post.account),
      staleTime: StaleTime.MEDIUM,
      retry: 1
    }))
  });

  const waveInFlight = histories.some((query) => query.isLoading);
  const moreToCheck = checkLimit < unsettled.length;

  // The next wave, the moment this one is back. No button, no waiting for the
  // player to ask: they asked by opening the game.
  useEffect(() => {
    if (!waveInFlight && moreToCheck) setCheckLimit((limit) => limit + CHECK_AT_ONCE);
  }, [waveInFlight, moreToCheck]);

  /** True while there is any question still outstanding about the window. */
  const checking = waveInFlight || moreToCheck;

  const queue = useMemo(() => {
    if (judged === null) return NONE;
    const verdictByAccount = new Map<string, boolean>();
    toCheck.forEach((row, i) => {
      const patterns = histories[i]?.data?.patterns ?? null;
      verdictByAccount.set(row.post.account, isFirstEverPost(row.postCount, patterns));
    });
    return candidates
      .filter((row) => (row.certain ? true : (verdictByAccount.get(row.post.account) ?? false)))
      .map((row) => row.post);
  }, [judged, candidates, toCheck, histories]);

  /**
   * Has the reading walked out the back of the window?
   *
   * The feed is newest first, so the LAST thing read is the oldest thing read.
   * Once that is older than a day, every further page is older still and the
   * window is exhausted however many pages the feed has left.
   */
  const pastWindow = useMemo(() => {
    const last = newcomers[newcomers.length - 1];
    if (!last) return false;
    const at = postedMs(typeof last.post.created === 'string' ? last.post.created : '');
    return Number.isFinite(at) && at < Date.now() - WINDOW_MS;
  }, [newcomers]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetching && !pastWindow) fetchNextPage();
  }, [hasNextPage, isFetching, fetchNextPage, pastWindow]);

  return {
    queue,
    // The old rule waited for the feed to be EXHAUSTED before admitting it had
    // loaded, so with more pages always available the game rendered nothing at
    // all, forever. That was the blank screen: not an empty queue, a screen
    // that never got the chance to say anything.
    //
    // The history reads count too: an empty queue while they are still in the
    // air is not an empty day, it is an unfinished question, and saying "no
    // first posts" in the middle of looking would be a lie.
    //
    // But a queue that already HAS somebody in it is shown straight away and
    // fills in underneath. Waiting for every last account in the day to be
    // checked before showing the first one is its own kind of broken.
    loaded: judged !== null && !isLoading && (queue.length > 0 || !checking),
    loadMore,
    hasMore: Boolean(hasNextPage) && !pastWindow
  };
}
