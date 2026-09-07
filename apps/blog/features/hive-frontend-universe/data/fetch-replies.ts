/**
 * Hive Frontend Universe — who replied to one post.
 *
 * One `condenser_api.get_content_replies` call per post, asked for lazily
 * as the bug comes near a house (engine/footprints.ts), cached for an hour
 * so a player leaving and re-entering the round asks nothing twice. Read
 * only, like every other fetch here.
 */

import { configuredApiEndpoint } from '@ui/config/public-vars';
import { getStorageItem, setStorageItem, StorageTTL } from '@ui/lib/storage-with-ttl';

export interface Replier {
  handle: string;
  createdMs: number;
}

const KEY_PREFIX = 'hfu-replies-';

interface RawReply {
  author: string;
  created: string;
}

export async function fetchRepliers(
  author: string,
  permlink: string,
  endpoint: string = configuredApiEndpoint
): Promise<Replier[]> {
  const key = `${KEY_PREFIX}${author}/${permlink}`;
  const cached = getStorageItem<Replier[]>(key);
  if (cached) return cached;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'condenser_api.get_content_replies',
      params: [author, permlink],
      id: 1
    })
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message ?? 'get_content_replies failed');
  const out: Replier[] = (json.result as RawReply[]).map((r) => ({
    handle: r.author,
    createdMs: new Date(`${r.created}Z`).getTime()
  }));
  setStorageItem(key, out, StorageTTL.CACHE);
  return out;
}
