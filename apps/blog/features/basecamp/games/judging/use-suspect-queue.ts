'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNewcomers } from '../../hooks/use-newcomers';
import { readSusReports, type SusReasonId } from '../../lib/sus';

/**
 * Where the account on the slab came from.
 *
 * 'marked' means the player picked it out themselves with the SUS button.
 * 'feed' means the game went and found somebody. The screen says which,
 * because an account that turned up on its own has had no accusation made
 * against it and the player should know that before they answer.
 */
export type SuspectSource = 'marked' | 'feed';

/** One account waiting to be judged, and the post it is being judged on. */
export interface Suspect {
  account: string;
  permlink: string;
  /**
   * When the SUS report was filed, or — for an account off the feed, where
   * there is no report — when the post was written. Nothing ranks on it.
   */
  reportedIso: string;
  source: SuspectSource;
}

export interface SuspectQueue {
  queue: Suspect[];
  /** False while there is still nothing to show — nothing read, nothing fetched. */
  loaded: boolean;
  /** Asks the feed for more accounts, so the queue does not run dry mid-game. */
  loadMore: () => void;
  /** True while the feed still has accounts the game has not been given yet. */
  hasMore: boolean;
}

/** Shared so an empty queue keeps one identity across renders. */
const NO_SUSPECTS: Suspect[] = [];

/**
 * Who a judging game pulls up.
 *
 * Two rules, and they hold for every judging game:
 *
 * 1. NEVER an account this game has already been answered on. A verdict is a
 *    finished piece of work; handing it back is busywork, and it was the first
 *    thing wrong with the queue when Bryan played it.
 * 2. NEVER empty. Accounts ticked with the SUS button come first — that is the
 *    whole point of the games, and the reader has already said something is
 *    off about them. Behind those, and the moment they run out, come new
 *    accounts from the Basecamp feed, newest post first. The feed is the same
 *    query the page below is already running, so this costs no extra reading,
 *    and `loadMore` asks it for another page before the queue can run dry.
 *
 * Marked accounts are one entry each, on their newest report: if the same
 * account was reported on three posts, the newest post is the one the game
 * opens with. Each game asks its own question, so each gets its own queue; an
 * account ticked both turns up in both, and answering one leaves the other
 * untouched.
 *
 * Read on the client only. The server has no localStorage, and a queue that is
 * empty on the server and full in the browser is a hydration mismatch (same
 * reason as postcard/sus-button.tsx).
 */
export function useSuspectQueue(
  reason: SusReasonId,
  /**
   * The accounts this game has already been answered on. Stable across renders
   * — define it at module scope, not inline.
   */
  readJudged?: () => string[]
): SuspectQueue {
  const [marked, setMarked] = useState<Suspect[] | null>(null);
  const [judged, setJudged] = useState<Set<string>>(() => new Set());
  const { newcomers, isLoading, isFetching, fetchNextPage, hasNextPage } = useNewcomers();

  useEffect(() => {
    const byAccount = new Map<string, Suspect>();
    const decided = new Set(readJudged ? readJudged() : []);
    for (const report of readSusReports()) {
      if (!report.reasons.includes(reason)) continue;
      // Already answered: it does not come back, however it was marked.
      if (decided.has(report.account)) continue;
      // readSusReports hands them back newest first, so the first sighting of
      // an account is already its newest report — later ones are dropped.
      if (byAccount.has(report.account)) continue;
      byAccount.set(report.account, {
        account: report.account,
        permlink: report.permlink,
        reportedIso: report.reportedIso,
        source: 'marked'
      });
    }
    setMarked(Array.from(byAccount.values()));
    setJudged(decided);
  }, [reason, readJudged]);

  // Memoised, and not merely for speed: the game holds the account it is on in
  // an effect keyed on that object, so a queue rebuilt on every render would
  // re-run it on every render.
  const queue = useMemo(() => {
    if (marked === null) return NO_SUSPECTS;
    const seen = new Set(marked.map((suspect) => suspect.account));
    const rows: Suspect[] = [...marked];
    for (const newcomer of newcomers) {
      const account = newcomer.post.author;
      if (judged.has(account) || seen.has(account)) continue;
      seen.add(account);
      rows.push({
        account,
        permlink: newcomer.post.permlink,
        reportedIso: typeof newcomer.post.created === 'string' ? newcomer.post.created : '',
        source: 'feed'
      });
    }
    return rows;
  }, [marked, newcomers, judged]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetching) fetchNextPage();
  }, [hasNextPage, isFetching, fetchNextPage]);

  return {
    queue,
    // Nothing to show yet is not the same as nothing to show: the notice waits
    // until the feed has actually come back empty.
    loaded: marked !== null && (queue.length > 0 || !isLoading),
    loadMore,
    hasMore: Boolean(hasNextPage)
  };
}
