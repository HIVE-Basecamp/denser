/**
 * An account's day, hour by hour.
 *
 * Pure: no network, no React, no user-facing English.
 *
 * Today, not a composite. The day runs 00:00 to 23:59 UTC and rolls over at
 * midnight UTC — the same clock Hive itself runs on, the one that decides when
 * Power Up Day is Power Up Day and when it has stopped being it. An action at
 * 23:59 and an action at 00:01 are on different days here, as they are on
 * chain.
 *
 * The clock on the card counts the same hours, from the same records, so the
 * drawing and the panel behind it can never disagree.
 *
 * Hours are UTC because that is what the chain stamps. Converting to the
 * reader's own zone would move an account's midnight to somewhere it never
 * was, and would put the day boundary somewhere Hive does not keep it.
 *
 * Nothing here decides anything. A day with something in all twenty-four hours
 * is a shape a reader may find interesting; it is also what a shared account,
 * a scheduler and somebody who did not sleep last night each look like from
 * here (ETHOS.md).
 */

export const HOURS_IN_DAY = 24;

/**
 * - `post`         a post of their own
 * - `reply`        a reply under somebody's post, their own included
 * - `vote`         a vote they cast
 * - `follow`       a follow they made
 * - `powerUp`      HIVE they turned into stake, theirs or somebody else's
 * - `sent`         money they sent
 * - `received`     money that arrived
 * - `delegated`    stake they lent out
 * - `delegationIn` stake somebody lent them
 * - `delegationEnded`   a delegation of theirs that they stopped
 * - `delegationInEnded` a delegation to them that the lender stopped
 * - `claimed`      rewards they took out of the reward balance
 * - `powerDown`    stake they started turning back into HIVE
 * - `powerDownStopped` a power down they cancelled
 * - `witnessVote`  a witness they voted for
 * - `witnessUnvote` a witness they took their vote off
 * - `proxySet`     somebody they handed their witness votes to
 * - `proxyCleared` taking those votes back
 * - `proposalVote` a proposal they voted for
 * - `proposalUnvote` a proposal they took their vote off
 */
export type ActionKind =
  | 'post'
  | 'reply'
  | 'vote'
  | 'follow'
  | 'powerUp'
  | 'sent'
  | 'received'
  | 'delegated'
  | 'delegationIn'
  | 'delegationEnded'
  | 'delegationInEnded'
  | 'claimed'
  | 'powerDown'
  | 'powerDownStopped'
  | 'witnessVote'
  | 'witnessUnvote'
  | 'proxySet'
  | 'proxyCleared'
  | 'proposalVote'
  | 'proposalUnvote';

/** One thing that happened, reduced to what a single line needs. */
export interface ActionRecord {
  kind: ActionKind;
  timestampMs: number;
  /** The other account, where the action has one. Empty otherwise. */
  counterparty: string;
  /**
   * The post it was aimed at — theirs for a post, the parent for a reply, the
   * voted one for a vote. With the counterparty it makes a whole address.
   */
  permlink?: string;
  /** How hard they voted, in percent. Negative on a downvote. */
  percent?: number;
  hive?: number;
  hbd?: number;
  /** VESTS. Turned into HP where the rate is known, and left out where it is not. */
  vests?: number;
  /** What was written on a transfer. Often the only thing saying what it was for. */
  memo?: string;
  /** The proposals a governance vote covered. One operation can carry several. */
  proposalIds?: number[];
}

/** Where a line's post lives, or null where the action was not aimed at one. */
export function actionPostHref(action: ActionRecord, account: string): string | null {
  if (!action.permlink) return null;
  if (action.kind === 'post') return `/@${account}/${action.permlink}`;
  if (action.kind === 'reply' || action.kind === 'vote') {
    return action.counterparty ? `/@${action.counterparty}/${action.permlink}` : null;
  }
  return null;
}

export interface HourBucket {
  /** 0-23, UTC. */
  hour: number;
  /** Everything that landed in this hour, newest first. */
  actions: ActionRecord[];
}

/** Midnight UTC of the day an instant falls in. The day boundary Hive keeps. */
export function utcDayStart(timestampMs: number): number {
  const when = new Date(timestampMs);
  return Date.UTC(when.getUTCFullYear(), when.getUTCMonth(), when.getUTCDate());
}

/**
 * Today's actions, sorted into its twenty-four hours.
 *
 * Every hour is returned, including the empty ones. The gaps are the reading:
 * eight busy hours and sixteen quiet ones is a person with a routine, and
 * twenty-four busy is not, and neither is visible in a list that prints only
 * the hours something happened in.
 */
export function bucketDay(actions: ActionRecord[]): HourBucket[] {
  const hours: HourBucket[] = Array.from({ length: HOURS_IN_DAY }, (_, hour) => ({
    hour,
    actions: []
  }));

  for (const action of actions) {
    if (!Number.isFinite(action.timestampMs)) continue;
    const hour = new Date(action.timestampMs).getUTCHours();
    if (hour < 0 || hour >= HOURS_IN_DAY) continue;
    hours[hour].actions.push(action);
  }

  // Newest first inside an hour. The records arrive that way, but nothing
  // promises it, and a day read out of order is worse than no day.
  for (const bucket of hours) bucket.actions.sort((a, b) => b.timestampMs - a.timestampMs);
  return hours;
}
