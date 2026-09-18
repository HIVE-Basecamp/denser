'use client';

/**
 * Hive Frontend Universe - projectiles.
 *
 * Enemy fire and player fire share one array and one physics: a straight
 * line at real speed with real travel time, so both sides actually aim and
 * actually dodge. Every critter kind takes potshots from range now; the
 * close-range nuisances (hazards.ts) and thieves (coins.ts) are unchanged
 * underneath. The bug fires back by spending one bullet per shot.
 *
 * AIM is held here (aimX/aimY), not on the player: the last direction the
 * bug travelled, so standing still keeps pointing where you were going.
 * The surfboard in render.ts turns to show it (Bryan: "make it clear what
 * direction the shot will fire... built into the surf board").
 *
 * Nothing here touches movement.ts or PlayerState. The player is read;
 * consequences go through combat.ts (the bug) and the critter's own
 * hp/koUntil fields (critters.ts). A DRIFTING bug is immune to enemy fire,
 * the same rule every other hazard obeys: jumping over trouble always works.
 *
 * The bug's own shots are paid for out of engine/ammo.ts, never out of the
 * tokens it is carrying: tokens are for gathering, bullets are for spending.
 */

import type { PlayerState } from './movement';
import { KNOCKOUT_HITS, KNOCKOUT_SECONDS, type CritterState, type CritterKind } from './critters';
import { registerPlayerHit, type CombatState } from './combat';
import { drawHiveMark } from './icons';
import { spendRound, type AmmoState } from './ammo';

export interface Shot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  owner: 'critter' | 'player';
  kind: CritterKind | 'player';
  age: number;
}

/** A one-shot explosion: small on every hit, BIG on the knockout. */
export interface Burst {
  x: number;
  y: number;
  age: number;
  kind: CritterKind;
  big: boolean;
}

export interface ProjectileState {
  shots: Shot[];
  bursts: Burst[];
  /** Per-critter fire cooldown, sized to the population on first sight. */
  cooldowns: number[];
  /** Unit vector the bug will fire along. Last travel direction. */
  aimX: number;
  aimY: number;
}

/** World px/sec. Fast and flat: meant to be dodged, not outrun. */
const CRITTER_SHOT_SPEED = 520;
const PLAYER_SHOT_SPEED = 640;
const SHOT_LIFETIME = 2.4;
/** How far a critter will fire from. Past every close-range hazard range. */
const ENGAGE_RANGE = 640;
/** Seconds between shots per critter. */
const FIRE_COOLDOWN = 2.4;
const HIT_RADIUS = 30;
/** Burst lifetimes. Under the 1.5s one-shot ceiling in ART-DIRECTION. */
export const BIG_BURST_SECONDS = 1.0;
const SMALL_BURST_SECONDS = 0.35;
/** The shot leaves from the board's nose, not the bug's belly. */
const MUZZLE = 34;

export function createProjectiles(): ProjectileState {
  return { shots: [], bursts: [], cooldowns: [], aimX: 1, aimY: 0 };
}

function fire(
  state: ProjectileState,
  x: number,
  y: number,
  dx: number,
  dy: number,
  speed: number,
  owner: 'critter' | 'player',
  kind: CritterKind | 'player'
): void {
  const d = Math.hypot(dx, dy) || 1;
  state.shots.push({ x, y, vx: (dx / d) * speed, vy: (dy / d) * speed, owner, kind, age: 0 });
}

export function updateProjectiles(
  state: ProjectileState,
  player: PlayerState,
  critters: CritterState | null,
  combat: CombatState,
  dt: number,
  time: number
): void {
  // Aim follows travel; standing still keeps the last heading.
  const sp = Math.hypot(player.vx, player.vy);
  if (sp > 5) {
    state.aimX = player.vx / sp;
    state.aimY = player.vy / sp;
  }

  for (let i = state.shots.length - 1; i >= 0; i--) {
    const s = state.shots[i];
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.age += dt;
    if (s.age > SHOT_LIFETIME) state.shots.splice(i, 1);
  }
  for (let i = state.bursts.length - 1; i >= 0; i--) {
    const b = state.bursts[i];
    b.age += dt;
    if (b.age > (b.big ? BIG_BURST_SECONDS : SMALL_BURST_SECONDS)) state.bursts.splice(i, 1);
  }

  if (!critters) return;
  if (state.cooldowns.length !== critters.critters.length) {
    // Staggered so a cluster never fires in chorus.
    state.cooldowns = critters.critters.map((_, i) => (i % 5) * 0.4);
  }

  const airborne = player.mode === 'drift';
  const hit2 = HIT_RADIUS * HIT_RADIUS;
  const engage2 = ENGAGE_RANGE * ENGAGE_RANGE;

  for (let i = 0; i < critters.critters.length; i++) {
    const c = critters.critters[i];
    if (c.koUntil > time) continue;
    if (state.cooldowns[i] > 0) {
      state.cooldowns[i] -= dt;
      continue;
    }
    const dx = player.x - c.x;
    const dy = player.y - c.y;
    if (dx * dx + dy * dy > engage2) continue;
    fire(state, c.x, c.y, dx, dy, CRITTER_SHOT_SPEED, 'critter', c.kind);
    state.cooldowns[i] = FIRE_COOLDOWN;
  }

  for (let i = state.shots.length - 1; i >= 0; i--) {
    const s = state.shots[i];
    if (s.owner === 'critter') {
      if (airborne) continue;
      const dx = s.x - player.x;
      const dy = s.y - player.y;
      if (dx * dx + dy * dy <= hit2) {
        registerPlayerHit(combat);
        state.shots.splice(i, 1);
      }
      continue;
    }
    for (const c of critters.critters) {
      if (c.koUntil > time) continue;
      const dx = s.x - c.x;
      const dy = s.y - c.y;
      if (dx * dx + dy * dy > hit2) continue;
      c.hp--;
      state.bursts.push({ x: s.x, y: s.y, age: 0, kind: c.kind, big: false });
      if (c.hp <= 0) {
        c.koUntil = time + KNOCKOUT_SECONDS;
        c.hp = KNOCKOUT_HITS;
        // Out of the game for the count, and when it comes back it comes back
        // out of the Emperor's ground, not out of thin air where it stood
        // (critters.ts, `emperorEdges`).
        c.returning = true;
        state.bursts.push({ x: c.x, y: c.y, age: 0, kind: c.kind, big: true });
      }
      state.shots.splice(i, 1);
      break;
    }
  }
}

/**
 * The bug fires along its aim (see aimX/aimY), spending one bullet.
 * Returns false with an empty magazine, and spends nothing.
 *
 * This used to spend a carried TOKEN. Bryan, 2026-09-17: "i need the tokens
 * to return to just being tokens to collect and not bullets." A token is
 * gathered and banked; a bullet is spent. Charging the round's score for
 * every shot made never firing the safest way to play, which is the opposite
 * of what a shot is for. Bullets now come from ammo packs (engine/ammo.ts).
 */
export function playerFire(state: ProjectileState, player: PlayerState, ammo: AmmoState | null): boolean {
  if (!spendRound(ammo)) return false;
  fire(
    state,
    player.x + state.aimX * MUZZLE,
    player.y + state.aimY * MUZZLE,
    state.aimX,
    state.aimY,
    PLAYER_SHOT_SPEED,
    'player',
    'player'
  );
  return true;
}

export const SHOT_COLORS: Record<string, string> = {
  sock: '#e3123a',
  blah: '#52f22e',
  scammer: '#ffd84a',
  extractor: '#c05df0',
  spammer: '#f2dfa8',
  player: '#5df0ff'
};

const OUTLINE = '#141019';

/** Ease-out: debris leaves fast and settles. */
function easeOut(f: number): number {
  return 1 - (1 - f) * (1 - f);
}

function drawBurst(ctx: CanvasRenderingContext2D, b: Burst): void {
  const color = SHOT_COLORS[b.kind] ?? '#ffffff';
  if (!b.big) {
    // A hit spark: a quick ring and four flecks. Confirms the shot landed.
    const f = b.age / SMALL_BURST_SECONDS;
    ctx.globalAlpha = 1 - f;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 8 + f * 30, 0, 6.283);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    for (let k = 0; k < 4; k++) {
      const a = k * 1.571 + 0.785;
      const d = 10 + easeOut(f) * 26;
      ctx.beginPath();
      ctx.arc(b.x + Math.cos(a) * d, b.y + Math.sin(a) * d, 3 * (1 - f) + 0.5, 0, 6.283);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    return;
  }

  // THE KNOCKOUT. A white flash, two shock rings racing out, a starburst
  // of spikes, and a dozen chunks of the critter's colour tumbling away
  // and shrinking. Loud on purpose: taking one down should feel earned.
  const f = b.age / BIG_BURST_SECONDS;
  const e = easeOut(f);
  ctx.save();
  ctx.translate(b.x, b.y);

  if (f < 0.3) {
    const fl = 1 - f / 0.3;
    ctx.globalAlpha = fl;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 26 + (1 - fl) * 70, 0, 6.283);
    ctx.fill();
  }

  ctx.lineCap = 'round';
  ctx.globalAlpha = (1 - f) * 0.95;
  ctx.strokeStyle = color;
  ctx.lineWidth = 7 * (1 - f) + 1;
  ctx.beginPath();
  ctx.arc(0, 0, 18 + e * 170, 0, 6.283);
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3 * (1 - f) + 0.5;
  ctx.beginPath();
  ctx.arc(0, 0, 12 + e * 110, 0, 6.283);
  ctx.stroke();

  // Spikes: eight, rotating slowly as they fade.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.globalAlpha = (1 - f) * 0.85;
  for (let k = 0; k < 8; k++) {
    const a = k * 0.785 + f * 0.6;
    const r0 = 14 + e * 40;
    const r1 = 40 + e * 95;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
    ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
    ctx.stroke();
  }

  // Chunks: twelve pieces of the critter, fanned by index so the burst is
  // the same shape every time, tumbling outward and shrinking to nothing.
  ctx.globalAlpha = 1 - f * f;
  for (let k = 0; k < 12; k++) {
    const a = k * 0.5236 + (k % 2) * 0.2;
    const spd = 90 + (k % 3) * 45;
    const d = 12 + e * spd;
    const sz = (9 - (k % 3) * 2) * (1 - f) + 1;
    ctx.save();
    ctx.translate(Math.cos(a) * d, Math.sin(a) * d - e * e * 20 * (k % 2));
    ctx.rotate(a + f * 6);
    ctx.fillStyle = k % 4 === 0 ? '#ffffff' : color;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-sz, -sz * 0.7);
    ctx.lineTo(sz, -sz * 0.4);
    ctx.lineTo(sz * 0.6, sz);
    ctx.lineTo(-sz * 0.8, sz * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

/**
 * ENEMY SHOTS ARE BLATANT. Bryan: "very hard to distinguish the bullets...
 * often im getting struck but i couldnt even tell a shot was coming at me."
 * So every enemy shot is the same vibrant blue whatever fired it, big, with
 * a white core, a soft halo, a long bright tail, and a size that pulses as
 * it flies. Nothing else on the board is this blue or this big and moving.
 * The critter's own colour stays on the hit bursts, where it says who.
 */
const ENEMY_SHOT = '#1f6bff';
const ENEMY_SHOT_CORE = '#dff0ff';
/** Radius of the ball, at rest and at the top of the pulse. */
const ENEMY_SHOT_RADIUS = 24;
const ENEMY_SHOT_PULSE = 8;
/** Pulses per second. Fast enough to read as alive, not a blink. */
const ENEMY_SHOT_PULSE_HZ = 4;
const ENEMY_SHOT_TAIL = 90;

/*
  THE BUG'S SHOT (Bryan, 2026-09-17): "a red and black diamond with the hive
  logo in middle and a flame tale... same size as the enemy bullets with same
  tale, but black and red the bullet and shimmering glowing vibe."

  So it is built to the enemy shot's measurements on purpose - the same ball
  size, the same pulse, the same tail length - and differs only in what it is
  made of. Reading which way a shot is going matters more than reading whose
  it is, and two shots the same size read as one language.

  The diamond turns to point along its flight; the Hive mark inside it does
  NOT (hive-mark.ts: the mark must never be drawn under a flipped or turned
  transform), so the mark is laid on afterwards, upright, the way a badge sits
  flat on a moving thing.
*/
const PLAYER_SHOT_RADIUS = ENEMY_SHOT_RADIUS;
const PLAYER_SHOT_PULSE = ENEMY_SHOT_PULSE;
const PLAYER_SHOT_TAIL = ENEMY_SHOT_TAIL;
/** The diamond is a shade longer than it is wide, so it reads as pointed. */
const PLAYER_SHOT_LONG = 1.3;
/** The black it is cut from, and the red it is lit by. */
const PLAYER_SHOT_BLACK = '#0b0409';
const PLAYER_SHOT_RED = '#ff2d4f';
const PLAYER_SHOT_RED_DEEP = '#8d0c22';
/** The flame: hottest at the ball, cooling backwards down the tail. */
const PLAYER_FLAME_HOT = '255, 214, 120';
const PLAYER_FLAME_MID = '255, 92, 32';
const PLAYER_FLAME_COOL = '160, 12, 40';
/** Shimmers per second. Faster than the pulse, so the two beat against each other. */
const PLAYER_SHIMMER_HZ = 7;
/** Tongues of flame in the tail. Odd number, so they never pair up. */
const PLAYER_FLAME_TONGUES = 5;

function drawEnemyShot(ctx: CanvasRenderingContext2D, s: Shot, nx: number, ny: number): void {
  const pulse = Math.sin(s.age * ENEMY_SHOT_PULSE_HZ * 6.283);
  const r = ENEMY_SHOT_RADIUS + pulse * ENEMY_SHOT_PULSE;

  // Halo: twice the ball, faint, so the shot is seen before it is read.
  ctx.globalAlpha = 0.28 + pulse * 0.08;
  ctx.fillStyle = ENEMY_SHOT;
  ctx.beginPath();
  ctx.arc(s.x, s.y, r * 2, 0, 6.283);
  ctx.fill();

  // Tail: a thick blue streak back along the flight line, fading.
  const grad = ctx.createLinearGradient(s.x - nx * ENEMY_SHOT_TAIL, s.y - ny * ENEMY_SHOT_TAIL, s.x, s.y);
  grad.addColorStop(0, 'rgba(31,107,255,0)');
  grad.addColorStop(1, 'rgba(31,107,255,0.9)');
  ctx.globalAlpha = 1;
  ctx.strokeStyle = grad;
  ctx.lineCap = 'round';
  ctx.lineWidth = r * 1.1;
  ctx.beginPath();
  ctx.moveTo(s.x - nx * ENEMY_SHOT_TAIL, s.y - ny * ENEMY_SHOT_TAIL);
  ctx.lineTo(s.x, s.y);
  ctx.stroke();

  // The ball: blue, dark outline, white-hot core.
  ctx.fillStyle = ENEMY_SHOT;
  ctx.beginPath();
  ctx.arc(s.x, s.y, r, 0, 6.283);
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = ENEMY_SHOT_CORE;
  ctx.beginPath();
  ctx.arc(s.x, s.y, r * 0.45, 0, 6.283);
  ctx.fill();
}

/**
 * The flame tail: one broad body of fire plus a few tongues that flicker
 * independently, all of it drawn back along the flight line. The tongues are
 * worked out from the shot's own age rather than remembered, so nothing
 * accumulates and two machines draw the same flame at the same moment.
 */
function drawFlameTail(ctx: CanvasRenderingContext2D, s: Shot, nx: number, ny: number, r: number): void {
  const bx = s.x - nx * PLAYER_SHOT_TAIL;
  const by = s.y - ny * PLAYER_SHOT_TAIL;
  const body = ctx.createLinearGradient(bx, by, s.x, s.y);
  body.addColorStop(0, `rgba(${PLAYER_FLAME_COOL}, 0)`);
  body.addColorStop(0.45, `rgba(${PLAYER_FLAME_COOL}, 0.55)`);
  body.addColorStop(0.8, `rgba(${PLAYER_FLAME_MID}, 0.85)`);
  body.addColorStop(1, `rgba(${PLAYER_FLAME_HOT}, 0.95)`);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = body;
  ctx.lineCap = 'round';
  ctx.lineWidth = r * 1.1;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(s.x, s.y);
  ctx.stroke();

  // The tongues: thin licks either side of the body, each a different length
  // and each wavering on its own clock.
  const px = -ny;
  const py = nx;
  for (let i = 0; i < PLAYER_FLAME_TONGUES; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const seed = (i + 1) * 1.7;
    const waver = Math.sin(s.age * (9 + i * 2.1) + seed);
    const reach = PLAYER_SHOT_TAIL * (0.45 + (i / PLAYER_FLAME_TONGUES) * 0.5) * (0.85 + waver * 0.15);
    const off = side * r * (0.22 + (i % 3) * 0.14) * (0.6 + waver * 0.4);
    const tip = ctx.createLinearGradient(s.x - nx * reach + px * off, s.y - ny * reach + py * off, s.x, s.y);
    tip.addColorStop(0, `rgba(${PLAYER_FLAME_MID}, 0)`);
    tip.addColorStop(1, `rgba(${PLAYER_FLAME_HOT}, 0.8)`);
    ctx.strokeStyle = tip;
    ctx.lineWidth = r * 0.26;
    ctx.beginPath();
    ctx.moveTo(s.x - nx * reach + px * off, s.y - ny * reach + py * off);
    ctx.quadraticCurveTo(
      s.x - nx * reach * 0.5 + px * off * 1.8,
      s.y - ny * reach * 0.5 + py * off * 1.8,
      s.x,
      s.y
    );
    ctx.stroke();
  }
}

function drawPlayerShot(ctx: CanvasRenderingContext2D, s: Shot, nx: number, ny: number): void {
  const pulse = Math.sin(s.age * ENEMY_SHOT_PULSE_HZ * 6.283);
  const shimmer = 0.5 + Math.sin(s.age * PLAYER_SHIMMER_HZ * 6.283) * 0.5;
  const r = PLAYER_SHOT_RADIUS + pulse * PLAYER_SHOT_PULSE;

  // The glow, first and widest, so the shot is seen before it is read. It
  // breathes on the shimmer rather than the pulse, which is what stops the
  // thing looking like a painted shape being slid along.
  const halo = ctx.createRadialGradient(s.x, s.y, r * 0.4, s.x, s.y, r * 2.2);
  halo.addColorStop(0, `rgba(255, 45, 79, ${(0.34 + shimmer * 0.2).toFixed(3)})`);
  halo.addColorStop(1, 'rgba(255, 45, 79, 0)');
  ctx.globalAlpha = 1;
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(s.x, s.y, r * 2.2, 0, 6.283);
  ctx.fill();

  drawFlameTail(ctx, s, nx, ny, r);

  // THE DIAMOND, turned to point where it is going. Black through the middle,
  // red at the edges, with a rim that brightens on the shimmer.
  const rx = r * PLAYER_SHOT_LONG;
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(Math.atan2(ny, nx));
  const face = ctx.createLinearGradient(-rx, 0, rx, 0);
  face.addColorStop(0, PLAYER_SHOT_RED_DEEP);
  face.addColorStop(0.42, PLAYER_SHOT_BLACK);
  face.addColorStop(1, PLAYER_SHOT_RED);
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.moveTo(rx, 0);
  ctx.lineTo(0, r);
  ctx.lineTo(-rx, 0);
  ctx.lineTo(0, -r);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PLAYER_SHOT_RED;
  ctx.globalAlpha = 0.55 + shimmer * 0.45;
  ctx.lineWidth = 3;
  ctx.stroke();
  // A hairline of pure black outside the red rim, so the diamond keeps its
  // shape over bright ground the way every other icon here does.
  ctx.globalAlpha = 1;
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.restore();

  // THE MARK, upright and never turned. It rides at the diamond's heart and
  // brightens with the shimmer, which is what makes the shot look lit from
  // inside rather than coloured in.
  ctx.globalAlpha = 0.85 + shimmer * 0.15;
  drawHiveMark(ctx, s.x, s.y, r * 0.95, shimmer > 0.5 ? '#ffd6c0' : PLAYER_SHOT_RED);
  ctx.globalAlpha = 1;
}

export function drawProjectiles(
  ctx: CanvasRenderingContext2D,
  state: ProjectileState,
  vis: (x: number, y: number) => boolean
): void {
  for (const s of state.shots) {
    if (!vis(s.x, s.y)) continue;
    const speed = Math.hypot(s.vx, s.vy) || 1;
    const nx = s.vx / speed;
    const ny = s.vy / speed;
    if (s.owner === 'critter') drawEnemyShot(ctx, s, nx, ny);
    else drawPlayerShot(ctx, s, nx, ny);
  }
  ctx.globalAlpha = 1;
  for (const b of state.bursts) {
    if (!vis(b.x, b.y)) continue;
    drawBurst(ctx, b);
  }
}
