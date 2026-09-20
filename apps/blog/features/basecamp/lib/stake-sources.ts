/**
 * Where an account's Hive Power came from.
 *
 * Pure: no network, no React, no user-facing English. It takes the money
 * events that change stake and folds them into a handful of totals.
 *
 * The question behind it is a plain one. Hive Power arrives two ways: it is
 * earned, or it is powered up. Earning leaves a trail of reward payouts;
 * powering up leaves a trail naming whose HIVE it was. So whatever an account
 * holds beyond what it earned is, by definition, the powered-up figure — and
 * that figure has names attached.
 *
 * What the chain cannot say is where the HIVE itself came from. A purchase on
 * an outside exchange reaches an account as an ordinary transfer, identical in
 * every respect to a gift from a friend. Nothing here guesses at the
 * difference, and nothing here calls a shape a verdict (ETHOS.md).
 */

/** One event that moved stake into or out of the account. */
export interface StakeFlowEvent {
  /**
   * - `powerUpSelf`   their own HIVE turned into their own stake
   * - `powerUpGiven`  their HIVE turned into somebody else's stake
   * - `powerDown`     stake leaving, in VESTS
   * - `marketBuy`     HIVE bought on Hive's own order book
   * - `marketSell`    HIVE sold on Hive's own order book
   */
  kind: 'powerUpSelf' | 'powerUpGiven' | 'powerDown' | 'marketBuy' | 'marketSell' | 'rewardClaim';
  /** The other account, where there is one. */
  counterparty: string | null;
  /** HIVE, except `powerDown` and `rewardClaim`, which are VESTS. */
  amount: number;
  timestampMs: number;
}

export interface StakeFlows {
  /** False until a read has finished. Never to be drawn as a row of zeroes. */
  known: boolean;
  /** HIVE they powered up into their own stake. */
  poweredUpSelf: number;
  /** HIVE they powered up into somebody else's stake. */
  poweredUpGiven: number;
  /** VESTS that have finished leaving as a power-down. */
  poweredDownVests: number;
  /**
   * VESTS that arrived as rewards, of every kind — author, curation and
   * beneficiary alike. What the chain says landed, rather than what can be
   * worked out by subtraction.
   */
  claimedVests: number;
  /** HIVE they bought on Hive's own market, where they did. */
  boughtHive: number;
  soldHive: number;
  /** How many records were folded in. */
  counted: number;
  /** False when the read stopped before reaching the account's first record. */
  complete: boolean;
}

export const EMPTY_STAKE_FLOWS: StakeFlows = {
  known: false,
  poweredUpSelf: 0,
  poweredUpGiven: 0,
  poweredDownVests: 0,
  claimedVests: 0,
  boughtHive: 0,
  soldHive: 0,
  counted: 0,
  complete: false
};

export function createStakeFlows(): StakeFlows {
  return { ...EMPTY_STAKE_FLOWS, known: true };
}

/** Adds a page of events to the totals, in place, and forgets them. */
export function foldStakeFlows(flows: StakeFlows, events: StakeFlowEvent[]): StakeFlows {
  for (const event of events) {
    if (!Number.isFinite(event.amount)) continue;
    flows.counted++;
    switch (event.kind) {
      case 'powerUpSelf':
        flows.poweredUpSelf += event.amount;
        break;
      case 'powerUpGiven':
        flows.poweredUpGiven += event.amount;
        break;
      case 'powerDown':
        flows.poweredDownVests += event.amount;
        break;
      case 'rewardClaim':
        flows.claimedVests += event.amount;
        break;
      case 'marketBuy':
        flows.boughtHive += event.amount;
        break;
      case 'marketSell':
        flows.soldHive += event.amount;
        break;
    }
  }
  return flows;
}

/**
 * The reading the panel prints: what the account holds, and how much of it was
 * bought in rather than earned.
 */
export interface StakeOrigin {
  /** Hive Power the account owns, delegations out included. */
  ownHp: number | null;
  /** Everything powered up into it, in HIVE: their own plus everybody else's. */
  poweredUpHp: number;
  /** Their own HIVE, powered up by themselves. */
  poweredUpSelfHp: number;
  /** Somebody else's HIVE, powered up into this account. */
  poweredUpByOthersHp: number;
  /** Stake that has left as a power-down, in HP. */
  poweredDownHp: number | null;
  /**
   * Hive Power that arrived as rewards, of every kind. Read from the claims
   * themselves, so it is a figure the chain states rather than one worked out
   * by subtraction — and it holds even for an account whose earnings are all
   * beneficiary rewards, which the account's own lifetime totals never show.
   */
  fromRewardsHp: number | null;
  /** The share of what they own that was powered up rather than earned, 0-1. */
  poweredUpShare: number | null;
}

/**
 * Puts the pieces together.
 *
 * `poweredUpByOthers` comes from the payers read, which already separates
 * money other people put in; it is passed rather than recomputed so the two
 * panels can never disagree.
 */
export function stakeOrigin(
  flows: StakeFlows,
  ownHp: number | null,
  poweredUpByOthersHp: number,
  hivePerVest: number | null
): StakeOrigin {
  const poweredUpSelfHp = flows.poweredUpSelf;
  const poweredUpHp = poweredUpSelfHp + poweredUpByOthersHp;
  const poweredDownHp = hivePerVest === null ? null : flows.poweredDownVests * hivePerVest;
  const fromRewardsHp =
    hivePerVest === null || !flows.known ? null : flows.claimedVests * hivePerVest;
  const poweredUpShare =
    ownHp === null || ownHp <= 0 ? null : Math.min(Math.max(poweredUpHp / ownHp, 0), 1);
  return {
    ownHp,
    poweredUpHp,
    poweredUpSelfHp,
    poweredUpByOthersHp,
    poweredDownHp,
    fromRewardsHp,
    poweredUpShare
  };
}
