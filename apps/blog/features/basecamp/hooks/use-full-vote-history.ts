'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createVoteTally,
  EMPTY_VOTE_SUMMARY,
  foldVoteEvents,
  isCountCapped,
  summarizeTally,
  type VoteDirection,
  type VoteSummary
} from '../lib/voters';
import { estimateSecondsLeft } from '../lib/read-progress';
import { fetchVotePage, type VotePageEvent } from './use-votes-received';

/**
 * Every vote an account has ever been given — or, read the other way, ever
 * cast — on demand.
 *
 * The shape of the read is forced by two limits on the node. A page is at most
 * a thousand operations, and the count stops at ten thousand — past that the
 * chain will not say how many there are, and the only way to the real number is
 * to keep asking for older ones. So this walks backwards in windows: each
 * window's pages are fetched together rather than one after another, and when a
 * window comes back full, the next one starts where it ended. A window that
 * comes back short is the account's first vote, and the walk stops.
 *
 * Measured on 2026-09-16: an account given 44,413 votes in its first 93 days
 * read whole in five windows, fifty-two requests, thirty-two seconds. A smaller
 * one — 8,811 votes — took nine requests and under two.
 *
 * Nothing is kept but the tally. Forty thousand votes is megabytes of JSON and
 * a few dozen rows of answer, so each page is counted and thrown away.
 */

/** Pages asked for at once. Enough to make the walk quick; not so many as to lean on a public node. */
const CONCURRENCY = 6;

/**
 * `to-block` excludes the instant it is given, so the boundary between two
 * windows is moved on by a second and the votes already counted in that second
 * are skipped by id. Without this, every vote sharing its second with the
 * oldest one in a window would be silently dropped.
 */
const BOUNDARY_STEP_MS = 1000;

/**
 * A stop on the walk itself, so a mistake about where a window ends can never
 * turn into a loop that asks a public node forever. At ten thousand votes a
 * window this is six hundred thousand votes, far past any account the card is
 * shown for.
 */
const MAX_WINDOWS = 60;

export type FullReadStatus = 'idle' | 'reading' | 'complete' | 'stopped' | 'failed';

export interface FullVoteHistory {
  /** The tally so far — it is a real reading at every moment, not only at the end. */
  votes: VoteSummary;
  status: FullReadStatus;
  /** 0-1, or null when there is nothing honest to say yet. */
  progress: number | null;
  /** Roughly how long is left, in seconds, or null. */
  secondsLeft: number | null;
}

interface Snapshot {
  votes: VoteSummary;
  status: FullReadStatus;
  progress: number | null;
  secondsLeft: number | null;
}

const IDLE: Snapshot = { votes: EMPTY_VOTE_SUMMARY, status: 'idle', progress: null, secondsLeft: null };

/**
 * How far through the read we are.
 *
 * Two different questions, because the chain answers one of them only
 * sometimes. Under the counting ceiling the total is known, so progress is
 * simply pages done over pages to do. Above it nothing is known about how many
 * votes there are — but the account's own age is known, so progress becomes how
 * far back through its life the read has reached. That is an approximation:
 * votes are not spread evenly across a life. It is stated as "about".
 */
function readProgress(
  pagesDone: number,
  pagesTotal: number | null,
  oldestMs: number | null,
  createdMs: number | null,
  nowMs: number
): number | null {
  if (pagesTotal !== null && pagesTotal > 0) return Math.min(pagesDone / pagesTotal, 1);
  if (oldestMs === null || createdMs === null) return null;
  const life = nowMs - createdMs;
  if (life <= 0) return null;
  return Math.min(Math.max((nowMs - oldestMs) / life, 0), 1);
}

/**
 * Reads the whole history once `enabled` turns true, and stops for good when
 * `stop()` is called. `createdMs` is when the account was made; it is what lets
 * the read say how far through it is when the chain will not give a total.
 * `direction` says which way the votes are read: given to this account, or
 * cast by it.
 */
export function useFullVoteHistory(
  account: string,
  createdMs: number | null,
  enabled: boolean,
  direction: VoteDirection = 'received'
) {
  const [snapshot, setSnapshot] = useState<Snapshot>(IDLE);
  const stopped = useRef(false);

  const stop = useCallback(() => {
    stopped.current = true;
    setSnapshot((current) => (current.status === 'reading' ? { ...current, status: 'stopped' } : current));
  }, []);

  useEffect(() => {
    if (!enabled || !account) return;
    let abandoned = false;
    stopped.current = false;

    const run = async () => {
      const tally = createVoteTally();
      const startedAt = Date.now();
      const nowMs = startedAt;
      let beforeMs: number | undefined;
      let skipIds = new Set<string>();
      let reportedTotal: number | null = null;
      let pagesTotal: number | null = null;
      let pagesDone = 0;
      let windows = 0;
      let complete = false;

      const publish = (status: FullReadStatus) => {
        if (abandoned) return;
        const votes = summarizeTally(tally, reportedTotal, complete);
        const progress = complete ? 1 : readProgress(pagesDone, pagesTotal, tally.oldestMs, createdMs, nowMs);
        setSnapshot({
          votes,
          status,
          progress,
          secondsLeft: status === 'reading' ? estimateSecondsLeft(progress, Date.now() - startedAt) : null
        });
      };

      try {
        while (!stopped.current && !abandoned && windows < MAX_WINDOWS) {
          // The oldest instant this window has reached, and the votes sitting
          // exactly on it. Tracked as the pages arrive rather than by keeping
          // the pages: a full window is ten thousand votes, and only the
          // handful on the boundary is ever needed again.
          let oldestInWindow = Number.POSITIVE_INFINITY;
          let boundaryIds: string[] = [];
          let foldedInWindow = 0;

          const take = (events: VotePageEvent[]) => {
            const fresh = events.filter((event) => !skipIds.has(event.id));
            for (const event of fresh) {
              if (!Number.isFinite(event.timestampMs)) continue;
              if (event.timestampMs < oldestInWindow) {
                oldestInWindow = event.timestampMs;
                boundaryIds = [event.id];
              } else if (event.timestampMs === oldestInWindow) {
                boundaryIds.push(event.id);
              }
            }
            // Folded as each batch lands, so the ranking on screen fills in
            // while the read runs instead of jumping at the end.
            foldVoteEvents(tally, fresh);
            foldedInWindow += fresh.length;
          };

          const first = await fetchVotePage(account, { beforeMs }, direction);
          windows++;
          pagesDone++;
          if (beforeMs === undefined) {
            reportedTotal = first.total;
            pagesTotal = isCountCapped(first.total) ? null : first.pages;
          }
          take(first.events);
          publish('reading');

          // The window's remaining pages, newest first, several at a time. One
          // after another this is the difference between two seconds and ten.
          for (let page = first.pages - 1; page >= 1 && !stopped.current && !abandoned; page -= CONCURRENCY) {
            const batch: number[] = [];
            for (let offset = 0; offset < CONCURRENCY && page - offset >= 1; offset++)
              batch.push(page - offset);
            const pages = await Promise.all(
              batch.map((number) => fetchVotePage(account, { page: number, beforeMs }, direction))
            );
            for (const result of pages) take(result.events);
            pagesDone += batch.length;
            publish('reading');
          }
          if (stopped.current || abandoned) break;

          // A window the chain was willing to count, or one that held nothing
          // new, is the beginning of the account.
          if (!isCountCapped(first.total) || foldedInWindow === 0 || !Number.isFinite(oldestInWindow)) {
            complete = true;
            break;
          }

          skipIds = new Set(boundaryIds);
          const nextBefore = oldestInWindow + BOUNDARY_STEP_MS;
          // The window has to move. If it ever did not, the same votes would be
          // asked for again and again.
          if (beforeMs !== undefined && nextBefore >= beforeMs) break;
          beforeMs = nextBefore;
        }

        publish(complete ? 'complete' : 'stopped');
      } catch {
        // Whatever was read before it broke is still a true reading of that
        // much, so it is kept and the panel says the read did not finish.
        publish('failed');
      }
    };

    void run();

    return () => {
      abandoned = true;
      stopped.current = true;
    };
  }, [account, createdMs, enabled, direction]);

  return { ...snapshot, stop };
}
