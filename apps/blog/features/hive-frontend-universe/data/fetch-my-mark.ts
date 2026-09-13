/**
 * Hive Frontend Universe — have I voted on or replied to this post?
 *
 * The new-posts challenge (lib/goals.ts) asks the chain, it never writes to
 * it: one `condenser_api.get_active_votes` call plus the repliers of the same
 * post, both asked fresh, because the whole point is to notice something the
 * player has only just done on hive.blog. Called at most once every few
 * seconds per post (engine/post-marks.ts), so nothing is cached here.
 */

import { configuredApiEndpoint } from '@ui/config/public-vars';
import { fetchRepliers } from './fetch-replies';

export interface PostMark {
  voted: boolean;
  replied: boolean;
}

interface RawVote {
  voter?: string;
}

async function fetchVoters(author: string, permlink: string, endpoint: string): Promise<string[]> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'condenser_api.get_active_votes',
      params: [author, permlink],
      id: 1
    })
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message ?? 'get_active_votes failed');
  return (json.result as RawVote[]).map((v) => v.voter).filter((v): v is string => typeof v === 'string');
}

export async function fetchMyMark(
  author: string,
  permlink: string,
  handle: string,
  endpoint: string = configuredApiEndpoint
): Promise<PostMark> {
  const [voters, repliers] = await Promise.all([
    fetchVoters(author, permlink, endpoint),
    fetchRepliers(author, permlink, endpoint, true)
  ]);
  return {
    voted: voters.includes(handle),
    replied: repliers.some((r) => r.handle === handle)
  };
}
