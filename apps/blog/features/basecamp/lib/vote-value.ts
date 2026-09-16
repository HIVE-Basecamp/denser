/**
 * What a vote was worth, in HBD.
 *
 * Pure, like signals.ts and patterns.ts — no network, no React, no
 * user-facing English. The caller fetches the reward fund and the price feed
 * and hands the raw strings in.
 *
 * A vote carries no money of its own. What it carries is `rshares`, a share of
 * the whole reward pool, and the pool's size and the HIVE price both move. So
 * every figure here is the same arithmetic every Hive front end uses to print a
 * vote's value:
 *
 *   hbd = rshares / recent_claims * reward_balance * (HIVE price in HBD)
 *
 * Checked against five live trending posts on 2026-09-16: net_rshares put
 * through this came out within 0.3% of the payout hivemind reports.
 *
 * Two things it is not. It values every vote at *today's* pool and today's
 * price, not the ones in force when the vote was cast, so an old vote is
 * restated in today's money rather than recalled at its own. And a vote's share
 * is not the same as money in a pocket: half of it goes to the curator, the
 * post may never have paid out, and downvotes take value away. It is the weight
 * the voter threw, priced — which is the thing worth comparing between voters.
 */

/** Nai amounts arrive as an integer string plus the number of decimal places. */
export interface NaiAmount {
  amount: string | number;
  precision: number;
}

export interface VoteValueInput {
  /** The post reward fund's `recent_claims`: a very large integer as a string. */
  recentClaims: string | number | null | undefined;
  /** The fund's `reward_balance`, as condenser prints it: "1116698.621 HIVE". */
  rewardBalance: string | null | undefined;
  /** The median price feed: HBD per HIVE, as base over quote. */
  base: NaiAmount | null | undefined;
  quote: NaiAmount | null | undefined;
}

function naiToNumber(asset: NaiAmount | null | undefined): number | null {
  if (!asset) return null;
  const amount = Number(asset.amount);
  const precision = Number(asset.precision);
  if (!Number.isFinite(amount) || !Number.isFinite(precision)) return null;
  return amount / 10 ** precision;
}

/** "1116698.621 HIVE" -> 1116698.621. The unit is dropped; the fund is always in HIVE. */
function assetStringToNumber(value: string | null | undefined): number | null {
  if (typeof value !== 'string') return null;
  const amount = Number.parseFloat(value);
  return Number.isFinite(amount) ? amount : null;
}

/**
 * HBD per rshare, or null when any part of the lookup is missing — a rate this
 * code could not compute must never become a zero, which would print every
 * vote as worthless.
 *
 * `recent_claims` is around 7.8e17, past the point where a double holds every
 * digit. It is a divisor in a ratio, so the sixteenth digit does not survive
 * and does not matter; nothing here is an exact accounting figure.
 */
export function hbdPerRshare(input: VoteValueInput): number | null {
  const recentClaims = Number(input.recentClaims);
  const rewardBalance = assetStringToNumber(input.rewardBalance);
  const base = naiToNumber(input.base);
  const quote = naiToNumber(input.quote);
  if (!Number.isFinite(recentClaims) || recentClaims <= 0) return null;
  if (rewardBalance === null || rewardBalance <= 0) return null;
  if (base === null || quote === null || quote <= 0) return null;
  const rate = (rewardBalance / recentClaims) * (base / quote);
  return Number.isFinite(rate) && rate > 0 ? rate : null;
}

/**
 * HBD per HIVE, straight off the median price feed — what one HIVE is worth in
 * HBD right now. Null when the feed is missing or nonsense, never a 1: a
 * made-up parity would silently price HBD five times too cheap.
 */
export function hbdPerHive(base: NaiAmount | null | undefined, quote: NaiAmount | null | undefined): number | null {
  const baseValue = naiToNumber(base);
  const quoteValue = naiToNumber(quote);
  if (baseValue === null || quoteValue === null || quoteValue <= 0) return null;
  const rate = baseValue / quoteValue;
  return Number.isFinite(rate) && rate > 0 ? rate : null;
}

/** A pile of rshares in HBD, or null while the rate is unknown. */
export function hbdFromRshares(rshares: number, rate: number | null): number | null {
  if (rate === null || !Number.isFinite(rshares)) return null;
  return rshares * rate;
}
