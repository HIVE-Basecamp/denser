'use client';

import { useEffect, useMemo, useState } from 'react';
import { useNewcomers } from '../../hooks/use-newcomers';
import { readSusReports, type SusReasonId } from '../../lib/sus';

/** Shared so an empty queue keeps one identity across renders. */
const NO_SUSPECTS: readonly Suspect[] = [];

/** One account waiting to be judged, and the post that got it reported. */
export interface Suspect {
  account: string;
  permlink: string;
  /** When the SUS report was filed, so the queue can be shown newest first. */
  reportedIso: string;
}

/**
 * Where the account on the slab came from.
 *
 * 'marked' means the player picked it out themselves with the SUS button.
 * 'feed' means nobody has marked anything for this game, so the game went and
 * found somebody. The screen says which, because an account that turned up on
 * its own has had no accusation made against it and the player should know
 * that before they answer.
 */
export type SuspectSource = 'marked' | 'feed';

export interface SuspectQueue {
  queue: Suspect[];
  /** False while there is still nothing to show — nothing read, nothing fetched. */
  loaded: boolean;
  source: SuspectSource;
}

/**
 * Who a judging game pulls up.
 *
 * First choice is the accounts this browser has already ticked with the SUS
 * button for the reason the game is about — the reader has said something is
 * off, and this is where that gets looked at properly. Newest report first,
 * one entry per account: if the same account was reported on three posts, the
 * newest post is the one the game opens with. Each game asks its own question,
 * so each gets its own queue; an account ticked both turns up in both.
 *
 * Where nothing has been ticked, the game does NOT sit there empty. It falls
 * back to the Basecamp feed — new accounts, in the order the feed has them —
 * so the game can always be played, including by somebody who has just arrived
 * and has marked nothing. Accounts this game has already been answered on are
 * left out of that fallback, so the queue does not hand back the same person
 * every time. The feed is the same query the page below is already running, so
 * this costs no extra reading.
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
  const { newcomers, isLoading } = useNewcomers();

  useEffect(() => {
    const byAccount = new Map<string, Suspect>();
    for (const report of readSusReports()) {
      if (!report.reasons.includes(reason)) continue;
      // readSusReports hands them back newest first, so the first sighting of
      // an account is already its newest report — later ones are dropped.
      if (byAccount.has(report.account)) continue;
      byAccount.set(report.account, {
        account: report.account,
        permlink: report.permlink,
        reportedIso: report.reportedIso
      });
    }
    setMarked(Array.from(byAccount.values()));
    setJudged(new Set(readJudged ? readJudged() : []));
  }, [reason, readJudged]);

  // Memoised, and not merely for speed: the game holds the account it is on in
  // an effect keyed on that object, so a queue rebuilt on every render would
  // re-run it on every render — and on an account already answered, that is a
  // loop that never settles.
  const fromFeed = useMemo(() => {
    const rows: Suspect[] = [];
    for (const newcomer of newcomers) {
      if (judged.has(newcomer.post.author)) continue;
      rows.push({
        account: newcomer.post.author,
        permlink: newcomer.post.permlink,
        // Nobody reported it, so there is no report time. The post's own time
        // is the nearest true thing, and nothing ranks on it.
        reportedIso: typeof newcomer.post.created === 'string' ? newcomer.post.created : ''
      });
    }
    return rows;
  }, [newcomers, judged]);

  if (marked === null) return { queue: NO_SUSPECTS as Suspect[], loaded: false, source: 'marked' };
  if (marked.length > 0) return { queue: marked, loaded: true, source: 'marked' };
  return { queue: fromFeed, loaded: !isLoading || fromFeed.length > 0, source: 'feed' };
}
