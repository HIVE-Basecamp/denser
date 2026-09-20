/**
 * What a reply was paid, and who paid it.
 *
 * Pure: no network, no React, no user-facing English.
 *
 * The chain states one figure — what the reply is worth — and lists the votes
 * that made it. It does not say what each vote was worth on its own, so that
 * is worked out here, as every Hive front-end works it out: a voter's share of
 * the payout is their share of the weight behind it. The shares therefore add
 * up to the figure the chain states, which is the point of doing it this way
 * rather than pricing each vote at today's reward pool — that would produce a
 * column of numbers that did not sum to the total printed above them.
 *
 * Nothing here decides anything. One account behind the whole payout on every
 * reply is a shape a reader may find interesting; it is also what a friend, a
 * curation trail and a community's own account each look like from here
 * (ETHOS.md).
 */

/** One vote on a reply, as the chain lists it. */
export interface CommentVote {
  voter: string;
  /** Weight thrown. Negative on a downvote. */
  rshares: number;
}

export interface VoteWorth {
  voter: string;
  rshares: number;
  /** The voter's share of the payout, in HBD, or null where it cannot be worked out. */
  value: number | null;
}

/** The weight behind a reply: every vote on it added up, downvotes included. */
export function netRshares(votes: CommentVote[]): number {
  let net = 0;
  for (const vote of votes) {
    if (Number.isFinite(vote.rshares)) net += vote.rshares;
  }
  return net;
}

/**
 * The votes on a reply, heaviest first, each with its share of the payout.
 *
 * `value` is null rather than zero only where the shares cannot be worked out
 * at all — a reply with no weight behind it, or one whose votes cancelled out.
 * A payout of nothing is not that case: a share of nothing is nothing, and
 * "$0" is what the reader should see. The dash means "cannot be divided", and
 * it must never stand in for a real zero.
 */
export function rankCommentVotes(votes: CommentVote[], payout: number): VoteWorth[] {
  const net = netRshares(votes);
  const divisible = net > 0 && Number.isFinite(payout);
  return votes
    .filter((vote) => typeof vote.voter === 'string' && vote.voter.length > 0)
    .map((vote) => ({
      voter: vote.voter,
      rshares: Number.isFinite(vote.rshares) ? vote.rshares : 0,
      value: divisible ? (vote.rshares / net) * payout : null
    }))
    .sort((a, b) => b.rshares - a.rshares);
}

/** A reply, reduced to the two things this file needs from it. */
export interface PaidReply {
  votes: CommentVote[];
  payout: number;
}

export interface VoterSummary {
  voter: string;
  /** Their share of the payouts across every reply read, in HBD. */
  earned: number;
  /** How many of those replies they voted on. */
  votes: number;
}

/** How many voters the strip above the list names. Bryan's number. */
export const TOP_COMMENT_VOTERS_COUNT = 5;

/**
 * The same votes read across all the replies at once, biggest payer first.
 *
 * The list below it stays in the order it happened, which is where the rhythm
 * of an account is visible — twenty-five replies inside an hour, the same
 * sentence five times running. This is the other question, asked without
 * disturbing that one: over these replies as a whole, who has been paying, and
 * how often.
 *
 * It is the payers of the replies that were read and nothing wider. Five
 * accounts here are five accounts across those replies, not across a life.
 */
export function topCommentVoters(
  replies: PaidReply[],
  limit = TOP_COMMENT_VOTERS_COUNT
): VoterSummary[] {
  const byVoter = new Map<string, VoterSummary>();

  for (const reply of replies) {
    for (const vote of rankCommentVotes(reply.votes, reply.payout)) {
      const summary = byVoter.get(vote.voter) ?? { voter: vote.voter, earned: 0, votes: 0 };
      byVoter.set(vote.voter, summary);
      summary.votes++;
      // A vote on a reply whose shares cannot be worked out is still a vote,
      // and is counted as one. It simply adds nothing to the money.
      if (vote.value !== null) summary.earned += vote.value;
    }
  }

  return Array.from(byVoter.values())
    .sort((a, b) => b.earned - a.earned || b.votes - a.votes)
    .slice(0, limit);
}
