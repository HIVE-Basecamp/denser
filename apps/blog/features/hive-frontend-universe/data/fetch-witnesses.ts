/**
 * Hive Frontend Universe - the top 21 witnesses, for the citadel ring.
 *
 * These are the accounts actually producing blocks, so the towers standing
 * around the outside of the world are the real consensus set, in rank order,
 * not decoration invented for the game. One `condenser_api.get_witnesses_by_vote`
 * call returns exactly the 21 in vote order; a second cheap
 * `get_dynamic_global_properties` call converts approval VESTS into HP so the
 * card can show a number a human recognises.
 *
 * READ ONLY. Nothing here signs or broadcasts anything.
 *
 * Cached for an hour under its own key, in its own file, so the board and
 * community fetches stay untouched.
 */

import { configuredApiEndpoint } from '@ui/config/public-vars';
import { getStorageItem, setStorageItem, StorageTTL } from '@ui/lib/storage-with-ttl';

export interface TopWitness {
  /** Account name; also the handle its avatar is fetched with. */
  name: string;
  /** 1 for the top-voted witness, through 21. */
  rank: number;
  /** Blocks this witness has missed, all time. Used only to tint the tower. */
  missed: number;
  /** Reported node version, for the tower's little version tag. */
  version: string;
  /** Last block this witness confirmed, for the visit card. */
  lastBlock: number;
  /** The witness's own declared page, when they declared one. */
  url: string;
  /** The HBD savings interest rate this witness votes for, e.g. "15%". */
  hbdApr: string;
  /** The witness's published HIVE price feed, e.g. "0.238 HBD". */
  priceFeed: string;
  /** Total approval voting for this witness, in HP, e.g. "92.4M HP". */
  votesHp: string;
  /** The account creation fee this witness votes for, e.g. "3 HIVE". */
  creationFee: string;
  /** The maximum block size this witness votes for, e.g. "64 KB". */
  blockSize: string;
  /** The year this witness registered, e.g. "2016". */
  since: string;
}

/** v3: the card grew the witness's actual chain-parameter votes. */
const CACHE_KEY = 'hfu-witnesses-v3';
/** The consensus set is exactly 21 accounts. */
export const WITNESS_COUNT = 21;

interface RawWitness {
  owner: string;
  total_missed: number;
  running_version: string;
  last_confirmed_block_num: number;
  url: string;
  created: string;
  votes: string;
  props: {
    account_creation_fee: string;
    maximum_block_size: number;
    hbd_interest_rate: number;
  };
  hbd_exchange_rate: { base: string; quote: string };
}

async function rpc<T>(endpoint: string, method: string, params: unknown[]): Promise<T> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 })
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message ?? `${method} failed`);
  return json.result as T;
}

export async function fetchTopWitnesses(
  endpoint: string = configuredApiEndpoint
): Promise<TopWitness[]> {
  const cached = getStorageItem<TopWitness[]>(CACHE_KEY);
  if (cached) return cached;

  const [rows, globals] = await Promise.all([
    rpc<RawWitness[]>(endpoint, 'condenser_api.get_witnesses_by_vote', ['', WITNESS_COUNT]),
    rpc<{ total_vesting_fund_hive: string; total_vesting_shares: string }>(
      endpoint,
      'condenser_api.get_dynamic_global_properties',
      []
    )
  ]);
  // HIVE per VESTS, for turning raw approval into HP.
  const fundHive = parseFloat(globals.total_vesting_fund_hive);
  const shares = parseFloat(globals.total_vesting_shares);
  const hivePerVest = shares > 0 ? fundHive / shares : 0;

  const top = (rows ?? []).slice(0, WITNESS_COUNT).map((r, i) => {
    // `votes` is a micro-VESTS integer string; HP is what a human reads.
    const hp = (parseFloat(r.votes ?? '0') / 1e6) * hivePerVest;
    const aprBp = r.props?.hbd_interest_rate ?? 0;
    const feedBase = parseFloat(r.hbd_exchange_rate?.base ?? '0');
    const feedQuote = parseFloat(r.hbd_exchange_rate?.quote ?? '1') || 1;
    return {
      name: r.owner,
      rank: i + 1,
      missed: r.total_missed ?? 0,
      version: r.running_version ?? '',
      lastBlock: r.last_confirmed_block_num ?? 0,
      url: r.url ?? '',
      hbdApr: `${aprBp % 100 === 0 ? aprBp / 100 : (aprBp / 100).toFixed(1)}%`,
      priceFeed: feedBase > 0 ? `${(feedBase / feedQuote).toFixed(3)} HBD` : '?',
      votesHp: hp > 0 ? `${(hp / 1e6).toFixed(1)}M HP` : '?',
      creationFee: r.props?.account_creation_fee
        ? `${parseFloat(r.props.account_creation_fee)} HIVE`
        : '?',
      blockSize: r.props?.maximum_block_size
        ? `${Math.round(r.props.maximum_block_size / 1024)} KB`
        : '?',
      since: r.created ? r.created.slice(0, 4) : '?'
    };
  });

  setStorageItem(CACHE_KEY, top, StorageTTL.CACHE);
  return top;
}
