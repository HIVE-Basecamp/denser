'use client';

import { useQuery } from '@tanstack/react-query';
import { getChain } from '@transaction/lib/chain';
import { StaleTime } from '@/blog/lib/react-query';

/**
 * Who this account has delegated Hive Power to, right now.
 *
 * Deliberately not read from history. A delegation operation sets a
 * delegation to a new figure rather than adding to it, and a figure of zero
 * takes it all back — so a history walk has to replay every record in order to
 * work out what stands today. The chain keeps the standing figures itself, and
 * hands them over in one call.
 *
 * The other direction has no such call: nothing on the chain lists who has
 * delegated *to* an account, so that side is still read from history by the
 * payers hook.
 */

/** As many delegatees as the panel will list. Past this the list is not the point. */
const DELEGATION_LIMIT = 100;

export interface DelegationOut {
  delegatee: string;
  /** The standing delegation, in VESTS. */
  vests: number;
}

interface NaiAsset {
  amount?: unknown;
  precision?: unknown;
}

function assetValue(asset: unknown): number | null {
  if (typeof asset !== 'object' || asset === null) return null;
  const { amount, precision } = asset as NaiAsset;
  const raw = Number(amount);
  const places = Number(precision);
  if (!Number.isFinite(raw) || !Number.isFinite(places)) return null;
  return raw / 10 ** places;
}

export async function fetchDelegationsOut(account: string): Promise<DelegationOut[]> {
  const chain = await getChain();
  const response = await chain.api.database_api.list_vesting_delegations({
    start: [account, ''],
    limit: DELEGATION_LIMIT,
    order: 'by_delegation'
  });

  const rows: DelegationOut[] = [];
  for (const delegation of response.delegations ?? []) {
    // The list runs on past this account into the next one, so it stops at the
    // first row that is not theirs.
    if (delegation.delegator !== account) break;
    const vests = assetValue(delegation.vesting_shares);
    if (vests === null || vests <= 0) continue;
    rows.push({ delegatee: delegation.delegatee, vests });
  }
  return rows.sort((a, b) => b.vests - a.vests);
}

export type DelegationsOutStatus = 'idle' | 'loading' | 'ready' | 'unavailable';

export function useDelegationsOut(account: string, enabled = true) {
  const isEnabled = enabled && Boolean(account);
  const { data, isError } = useQuery({
    queryKey: ['basecampDelegationsOut', account] as const,
    queryFn: () => fetchDelegationsOut(account),
    enabled: isEnabled,
    staleTime: StaleTime.MEDIUM,
    retry: 1
  });

  let status: DelegationsOutStatus;
  if (isError) status = 'unavailable';
  else if (data) status = 'ready';
  else if (isEnabled) status = 'loading';
  else status = 'idle';

  return { delegations: data ?? [], status };
}
