/**
 * One account's chain operations, folded into everything the card reads from
 * them: the checklist facts, the writing and voting patterns, the rates, and
 * the day on the clock.
 *
 * Pure, like signals.ts and patterns.ts — no network, no React, no date
 * library, no user-facing English. The hook does the asking; this file does
 * the counting, so the counting can be read and tested on its own.
 *
 * Two batches go in, and they are not the same question:
 *
 *   - the *window*: the account's last few days, in full. Rates, the clock's
 *     spokes and today's marks all come from here, because all three are
 *     questions about now.
 *   - the *beginning*: the account's oldest operations. Only the checklist
 *     reads these, because every item on it is a "have they ever" and an ever
 *     is answered at the start of a history, not the end.
 *
 * Mixing them would put 2025 in a drawing labelled this week, so the fold is
 * told which batch it is holding and counts accordingly.
 *
 * Nothing here decides anything. A high duplicate share is a number a reader
 * weighs, not a label this code applies (ETHOS.md).
 */

import { EMPTY_CHECKLIST_FACTS, type ChecklistFacts } from './checklist';
import type { CommentRecord, VoteRecord } from './patterns';
import { HOURS_IN_DAY, type ActionRecord } from './hourly-actions';
import {
  COMMENT_OPERATION_NAME,
  CLAIM_OPERATION_NAME,
  CUSTOM_JSON_OPERATION_NAME,
  DELEGATE_OPERATION_NAME,
  POWER_DOWN_OPERATION_NAME,
  POWER_UP_OPERATION_NAME,
  PROPOSAL_VOTE_OPERATION_NAME,
  PROXY_OPERATION_NAME,
  TRANSFER_OPERATION_NAME,
  VOTE_OPERATION_NAME,
  WITNESS_VOTE_OPERATION_NAME,
  followedAccountName,
  text,
  toAction
} from './operation-actions';

/**
 * Everything that counts as something this account did.
 *
 * The governance and money types are here for the clock. It shows the hours of
 * today the account was doing anything, and a day in which they only moved
 * money would otherwise read as a day they were asleep.
 */
export const HISTORY_OPERATION_NAMES = [
  VOTE_OPERATION_NAME,
  COMMENT_OPERATION_NAME,
  CUSTOM_JSON_OPERATION_NAME,
  POWER_UP_OPERATION_NAME,
  TRANSFER_OPERATION_NAME,
  DELEGATE_OPERATION_NAME,
  CLAIM_OPERATION_NAME,
  POWER_DOWN_OPERATION_NAME,
  WITNESS_VOTE_OPERATION_NAME,
  PROXY_OPERATION_NAME,
  PROPOSAL_VOTE_OPERATION_NAME
];

/**
 * The far smaller list the *beginning* read asks for.
 *
 * Every item on the checklist is a "have they ever", and measured across the
 * live feed on 2026-09-21 the oldest records only ever answered three of them:
 * a first reply, a first follow, a first power up. Votes were never among them
 * — an account that has ever upvoted has almost always upvoted this week too,
 * so the window answers that one — and votes are most of what an old page
 * weighs. Dropping them lets the same few hundred records reach years further
 * back for a third of the bytes: the same ticks for 629KB across five accounts
 * where the full list cost 2,160KB.
 */
export const BEGINNING_OPERATION_NAMES = [
  COMMENT_OPERATION_NAME,
  CUSTOM_JSON_OPERATION_NAME,
  POWER_UP_OPERATION_NAME
];

const INTRO_POST_TAG = 'introduceyourself';
/** Hive community accounts are all named `hive-<digits>`. */
const COMMUNITY_PERMLINK_PREFIX = 'hive-';

const PROFILE_FIELDS = ['profile_image', 'cover_image', 'about', 'location', 'website', 'name'] as const;

/** As much of a history record as any of this needs. */
export interface HistoryOperation {
  op?: { type?: string; value?: unknown };
  timestamp: string | Date;
}

/**
 * Hive history timestamps are UTC but arrive as strings with no timezone
 * designator, so JavaScript would read them as local time and skew every span
 * by the viewer's offset. The 'Z' is appended explicitly.
 */
export function parseHiveTimestamp(timestamp: Date | string | null | undefined): number {
  if (timestamp instanceof Date) return timestamp.getTime();
  if (typeof timestamp !== 'string') return Number.NaN;
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/.test(timestamp) ? timestamp : `${timestamp}Z`;
  return new Date(normalized).getTime();
}

/**
 * An instant in the form the history endpoint accepts where it expects a block:
 * `2026-09-13T00:00:00`, UTC, no zone designator. Given one, the node resolves
 * it to the block that was being produced then, which is what makes a read
 * bounded by days rather than by a page count.
 */
export function historyTimeParam(timestampMs: number): string {
  return new Date(timestampMs).toISOString().slice(0, 19);
}

export function hasProfile(metadata: string | null | undefined): boolean {
  try {
    if (typeof metadata !== 'string' || metadata.length === 0) return false;
    const parsed: unknown = JSON.parse(metadata);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return false;
    const profile: unknown = (parsed as Record<string, unknown>).profile;
    if (typeof profile !== 'object' || profile === null || Array.isArray(profile)) return false;
    const record = profile as Record<string, unknown>;
    return PROFILE_FIELDS.some((field) => typeof record[field] === 'string' && record[field] !== '');
  } catch {
    return false;
  }
}

function hasIntroTag(jsonMetadata: unknown): boolean {
  try {
    if (typeof jsonMetadata !== 'string' || jsonMetadata.length === 0) return false;
    const parsed: unknown = JSON.parse(jsonMetadata);
    if (typeof parsed !== 'object' || parsed === null) return false;
    const tags: unknown = (parsed as Record<string, unknown>).tags;
    return Array.isArray(tags) && tags.some((tag) => typeof tag === 'string' && tag.toLowerCase() === INTRO_POST_TAG);
  } catch {
    return false;
  }
}

/** Everything the fold is building, across however many batches it is given. */
export interface OperationTally {
  username: string;
  /** Midnight UTC of the day the clock's red marks cover. */
  dayStartMs: number;
  facts: ChecklistFacts;
  /** Sets, not counters: following the same person twice is one follow. */
  followedAccounts: Set<string>;
  repliedToPosts: Set<string>;
  wasRepliedTo: boolean;
  writtenComments: CommentRecord[];
  castVotes: VoteRecord[];
  /** Window only. The hours of today anything landed in. */
  todayHourly: number[];
  /** Window only. The same hours across the whole window — the usual-hours spokes. */
  historyHourly: number[];
  dayActions: ActionRecord[];
  /** Window only, and the denominator of every rate. */
  windowVotes: number;
  windowComments: number;
  oldestWindowActionMs: number | null;
  /** The oldest record of any kind the window reached, for the day's honesty flag. */
  oldestWindowMs: number;
  /** Every record folded in, of either batch. What the card's readings rest on. */
  recordsRead: number;
}

export function createOperationTally(username: string, dayStartMs: number): OperationTally {
  return {
    username,
    dayStartMs,
    facts: { ...EMPTY_CHECKLIST_FACTS, available: true },
    followedAccounts: new Set<string>(),
    repliedToPosts: new Set<string>(),
    wasRepliedTo: false,
    writtenComments: [],
    castVotes: [],
    todayHourly: new Array<number>(HOURS_IN_DAY).fill(0),
    historyHourly: new Array<number>(HOURS_IN_DAY).fill(0),
    dayActions: [],
    windowVotes: 0,
    windowComments: 0,
    oldestWindowActionMs: null,
    oldestWindowMs: Number.POSITIVE_INFINITY,
    recordsRead: 0
  };
}

/**
 * Folds one batch of operations into the tally.
 *
 * `isWindow` is the whole difference between the two batches. Everything a
 * reader sees as "now" — the clock, the rates, the week's counts — is counted
 * only from the window, so no drawing labelled today can be fed by a record
 * from the year the account opened. The checklist and the writing patterns
 * take both, because "have they ever" and "do they copy and paste" are
 * questions the beginning answers as well as the end.
 *
 * The endpoint returns operations the account is *involved in*, not only the
 * ones it performed — an author's own post attracts votes and comments from
 * other people. Counting the response directly would measure popularity, not
 * activity, so every count below filters on the account having acted. The same
 * property is what makes `hadConversation` possible: a comment whose
 * `parent_author` is this account but whose `author` is somebody else is
 * someone replying to them.
 */
export function foldOperations(
  tally: OperationTally,
  operations: readonly HistoryOperation[],
  isWindow: boolean
): void {
  const { username } = tally;

  for (const operation of operations) {
    const value = operation.op?.value as Record<string, unknown> | undefined;
    if (!value) continue;
    tally.recordsRead++;
    const type = operation.op?.type;
    const time = parseHiveTimestamp(operation.timestamp);
    const timed = Number.isFinite(time);

    if (isWindow && timed) {
      if (time < tally.oldestWindowMs) tally.oldestWindowMs = time;

      // Classified once. The long spokes and the short marks are the same
      // events counted over two spans, so they can never disagree about what
      // an action is.
      const action = toAction(type, value, time, username);
      if (action) {
        const hour = new Date(time).getUTCHours();
        if (hour >= 0 && hour < HOURS_IN_DAY) {
          tally.historyHourly[hour]++;
          if (time >= tally.dayStartMs) tally.todayHourly[hour]++;
        }
        if (time >= tally.dayStartMs) tally.dayActions.push(action);
        if (tally.oldestWindowActionMs === null || time < tally.oldestWindowActionMs) {
          tally.oldestWindowActionMs = time;
        }
      }
    }

    switch (type) {
      case VOTE_OPERATION_NAME:
        if (value.voter === username) {
          if (isWindow) tally.windowVotes++;
          tally.castVotes.push({
            author: text(value.author),
            weight: Number(value.weight)
          });
          // A downvote is not "your first upvote".
          if (Number(value.weight) > 0) tally.facts.gaveUpvote = true;
        }
        break;
      case COMMENT_OPERATION_NAME: {
        const parentAuthor = text(value.parent_author);
        if (value.author === username) {
          if (isWindow) tally.windowComments++;
          tally.writtenComments.push({
            body: text(value.body),
            timestampMs: time,
            parentAuthor
          });
          if (parentAuthor === '') {
            if (hasIntroTag(value.json_metadata)) tally.facts.wroteIntroPost = true;
            if (text(value.parent_permlink).startsWith(COMMUNITY_PERMLINK_PREFIX)) {
              tally.facts.postedInCommunity = true;
            }
          } else if (parentAuthor !== username) {
            tally.repliedToPosts.add(`${parentAuthor}/${text(value.parent_permlink)}`);
          }
        } else if (parentAuthor === username) {
          tally.wasRepliedTo = true;
        }
        break;
      }
      case CUSTOM_JSON_OPERATION_NAME: {
        const followed = followedAccountName(value, username);
        if (followed) tally.followedAccounts.add(followed);
        break;
      }
      case POWER_UP_OPERATION_NAME:
        if (value.from === username) tally.facts.poweredUp = true;
        break;
      default:
        break;
    }
  }
}

/** The checklist answers, once every batch has been folded in. */
export function tallyFacts(tally: OperationTally, profileFilled: boolean): ChecklistFacts {
  return {
    ...tally.facts,
    profileFilled,
    followCount: tally.followedAccounts.size,
    replyToOthersCount: tally.repliedToPosts.size,
    // Two-sided: somebody came to them, and they go out to others. Approximate
    // by design — proving one back-and-forth thread would mean walking each one.
    hadConversation: tally.wasRepliedTo && tally.repliedToPosts.size > 0
  };
}
