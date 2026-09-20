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
