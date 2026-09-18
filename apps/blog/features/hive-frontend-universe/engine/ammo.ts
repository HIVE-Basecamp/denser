'use client';

/**
 * Hive Frontend Universe - AMMO.
 *
 * Bryan, 2026-09-17: "i need the tokens to return to just being tokens to
 * collect and not bullets. when you start the game you should have 25
 * bullets. and like the helmuts we need 25 bullet ammo packs spread around
 * the game to collect."
 *
 * So shooting stopped costing tokens. A token is a thing you gather and bank
 * (coins.ts); a bullet is a thing you spend. Tying the two made every shot a
 * withdrawal from the round's score, which meant the safest way to play was
 * never to fire.
 *
 * HOW THIS DIFFERS FROM THE HELMETS, which it is otherwise built like:
 *
 * - Helmets are an ACHIEVEMENT and persist forever. Ammo is not. A pack
 *   picked up is gone for the round and back next round, because a supply
 *   you can permanently exhaust is a game that can become unplayable.
 * - Helmets are hidden, to be learnt and told about. Packs are SCATTERED, to
 *   be stumbled on: same spots every round, but plentiful rather than rare.
 *
 * Nothing here touches movement.ts or PlayerState. The magazine is read by
 * projectiles.ts when the bug fires and by the HUD when it counts.
 */

import { sampleBodyPoint } from '../lib/fixed-world';
import { mulberry32 } from '../lib/mesh';

export interface AmmoPack {
  id: number;
  x: number;
  y: number;
  taken: boolean;
}

export interface AmmoState {
  packs: AmmoPack[];
  /** Bullets in hand. Spent by firing, refilled by packs. */
  rounds: number;
  /** Seconds of pick-up flash remaining, for the renderer. */
  flash: number;
}

/** What the bug starts every round holding. Bryan's number. */
export const AMMO_START = 25;
/** How many packs are scattered over the world. Bryan's number. */
export const AMMO_PACKS = 25;
/** What one pack is worth. Chosen, not asked for - say the word and it moves. */
export const AMMO_PER_PACK = 10;
/** A ceiling, so a hoarder cannot carry a thousand and stop aiming. */
export const AMMO_MAX = 99;
/** How close the bug must pass to collect, world px. The helmets' range. */
const COLLECT_RANGE = 90;
/** Seconds the pick-up flash lasts. */
const FLASH_SECONDS = 0.9;
/** Constant seed: the spots are the same every round, so they can be learnt. */
const PLACEMENT_SEED = 0x0a3300;

export function createAmmo(): AmmoState {
  const rng = mulberry32(PLACEMENT_SEED);
  const packs: AmmoPack[] = [];
  for (let i = 0; i < AMMO_PACKS; i++) {
    const p = sampleBodyPoint(rng);
    packs.push({ id: i, x: p.x, y: p.y, taken: false });
  }
  return { packs, rounds: AMMO_START, flash: 0 };
}

/** True when there is something to fire. */
export function hasAmmo(state: AmmoState | null): boolean {
  return state !== null && state.rounds > 0;
}

/** Spend one. Returns false when the magazine is empty, and takes nothing. */
export function spendRound(state: AmmoState | null): boolean {
  if (!state || state.rounds <= 0) return false;
  state.rounds--;
  return true;
}

export function tickAmmo(state: AmmoState, dt: number): void {
  if (state.flash > 0) state.flash = Math.max(0, state.flash - dt);
}

/** Collect by proximity, any mode. Nothing is stored between rounds. */
export function updateAmmo(state: AmmoState, px: number, py: number): void {
  const r2 = COLLECT_RANGE * COLLECT_RANGE;
  for (const pack of state.packs) {
    if (pack.taken) continue;
    const dx = pack.x - px;
    const dy = pack.y - py;
    if (dx * dx + dy * dy <= r2) {
      pack.taken = true;
      state.rounds = Math.min(AMMO_MAX, state.rounds + AMMO_PER_PACK);
      state.flash = FLASH_SECONDS;
    }
  }
}

/**
 * A pack waiting to be found: a squat red box with a black band, three
 * bullet noses standing out of the top, and the same red glow the bug's own
 * shot carries, so what it gives you is legible before you reach it.
 */
export function drawAmmoPacks(
  ctx: CanvasRenderingContext2D,
  state: AmmoState,
  time: number,
  vis: (x: number, y: number) => boolean
): void {
  for (const pack of state.packs) {
    if (pack.taken || !vis(pack.x, pack.y)) continue;
    const bob = Math.sin(time * 1.6 + pack.id) * 5;
    ctx.save();
    ctx.translate(pack.x, pack.y + bob);

    // The halo, so it reads against both the red land and the black void.
    const pulse = 0.35 + Math.sin(time * 2.2 + pack.id * 2) * 0.22;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ff2d4f';
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, 6.283);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Three bullet noses standing out of the open top, drawn first so the
    // box front overlaps their bases and they sit IN it.
    ctx.fillStyle = '#ffd24a';
    ctx.strokeStyle = '#140a10';
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    for (let i = -1; i <= 1; i++) {
      const bx = i * 11;
      ctx.beginPath();
      ctx.moveTo(bx - 4, -6);
      ctx.lineTo(bx - 4, -16);
      ctx.quadraticCurveTo(bx, -23, bx + 4, -16);
      ctx.lineTo(bx + 4, -6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // The box.
    ctx.fillStyle = '#c2142f';
    ctx.beginPath();
    ctx.rect(-22, -8, 44, 22);
    ctx.fill();
    ctx.stroke();
    // The black band across it.
    ctx.fillStyle = '#140a10';
    ctx.fillRect(-22, -1, 44, 7);
    // A shine along the top edge, so the box reads as a solid and not a hole.
    ctx.strokeStyle = '#ff8fa3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-18, -5);
    ctx.lineTo(18, -5);
    ctx.stroke();
    ctx.restore();
  }
}
