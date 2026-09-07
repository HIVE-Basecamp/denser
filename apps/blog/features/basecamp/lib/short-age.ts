/**
 * How long ago a moment was, as one number and one unit, for a place with
 * room for four characters. Pure: no React, no English — the caller prints
 * the unit in the reader's language.
 */

import { parseIsoMs } from './signals';

export type AgeUnit = 'now' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

export interface ShortAge {
  unit: AgeUnit;
  value: number;
}

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;
/** Calendar-ish, not exact: a short readout rounds anyway. */
const MONTH_MS = 30 * DAY_MS;
const YEAR_MS = 365 * DAY_MS;

const STEPS: [number, AgeUnit][] = [
  [YEAR_MS, 'year'],
  [MONTH_MS, 'month'],
  [WEEK_MS, 'week'],
  [DAY_MS, 'day'],
  [HOUR_MS, 'hour'],
  [MINUTE_MS, 'minute']
];

/**
 * The largest whole unit that fits: 90 seconds is one minute, 36 hours is
 * one day. Under a minute, or a moment in the future, is "now". Null when the
 * moment cannot be read.
 */
export function shortAge(iso: string, nowMs: number): ShortAge | null {
  const thenMs = parseIsoMs(iso);
  if (thenMs === null || !Number.isFinite(nowMs)) return null;
  const elapsed = nowMs - thenMs;
  for (const [unitMs, unit] of STEPS) {
    if (elapsed >= unitMs) return { unit, value: Math.floor(elapsed / unitMs) };
  }
  return { unit: 'now', value: 0 };
}
