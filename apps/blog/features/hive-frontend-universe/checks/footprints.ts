/**
 * Footprints (ticket 30): tracks from the accounts that voted or replied
 * this round. A house carries at most six.
 */

import { createFootprints, addReplyTracks } from '../engine/footprints';
import { world, HOUSE_COUNT } from './world';
import { check, assert, atMost } from './harness';

/** A fake board: every house busy enough to overflow its six slots. */
function busyHouses(voters: number) {
  return Array.from({ length: HOUSE_COUNT }, (_, i) => ({
    voters: Array.from({ length: voters }, (_, k) => `voter${i}-${k}`)
  }));
}

export function footprintChecks(): void {
  check('footprints: a house carries at most six tracks', () => {
    const state = createFootprints(world, busyHouses(30));
    for (const n of world.nodes) {
      if (n.kind !== 'house') continue;
      const mine = state.tracks.filter((tr) => tr.node === n.id).length;
      atMost(mine, 6, `tracks on house ${n.id}`);
    }
    // Repliers arrive later and must not push a house past six either.
    for (const n of world.nodes) {
      if (n.kind !== 'house') continue;
      addReplyTracks(state, world, n.id, n.ref, ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8']);
    }
    for (const n of world.nodes) {
      if (n.kind !== 'house') continue;
      atMost(state.tracks.filter((tr) => tr.node === n.id).length, 6, `tracks after replies on ${n.id}`);
    }
  });

  check('footprints: at most four of a house’s tracks are votes', () => {
    const state = createFootprints(world, busyHouses(30));
    for (const n of world.nodes) {
      if (n.kind !== 'house') continue;
      const votes = state.tracks.filter((tr) => tr.node === n.id && tr.act === 'vote').length;
      atMost(votes, 4, `vote tracks on house ${n.id}`);
    }
  });

  check('footprints: the same account never leaves two tracks on one house', () => {
    const state = createFootprints(world, busyHouses(3));
    const house = world.nodes.find((n) => n.kind === 'house');
    if (!house) throw new Error('no houses in the world');
    addReplyTracks(state, world, house.id, house.ref, ['voter0-0', 'voter0-0', 'someone-else']);
    const seen = new Set<string>();
    for (const tr of state.tracks.filter((t) => t.node === house.id)) {
      assert(!seen.has(tr.handle), `${tr.handle} left two tracks on one house`);
      seen.add(tr.handle);
    }
  });

  check('footprints: every track sits on one of its own house’s streets, short of mid-street', () => {
    const state = createFootprints(world, busyHouses(10));
    for (const tr of state.tracks) {
      assert(world.incident[tr.node].includes(tr.edge), `track on a street that is not house ${tr.node}'s`);
      atMost(tr.reach, 0.45, 'how far out the track stands');
    }
  });
}
