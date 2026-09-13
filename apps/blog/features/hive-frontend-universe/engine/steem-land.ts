/**
 * H.I.V.E.R. - painting the Steem land. The numbers are in lib/steem-side.ts.
 *
 * The back of the planet: the real Steem mark, in Steem's blue, as a slab
 * of land the way the Hive mark is the front's. Busted: pieces missing
 * (one even-odd fill cuts them all), cracks down to the sea, chipped
 * coasts, and the rubble lying where it fell. Drawn as vectors at every
 * zoom so the coast stays crisp up close; only the soft things (the slab's
 * shadow on the sea and its cold glow) are baked once and blitted.
 *
 * Never mirrored: the caller draws this un-mirrored on the back
 * (engine/render/layer-steem.ts), the same care the Hive mark gets.
 */
import {
  STEEM_BITES,
  STEEM_CRACKS,
  STEEM_FRAGMENTS,
  STEEM_LAND,
  STEEM_MARK_CENTRE,
  STEEM_MARK_PATH,
  STEEM_VIEW,
  steemLandBox
} from '../lib/steem-side';

/** Steem's blue, as the coin icon wears it. */
export const STEEM_BLUE = '#4BA2F2';
const STEEM_LIT = '#bfe0ff';
const STEEM_SHADE = '#2c6fb5';
const STEEM_DEEP = '#123a66';
/** Cracks go down to the sea. */
const SEA_DARK = 'rgba(5, 10, 26, 0.92)';
/** Baked textures: the mark's box at this many px per unit. */
const TEX_PX_PER_UNIT = 20;

type Poly = readonly (readonly [number, number])[];

function polyPath(polys: readonly Poly[], into = new Path2D()): Path2D {
  for (const poly of polys) {
    poly.forEach(([x, y], i) => (i === 0 ? into.moveTo(x, y) : into.lineTo(x, y)));
    into.closePath();
  }
  return into;
}

let cache: {
  mark: Path2D;
  /** The mark with its missing pieces: fill or clip it even-odd. */
  land: Path2D;
  bites: Path2D;
  fragments: Path2D;
  shadow: HTMLCanvasElement | null;
  glow: HTMLCanvasElement | null;
} | null = null;

/** The blurred silhouette of the land, in one colour. Built once. */
function bakeSilhouette(land: Path2D, mark: Path2D, color: string, blur: number): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = STEEM_VIEW.w * TEX_PX_PER_UNIT;
  canvas.height = STEEM_VIEW.h * TEX_PX_PER_UNIT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(TEX_PX_PER_UNIT, TEX_PX_PER_UNIT);
  ctx.filter = `blur(${blur}px)`;
  ctx.fillStyle = color;
  ctx.save();
  ctx.clip(mark);
  ctx.fill(land, 'evenodd');
  ctx.restore();
  ctx.filter = 'none';
  return canvas;
}

function paths(): NonNullable<typeof cache> | null {
  if (cache) return cache;
  if (typeof Path2D === 'undefined') return null;
  const mark = new Path2D(STEEM_MARK_PATH);
  const land = new Path2D(STEEM_MARK_PATH);
  polyPath(STEEM_BITES, land);
  cache = {
    mark,
    land,
    bites: polyPath(STEEM_BITES),
    fragments: polyPath(STEEM_FRAGMENTS),
    shadow: bakeSilhouette(land, mark, '#07101f', 6),
    glow: bakeSilhouette(land, mark, STEEM_BLUE, 9)
  };
  return cache;
}

function strokePolylines(ctx: CanvasRenderingContext2D, lines: readonly Poly[]): void {
  ctx.beginPath();
  for (const line of lines) {
    line.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  }
  ctx.stroke();
}

/**
 * A stroke width in the mark's units that is `screenPx` wide on screen,
 * held between a floor and a ceiling so the edges and cracks are neither
 * hairlines on the pulled-out map nor bands up close.
 */
function width(screenPx: number, z: number, floor: number, ceiling: number): number {
  return Math.min(ceiling, Math.max(floor, screenPx / (Math.max(z, 0.01) * STEEM_LAND.unit)));
}

/**
 * The Steem land, in world space. `mapness` is 0 at play zoom and 1 on the
 * pulled-out map; the glow comes up with it so the back reads from afar.
 * `z` is the camera zoom, for the line weights.
 */
export function drawSteemLand(ctx: CanvasRenderingContext2D, mapness: number, z: number): void {
  const p = paths();
  if (!p) return;
  const box = steemLandBox();
  const { x, y, unit } = STEEM_LAND;
  const chipW = width(10, z, 0.05, 0.26);
  const rimW = width(3, z, 0.02, 0.1);
  const crackW = width(6, z, 0.04, 0.16);

  // The slab's shadow on the sea, offset like the Hive land's (light from
  // the upper left), then its cold glow under the coast.
  if (p.shadow) {
    ctx.globalAlpha = 0.6;
    ctx.drawImage(p.shadow, box.x + 90, box.y + 150, box.w, box.h);
  }
  if (p.glow) {
    ctx.globalAlpha = 0.22 + 0.2 * mapness;
    ctx.drawImage(p.glow, box.x, box.y, box.w, box.h);
  }
  ctx.globalAlpha = 1;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(unit, unit);
  ctx.translate(-STEEM_MARK_CENTRE.x, -STEEM_MARK_CENTRE.y);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // THE LAND: the mark less its missing pieces. Clipped to the mark first so
  // a bite that reaches past the coast cuts the coast and nothing else.
  ctx.save();
  ctx.clip(p.mark);
  ctx.clip(p.land, 'evenodd');
  const lit = ctx.createLinearGradient(6, 5, 27, 27);
  lit.addColorStop(0, '#6db8f7');
  lit.addColorStop(0.5, STEEM_BLUE);
  lit.addColorStop(1, STEEM_SHADE);
  ctx.fillStyle = lit;
  ctx.fillRect(0, 0, STEEM_VIEW.w, STEEM_VIEW.h);
  // Dust: the dead land is dull toward its lower right, where the night is.
  const dust = ctx.createRadialGradient(10, 9, 2, 16, 16, 18);
  dust.addColorStop(0, 'rgba(18, 58, 102, 0)');
  dust.addColorStop(1, 'rgba(18, 58, 102, 0.55)');
  ctx.fillStyle = dust;
  ctx.fillRect(0, 0, STEEM_VIEW.w, STEEM_VIEW.h);
  // Chipped coasts: a dark dashed edge inside every rim, bite rims included.
  ctx.strokeStyle = STEEM_DEEP;
  ctx.lineWidth = chipW;
  ctx.setLineDash([chipW * 2.1, chipW * 1.15]);
  ctx.globalAlpha = 0.7;
  ctx.stroke(p.land);
  ctx.setLineDash([]);
  // The broken edges catch the light.
  ctx.strokeStyle = STEEM_LIT;
  ctx.lineWidth = rimW;
  ctx.globalAlpha = 0.55;
  ctx.stroke(p.land);
  ctx.globalAlpha = 1;
  // Cracks, down to the sea.
  ctx.strokeStyle = SEA_DARK;
  ctx.lineWidth = crackW;
  strokePolylines(ctx, STEEM_CRACKS);
  ctx.restore();

  // THE RUBBLE: the pieces that fell off, each with its own small shadow.
  ctx.save();
  ctx.translate(0.14, 0.22);
  ctx.fillStyle = 'rgba(7, 16, 31, 0.6)';
  ctx.fill(p.fragments);
  ctx.restore();
  ctx.fillStyle = STEEM_SHADE;
  ctx.fill(p.fragments);
  ctx.strokeStyle = STEEM_LIT;
  ctx.lineWidth = width(2, z, 0.015, 0.06);
  ctx.globalAlpha = 0.6;
  ctx.stroke(p.fragments);
  ctx.globalAlpha = 1;

  ctx.restore();
}
