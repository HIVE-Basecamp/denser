/**
 * H.I.V.E.R. - the world is a ball, and the map turns it.
 *
 * Bryan, 2026-09-15: "let's stop this flipping thing. And actually move
 * around this globe with the bug... wherever the bug is, when you hit map
 * you're always centred, and the map rotates. If you're over on the keep of
 * JSON you should be able to see the edges of Steem, and the citadels would
 * move around."
 *
 * So the board is no longer a card that turns over. It is painted on a
 * sphere. The flat world we have always drawn IS the sphere seen face on:
 * a point at world (x, y) sits at
 *
 *     latitude   sin(lat) = y / PLANET.ry
 *     longitude  sin(lon) = x / halfWidth(y)
 *
 * which is the plain orthographic projection, and which means that with the
 * globe at rest the projection is the IDENTITY: nothing about the resting
 * composition changes, exactly as Bryan asked ("you always have a starting
 * position where everything is seen how it is now").
 *
 * Turn the globe by `turn` radians and a point's screen x becomes
 *
 *     x' = halfWidth(y) * sin(lon - turn)      y' = y
 *
 * The y never moves. That is the whole reason this is affordable: the warp
 * is horizontal only, so the painted board can be squeezed onto the ball in
 * plain axis-aligned strips with no per-pixel work and no 3D engine.
 *
 * THE FAR SIDE. Longitudes run right round, so the old chain is not a
 * separate card any more: it is the far hemisphere, sitting at longitude PI.
 * Turn far enough and its coast comes round the limb on its own.
 *
 * WHAT STANDS OFF THE BALL. The citadels lean outward past the limb, so they
 * are not on the surface: they are pins above it. A pin is always on the
 * silhouette edge of the ball, which works out to the tidy
 *
 *     x' = x * cos(turn)
 *
 * so the ring of towers closes toward the middle as the world turns, and the
 * near half passes in front of the ball while the far half slides behind it.
 *
 * Pure numbers, DOM free. The paint is engine/render/globe.ts.
 */
import { PLANET } from './planet';
import { BODY_CELLS } from './landmass';
import { steemLandBox } from './steem-side';

/** Where each board sits on the ball: the living chain faces you, the old one is behind. */
export const BOARD_LON = { hive: 0, steem: Math.PI } as const;

/** Half a turn either way, radians. Anything past this has wrapped. */
const QUARTER = Math.PI / 2;

/** An angle brought back into (-PI, PI]. */
export function wrapPi(a: number): number {
  let v = a % (Math.PI * 2);
  if (v > Math.PI) v -= Math.PI * 2;
  if (v <= -Math.PI) v += Math.PI * 2;
  return v;
}

/**
 * Half the ball's width at world y, world px: the sphere's own outline.
 * Zero past the poles, where everything left is a pin standing off the ball.
 */
export function rowHalfWidth(y: number): number {
  const w = y / PLANET.ry;
  if (w <= -1 || w >= 1) return 0;
  return PLANET.rx * Math.sqrt(1 - w * w);
}

/** How far a board's land reaches east and west, world px. */
export interface LandSpan {
  min: number;
  max: number;
}

function bodySpan(): LandSpan {
  let min = Infinity;
  let max = -Infinity;
  for (const c of BODY_CELLS) {
    min = Math.min(min, c.x - c.r);
    max = Math.max(max, c.x + c.r);
  }
  return { min, max };
}

/**
 * WHERE THE GLOBE HOLDS STILL: the west and east ends of each board's land.
 *
 * Bryan, 2026-09-16: "If the bug is anywhere on the Hive logo the view stays
 * the same as always on the map. Everything looks wrong and stretched, which
 * we don't want. So only when the bug moves off to the right or left of the
 * Hive logo landmass should the map view change."
 *
 * So the turn is NOT the bug's longitude. It is how far past the land the bug
 * has gone. Between these two ends the globe does not move at all and the map
 * is the one everyone already knows, hand-tuned over eighteen passes; step
 * off either end into the open sea and it starts to turn, from nothing,
 * growing as you go.
 */
export const LAND_HOLD = {
  hive: bodySpan(),
  steem: (() => {
    const box = steemLandBox();
    return { min: box.x, max: box.x + box.w };
  })()
} as const;

/**
 * The longitude of a point standing on its own board, radians from the
 * board's own face. Past the limb it reads as the limb itself.
 */
export function longitudeAt(x: number, y: number): number {
  const hw = rowHalfWidth(y);
  if (hw <= 0) return x >= 0 ? QUARTER : -QUARTER;
  return Math.asin(Math.max(-1, Math.min(1, x / hw)));
}

/**
 * How far the globe should turn to bring the bug round to the front: the
 * longitude it has travelled PAST the land, and nothing at all while it is
 * still between the land's two ends (see LAND_HOLD).
 */
export function turnToward(x: number, y: number, hold: LandSpan): number {
  const held = Math.max(hold.min, Math.min(hold.max, x));
  return longitudeAt(x, y) - longitudeAt(held, y);
}

/**
 * Where a point on `base`'s board lands once the globe has turned, world px
 * across the screen, plus how far toward the viewer it now faces (1 dead
 * ahead, 0 on the limb, negative round the back).
 */
export function project(x: number, y: number, turn: number, base = 0): { x: number; depth: number } {
  const hw = rowHalfWidth(y);
  if (hw > 0 && Math.abs(x) <= hw) {
    const view = wrapPi(longitudeAt(x, y) + base - turn);
    return { x: hw * Math.sin(view), depth: Math.cos(view) };
  }
  // Off the ball: a pin on the silhouette, which only closes with the turn.
  const view = wrapPi((x >= 0 ? QUARTER : -QUARTER) + base - turn);
  return { x: x * Math.cos(base - turn), depth: Math.cos(view) };
}

/** What a point on the screen is standing on: a spot on a board, or nothing. */
export interface GlobeHit {
  /** World x on that board. */
  x: number;
  /** Which board: 0 the living chain, PI the old one. */
  base: number;
}

/**
 * The cursor, read back onto a board. The globe only turns about its upright
 * axis, so the world y is whatever the camera says and only x has to be
 * undone.
 */
export function unproject(sx: number, y: number, turn: number): GlobeHit | null {
  const hw = rowHalfWidth(y);
  if (hw > 0 && Math.abs(sx) <= hw) {
    const lon = wrapPi(Math.asin(Math.max(-1, Math.min(1, sx / hw))) + turn);
    const base = Math.abs(lon) <= QUARTER ? 0 : Math.PI;
    return { x: hw * Math.sin(wrapPi(lon - base)), base };
  }
  // Past the limb: whatever stands off the ball, read back off the board
  // whose face is nearer to you.
  const base = Math.abs(wrapPi(turn)) <= QUARTER ? 0 : Math.PI;
  const c = Math.cos(turn - base);
  if (Math.abs(c) < 0.08) return null;
  const x = sx / c;
  if (Math.abs(x) < hw) return null;
  return { x, base };
}

/**
 * One run of screen columns that all read from the same board, walked from
 * left to right. `view` and `local` are sines: multiply by the row's half
 * width to get world px on the screen and world px on the board.
 */
export interface GlobeSegment {
  /** Which board this run reads from: 0 the living chain, PI the old one. */
  base: number;
  /** sin(view longitude) per sample, ascending: the screen side. */
  view: number[];
  /** sin(longitude on its own board) per sample: the source side. */
  local: number[];
}

/**
 * The screen's half of the ball, cut into runs. The cuts fall exactly where
 * one board's coast hands over to the other's, so no strip is ever stretched
 * across the seam. Row independent: every row of the ball uses this same
 * list scaled by its own half width, which is what keeps the warp cheap.
 */
export function globeSegments(turn: number, steps: number): GlobeSegment[] {
  const cuts = [-QUARTER, QUARTER];
  for (const edge of [QUARTER, -QUARTER]) {
    const v = wrapPi(edge - turn);
    if (v > -QUARTER + 1e-6 && v < QUARTER - 1e-6) cuts.push(v);
  }
  cuts.sort((a, b) => a - b);
  const out: GlobeSegment[] = [];
  for (let s = 0; s < cuts.length - 1; s++) {
    const a = cuts[s];
    const b = cuts[s + 1];
    if (b - a < 1e-4) continue;
    const base = Math.abs(wrapPi((a + b) / 2 + turn)) <= QUARTER ? 0 : Math.PI;
    const n = Math.max(2, Math.round((steps * (b - a)) / Math.PI));
    const view: number[] = [];
    const local: number[] = [];
    for (let i = 0; i <= n; i++) {
      const v = a + ((b - a) * i) / n;
      view.push(Math.sin(v));
      local.push(Math.sin(wrapPi(wrapPi(v + turn) - base)));
    }
    out.push({ base, view, local });
  }
  return out;
}

/**
 * The rows the ball is cut into, world y, top to bottom. Spaced by LATITUDE,
 * not by height, because the outline changes fastest at the poles and a row
 * there has to be thin or the rim comes out as stairs.
 */
export function globeRows(count: number): number[] {
  const out: number[] = [];
  for (let i = 0; i <= count; i++) {
    out.push(-PLANET.ry * Math.cos((Math.PI * i) / count));
  }
  return out;
}
