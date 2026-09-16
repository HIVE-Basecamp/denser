'use client';

import { useEffect, useState } from 'react';
import { readSusReports, type SusReasonId } from '../../lib/sus';

/** One account waiting to be judged, and the post that got it reported. */
export interface Suspect {
  account: string;
  permlink: string;
  /** When the SUS report was filed, so the queue can be shown newest first. */
  reportedIso: string;
}

/**
 * Who a judging game pulls up.
 *
 * Not a random account. The queue is the accounts this browser has already
 * ticked with the SUS button for the reason the game is about — the reader has
 * said something is off, and this is where that gets looked at properly.
 * Newest report first, one entry per account: if the same account was reported
 * on three posts, the newest post is the one the game opens with.
 *
 * Each game asks its own question, so each game gets its own queue: an account
 * ticked `sock` belongs to Sock or Not and not to Bot or Not, and an account
 * ticked both turns up in both.
 *
 * Read on the client only. The server has no localStorage, and a queue that is
 * empty on the server and full in the browser is a hydration mismatch (same
 * reason as postcard/sus-button.tsx).
 */
export function useSuspectQueue(reason: SusReasonId): { queue: Suspect[]; loaded: boolean } {
  const [queue, setQueue] = useState<Suspect[]>([]);
  const [loaded, setLoaded] = useState(false);

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
    setQueue(Array.from(byAccount.values()));
    setLoaded(true);
  }, [reason]);

  return { queue, loaded };
}
