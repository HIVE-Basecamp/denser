/**
 * One chain operation, read as a line a person can read.
 *
 * Pure, and split out from account-operations.ts because it is the one part
 * that knows what each kind of operation *means* rather than how many of them
 * there are. Nothing here decides anything about the account (ETHOS.md); it
 * only says what happened, to whom, and for how much.
 */

import type { ActionRecord } from './hourly-actions';

export const VOTE_OPERATION_NAME = 'vote_operation';
export const COMMENT_OPERATION_NAME = 'comment_operation';
export const CUSTOM_JSON_OPERATION_NAME = 'custom_json_operation';
export const POWER_UP_OPERATION_NAME = 'transfer_to_vesting_operation';
export const TRANSFER_OPERATION_NAME = 'transfer_operation';
export const DELEGATE_OPERATION_NAME = 'delegate_vesting_shares_operation';
export const CLAIM_OPERATION_NAME = 'claim_reward_balance_operation';
export const POWER_DOWN_OPERATION_NAME = 'withdraw_vesting_operation';
export const WITNESS_VOTE_OPERATION_NAME = 'account_witness_vote_operation';
export const PROXY_OPERATION_NAME = 'account_witness_proxy_operation';
export const PROPOSAL_VOTE_OPERATION_NAME = 'update_proposal_votes_operation';

const FOLLOW_CUSTOM_JSON_ID = 'follow';

/**
 * The account this custom_json follows, or null when it is not a follow by this
 * account. Shape is ['follow', { follower, following, what: ['blog'] }]; an
 * empty `what` is an unfollow and 'ignore' is a mute, so neither counts.
 */
export function followedAccountName(value: Record<string, unknown>, username: string): string | null {
  try {
    if (value.id !== FOLLOW_CUSTOM_JSON_ID) return null;
    const auths = value.required_posting_auths;
    if (!Array.isArray(auths) || !auths.includes(username)) return null;
    const parsed: unknown = JSON.parse(String(value.json));
    if (!Array.isArray(parsed) || parsed[0] !== 'follow') return null;
    const body = parsed[1];
    if (typeof body !== 'object' || body === null) return null;
    const record = body as Record<string, unknown>;
    const what = record.what;
    if (!Array.isArray(what) || !what.includes('blog')) return null;
    return typeof record.following === 'string' ? record.following : null;
  } catch {
    return null;
  }
}

/** A vote weight is in hundredths of a percent. */
const WEIGHT_PER_PERCENT = 100;
/** The asset identifiers Hive stamps on an amount. */
const NAI_HIVE = '@@000000021';
const NAI_HBD = '@@000000013';

interface NaiAsset {
  nai?: unknown;
  amount?: unknown;
  precision?: unknown;
}

/** `{ amount: "125000", precision: 3 }` -> 125. Zero where it is not an amount. */
function assetValue(asset: unknown): number {
  if (typeof asset !== 'object' || asset === null) return 0;
  const { amount, precision } = asset as NaiAsset;
  const raw = Number(amount);
  const places = Number(precision);
  if (!Number.isFinite(raw) || !Number.isFinite(places)) return 0;
  return raw / 10 ** places;
}

function assetNai(asset: unknown): string | null {
  if (typeof asset !== 'object' || asset === null) return null;
  const { nai } = asset as NaiAsset;
  return typeof nai === 'string' ? nai : null;
}

export function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * One operation as a line a reader can read, or nothing where it is something
 * this account did not do.
 *
 * Both directions of a transfer and a delegation are kept. Money arriving is
 * not an action the account took, but it is half of what happened to them
 * today, and a day showing only the outgoing half would read as a person who
 * gives everything away.
 */
export function toAction(
  type: string | undefined,
  value: Record<string, unknown>,
  timestampMs: number,
  username: string
): ActionRecord | null {
  switch (type) {
    case VOTE_OPERATION_NAME: {
      if (value.voter !== username) return null;
      const weight = Number(value.weight);
      return {
        kind: 'vote',
        timestampMs,
        counterparty: text(value.author),
        permlink: text(value.permlink),
        percent: Number.isFinite(weight) ? weight / WEIGHT_PER_PERCENT : undefined
      };
    }
    case COMMENT_OPERATION_NAME: {
      if (value.author !== username) return null;
      const parentAuthor = text(value.parent_author);
      if (parentAuthor === '') {
        return { kind: 'post', timestampMs, counterparty: '', permlink: text(value.permlink) };
      }
      return {
        kind: 'reply',
        timestampMs,
        counterparty: parentAuthor,
        permlink: text(value.parent_permlink)
      };
    }
    case CUSTOM_JSON_OPERATION_NAME: {
      const followed = followedAccountName(value, username);
      return followed ? { kind: 'follow', timestampMs, counterparty: followed } : null;
    }
    case POWER_UP_OPERATION_NAME: {
      if (value.from !== username) return null;
      const to = text(value.to);
      return {
        kind: 'powerUp',
        timestampMs,
        // Powering up their own stake names nobody; powering up somebody else
        // is a gift, and the name is the point of the line.
        counterparty: to === username ? '' : to,
        hive: assetValue(value.amount)
      };
    }
    case TRANSFER_OPERATION_NAME: {
      const nai = assetNai(value.amount);
      if (nai !== NAI_HIVE && nai !== NAI_HBD) return null;
      const amount = assetValue(value.amount);
      const money = nai === NAI_HBD ? { hbd: amount } : { hive: amount };
      const memo = text(value.memo);
      if (value.from === username && value.to !== username) {
        return { kind: 'sent', timestampMs, counterparty: text(value.to), memo, ...money };
      }
      if (value.to === username && value.from !== username) {
        return { kind: 'received', timestampMs, counterparty: text(value.from), memo, ...money };
      }
      return null;
    }
    case DELEGATE_OPERATION_NAME: {
      const vests = assetValue(value.vesting_shares);
      // Hive cancels a delegation by setting it to nothing. It is a different
      // event from lending, not a loan of zero, and it says the opposite thing
      // about the two accounts.
      const ended = vests === 0;
      if (value.delegator === username) {
        return {
          kind: ended ? 'delegationEnded' : 'delegated',
          timestampMs,
          counterparty: text(value.delegatee),
          vests
        };
      }
      if (value.delegatee === username) {
        return {
          kind: ended ? 'delegationInEnded' : 'delegationIn',
          timestampMs,
          counterparty: text(value.delegator),
          vests
        };
      }
      return null;
    }
    case POWER_DOWN_OPERATION_NAME: {
      if (value.account !== username) return null;
      const vests = assetValue(value.vesting_shares);
      // Hive stops a power down by setting it to nothing, the same way it
      // cancels a delegation. Stopping one is the opposite decision to
      // starting one, and the line says which.
      return vests === 0
        ? { kind: 'powerDownStopped', timestampMs, counterparty: '' }
        : { kind: 'powerDown', timestampMs, counterparty: '', vests };
    }
    case WITNESS_VOTE_OPERATION_NAME: {
      // The witness is an impacted account too, so without this a witness's
      // own card would count every vote it was given as something it did.
      if (value.account !== username) return null;
      return {
        kind: value.approve === false ? 'witnessUnvote' : 'witnessVote',
        timestampMs,
        counterparty: text(value.witness)
      };
    }
    case PROXY_OPERATION_NAME: {
      if (value.account !== username) return null;
      const proxy = text(value.proxy);
      return proxy === ''
        ? { kind: 'proxyCleared', timestampMs, counterparty: '' }
        : { kind: 'proxySet', timestampMs, counterparty: proxy };
    }
    case PROPOSAL_VOTE_OPERATION_NAME: {
      if (value.voter !== username) return null;
      const ids = Array.isArray(value.proposal_ids)
        ? value.proposal_ids.map(Number).filter((id) => Number.isFinite(id))
        : [];
      return {
        kind: value.approve === false ? 'proposalUnvote' : 'proposalVote',
        timestampMs,
        counterparty: '',
        proposalIds: ids
      };
    }
    case CLAIM_OPERATION_NAME: {
      if (value.account !== username) return null;
      return {
        kind: 'claimed',
        timestampMs,
        counterparty: '',
        hive: assetValue(value.reward_hive),
        hbd: assetValue(value.reward_hbd),
        vests: assetValue(value.reward_vests)
      };
    }
    default:
      return null;
  }
}
