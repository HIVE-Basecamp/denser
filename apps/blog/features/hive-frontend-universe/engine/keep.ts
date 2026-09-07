/**
 * H.I.V.E.R. — WHAT HAPPENS AT THE KEEP.
 *
 * The ending is the real one (overview chart tickets 07 and 27). On Hive the
 * Emperor's hoard, the stake he bought the old chain with, was moved into
 * the DHF at hardfork 24 in October 2020: a public vault whose account has
 * no keys at all. "His hoard became everyone's."
 *
 * The idea we are trying:
 *   - Two helmets still buy the crossing (engine/helmets.ts). Anyone who
 *     makes it sees him, the hoard and the motto, and the panel shows the
 *     real vault, live.
 *   - Park at the keep wearing all 21 helmets, one per guardian, and the
 *     hoard is set loose: the pile lifts off and streams away toward the
 *     DHF Fun Park. The 21 together do what none could alone, which is
 *     the history.
 *   - The hoard re-forms every round (the world reweaves); the ending is
 *     kept forever as a fact about the player, like a found place.
 *
 * DOM-free. Nothing here touches movement.ts, and nothing reaches the chain.
 */

import { LANDMARKS } from '../lib/fixed-world';
import type { GameWorld } from './world';
import { HELMET_TOTAL } from './helmets';
import { getStorageItem, setStorageItem, StorageTTL } from '@ui/lib/storage-with-ttl';

export const KEEP_LANDMARK_ID = 'json_keep';
/** Where the hoard goes: the DHF Fun Park stands for the vault. */
export const VAULT_LANDMARK_ID = 'proposals';
/** All 21: one helmet per guardian. */
export const GUARDIANS_NEEDED = HELMET_TOTAL;

/** How long the pile takes to stream away. */
const RELEASE_SECONDS = 7;
/** The pile empties over this first part of the release. */
const EMPTY_BY = 0.5;
/** Coins in the stream, and how far each one flies before it fades. */
const COINS = 30;
const TRAVEL = 1600;
const ARC = 320;
/** Where drawJsonBoss piles the hoard, in units of its R (engine/icons.ts). */
const HOARD_AT = { x: 0.1, y: 0.88 };
/** drawIcon hands the boss R = s * 1.5. */
const BOSS_R_PER_S = 1.5;
/** Permanent: the ending is an achievement, not a session. */
const STORE_KEY = 'hfu-keep';
const GOLD = '#ffd24a';
const OUTLINE = '#160f1d';

export interface KeepState {
  /** World position of the pile at the villain's feet. */
  hoardX: number;
  hoardY: number;
  /** World position of the vault the pile streams toward. */
  vaultX: number;
  vaultY: number;
  /** True once the hoard was set loose this round. */
  released: boolean;
  /** 0 while the hoard is his; climbs to 1 over RELEASE_SECONDS. */
  release: number;
  /** True if any round ever ended this way. Kept forever. */
  everReleased: boolean;
}

function landmarkNode(world: GameWorld, id: string): { x: number; y: number } | null {
  const idx = LANDMARKS.findIndex((lm) => lm.id === id);
  const node = world.nodes[world.landmarkNodeByIndex[idx] ?? -1];
  return node ? { x: node.x, y: node.y } : null;
}

/** `iconSize` is the boss's BIG_SIZE at play zoom (engine/render.ts). */
export function createKeep(world: GameWorld, iconSize: number): KeepState | null {
  const keep = landmarkNode(world, KEEP_LANDMARK_ID);
  const vault = landmarkNode(world, VAULT_LANDMARK_ID);
  if (!keep || !vault) return null;
  const R = iconSize * BOSS_R_PER_S;
  return {
    hoardX: keep.x + R * HOARD_AT.x,
    hoardY: keep.y + R * HOARD_AT.y,
    vaultX: vault.x,
    vaultY: vault.y,
    released: false,
    release: 0,
    everReleased: getStorageItem<boolean>(STORE_KEY) === true
  };
}

/**
 * Park at the keep. With all 21 helmets the hoard is set loose; true when
 * this visit did it. Fewer, or already loose this round: nothing.
 */
export function releaseHoard(state: KeepState, helmets: number): boolean {
  if (state.released || helmets < GUARDIANS_NEEDED) return false;
  state.released = true;
  if (!state.everReleased) {
    state.everReleased = true;
    setStorageItem(STORE_KEY, true, StorageTTL.PERMANENT);
  }
  return true;
}

export function updateKeep(state: KeepState, dt: number): void {
  if (!state.released || state.release >= 1) return;
  state.release = Math.min(1, state.release + dt / RELEASE_SECONDS);
}

/** How much of the pile is still at his feet, 1 to 0. Drives the icon. */
export function hoardLeft(state: KeepState | null | undefined): number {
  if (!state || !state.released) return 1;
  return 1 - Math.min(1, state.release / EMPTY_BY);
}

/** The pile lifting off and streaming toward the vault, coin by coin. */
export function drawKeepRelease(
  ctx: CanvasRenderingContext2D,
  state: KeepState,
  time: number,
  vis: (x: number, y: number) => boolean
): void {
  if (!state.released || state.release >= 1) return;
  const dx = state.vaultX - state.hoardX;
  const dy = state.vaultY - state.hoardY;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const heading = Math.atan2(uy, ux);

  // A gold pulse at the pile as it lets go.
  const pulse = 1 - state.release / EMPTY_BY;
  if (pulse > 0 && vis(state.hoardX, state.hoardY)) {
    const r = 120 + (1 - pulse) * 420;
    const glow = ctx.createRadialGradient(state.hoardX, state.hoardY, 0, state.hoardX, state.hoardY, r);
    glow.addColorStop(0, `rgba(255, 210, 74, ${0.35 * pulse})`);
    glow.addColorStop(1, 'rgba(255, 210, 74, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(state.hoardX, state.hoardY, r, 0, 6.283);
    ctx.fill();
  }

  ctx.lineWidth = 2;
  for (let k = 0; k < COINS; k++) {
    const start = (k / COINS) * 0.55;
    const u = (state.release - start) / 0.45;
    if (u <= 0 || u >= 1) continue;
    const along = u * TRAVEL;
    const lift = Math.sin(u * Math.PI) * ARC;
    const wobble = Math.sin(time * 4 + k * 1.7) * 10;
    const x = state.hoardX + ux * along - uy * wobble;
    const y = state.hoardY + uy * along + ux * wobble - lift;
    if (!vis(x, y)) continue;
    ctx.globalAlpha = u < 0.1 ? u / 0.1 : u > 0.65 ? (1 - u) / 0.35 : 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(heading + Math.sin(time * 6 + k) * 0.3);
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 9, 0, 0, 6.283);
    ctx.fillStyle = k % 2 ? GOLD : '#f0b429';
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}
