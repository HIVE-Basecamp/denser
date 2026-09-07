/**
 * H.I.V.E.R. - BLOCKS on the lines.
 *
 * Ticket 17, from ticket 10 (Bryan: "Yes try it"): things sit on the lines
 * that the bug must hop over or route around, and that hide whatever stands
 * behind them, so the hop has a job every second. Chunky crystal blocks
 * parked mid-line, placed once per round from the round's seed, so every
 * player meets the same ones.
 *
 * Same layering as the hazards: movement.ts is untouched. The integrator
 * runs, then the caller asks blockPlayer whether the bug pushed into a
 * block this step; if so the bug is set back to the block's edge, stopped.
 * A drifting bug sails over every block, so jumping is always the answer.
 */
import type { GameWorld, WorldEdge } from './world';
import type { PlayerState } from './movement';
import { posAt, tangentAt } from './movement';
import { mulberry32 } from '../lib/mesh';

export interface Block {
  /** Index of the line it sits on. */
  edge: number;
  /** Where along the line, 0..1. */
  t: number;
  /** Half of what it covers along the line, as a fraction of the line. */
  halfSpan: number;
  x: number;
  y: number;
  /** Footprint radius, world px. */
  size: number;
  /** Index into the block palette. */
  hue: number;
}

export interface BlockState {
  blocks: Block[];
  /** The block last bumped, and how much wobble it has left. */
  bumpIdx: number;
  bumpT: number;
  /** The block the bug is pressed against right now, or -1. */
  holdIdx: number;
  /** The bug's mode last step, to tell a landing from a push. */
  prevMode: 'rail' | 'drift';
}

/** About one block per this many eligible lines. */
const ONE_IN = 6;
/** Lines shorter than this stay clear: nothing to route around on them. */
const MIN_EDGE_LEN = 320;
/** How long a bump wobbles, seconds. */
const BUMP_SECONDS = 0.35;
/** The bug is set back this far from the block's edge, as a fraction of the line. */
const PUSH_BACK = 0.004;

/** The cube palette from render.ts, so the blocks belong with the scenery. */
const BLOCK_HEX = ['#5EE9D5', '#B79CFF', '#FFC24D', '#FF90AE', '#7fb8ff'];
const OUTLINE = '#160f1d';

/**
 * Deterministic placement from the round seed: only ordinary streets (a
 * spoke leads to one place and must stay open), only lines long enough to
 * matter, never a line whose end is a dead end.
 */
export function placeBlocks(world: GameWorld, seed: number): BlockState {
  const rng = mulberry32(seed ^ 0xb10c);
  const blocks: Block[] = [];
  const at = { x: 0, y: 0 };
  world.edges.forEach((e, i) => {
    if (e.kind !== 'mesh' || e.len < MIN_EDGE_LEN) return;
    if (world.incident[e.a].length < 2 || world.incident[e.b].length < 2) return;
    if (rng() * ONE_IN >= 1) return;
    const size = 46 + rng() * 40;
    const t = 0.4 + rng() * 0.2;
    posAt(e, t, at);
    blocks.push({
      edge: i,
      t,
      halfSpan: (size * 1.1) / e.len,
      x: at.x,
      y: at.y,
      size,
      hue: Math.floor(rng() * 5)
    });
  });
  return { blocks, bumpIdx: -1, bumpT: 0, holdIdx: -1, prevMode: 'rail' };
}

const tangent = { x: 0, y: 0 };

/**
 * After the integrator ran: is the bug inside a block's span on its line?
 * Riding into it, the bug is set back to the block's edge on the side it
 * came from, stopped: a wall. Landing inside it from a hop, the bug is
 * carried out on the side it was heading: the hop cleared it. Returns true
 * when a fresh bump starts, for the caller's shake. A drifting bug is never
 * touched.
 */
export function blockPlayer(state: BlockState, p: PlayerState, edges: WorldEdge[], dt: number): boolean {
  if (state.bumpT > 0) state.bumpT = Math.max(0, state.bumpT - dt);
  const landed = state.prevMode === 'drift' && p.mode === 'rail';
  state.prevMode = p.mode;
  if (p.mode !== 'rail') {
    state.holdIdx = -1;
    return false;
  }
  for (let i = 0; i < state.blocks.length; i++) {
    const b = state.blocks[i];
    if (b.edge !== p.edge) continue;
    const lo = b.t - b.halfSpan;
    const hi = b.t + b.halfSpan;
    if (p.t <= lo || p.t >= hi) continue;
    const e = edges[p.edge];
    let toHigh = p.t >= b.t;
    if (landed) {
      tangentAt(e, b.t, tangent);
      toHigh = p.vx * tangent.x + p.vy * tangent.y >= 0;
    }
    p.t = Math.max(0, Math.min(1, toHigh ? hi + PUSH_BACK : lo - PUSH_BACK));
    posAt(e, p.t, p);
    p.vx = 0;
    p.vy = 0;
    if (landed) return false;
    const fresh = state.holdIdx !== i;
    state.holdIdx = i;
    if (fresh) {
      state.bumpIdx = i;
      state.bumpT = BUMP_SECONDS;
    }
    return fresh;
  }
  state.holdIdx = -1;
  return false;
}

function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * k);
  const g = Math.round(((n >> 8) & 255) * k);
  const b = Math.round((n & 255) * k);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * A chunky crystal block standing on the line: thick outline, flat bright
 * faces, a shadow on the street. Opaque on purpose, so whatever passes
 * behind it is hidden.
 */
export function drawBlocks(
  ctx: CanvasRenderingContext2D,
  state: BlockState,
  vis: (x: number, y: number) => boolean
): void {
  for (let i = 0; i < state.blocks.length; i++) {
    const b = state.blocks[i];
    if (!vis(b.x, b.y)) continue;
    const s = b.size;
    const w = s * 0.87;
    const h = s * 0.95;
    const col = BLOCK_HEX[b.hue];
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.2, s * 1.15, s * 0.5, 0, 0, 6.283);
    ctx.fill();
    // Bumped: it rocks on its footprint for a moment.
    if (i === state.bumpIdx && state.bumpT > 0) {
      ctx.rotate(Math.sin(state.bumpT * 40) * 0.1 * (state.bumpT / BUMP_SECONDS));
    }
    ctx.lineJoin = 'round';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = Math.max(2, s * 0.09);
    // Left face.
    ctx.fillStyle = shade(col, 0.74);
    ctx.beginPath();
    ctx.moveTo(-w, 0);
    ctx.lineTo(0, s * 0.5);
    ctx.lineTo(0, s * 0.5 - h);
    ctx.lineTo(-w, -h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Right face, darkest.
    ctx.fillStyle = shade(col, 0.52);
    ctx.beginPath();
    ctx.moveTo(0, s * 0.5);
    ctx.lineTo(w, 0);
    ctx.lineTo(w, -h);
    ctx.lineTo(0, s * 0.5 - h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Top face, brightest, with a glint.
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.5 - h);
    ctx.lineTo(w, -h);
    ctx.lineTo(0, -s * 0.5 - h);
    ctx.lineTo(-w, -h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = Math.max(1.5, s * 0.06);
    ctx.beginPath();
    ctx.moveTo(-w * 0.55, -h - s * 0.05);
    ctx.lineTo(-w * 0.15, -h - s * 0.32);
    ctx.stroke();
    ctx.restore();
  }
}
