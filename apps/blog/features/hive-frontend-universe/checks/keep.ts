/**
 * The keep (ticket 27): two helmets still cross, but only all 21 set the
 * hoard loose, once, and it takes seven seconds to stream away.
 */

import { createKeep, releaseHoard, updateKeep, hoardLeft, GUARDIANS_NEEDED } from '../engine/keep';
import { HELMET_TOTAL, createHelmets, o2Multiplier } from '../engine/helmets';
import { world } from './world';
import { check, assert, equal, near, atMost } from './harness';

function keep() {
  const k = createKeep(world, 300);
  if (!k) throw new Error('the keep has no landmark node in this world');
  return k;
}

export function keepChecks(): void {
  check('keep: it takes every helmet, and there are 21 of them', () => {
    equal(HELMET_TOTAL, 21, 'the helmet total');
    equal(GUARDIANS_NEEDED, 21, 'guardians needed at the keep');
    equal(createHelmets().helmets.length, 21, 'helmets placed in the world');
  });

  check('keep: 20 helmets do nothing', () => {
    const k = keep();
    equal(releaseHoard(k, 20), false, 'released with 20');
    equal(k.released, false, 'released flag with 20');
    equal(hoardLeft(k), 1, 'the hoard still his');
  });

  check('keep: 21 helmets release it, and only once', () => {
    const k = keep();
    equal(releaseHoard(k, 21), true, 'first visit with 21');
    equal(releaseHoard(k, 21), false, 'a second visit in the same round');
    equal(k.released, true, 'released flag');
  });

  check('keep: the release reaches 1 in seven seconds', () => {
    const k = keep();
    releaseHoard(k, 21);
    for (let i = 0; i < 7 * 60 - 1; i++) updateKeep(k, 1 / 60);
    assert(k.release < 1, `the release finished early, at ${k.release}`);
    updateKeep(k, 1 / 60);
    near(k.release, 1, 0.0001, 'release after seven seconds');
    updateKeep(k, 1);
    atMost(k.release, 1, 'the release ran past 1');
  });

  check('keep: the pile is gone from his feet halfway through', () => {
    const k = keep();
    releaseHoard(k, 21);
    equal(hoardLeft(k), 1, 'at the moment of release');
    for (let i = 0; i < 3.5 * 60; i++) updateKeep(k, 1 / 60);
    near(hoardLeft(k), 0, 0.0001, 'the hoard left after 3.5s');
  });

  check('helmets: each one lengthens a jump, 21 of them take one ring to 3.52', () => {
    equal(o2Multiplier(0), 1, 'no helmets');
    near(o2Multiplier(21), 3.52, 0.0001, 'all 21 helmets');
  });
}
