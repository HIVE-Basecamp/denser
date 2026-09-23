/**
 * Ask again when a public node drops a request.
 *
 * Pure: no React, no chain, no user-facing English.
 *
 * Measured against api.hive.blog on 2026-09-23: one request in five or six
 * came back as a dropped connection ("Failed to fetch"), even one at a time,
 * and the panels that read several pages at once were losing the whole read
 * to a single dropped page — a votes panel that says "stopped early at 1
 * votes" on an account the chain counts 10,001 for. A dropped connection is
 * not an answer; asking once more almost always gets one.
 *
 * Two tries after the first, a short pause between them, and the pause grows.
 * Any error is retried: at this layer a dropped connection, a timeout and a
 * node that answered 5xx look the same and are all worth one more ask. The
 * last error is the one thrown, so a caller that fails still learns why.
 */

/** How many extra times a page is asked for after the first try fails. */
export const RETRY_ATTEMPTS = 2;
/** How long to wait before the first extra try, in milliseconds. Doubled for each after. */
export const RETRY_DELAY_MS = 350;

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs `read` and, when it throws, runs it again up to `attempts` more times
 * with a growing pause between tries.
 */
export async function withRetry<T>(
  read: () => Promise<T>,
  attempts: number = RETRY_ATTEMPTS,
  delayMs: number = RETRY_DELAY_MS
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= attempts; attempt++) {
    try {
      return await read();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await pause(delayMs * 2 ** attempt);
    }
  }
  throw lastError;
}
