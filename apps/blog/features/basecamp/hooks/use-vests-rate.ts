'use client';

import { useQuery } from '@tanstack/react-query';
import { getDynamicGlobalProperties } from '@transaction/lib/hive-api';
import { StaleTime } from '@/blog/lib/react-query';
import { vestsToHivePowerRate } from '../lib/stake';

/**
 * The chain-wide VESTS-to-HP conversion rate.
 *
 * This figure is identical for every account, so it is deliberately not part of
 * the per-card lookup: React Query keys it once and every card on the page
 * shares the single request, however long the feed grows. It drifts slowly —
 * only as the reward pool grows — so it is cached for the longest stale window
 * the app offers.
 *
 * Returns null while loading or if the request fails. Every readout that needs
 * it treats null as "not known yet" and shows a placeholder rather than a zero.
 */
export const useVestsToHivePowerRate = (): number | null => {
  const { data } = useQuery({
    queryKey: ['basecampVestsRate'],
    queryFn: async () => {
      const properties = await getDynamicGlobalProperties();
      return vestsToHivePowerRate(
        properties.total_vesting_fund_hive?.amount,
        properties.total_vesting_shares?.amount
      );
    },
    staleTime: StaleTime.LONG,
    retry: false
  });

  return data ?? null;
};
