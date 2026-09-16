'use client';

import { useQuery } from '@tanstack/react-query';
import { getChain } from '@transaction/lib/chain';
import { StaleTime } from '@/blog/lib/react-query';
import { hbdPerRshare } from '../lib/vote-value';

/**
 * What one rshare is worth in HBD right now.
 *
 * Two chain-wide reads that are the same for every account on the page, so
 * this is one query key with no account in it: a feed of twenty cards asks for
 * the rate once and everybody reads that answer. It moves slowly — the reward
 * pool and the median price feed both change over hours — so it is held for a
 * long while rather than re-read per panel.
 *
 * `get_reward_fund` is asked of condenser_api on purpose. It is declared on
 * database_api in the wax typings, but hived does not register it there and
 * answers "Could not find method get_reward_fund".
 */
export function voteValueQueryKey() {
  return ['basecampVoteValue'] as const;
}

export async function fetchVoteValueRate(): Promise<number | null> {
  const chain = await getChain();
  const [fund, feed] = await Promise.all([
    chain.api.condenser_api.get_reward_fund(['post']),
    chain.api.database_api.get_feed_history()
  ]);
  return hbdPerRshare({
    recentClaims: fund?.recent_claims,
    rewardBalance: fund?.reward_balance,
    base: feed?.current_median_history?.base,
    quote: feed?.current_median_history?.quote
  });
}

/**
 * `enabled` defers the read until a panel that prints values is actually
 * opened. A null rate is not an error the reader needs to see — the votes are
 * still counted and ranked, the money column simply stays blank.
 */
export function useVoteValueRate(enabled = true) {
  const { data } = useQuery({
    queryKey: voteValueQueryKey(),
    queryFn: fetchVoteValueRate,
    enabled,
    staleTime: StaleTime.LONG,
    retry: 1
  });

  return data ?? null;
}
