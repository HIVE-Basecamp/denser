/**
 * Pure "pattern" logic: the shape of an account's own writing and voting,
 * derived from records the single per-card history read already returns.
 *
 * Same rules as lib/signals.ts, and for the same reason — this file is meant to
 * be liftable into a standalone package:
 *   - No network, no date library, no Date.now(). Callers pass nowMs.
 *   - No user-facing English. Numbers and tokens only.
 *   - "known: false" is kept strictly distinct from a real zero. An account
 *     that wrote nothing is known with a count of 0; an account whose history
 *     never loaded is unknown.
 *
 * Nothing here renders a verdict. A high duplicate share is a number a reader
 * weighs, not a label this code applies.
 */

/** One comment the account itself wrote. */
export interface CommentRecord {
  body: string;
  timestampMs: number;
  /** Empty string when this is a root post rather than a reply. */
  parentAuthor: string;
}

/** One vote the account itself cast. */
export interface VoteRecord {
  author: string;
  weight: number;
}

export interface CommentPatterns {
  /** False when no history was read at all. Distinct from "read it, found none". */
  known: boolean;
  /** How many of the account's own comments and posts were examined. */
  writtenCount: number;
  postCount7d: number;
  replyCount7d: number;
  /** Share of their replies that repeat text they have already used elsewhere. */
  duplicatePercent: number | null;
  /** Share of their replies that are nothing but a bot trigger such as "!PIZZA". */
  botCommandPercent: number | null;
  /** Share of their replies written under their own posts rather than other people's. */
  selfReplyPercent: number | null;
  /** How many different people they have replied to. */
  distinctReplyTargets: number;
  /** Counts per hour of the day in UTC, index 0-23, oldest record onward. */
  hourlyCounts: number[];
  /** How many of the twenty-four hours they have ever been seen writing in. */
  activeHourCount: number;
  /** Share of their votes cast on their own posts. */
  selfVotePercent: number | null;
  voteCount: number;
}

const HOURS_IN_DAY = 24;
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const RECENT_WINDOW_DAYS = 7;

/**
 * A comment that is only bot triggers: one or more "!word" tokens, each
 * optionally followed by a number, and nothing else. "!PIZZA", "!LUV 1" and
 * "!PIZZA !LUV" all match; "!pizza thanks for the post" does not, because the
 * person also wrote something.
 */
const BOT_COMMAND_ONLY = /^(?:![A-Za-z][A-Za-z0-9_]{1,19}(?:\s+\d+)?[\s,.!]*)+$/;

export const EMPTY_COMMENT_PATTERNS: CommentPatterns = {
  known: false,
  writtenCount: 0,
  postCount7d: 0,
  replyCount7d: 0,
  duplicatePercent: null,
  botCommandPercent: null,
  selfReplyPercent: null,
  distinctReplyTargets: 0,
  hourlyCounts: new Array(HOURS_IN_DAY).fill(0),
  activeHourCount: 0,
  selfVotePercent: null,
  voteCount: 0
};

/**
 * Reduces a comment to a comparison key, so two posts that differ only in
 * spacing, case or trailing punctuation are recognised as the same text. Emoji
 * and other non-word characters are dropped for the same reason — "Nice post!"
 * and "nice post 🔥" are the same contribution.
 *
 * Returns an empty string for anything too short to be worth comparing, which
 * the caller skips: a bare "ok" repeated ten times is not evidence of much.
 */
export function commentComparisonKey(body: string): string {
  try {
    if (typeof body !== 'string') return '';
    const normalized = body
      .toLowerCase()
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return normalized.length >= 12 ? normalized : '';
  } catch {
    return '';
  }
}

/** True when the whole comment is bot triggers and nothing the person wrote. */
export function isBotCommandOnly(body: string): boolean {
  try {
    if (typeof body !== 'string') return false;
    const trimmed = body.trim();
    if (trimmed.length === 0 || !trimmed.startsWith('!')) return false;
    return BOT_COMMAND_ONLY.test(trimmed);
  } catch {
    return false;
  }
}

function percentOf(part: number, whole: number): number | null {
  if (whole <= 0) return null;
  return Math.round((part / whole) * 1000) / 10;
}

/**
 * Turns the account's own comments and votes into the card's pattern readouts.
 *
 * Only records the account itself produced belong here. The history endpoint
 * also returns operations the account was merely involved in — other people
 * voting on their post, other people replying to them — and counting those
 * would measure popularity rather than behaviour. The caller filters; this
 * function trusts what it is given.
 */
export function summarizePatterns(
  comments: CommentRecord[],
  votes: VoteRecord[],
  username: string,
  nowMs: number
): CommentPatterns {
  try {
    const hourlyCounts = new Array<number>(HOURS_IN_DAY).fill(0);
    const recentCutoff = nowMs - RECENT_WINDOW_DAYS * MS_PER_DAY;
    const replyTargets = new Set<string>();
    const keyCounts = new Map<string, number>();

    let postCount7d = 0;
    let replyCount7d = 0;
    let replyTotal = 0;
    let selfReplies = 0;
    let botCommands = 0;
    const replyKeys: string[] = [];

    for (const comment of comments) {
      const isReply = comment.parentAuthor !== '';

      if (Number.isFinite(comment.timestampMs)) {
        const hour = new Date(comment.timestampMs).getUTCHours();
        if (hour >= 0 && hour < HOURS_IN_DAY) hourlyCounts[hour]++;
        if (comment.timestampMs >= recentCutoff) {
          if (isReply) replyCount7d++;
          else postCount7d++;
        }
      }

      if (!isReply) continue;

      replyTotal++;
      if (comment.parentAuthor === username) selfReplies++;
      else replyTargets.add(comment.parentAuthor);

      if (isBotCommandOnly(comment.body)) {
        botCommands++;
        // A bot trigger is not copy-paste writing; it is already counted as its
        // own readout and would otherwise be double-charged as a duplicate.
        continue;
      }

      const key = commentComparisonKey(comment.body);
      if (key.length > 0) {
        replyKeys.push(key);
        keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
      }
    }

    // A reply counts as duplicated when its text appears more than once. Both
    // the original and the copy count, because from a reader's point of view
    // there is no way to tell which came first.
    let duplicated = 0;
    for (const key of replyKeys) {
      if ((keyCounts.get(key) ?? 0) > 1) duplicated++;
    }

    let selfVotes = 0;
    for (const vote of votes) {
      if (vote.author === username) selfVotes++;
    }

    return {
      known: true,
      writtenCount: comments.length,
      postCount7d,
      replyCount7d,
      // Measured against replies that carried enough text to compare, so an
      // account whose replies are all one word is unknown rather than 0%.
      duplicatePercent: percentOf(duplicated, replyKeys.length),
      botCommandPercent: percentOf(botCommands, replyTotal),
      selfReplyPercent: percentOf(selfReplies, replyTotal),
      distinctReplyTargets: replyTargets.size,
      hourlyCounts,
      activeHourCount: hourlyCounts.filter((count) => count > 0).length,
      selfVotePercent: percentOf(selfVotes, votes.length),
      voteCount: votes.length
    };
  } catch {
    return EMPTY_COMMENT_PATTERNS;
  }
}
