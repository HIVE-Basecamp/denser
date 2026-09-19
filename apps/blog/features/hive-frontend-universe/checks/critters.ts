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
import { createCoins, updateCoins } from '../engine/coins';
import { createHazards, updateHazards } from '../engine/hazards';
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

/**
 * Nothing shoots a player who has been stopped to answer something.
 *
 * Bryan, 2026-09-19: "i was voting on a post and was killed. because i have
 * to stay still." A card is the game asking a question; standing still is the
 * only way to answer it.
 */
export function readingChecks(): void {
  /** A critter parked right beside the bug, well inside its firing range. */
  const setUp = () => {
    const critters = createCritters(world, WINDOW_START);
    const shots = createProjectiles();
    const player = createPlayer();
    const c = critters.critters[0];
    player.x = c.x + 40;
    player.y = c.y;
    return { critters, shots, player, combat: createCombat() };
  };

  check('reading: a critter beside the bug does fire when nothing is open', () => {
    const { critters, shots, player, combat } = setUp();
    updateProjectiles(shots, player, critters, combat, 0.016, 100, false);
    assert(shots.shots.length > 0, 'shots fired at an unguarded bug');
  });

  check('reading: nobody takes aim while a card is open', () => {
    const { critters, shots, player, combat } = setUp();
    updateProjectiles(shots, player, critters, combat, 0.016, 100, true);
    equal(shots.shots.length, 0, 'shots fired at a bug reading a card');
  });

  check('reading: a shot already in the air cannot land either', () => {
    const { critters, shots, player, combat } = setUp();
    // One enemy shot sitting exactly on the bug: nothing closer is possible.
    shots.shots.push({ x: player.x, y: player.y, vx: 0, vy: 0, owner: 'critter', kind: 'blah', age: 0 });
    updateProjectiles(shots, player, critters, combat, 0.016, 100, true);
    equal(combat.hits, 0, 'hits taken while reading');
    equal(shots.shots.length, 1, 'the shot flies on rather than being eaten');
    // And the same shot lands the moment the card is shut.
    updateProjectiles(shots, player, critters, combat, 0.016, 100, false);
    equal(combat.hits, 1, 'hits taken once the card is shut');
  });
}

/**
 * And no pocket picked, and no sock closed, for the same reason.
 *
 * Bryan, 2026-09-19, asked for the thieves and the nuisances to follow the
 * shots: a card is the game asking a question, and holding still to answer
 * one may not be punished by anything at all.
 */
export function readingSafeChecks(): void {
  /** A thief and a sock both parked right on top of the bug. */
  const setUp = (kind: 'scammer' | 'sock') => {
    const critters = createCritters(world, WINDOW_START);
    const player = createPlayer();
    const c = critters.critters[0];
    c.kind = kind;
    player.x = c.x;
    player.y = c.y;
    return { critters, player };
  };

  check('reading: a scammer does snatch tokens when nothing is open', () => {
    const { critters, player } = setUp('scammer');
    const coins = createCoins(world, 0, WINDOW_START);
    coins.carried = 10;
    updateCoins(coins, player, critters, [], [], 0.016, null, false);
    assert(coins.carried < 10, 'tokens taken from an unguarded bug');
  });

  check('reading: no pocket is picked while a card is open', () => {
    const { critters, player } = setUp('scammer');
    const coins = createCoins(world, 0, WINDOW_START);
    coins.carried = 10;
    updateCoins(coins, player, critters, [], [], 0.016, null, true);
    equal(coins.carried, 10, 'tokens left after a card-reading tick');
  });

  check('reading: no sock closes on a bug that was told to hold still', () => {
    const { critters, player } = setUp('sock');
    const open = createHazards(critters.critters.length);
    updateHazards(open, player, critters, 0.016, false);
    assert(open.sockT !== null, 'the sock does close on an unguarded bug');
    const guarded = createHazards(critters.critters.length);
    updateHazards(guarded, player, critters, 0.016, true);
    equal(guarded.sockT, null, 'the sock closing while a card is open');
  });
}
