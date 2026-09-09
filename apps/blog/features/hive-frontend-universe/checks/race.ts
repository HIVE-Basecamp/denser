/**
 * The DHF race (ticket 35): stake-weighted votes carried from the houses to
 * the Fun Park, and the return line they have to cross.
 */

import { createRace, takeVote, deliverVotes, dropVotes, voteWeight, VOTE_WEIGHT_BY_TIER } from '../engine/dhf-race';
import { check, assert, equal, atLeast } from './harness';

/** A board of 26 houses across the five stake tiers. */
const TIERS = Array.from({ length: 26 }, (_, i) => i % 5);

export function raceChecks(): void {
  check('race: a vote weighs its tier, and out-of-range tiers are clamped', () => {
    VOTE_WEIGHT_BY_TIER.forEach((w, tier) => equal(voteWeight(tier), w, `tier ${tier}`));
    equal(voteWeight(-3), VOTE_WEIGHT_BY_TIER[0], 'below the first tier');
    equal(voteWeight(99), VOTE_WEIGHT_BY_TIER[VOTE_WEIGHT_BY_TIER.length - 1], 'above the last tier');
  });

  check('race: the line is two fifths of the board, never less than three', () => {
    const r = createRace(TIERS);
    const total = TIERS.reduce((s, t) => s + voteWeight(t), 0);
    equal(r.total, total, 'the board total');
    equal(r.line, Math.max(3, Math.ceil(total * 0.4)), 'the return line');
    atLeast(createRace([0]).line, 3, 'the line on a tiny board');
  });

  check('race: a house gives its vote once per round', () => {
    const r = createRace(TIERS);
    equal(takeVote(r, 7, 4), 5, 'first visit');
    equal(takeVote(r, 7, 4), 0, 'second visit to the same house');
    equal(r.carried, 5, 'weight carried');
  });

  check('race: delivering short of the line does nothing; crossing it funds', () => {
    const r = createRace(TIERS);
    equal(deliverVotes(r), false, 'delivered with nothing carried');
    let node = 0;
    while (r.carried < r.line) takeVote(r, node++, 4);
    equal(deliverVotes(r), true, 'delivered over the line');
    equal(r.funded, true, 'funded');
    equal(deliverVotes(r), false, 'delivered again after funding');
    equal(takeVote(r, 999, 4), 0, 'took a vote after the round was won');
  });

  check('race: the setback drops what is carried and gives the houses their votes back', () => {
    const r = createRace(TIERS);
    takeVote(r, 1, 4);
    takeVote(r, 2, 4);
    const lost = dropVotes(r);
    equal(lost, 10, 'weight lost');
    equal(r.carried, 0, 'carried after the fall');
    equal(r.taken.size, 0, 'houses still marked as voted');
    assert(takeVote(r, 1, 4) === 5, 'the house did not give its vote back');
  });
}
