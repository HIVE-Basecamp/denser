'use client';

/**
 * Hive Frontend Universe - projectiles.
 *
 * Enemy fire and player fire share one array and one physics: a straight
 * line at real speed with real travel time, so both sides actually aim and
 * actually dodge. Every critter kind takes potshots from range now; the
 * close-range nuisances (hazards.ts) and thieves (coins.ts) are unchanged
 * underneath. The bug fires back by spending a carried token per shot.
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
 */

import type { PlayerState } from './movement';
import { KNOCKOUT_HITS, KNOCKOUT_SECONDS, type CritterState, type CritterKind } from './critters';
import { registerPlayerHit, type CombatState } from './combat';

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
        state.bursts.push({ x: c.x, y: c.y, age: 0, kind: c.kind, big: true });
      }
      state.shots.splice(i, 1);
      break;
    }
  }
}

/**
 * The bug fires along its aim (see aimX/aimY), spending one carried token.
 * Returns false with no ammo.
 */
export function playerFire(state: ProjectileState, player: PlayerState, coins: { carried: number }): boolean {
  if (coins.carried <= 0) return false;
  coins.carried--;
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
    const color = SHOT_COLORS[s.kind] ?? '#ffffff';
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(s.x - nx * 22, s.y - ny * 22);
    ctx.lineTo(s.x, s.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 6, 0, 6.283);
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }
  for (const b of state.bursts) {
    if (!vis(b.x, b.y)) continue;
    drawBurst(ctx, b);
  }
}
