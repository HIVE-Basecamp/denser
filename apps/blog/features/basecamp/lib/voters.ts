/**
 * Who has been voting on this account, and how heavily.
 *
 * Pure: no network, no React, no user-facing English. It takes vote events and
 * folds them into one row per voter.
 *
 * Built to be fed a page at a time and to forget the pages. Reading one
 * account's whole life can be forty thousand votes; holding them would be
 * megabytes for a figure that is a few dozen rows wide. So the tally is a
 * running object the reader adds to, and every vote is thrown away the moment
 * it has been counted.
 *
 * Nothing here decides anything. One account behind most of another account's
 * money is a shape a reader may find interesting; it is also what a patron, a
 * curation trail and a community account each look like. The table states who,
 * how many and how much, and stops there (ETHOS.md: visual indicators, not
 * conclusions).
 */

/** One vote, as it lands on a post. */
export interface VoteEvent {
  voter: string;
  /** The weight the vote actually carried. Negative for a downvote. */
  rshares: number;
  timestampMs: number;
}

export interface VoterTally {
  voter: string;
  /** How many votes this voter has cast on the account's posts. */
  votes: number;
  /** Their rshares added up. Downvotes subtract, so this can come out negative. */
  rshares: number;
}

/**
 * The running total. `byVoter` is the accumulator; nothing else keeps a vote.
 */
export interface VoteTally {
  byVoter: Map<string, VoterTally>;
  /** How many votes have been folded in. */
  counted: number;
  totalRshares: number;
  /** The oldest vote reached so far, which is how far back the read has got. */
  oldestMs: number | null;
}

export function createVoteTally(): VoteTally {
  return { byVoter: new Map(), counted: 0, totalRshares: 0, oldestMs: null };
}

/** Adds a page of votes to a tally, in place, and forgets them. */
export function foldVoteEvents(tally: VoteTally, events: VoteEvent[]): VoteTally {
  for (const event of events) {
    if (
      Number.isFinite(event.timestampMs) &&
      (tally.oldestMs === null || event.timestampMs < tally.oldestMs)
    ) {
      tally.oldestMs = event.timestampMs;
    }
    const rshares = Number.isFinite(event.rshares) ? event.rshares : 0;
    tally.counted++;
    tally.totalRshares += rshares;
    const existing = tally.byVoter.get(event.voter);
    if (existing) {
      existing.votes++;
      existing.rshares += rshares;
    } else {
      tally.byVoter.set(event.voter, { voter: event.voter, votes: 1, rshares });
    }
  }
  return tally;
}

/**
 * The voters, heaviest first.
 *
 * Weight, not count, because the question the panel is asked is which account
 * is putting the most money on this one. Ten small votes and one large one are
 * not the same thing, and ranking by count would put the first above the
 * second. The count stays on every row.
 */
export function rankVoters(tally: VoteTally): VoterTally[] {
  return Array.from(tally.byVoter.values()).sort((a, b) => b.rshares - a.rshares || b.votes - a.votes);
}

export interface VotesReceived {
  /** False when no read has finished. Never to be shown as a zero. */
  known: boolean;
  /** How many votes have been read. */
  counted: number;
  /**
   * Every vote this account has ever been given, when the chain will say — it
   * stops counting at VOTE_COUNT_CEILING. Null above that, until a full read
   * has walked back to the account's first vote and counted them itself.
   */
  lifetime: number | null;
  /**
   * The largest number that can honestly be stood behind: the lifetime figure
   * where there is one, and otherwise the floor. Kept apart from `counted`
   * because a capped read returns the newest *remainder* page, which can be
   * four votes on an account that has been given ten thousand — printing what
   * was read would badly understate it, where printing the chain's ceiling
   * does not.
   */
  atLeast: number;
  /** True once the read has reached the account's first vote. */
  complete: boolean;
  /** Every voter, heaviest first. */
  voters: VoterTally[];
  totalRshares: number;
  /** The oldest vote the read reached. */
  oldestMs: number | null;
}

/**
 * Where the chain stops counting. Past this a filtered read reports the ceiling
 * rather than the real total, so a number at or above it is a floor, not a
 * count — and the only way to the real one is to keep reading.
 */
export const VOTE_COUNT_CEILING = 10000;

export const EMPTY_VOTES_RECEIVED: VotesReceived = {
  known: false,
  counted: 0,
  lifetime: null,
  atLeast: 0,
  complete: false,
  voters: [],
  totalRshares: 0,
  oldestMs: null
};

/** How many voters the panel ranks. Bryan's number. */
export const TOP_VOTERS_COUNT = 10;

/** True when a reported total is really the chain's ceiling rather than a count. */
export function isCountCapped(total: number | null | undefined): boolean {
  return typeof total === 'number' && total >= VOTE_COUNT_CEILING;
}

/**
 * Turns a tally into what the card reads.
 *
 * `reportedTotal` is what the chain said when asked; it is only believed below
 * the ceiling. `complete` is the read's own claim that it reached the first
 * vote, and when it does the count it made is the lifetime figure, whatever
 * the chain was willing to say.
 */
export function summarizeTally(
  tally: VoteTally,
  reportedTotal: number | null,
  complete: boolean
): VotesReceived {
  const capped = isCountCapped(reportedTotal);
  const trustedTotal = capped ? null : reportedTotal;
  const lifetime = complete ? tally.counted : trustedTotal;
  return {
    known: true,
    counted: tally.counted,
    lifetime,
    atLeast: lifetime ?? Math.max(tally.counted, capped ? VOTE_COUNT_CEILING : 0),
    complete: complete || (trustedTotal !== null && tally.counted >= trustedTotal),
    voters: rankVoters(tally),
    totalRshares: tally.totalRshares,
    oldestMs: tally.oldestMs
  };
}

/** The share of the account's received weight one voter is responsible for, 0-1. */
export function voterShare(tally: VoterTally, totalRshares: number): number {
  if (!Number.isFinite(totalRshares) || totalRshares <= 0) return 0;
  const share = tally.rshares / totalRshares;
  if (!Number.isFinite(share) || share <= 0) return 0;
  return share > 1 ? 1 : share;
}
