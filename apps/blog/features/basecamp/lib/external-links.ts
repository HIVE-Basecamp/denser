'use client';

import env from '@beam-australia/react-env';

/**
 * Where the wallet lives when the deployment has not configured its own. The
 * same fallback the map uses, for the same reason: a link that resolves to
 * `undefined` is worse than no link at all.
 */
const WALLET_FALLBACK = 'https://wallet.hive.blog';

/**
 * An account's own transfer history, on the wallet.
 *
 * The panel can show the trail it read, but it read a bounded slice of it. This
 * is the way to the whole record, kept by the software that owns it rather than
 * copied into ours.
 */
export function walletTransfersHref(account: string): string {
  const wallet = env('WALLET_ENDPOINT') || WALLET_FALLBACK;
  return `${wallet}/@${account}/transfers`;
}
