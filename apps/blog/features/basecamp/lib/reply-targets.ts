/**
 * Who an account replies to, and what those replies earned.
 *
 * Pure: no network, no React, no user-facing English. It folds two streams —
 * the replies the account wrote, and the author payouts it was given — into
 * one row per person replied to.
 *
 * The join is the whole trick. A reply says who it was addressed to; a payout
 * says only which of the account's own permlinks it landed on. Held together,
 * they say what replying to a given person has actually been worth.
 *
 * Nothing here decides anything. Most of one account's replies going to one
 * person is a shape a reader may find interesting; it is also what a friend,
 * a mentor and a community host each look like from here (ETHOS.md).
 */

/** One comment the account wrote. Edits arrive as repeats and are folded once. */
export interface ReplyRecord {
  permlink: string;
  /** Who they were replying to. Empty where it was a post of their own. */
  parentAuthor: string;
  timestampMs: number;
}

/** One author payout the account was given, split the way the chain pays it. */
export interface RewardRecord {
  permlink: string;
  hbd: number;
  hive: number;
  vests: number;
  timestampMs: number;
}

export interface ReplyTargetTally {
  account: string;
  /** Replies written to this person. */
  replies: number;
  /** How many of those were paid anything. */
  paid: number;
  hbd: number;
  hive: number;
  vests: number;
  /** The newest reply to them. */
  lastMs: number;
}

export interface ReplyTargetSheet {
  /** The account being read, so a reply to themselves is recognised as one. */
  account: string;
  /** permlink -> who it was addressed to. Empty string where it was a root post. */
  parentOf: Map<string, string>;
  byAccount: Map<string, ReplyTargetTally>;
  /** Replies written to other people. */
  replies: number;
  /** Replies written under their own posts. */
  selfReplies: number;
  /** Root posts of their own seen in the same window. */
  rootPosts: number;
  /** Payouts whose permlink was older than the window read, so unattributable. */
  unmatched: number;
}

export function createReplyTargetSheet(account: string): ReplyTargetSheet {
  return {
    account,
    parentOf: new Map(),
    byAccount: new Map(),
    replies: 0,
    selfReplies: 0,
    rootPosts: 0,
    unmatched: 0
  };
}

/**
 * Adds a page of the account's own comments to a sheet, in place.
 *
 * Every page must be folded before any reward is, because a reward can only be
 * attributed through a permlink this has already seen.
 */
export function foldReplies(sheet: ReplyTargetSheet, records: ReplyRecord[]): ReplyTargetSheet {
  for (const record of records) {
    if (!record.permlink) continue;
    // An edit is another comment_operation on the same permlink. It is the
    // same reply, and counting it twice would make an account that revises
    // look twice as talkative.
    if (sheet.parentOf.has(record.permlink)) continue;
    sheet.parentOf.set(record.permlink, record.parentAuthor);

    if (record.parentAuthor === '') {
      sheet.rootPosts++;
      continue;
    }
    if (record.parentAuthor === sheet.account) {
      sheet.selfReplies++;
      continue;
    }

    sheet.replies++;
    const tally = sheet.byAccount.get(record.parentAuthor) ?? {
      account: record.parentAuthor,
      replies: 0,
      paid: 0,
      hbd: 0,
      hive: 0,
      vests: 0,
      lastMs: Number.NEGATIVE_INFINITY
    };
    sheet.byAccount.set(record.parentAuthor, tally);
    tally.replies++;
    if (Number.isFinite(record.timestampMs) && record.timestampMs > tally.lastMs) {
      tally.lastMs = record.timestampMs;
    }
  }
  return sheet;
}

/**
 * Adds a page of author payouts, attributing each to the person the paid reply
 * was addressed to.
 *
 * A payout on a root post is not a reply reward and is dropped; a payout whose
 * permlink is older than the replies that were read cannot be placed at all,
 * and is counted so the panel can say how many it could not place rather than
 * quietly understating somebody.
 */
export function foldRewards(sheet: ReplyTargetSheet, records: RewardRecord[]): ReplyTargetSheet {
  for (const record of records) {
    if (!record.permlink) continue;
    const parentAuthor = sheet.parentOf.get(record.permlink);
    if (parentAuthor === undefined) {
      sheet.unmatched++;
      continue;
    }
    if (parentAuthor === '' || parentAuthor === sheet.account) continue;
    const tally = sheet.byAccount.get(parentAuthor);
    if (!tally) continue;
    tally.paid++;
    if (Number.isFinite(record.hbd)) tally.hbd += record.hbd;
    if (Number.isFinite(record.hive)) tally.hive += record.hive;
    if (Number.isFinite(record.vests)) tally.vests += record.vests;
  }
  return sheet;
}

/** The two chain-wide rates needed to state a payout as one figure. */
export interface RewardRates {
  /** HBD per HIVE, from the median price feed. */
  hbdPerHive: number | null;
  /** HP per VEST — and HP is denominated in HIVE. */
  hivePerVest: number | null;
}

/**
 * What a row's replies earned, in HBD.
 *
 * Hive pays an author in three pieces and shows the result as one dollar
 * figure; this is that same arithmetic. Null rather than a partial sum while a
 * rate is missing: a figure that silently left out the stake half would be
 * wrong in the direction that flatters.
 */
export function replyEarningsInHbd(tally: ReplyTargetTally, rates: RewardRates): number | null {
  const { hbdPerHive, hivePerVest } = rates;
  const needsHive = tally.hive > 0 || tally.vests > 0;
  if (needsHive && (hbdPerHive === null || hbdPerHive <= 0)) return null;
  if (tally.vests > 0 && hivePerVest === null) return null;
  const fromVests = tally.vests > 0 && hivePerVest ? tally.vests * hivePerVest : 0;
  const inHive = tally.hive + fromVests;
  const earned = tally.hbd + (inHive > 0 && hbdPerHive ? inHive * hbdPerHive : 0);
  return Number.isFinite(earned) ? earned : null;
}

export interface ReplyTargetsReading {
  /** False until a read has finished. Never to be shown as a row of zeroes. */
  known: boolean;
  rows: ReplyTargetTally[];
  replies: number;
  selfReplies: number;
  rootPosts: number;
  unmatched: number;
  /** True when the read hit its ceiling, so the oldest replies are missing. */
  capped: boolean;
}

export const EMPTY_REPLY_TARGETS: ReplyTargetsReading = {
  known: false,
  rows: [],
  replies: 0,
  selfReplies: 0,
  rootPosts: 0,
  unmatched: 0,
  capped: false
};

/** How many people the panel lists. Bryan's number. */
export const TOP_REPLY_TARGETS_COUNT = 20;

/**
 * Ranked by how many replies went to them, biggest first.
 *
 * Deliberately rate-free. The price feed arrives on its own schedule, and a
 * reading that had to be thrown away and read again the moment it landed would
 * cost several megabytes twice. The payouts are kept as the chain paid them
 * and priced at the last moment, by `withEarnings`.
 */
export function summarizeReplyTargets(sheet: ReplyTargetSheet, capped: boolean): ReplyTargetsReading {
  const rows = Array.from(sheet.byAccount.values()).sort(
    (a, b) => b.replies - a.replies || b.paid - a.paid
  );
  return {
    known: true,
    rows,
    replies: sheet.replies,
    selfReplies: sheet.selfReplies,
    rootPosts: sheet.rootPosts,
    unmatched: sheet.unmatched,
    capped
  };
}

export interface ReplyTargetRow extends ReplyTargetTally {
  /** What those replies earned, in HBD, or null while a rate is still unknown. */
  earned: number | null;
}

export interface PricedReplyTargets extends Omit<ReplyTargetsReading, 'rows'> {
  rows: ReplyTargetRow[];
  /** Everything the attributed replies earned, in HBD. */
  earned: number | null;
}

/** The same reading with today's prices put on it. */
export function withEarnings(reading: ReplyTargetsReading, rates: RewardRates): PricedReplyTargets {
  const rows: ReplyTargetRow[] = reading.rows.map((tally) => ({
    ...tally,
    earned: replyEarningsInHbd(tally, rates)
  }));

  let earned: number | null = 0;
  for (const row of rows) {
    if (row.earned === null) {
      earned = null;
      break;
    }
    earned += row.earned;
  }

  return { ...reading, rows, earned };
}

/** The same rows, ranked by what they earned instead. */
export function byEarnings(rows: ReplyTargetRow[]): ReplyTargetRow[] {
  return [...rows].sort((a, b) => (b.earned ?? 0) - (a.earned ?? 0) || b.replies - a.replies);
}

/** A row's share of the replies counted, 0-1, for the bar beside it. */
export function replyShare(tally: ReplyTargetTally, replies: number): number {
  if (replies <= 0) return 0;
  const share = tally.replies / replies;
  return Number.isFinite(share) ? Math.min(Math.max(share, 0), 1) : 0;
}
