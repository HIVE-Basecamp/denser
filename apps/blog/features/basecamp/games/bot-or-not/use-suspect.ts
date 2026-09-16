'use client';

import { useQuery } from '@tanstack/react-query';
import type { Entry, FullAccount } from '@hive/common-hiveio-packages/wax';
import { getPost } from '@transaction/lib/bridge-api';
import { getAccounts } from '@transaction/lib/hive-api';
import { StaleTime } from '@/blog/lib/react-query';
import { DEFAULT_OBSERVER } from '@/blog/lib/utils';
import { parseIsoMs, type SignalAccountInput } from '../../lib/signals';
import type { Newcomer } from '../../hooks/use-newcomers';
import type { BotSuspect } from './use-bot-queue';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * The narrow account snapshot the postcard's readouts need.
 *
 * This is the same mapping hooks/use-newcomers.ts makes for the feed. The feed
 * builds it while paging the whole "created" stream, so there is nothing to
 * call from here; when a third caller wants it, lift this out of both.
 */
function accountSnapshot(account: FullAccount): SignalAccountInput {
  return {
    createdIso: account.created ?? null,
    postCount: typeof account.post_count === 'number' ? account.post_count : null,
    postingJsonMetadata: account.posting_json_metadata ?? null,
    jsonMetadata: account.json_metadata ?? null,
    lastPostIso: account.last_post ?? null,
    lastVoteTimeIso: account.last_vote_time ?? null,
    receivedVestingAmount: account.received_vesting_shares?.amount ?? null,
    vestingSharesAmount: account.vesting_shares?.amount ?? null,
    delegatedVestingAmount: account.delegated_vesting_shares?.amount ?? null,
    postingRewards: account.posting_rewards ?? null,
    curationRewards: account.curation_rewards ?? null
  };
}

function ageDays(createdIso: string | null): number {
  const createdMs = parseIsoMs(createdIso);
  if (createdMs === null) return -1;
  return Math.floor((Date.now() - createdMs) / MS_PER_DAY);
}

export interface SuspectDetail {
  /** Everything the postcard needs, in the shape the feed hands it. */
  newcomer: Newcomer;
  /** Straight off the post, so the profile can print it without a second read. */
  reputation: number;
}

async function fetchSuspect(suspect: BotSuspect): Promise<SuspectDetail | null> {
  const [post, accounts] = await Promise.all([
    getPost(suspect.account, suspect.permlink, DEFAULT_OBSERVER),
    getAccounts([suspect.account])
  ]);
  const account = accounts[0];
  if (!post || !account) return null;
  const snapshot = accountSnapshot(account);
  return {
    newcomer: { post: post as Entry, accountAgeDays: ageDays(snapshot.createdIso), account: snapshot },
    reputation: post.author_reputation
  };
}

/**
 * Pulls up one account: the post that got it reported, and the account itself.
 *
 * Both reads are needed before the postcard can be drawn, so they go together
 * and the card waits for the pair. A post that has since been deleted comes
 * back null, and the game says so rather than drawing an empty card.
 */
export function useSuspect(suspect: BotSuspect | null) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['basecampBotSuspect', suspect?.account, suspect?.permlink],
    queryFn: () => fetchSuspect(suspect as BotSuspect),
    enabled: suspect !== null,
    staleTime: StaleTime.MEDIUM
  });

  return { detail: data ?? null, isLoading: suspect !== null && isLoading, isError };
}
