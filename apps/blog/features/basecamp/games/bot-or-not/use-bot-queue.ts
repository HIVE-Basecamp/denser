'use client';

import { useEffect, useState } from 'react';
import { readSusReports } from '../../lib/sus';

/** One account waiting to be judged, and the post that got it reported. */
export interface BotSuspect {
  account: string;
  permlink: string;
  /** When the SUS report was filed, so the queue can be shown newest first. */
  reportedIso: string;
}

/**
 * Who the game pulls up.
 *
 * Not a random account. The queue is the accounts this browser has already
 * ticked `bot` on with the SUS button — the reader has said something is off,
 * and this is where that gets looked at properly. Newest report first, one
 * entry per account: if the same account was reported on three posts, the
 * newest post is the one the game opens with.
 *
 * Read on the client only. The server has no localStorage, and a queue that
 * is empty on the server and full in the browser is a hydration mismatch
 * (same reason as postcard/sus-button.tsx).
 */
export function useBotQueue(): { queue: BotSuspect[]; loaded: boolean } {
  const [queue, setQueue] = useState<BotSuspect[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const byAccount = new Map<string, BotSuspect>();
    for (const report of readSusReports()) {
      if (!report.reasons.includes('bot')) continue;
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
  }, []);

  return { queue, loaded };
}
