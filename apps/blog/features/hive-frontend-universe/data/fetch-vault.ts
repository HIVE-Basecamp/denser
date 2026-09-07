/**
 * Hive Frontend Universe — the vault the Emperor's hoard went into.
 *
 * On Hive the bought stake was moved into the DHF at hardfork 24 (October
 * 2020). The fund lives in the `hive.fund` account, which has no keys of
 * any kind: nobody can spend it except by proposal vote. One
 * `condenser_api.get_accounts` call, asked for when the bug reaches the keep
 * (engine/keep.ts), cached for an hour. Read only, like every fetch here.
 */

import { configuredApiEndpoint } from '@ui/config/public-vars';
import { getStorageItem, setStorageItem, StorageTTL } from '@ui/lib/storage-with-ttl';

export const VAULT_ACCOUNT = 'hive.fund';

export interface Vault {
  /** Liquid HIVE and HBD held right now. */
  hive: number;
  hbd: number;
  /** True when owner, active and posting all hold no key and no account. */
  keyless: boolean;
  createdMs: number;
}

const KEY = 'hfu-vault';

interface RawAuthority {
  key_auths: unknown[];
  account_auths: unknown[];
}

interface RawAccount {
  balance: string;
  hbd_balance: string;
  owner: RawAuthority;
  active: RawAuthority;
  posting: RawAuthority;
  created: string;
}

/** "28383868.307 HIVE" -> 28383868.307 */
function amount(asset: string): number {
  return parseFloat(asset) || 0;
}

function empty(auth: RawAuthority | undefined): boolean {
  return !!auth && auth.key_auths.length === 0 && auth.account_auths.length === 0;
}

export async function fetchVault(endpoint: string = configuredApiEndpoint): Promise<Vault> {
  const cached = getStorageItem<Vault>(KEY);
  if (cached) return cached;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'condenser_api.get_accounts',
      params: [[VAULT_ACCOUNT]],
      id: 1
    })
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message ?? 'get_accounts failed');
  const raw = (json.result as RawAccount[])[0];
  if (!raw) throw new Error(`${VAULT_ACCOUNT} not found`);
  const out: Vault = {
    hive: amount(raw.balance),
    hbd: amount(raw.hbd_balance),
    keyless: empty(raw.owner) && empty(raw.active) && empty(raw.posting),
    createdMs: new Date(`${raw.created}Z`).getTime()
  };
  setStorageItem(KEY, out, StorageTTL.CACHE);
  return out;
}
