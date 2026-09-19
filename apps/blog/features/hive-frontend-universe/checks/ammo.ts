/**
 * Bullets, and the packs they come from (engine/ammo.ts).
 *
 * Bryan, 2026-09-17: tokens went back to being tokens, the bug starts every
 * round with twenty-five bullets, and twenty-five packs are scattered about
 * to refill from. All of that is arithmetic and holds without a canvas.
 */

import {
  AMMO_MAX,
  AMMO_PACKS,
  AMMO_PER_PACK,
  AMMO_START,
  createAmmo,
  hasAmmo,
  spendRound,
  updateAmmo
} from '../engine/ammo';
import { createProjectiles, playerFire } from '../engine/projectiles';
import { createPlayer } from '../engine/movement';
import { assert, check, equal } from './harness';

export function ammoChecks(): void {
  check('ammo: the bug starts a round with twenty-five bullets', () => {
    equal(AMMO_START, 25, 'the starting count');
    equal(createAmmo().rounds, 25, 'what a fresh round hands over');
  });

  check('ammo: twenty-five packs are scattered, none of them taken yet', () => {
    equal(AMMO_PACKS, 25, 'the number of packs');
    const ammo = createAmmo();
    equal(ammo.packs.length, 25, 'packs actually placed');
    equal(ammo.packs.filter((pack) => pack.taken).length, 0, 'packs already taken');
  });

  check('ammo: no two packs are hidden in the same spot', () => {
    const seen = new Set(createAmmo().packs.map((pack) => `${Math.round(pack.x)},${Math.round(pack.y)}`));
    equal(seen.size, AMMO_PACKS, 'distinct places');
  });

  check('ammo: the spots are the same every round, so they can be learnt', () => {
    const a = createAmmo()
      .packs.map((pack) => `${pack.x},${pack.y}`)
      .join('|');
    const b = createAmmo()
      .packs.map((pack) => `${pack.x},${pack.y}`)
      .join('|');
    equal(a, b, 'two rounds laid out the same');
  });

  check('ammo: firing spends one bullet and nothing else', () => {
    const ammo = createAmmo();
    const shots = createProjectiles();
    const player = createPlayer();
    assert(playerFire(shots, player, ammo), 'the shot went off');
    equal(ammo.rounds, AMMO_START - 1, 'bullets left');
    equal(shots.shots.length, 1, 'one shot in the air');
  });

  check('ammo: an empty magazine fires nothing and goes no further into debt', () => {
    const ammo = createAmmo();
    ammo.rounds = 0;
    const shots = createProjectiles();
    equal(playerFire(shots, createPlayer(), ammo), false, 'the shot was refused');
    equal(ammo.rounds, 0, 'bullets left');
    equal(shots.shots.length, 0, 'shots in the air');
    equal(hasAmmo(ammo), false, 'anything left to fire');
    equal(spendRound(null), false, 'spending from nothing at all');
  });

  check('ammo: a pack is a full reload', () => {
    equal(AMMO_PER_PACK, AMMO_START, 'a pack is worth what the bug starts with');
  });

  check('ammo: walking over a pack takes it, once', () => {
    const ammo = createAmmo();
    ammo.rounds = 0;
    const pack = ammo.packs[0];
    updateAmmo(ammo, pack.x, pack.y);
    equal(ammo.rounds, AMMO_PER_PACK, 'what one pack is worth');
    assert(pack.taken, 'the pack is gone');
    updateAmmo(ammo, pack.x, pack.y);
    equal(ammo.rounds, AMMO_PER_PACK, 'standing on an empty spot gives nothing more');
  });

  check('ammo: a pack out of reach is not picked up through the floor', () => {
    const ammo = createAmmo();
    const pack = ammo.packs[0];
    updateAmmo(ammo, pack.x + 400, pack.y + 400);
    equal(ammo.rounds, AMMO_START, 'bullets left');
    equal(pack.taken, false, 'the pack is still there');
  });

  check('ammo: a hoarder cannot carry more than the ceiling', () => {
    const ammo = createAmmo();
    ammo.rounds = AMMO_MAX;
    updateAmmo(ammo, ammo.packs[0].x, ammo.packs[0].y);
    equal(ammo.rounds, AMMO_MAX, 'bullets left');
  });
}
