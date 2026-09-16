/**
 * The sea and what lives in it (Bryan, 2026-09-15).
 *
 * The three things that must hold: nothing spawns or swims onto the land,
 * only a bug adrift in the open water is ever on the menu, and the swallow
 * fires its setback exactly once.
 */

import { createSea, updateSea, seaHolds, inOpenWater, isHunter, SWALLOW_SECONDS, type SeaState } from '../engine/sea';
import { insideBody } from '../lib/landmass';
import { PLANET } from '../lib/planet';
import { WINDOW_START } from './world';
import { check, assert, equal, atLeast } from './harness';

/** A still bug, far from everything, for the cases that need no threat. */
const NOWHERE = { x: 1e6, y: 1e6 };

/** Run the sea forward at a steady 60fps with the bug wherever it is. */
function run(sea: SeaState, player: { x: number; y: number }, atRisk: boolean, seconds: number): number {
  let trips = 0;
  const dt = 1 / 60;
  for (let i = 0; i < Math.round(seconds / dt); i++) {
    updateSea(sea, player, atRisk, dt);
    if (sea.tripped) {
      sea.tripped = false;
      trips++;
    }
  }
  return trips;
}

/** A hunter placed nose-to-nose with a point, so contact is immediate. */
function hunterAt(sea: SeaState, x: number, y: number): number {
  const i = sea.creatures.findIndex((c) => isHunter(c.kind));
  assert(i >= 0, 'the sea has no hunters in it');
  sea.creatures[i].x = x;
  sea.creatures[i].y = y;
  return i;
}

export function seaChecks(): void {
  check('sea: the water is stocked with the whole stake ladder', () => {
    const sea = createSea(WINDOW_START);
    const kinds = new Set(sea.creatures.map((c) => c.kind));
    for (const k of ['redfish', 'dolphin', 'orca', 'whale']) {
      assert(kinds.has(k as never), `no ${k} in the water`);
    }
    atLeast(sea.creatures.filter((c) => isHunter(c.kind)).length, 5, 'hunters');
  });

  check('sea: nothing spawns on the land or outside the planet', () => {
    const sea = createSea(WINDOW_START);
    for (const c of sea.creatures) {
      assert(!insideBody(c.x, c.y), `a ${c.kind} spawned on the land at ${Math.round(c.x)},${Math.round(c.y)}`);
      assert(inOpenWater(c.x, c.y), `a ${c.kind} spawned outside the water`);
    }
  });

  check('sea: two minutes of swimming beaches nobody', () => {
    const sea = createSea(WINDOW_START);
    run(sea, NOWHERE, false, 120);
    for (const c of sea.creatures) {
      assert(!insideBody(c.x, c.y), `a ${c.kind} swam onto the land`);
      const limb = Math.hypot(c.x / PLANET.rx, c.y / PLANET.ry);
      assert(limb <= 1, `a ${c.kind} swam off the planet (${limb.toFixed(2)} of the limb)`);
    }
  });

  check('sea: the round is the same sea for everyone, and a new round restocks it', () => {
    const a = createSea(WINDOW_START);
    const b = createSea(WINDOW_START);
    equal(a.creatures.length, b.creatures.length, 'creature count');
    equal(Math.round(a.creatures[0].x), Math.round(b.creatures[0].x), 'the first creature');
    const later = createSea(WINDOW_START + 1_800_000);
    assert(
      Math.round(later.creatures[0].x) !== Math.round(a.creatures[0].x),
      'the next round put everything back in the same place'
    );
  });

  check('sea: a bug that is not adrift in the water is never touched', () => {
    const sea = createSea(WINDOW_START);
    const i = hunterAt(sea, 0, 0);
    const bug = { x: sea.creatures[i].x, y: sea.creatures[i].y };
    equal(run(sea, bug, false, 6), 0, 'setbacks on a bug that is not at risk');
    equal(seaHolds(sea), false, 'held');
  });

  check('sea: a hunter swallows an adrift bug, once, and lets go', () => {
    const sea = createSea(WINDOW_START);
    const i = hunterAt(sea, 0, 0);
    const bug = { x: 0, y: 0 };
    updateSea(sea, bug, true, 1 / 60);
    assert(sea.swallow !== null, 'the jaws never closed');
    equal(seaHolds(sea), true, 'the bug is not held during the swallow');
    equal(sea.swallow?.by, i, 'the wrong creature has the bug');
    // The setback fires once, at the midpoint, and the hold ends on time.
    equal(run(sea, bug, true, SWALLOW_SECONDS + 0.2), 1, 'setbacks from one swallow');
    equal(seaHolds(sea), false, 'still held after the animation ended');
  });

  check('sea: the grace after a swallow stops a second one straight away', () => {
    const sea = createSea(WINDOW_START);
    hunterAt(sea, 0, 0);
    const bug = { x: 0, y: 0 };
    equal(run(sea, bug, true, SWALLOW_SECONDS + 0.2), 1, 'the first swallow');
    equal(run(sea, bug, true, 1.5), 0, 'swallowed again inside the grace');
  });

  check('sea: redfish and dolphins never take the bug', () => {
    const sea = createSea(WINDOW_START);
    sea.creatures = sea.creatures.filter((c) => !isHunter(c.kind));
    atLeast(sea.creatures.length, 10, 'harmless creatures');
    for (const c of sea.creatures) {
      c.x = 0;
      c.y = 0;
    }
    equal(run(sea, { x: 0, y: 0 }, true, 10), 0, 'setbacks from the harmless half');
  });
}
