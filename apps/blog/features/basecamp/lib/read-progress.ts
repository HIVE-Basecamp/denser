/**
 * How long a long read has left.
 *
 * Pure: no network, no React, no user-facing English. Shared by every panel
 * that reads more of the chain than fits in one request, so they all guess the
 * same way and a reader who has watched one bar knows what the next one means.
 */

/** Below this share of the read, an estimate of the time left is not worth printing. */
export const MIN_PROGRESS_FOR_ESTIMATE = 0.04;

/**
 * Roughly how many seconds are left, or null where saying would be a guess
 * dressed as a measurement — at the very start, and once it is finished.
 *
 * The arithmetic assumes the rest of the read goes at the speed of the part
 * already done. That is only ever approximately true, which is why what is
 * printed beside it says "about".
 */
export function estimateSecondsLeft(progress: number | null, elapsedMs: number): number | null {
  if (progress === null || progress < MIN_PROGRESS_FOR_ESTIMATE || progress >= 1) return null;
  const seconds = Math.round(((elapsedMs / progress) * (1 - progress)) / 1000);
  // "About 0s left" is not a countdown, it is a contradiction. Under a second
  // there is nothing worth saying, so the caller prints that it is reading.
  return seconds > 0 ? seconds : null;
}
