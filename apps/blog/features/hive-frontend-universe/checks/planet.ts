/**
 * The planet (tickets 37, 40 and 41): what must stand on it, the keep's gap,
 * and room for every tower.
 *
 * Bryan's picture is a globe with sides: the citadels, Mount Socko and the
 * keep sit on its rim like pins, and the back is the old chain. These hold
 * the positions to the disc, keep the keep exactly two helmets away, and
 * keep every citadel out from behind the places it used to crowd.
 */

import { LANDMARKS, landmarkPosition } from '../lib/fixed-world';
import { MAP_OBSTACLES, PLANET, leaningTower, placeWitnesses, segDist } from '../lib/planet';
import { BLURT_ISLAND, STEEM_DISTRICT, steemLandBox } from '../lib/steem-side';
import { o2Multiplier } from '../engine/helmets';
import { world } from './world';
import { check, assert, atLeast, atMost } from './harness';

/** How far out from the planet's centre, 1 being the rim. */
function rim(x: number, y: number): number {
  return Math.hypot(x / PLANET.rx, y / PLANET.ry);
}

function placeOf(id: string): { x: number; y: number } {
  const lm = LANDMARKS.find((l) => l.id === id);
  if (!lm) throw new Error(`no landmark ${id}`);
  return landmarkPosition(lm);
}

/**
 * Twenty-one stand-in witnesses, Bryan's named ones included so their
 * placements are exercised. Only the names matter here: every position
 * comes from the ring formula.
 */
const WITNESS_NAMES: readonly string[] = [
  'arcange',
  'ausbitbank',
  'therealwolf',
  ...Array.from({ length: 18 }, (_, i) => `witness-${i}`)
];

export function planetChecks(): void {
  check('planet: Mount Socko and the keep stand on the planet, like the citadels', () => {
    // The outer citadels stand at about 1.05 of the rim (the ring's stagger).
    for (const id of ['mount_socko', 'json_keep']) {
      const p = placeOf(id);
      atMost(rim(p.x, p.y), 1.06, `${id} off the rim`);
    }
  });

  check('planet: the keep still takes two helmets, never one', () => {
    const gap = world.stats.gaps.find((g) => g.cluster === 'json_keep');
    assert(gap !== undefined, 'the keep has no measured gap');
    if (!gap) return;
    atLeast(gap.ratio, o2Multiplier(1) + 0.01, 'one helmet reaches the keep');
    atMost(gap.ratio, o2Multiplier(2) - 0.01, 'two helmets do not reach the keep');
  });

  check('planet: the back side stands inside the planet', () => {
    const box = steemLandBox();
    // The Steem land's own box is padded (the mark sits inside 32 units);
    // its four mid-edges are the far points the strokes can reach.
    for (const [x, y] of [
      [box.x + box.w * 0.2, box.y + box.h / 2],
      [box.x + box.w * 0.8, box.y + box.h / 2],
      [box.x + box.w / 2, box.y + box.h * 0.18],
      [box.x + box.w / 2, box.y + box.h * 0.85]
    ]) {
      atMost(rim(x, y), 1, 'the Steem land reaches past the rim');
    }
    atMost(rim(STEEM_DISTRICT.x, STEEM_DISTRICT.y), 1, 'the ruined district');
    atMost(rim(BLURT_ISLAND.x, BLURT_ISLAND.y) + BLURT_ISLAND.r / PLANET.ry, 1, 'the Blurt island');
  });

  check('planet: no tower stands over a place that needs its own room', () => {
    placeWitnesses(WITNESS_NAMES).forEach((p, slot) => {
      const t = leaningTower(p.x, p.y, slot);
      for (const o of MAP_OBSTACLES) {
        atLeast(
          segDist(o.x, o.y, t.x, t.y, t.tipX, t.tipY) - t.w * 0.6,
          o.r,
          `tower ${slot + 1} stands over a place at ${Math.round(o.x)},${Math.round(o.y)}`
        );
      }
    });
  });
}
