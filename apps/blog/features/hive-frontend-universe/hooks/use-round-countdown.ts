'use client';

import { useEffect, useState } from 'react';
import { msToNextRound } from '../lib/modes';

/** Milliseconds until the next round starts, refreshed once a second. */
export function useRoundCountdown(): number {
  const [left, setLeft] = useState(() => msToNextRound(Date.now()));
  useEffect(() => {
    const id = window.setInterval(() => setLeft(msToNextRound(Date.now())), 1000);
    return () => window.clearInterval(id);
  }, []);
  return left;
}
