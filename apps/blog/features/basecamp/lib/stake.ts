/**
 * Pure stake maths: turning the raw vesting and reward numbers the account
 * lookup already returns into figures a person can read.
 *
 * Same rules as lib/signals.ts and lib/patterns.ts — no network, no date
 * library, no user-facing English — so this stays liftable into a standalone
 * package and unit testable on its own.
 *
 * Hive stores stake as VESTS, an internal unit whose worth in HIVE drifts as
 * the reward pool grows. Converting to Hive Power (HP) needs one global figure,
 * `total_vesting_fund_hive / total_vesting_shares`, which is the same for every
 * account and so is fetched once and passed in rather than looked up per card.
 */

/** Hive stores VESTS amounts as an integer string with six implied decimals. */
const VESTS_PRECISION = 6;
/** HIVE amounts carry three implied decimals. */
const HIVE_PRECISION = 3;
/** Reward totals are whole numbers with three implied decimals. */
const REWARD_PRECISION = 1000;

function scaledAmount(amount: string | number | null | undefined, precision: number): number | null {
  try {
    if (amount === null || amount === undefined) return null;
    const raw = Number(amount);
    if (!Number.isFinite(raw)) return null;
    return raw / Math.pow(10, precision);
  } catch {
    return null;
  }
}

/** VESTS from a raw chain amount string such as "434355259154077". */
export function vestsFromAmount(amount: string | number | null | undefined): number | null {
  return scaledAmount(amount, VESTS_PRECISION);
}

/** HIVE from a raw chain amount string. */
export function hiveFromAmount(amount: string | number | null | undefined): number | null {
  return scaledAmount(amount, HIVE_PRECISION);
}

/**
 * HP per VEST, from the two global totals. Returned as a plain number so every
 * card can convert without repeating the lookup. Null when either total is
 * missing or the chain reports no vesting shares at all.
 */
export function vestsToHivePowerRate(
  totalVestingFundHiveAmount: string | number | null | undefined,
  totalVestingSharesAmount: string | number | null | undefined
): number | null {
  const fund = hiveFromAmount(totalVestingFundHiveAmount);
  const shares = vestsFromAmount(totalVestingSharesAmount);
  if (fund === null || shares === null || shares <= 0) return null;
  return fund / shares;
}

/** Hive Power for a VESTS amount, or null when either input is missing. */
export function hivePowerFromAmount(
  amount: string | number | null | undefined,
  rate: number | null
): number | null {
  const vests = vestsFromAmount(amount);
  if (vests === null || rate === null || !Number.isFinite(rate)) return null;
  return vests * rate;
}

/**
 * The stake an account actually wields: what it owns, less what it has lent
 * out, plus what has been lent to it.
 */
export function activeHivePower(
  ownAmount: string | number | null | undefined,
  delegatedOutAmount: string | number | null | undefined,
  receivedAmount: string | number | null | undefined,
  rate: number | null
): number | null {
  const own = hivePowerFromAmount(ownAmount, rate);
  if (own === null) return null;
  const out = hivePowerFromAmount(delegatedOutAmount, rate) ?? 0;
  const received = hivePowerFromAmount(receivedAmount, rate) ?? 0;
  return own - out + received;
}

/**
 * KE: lifetime rewards divided by the stake the account owns.
 *
 * Both reward totals are lifetime figures the chain keeps for every account,
 * expressed in the same units as HP once scaled. A low number means most of
 * what the account earned is still held as stake; a high number means the
 * earnings went elsewhere. Taking earnings out is not wrongdoing — people are
 * paid for their work — and this readout says only what the ratio is.
 *
 * Null when the account owns no stake at all, because dividing by nothing
 * would report an enormous ratio for someone who has simply just arrived.
 */
export function keScore(
  postingRewards: number | string | null | undefined,
  curationRewards: number | string | null | undefined,
  ownHivePower: number | null
): number | null {
  if (ownHivePower === null || ownHivePower <= 0) return null;
  const posting = Number(postingRewards ?? 0);
  const curation = Number(curationRewards ?? 0);
  if (!Number.isFinite(posting) || !Number.isFinite(curation)) return null;
  const rewards = (posting + curation) / REWARD_PRECISION;
  return rewards / ownHivePower;
}

/**
 * What share of an account's own stake is currently lent to somebody else.
 * Null when the account owns nothing, so a brand new account reads as unknown
 * rather than 0%.
 */
export function delegatedOutPercent(
  ownAmount: string | number | null | undefined,
  delegatedOutAmount: string | number | null | undefined
): number | null {
  const own = vestsFromAmount(ownAmount);
  const out = vestsFromAmount(delegatedOutAmount);
  if (own === null || out === null || own <= 0) return null;
  return (out / own) * 100;
}
