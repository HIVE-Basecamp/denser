/* eslint-disable no-console -- this is a command-line runner: printing the run IS the output. */
/**
 * The tiny check harness.
 *
 * No test framework on purpose: this runs under `tsx` in a plain Node
 * process, so it needs nothing installed and nothing configured. A check is
 * a name and a function; a failed expectation throws and the run ends with a
 * non-zero exit code.
 */

interface Result {
  name: string;
  ok: boolean;
  error?: string;
}

const results: Result[] = [];

/** Run one named check. Everything it asserts must hold. */
export function check(name: string, body: () => void): void {
  try {
    body();
    results.push({ name, ok: true });
  } catch (e) {
    results.push({ name, ok: false, error: e instanceof Error ? e.message : String(e) });
  }
}

export function assert(cond: boolean, message: string): void {
  if (!cond) throw new Error(message);
}

export function equal(actual: unknown, expected: unknown, what: string): void {
  if (actual !== expected) throw new Error(`${what}: expected ${String(expected)}, got ${String(actual)}`);
}

/** Floating point, for the physics and the timers. */
export function near(actual: number, expected: number, tolerance: number, what: string): void {
  if (!(Math.abs(actual - expected) <= tolerance)) {
    throw new Error(`${what}: expected ${expected} +/- ${tolerance}, got ${actual}`);
  }
}

export function atMost(actual: number, limit: number, what: string): void {
  if (!(actual <= limit)) throw new Error(`${what}: expected at most ${limit}, got ${actual}`);
}

export function atLeast(actual: number, limit: number, what: string): void {
  if (!(actual >= limit)) throw new Error(`${what}: expected at least ${limit}, got ${actual}`);
}

/** Print the run and exit. Called once, at the end of `run.ts`. */
export function report(): void {
  let failed = 0;
  for (const r of results) {
    if (r.ok) {
      console.log(`  ok   ${r.name}`);
    } else {
      failed++;
      console.log(`  FAIL ${r.name}\n         ${r.error}`);
    }
  }
  console.log(`\n${results.length - failed} passed, ${failed} failed, ${results.length} checks.`);
  if (failed) process.exit(1);
}
