'use client';

import { useQuery } from '@tanstack/react-query';
import { getChain } from '@transaction/lib/chain';
import { StaleTime } from '@/blog/lib/react-query';
import { hbdPerHive, hbdPerRshare } from '../lib/vote-value';

/**
 * The two chain-wide money rates, from one pair of reads.
 *
 * Both are the same for every account on the page, so this is one query key
 * with no account in it: a feed of twenty cards asks once and everybody reads
 * that answer. They move slowly — the reward pool and the median price feed
 * both change over hours — so they are held for a long while.
 *
 * `get_reward_fund` is asked of condenser_api on purpose. It is declared on
 * database_api in the wax typings, but hived does not register it there and
 * answers "Could not find method get_reward_fund".
 */
export function voteValueQueryKey() {
  return ['basecampVoteValue'] as const;
}

export interface MoneyRateReading {
  /** What one rshare is worth in HBD. */
  hbdPerRshare: number | null;
  /** What one HIVE is worth in HBD. */
  hbdPerHive: number | null;
}

export async function fetchVoteValueRate(): Promise<MoneyRateReading> {
  const chain = await getChain();
  const [fund, feed] = await Promise.all([
    chain.api.condenser_api.get_reward_fund(['post']),
    chain.api.database_api.get_feed_history()
  ]);
  const base = feed?.current_median_history?.base;
  const quote = feed?.current_median_history?.quote;
  return {
    hbdPerRshare: hbdPerRshare({
      recentClaims: fund?.recent_claims,
      rewardBalance: fund?.reward_balance,
      base,
      quote
    }),
    hbdPerHive: hbdPerHive(base, quote)
  };
}

/**
 * `enabled` defers the read until a panel that prints values is actually
 * opened. A null rate is not an error the reader needs to see — the votes and
 * the payments are still counted and ranked, the money column simply stays
 * blank.
 */
function useMoneyRates(enabled: boolean) {
  const { data } = useQuery({
    queryKey: voteValueQueryKey(),
    queryFn: fetchVoteValueRate,
    enabled,
    staleTime: StaleTime.LONG,
    retry: 1
  });
  return data ?? null;
}

/** What one rshare is worth in HBD, for pricing the weight a voter threw. */
export function useVoteValueRate(enabled = true) {
  return useMoneyRates(enabled)?.hbdPerRshare ?? null;
}

/** What one HIVE is worth in HBD, for putting sent HBD and sent HIVE in one unit. */
export function useHbdPerHive(enabled = true) {
  return useMoneyRates(enabled)?.hbdPerHive ?? null;
}
