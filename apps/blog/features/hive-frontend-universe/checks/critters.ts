/**
 * Blowing an enemy up, and where it comes back from (Bryan, 2026-09-17).
 *
 * The whole of this behaviour is arithmetic over a real world build: one hit
 * takes a critter down, it is gone for the count, and when it comes back it
 * comes back out of ground the Emperor owns rather than out of thin air where
 * it was standing. Nothing here needs a canvas.
 */

import { createCritters, updateCritters, KNOCKOUT_HITS, KNOCKOUT_SECONDS } from '../engine/critters';
import { createProjectiles, updateProjectiles } from '../engine/projectiles';
import { createCombat } from '../engine/combat';
import { createPlayer } from '../engine/movement';
import { posAt } from '../engine/movement';
import { TROLL_HOLES } from '../lib/fixed-world';
import { world, WINDOW_START } from './world';
import { assert, check, equal, atMost } from './harness';

/** How near a line has to pass an Emperor place to count as his ground. */
const HIS_GROUND = 1400;

/** A shot placed right on top of a critter, so the hit is certain. */
function shootAt(state: ReturnType<typeof createProjectiles>, x: number, y: number): void {
  state.shots.push({ x, y, vx: 1, vy: 0, owner: 'player', kind: 'player', age: 0 });
}

export function critterChecks(): void {
  check('critters: one hit takes an enemy down', () => {
    equal(KNOCKOUT_HITS, 1, 'hits a critter can take');
    const critters = createCritters(world, WINDOW_START);
    const shots = createProjectiles();
    const victim = critters.critters[0];
    shootAt(shots, victim.x, victim.y);
    updateProjectiles(shots, createPlayer(), critters, createCombat(), 0.016, 100);
    assert(victim.koUntil > 100, 'the critter is knocked out by the one shot');
    assert(victim.returning, 'and it owes a walk home');
  });

  check('critters: a blown-up enemy is gone for ten seconds', () => {
    equal(KNOCKOUT_SECONDS, 10, 'seconds knocked out');
    const critters = createCritters(world, WINDOW_START);
    const shots = createProjectiles();
    const victim = critters.critters[0];
    shootAt(shots, victim.x, victim.y);
    updateProjectiles(shots, createPlayer(), critters, createCombat(), 0.016, 100);
    equal(victim.koUntil, 110, 'back at exactly ten seconds');
  });

  check('critters: it comes back out of ground the Emperor owns', () => {
    const critters = createCritters(world, WINDOW_START);
    const shots = createProjectiles();
    const victim = critters.critters[0];
    const diedAt = { x: victim.x, y: victim.y };
    shootAt(shots, victim.x, victim.y);
    updateProjectiles(shots, createPlayer(), critters, createCombat(), 0.016, 100);

    // Still knocked out at nine seconds: nothing has moved it home yet.
    updateCritters(critters, world, 0.016, 109);
    assert(victim.returning, 'still owing the walk at nine seconds');

    // The tenth second: it walks out of one of his places.
    updateCritters(critters, world, 0.016, 110);
    assert(!victim.returning, 'the walk home is done');
    let nearest = Infinity;
    for (const hole of TROLL_HOLES) {
      nearest = Math.min(nearest, Math.hypot(victim.x - hole.x, victim.y - hole.y));
    }
    atMost(nearest, HIS_GROUND, 'distance from the nearest place the Emperor owns');
    assert(
      Math.hypot(victim.x - diedAt.x, victim.y - diedAt.y) > 1,
      'it did not simply reappear where it was blown up'
    );
  });

  check("critters: every one of the Emperor's places has a line to walk out of", () => {
    const critters = createCritters(world, WINDOW_START);
    equal(critters.emperorEdges.length, TROLL_HOLES.length, 'one line per place');
    const at = { x: 0, y: 0 };
    for (const edge of critters.emperorEdges) {
      posAt(world.edges[edge], 0.5, at);
      let nearest = Infinity;
      for (const hole of TROLL_HOLES) {
        nearest = Math.min(nearest, Math.hypot(at.x - hole.x, at.y - hole.y));
      }
      atMost(nearest, HIS_GROUND, 'a return line that is actually on his ground');
    }
  });
}
