/**
 * H.I.V.E.R. - FOOTPRINTS.
 *
 * Ticket 30, from ticket 09 ("liked"): fresh tracks in the world from the
 * real accounts that voted on or replied to a post this round, each track
 * leading to the account that left it. Facts only: who, and what they did.
 * Nothing here weighs an account or says what to make of it (the ethos:
 * visual indicators, not conclusions).
 *
 * A track is a short run of prints on one of the post's streets, from the
 * house outward to a marker wearing the account's avatar. Votes come with
 * the board (the post's active votes); replies are asked for lazily as the
 * bug comes near (data/fetch-replies.ts). Hover and click live in
 * canvas-map.tsx like everything else that names itself.
 */
import type { GameWorld, WorldEdge } from './world';
import { posAt, tangentAt } from './movement';
import { avatarImage } from './avatars';

export type TrackAct = 'vote' | 'reply';

export interface Track {
  /** The house node the act was on. */
  node: number;
  /** Its house slot (board.houses index). */
  ref: number;
  edge: number;
  /** Is the house at the edge's `a` end? */
  fromA: boolean;
  /** How far out along the edge the marker stands, as a fraction from the house. */
  reach: number;
  handle: string;
  act: TrackAct;
  /** Where the marker stands. */
  x: number;
  y: number;
}

export interface FootprintState {
  tracks: Track[];
  /** House slots whose replies have been asked for. */
  asked: Set<number>;
  /** Tracks placed per house slot, to lay the next one further out. */
  perHouse: number[];
}

/** Tracks a house can carry before it is a mess. */
const MAX_PER_HOUSE = 6;
/** Vote tracks per house, leaving room for repliers. The newest voters. */
const MAX_VOTERS = 4;
/** World px from the house to the first marker on a street. */
const FIRST_REACH = 150;
/** Each further track on the same street stands this much further out. */
const STEP_REACH = 80;
/** Never past the middle of the street. */
const MAX_REACH = 0.45;
const PRINTS = 5;
/** Marker radius, world px. */
const MARK_R = 17;

/** The act colours are the flow colours in render.ts: votes, comments. */
const ACT_HEX: Record<TrackAct, string> = { vote: '#cdf6ff', reply: '#8ee87f' };
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const at = { x: 0, y: 0 };
const tg = { x: 0, y: 0 };

function addTrack(
  state: FootprintState,
  world: GameWorld,
  node: number,
  ref: number,
  handle: string,
  act: TrackAct
): void {
  const k = state.perHouse[ref] ?? 0;
  if (k >= MAX_PER_HOUSE) return;
  if (state.tracks.some((tr) => tr.node === node && tr.handle === handle)) return;
  const streets = world.incident[node];
  if (!streets || !streets.length) return;
  const edge = streets[k % streets.length];
  const e = world.edges[edge];
  const fromA = e.a === node;
  const lane = Math.floor(k / streets.length);
  const reach = Math.min(MAX_REACH, (FIRST_REACH + lane * STEP_REACH) / e.len);
  posAt(e, fromA ? reach : 1 - reach, at);
  state.tracks.push({ node, ref, edge, fromA, reach, handle, act, x: at.x, y: at.y });
  state.perHouse[ref] = k + 1;
}

/**
 * The vote tracks for the round. The board's voter lists come in the order
 * the votes were cast, so the last few are the freshest.
 */
export function createFootprints(world: GameWorld, houses: readonly { voters: string[] }[]): FootprintState {
  const state: FootprintState = { tracks: [], asked: new Set(), perHouse: new Array(houses.length).fill(0) };
  for (const n of world.nodes) {
    if (n.kind !== 'house') continue;
    const voters = houses[n.ref]?.voters ?? [];
    for (const v of voters.slice(-MAX_VOTERS).reverse()) addTrack(state, world, n.id, n.ref, v, 'vote');
  }
  return state;
}

/** Reply tracks for one house, once its repliers are known. */
export function addReplyTracks(
  state: FootprintState,
  world: GameWorld,
  node: number,
  ref: number,
  handles: readonly string[]
): void {
  for (const h of handles) addTrack(state, world, node, ref, h, 'reply');
}

/**
 * Prints along the street from the house out to the marker, brightening
 * toward it, and the marker with the account's face once it has loaded.
 */
export function drawFootprints(
  ctx: CanvasRenderingContext2D,
  state: FootprintState,
  edges: WorldEdge[],
  vis: (x: number, y: number) => boolean
): void {
  for (const tr of state.tracks) {
    if (!vis(tr.x, tr.y)) continue;
    const e = edges[tr.edge];
    const col = ACT_HEX[tr.act];
    ctx.fillStyle = col;
    for (let i = 0; i < PRINTS; i++) {
      const f = (i + 0.5) / PRINTS;
      const t = tr.fromA ? tr.reach * f : 1 - tr.reach * f;
      posAt(e, t, at);
      tangentAt(e, t, tg);
      const side = i % 2 === 0 ? 1 : -1;
      ctx.save();
      ctx.translate(at.x - tg.y * side * 7, at.y + tg.x * side * 7);
      ctx.rotate(Math.atan2(tg.y, tg.x));
      ctx.globalAlpha = 0.45 + 0.45 * f;
      ctx.beginPath();
      ctx.ellipse(0, 0, 6.5, 4, 0, 0, 6.283);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    // The marker: the account that walked here.
    const img = avatarImage(tr.handle);
    ctx.save();
    ctx.beginPath();
    ctx.arc(tr.x, tr.y, MARK_R, 0, 6.283);
    ctx.clip();
    if (img) {
      ctx.drawImage(img, tr.x - MARK_R, tr.y - MARK_R, MARK_R * 2, MARK_R * 2);
    } else {
      ctx.fillStyle = '#141019';
      ctx.fillRect(tr.x - MARK_R, tr.y - MARK_R, MARK_R * 2, MARK_R * 2);
      ctx.fillStyle = col;
      ctx.font = `800 ${MARK_R * 1.1}px ${MONO}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tr.handle.charAt(0).toUpperCase(), tr.x, tr.y + 1);
    }
    ctx.restore();
    ctx.strokeStyle = col;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(tr.x, tr.y, MARK_R, 0, 6.283);
    ctx.stroke();
  }
}
