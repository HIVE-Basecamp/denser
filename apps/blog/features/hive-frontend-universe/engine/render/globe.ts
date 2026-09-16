/**
 * H.I.V.E.R. - squeezing the painted board onto the turning ball.
 *
 * The maths is lib/globe.ts; this is the paint. Because the turn never moves
 * anything vertically, the whole warp is axis-aligned: the board is painted
 * flat onto an off-screen sheet exactly as it always was, and then copied
 * onto the screen in horizontal rows, each row cut into columns that narrow
 * toward the limb. No clipping, no shearing, no per-pixel work, no 3D
 * engine: a few hundred plain image copies a frame.
 *
 * TWO SHEETS, because the far hemisphere is the old chain. Whichever board
 * has turned into view is read from its own sheet, and the seam between them
 * falls exactly on the limb where neither is stretched.
 *
 * WHAT STANDS OFF THE BALL (the citadels, and the ship in the south bay)
 * cannot be on the surface, so it is copied separately: one band either side,
 * closing toward the middle as the world turns. The half swinging toward you
 * passes IN FRONT of the ball, the half swinging away is cut off at the limb
 * and swallowed.
 */
import { globeRows, globeSegments, rowHalfWidth, type GlobeSegment } from '../../lib/globe';

/** How many rows the ball is cut into. Spaced by latitude, so the rim is smooth. */
const ROWS = 30;
/** How many columns a full half-turn is cut into, before merging. */
const COLUMNS = 40;
/** A copy thinner than this is merged into its neighbour, screen px. */
const MIN_SLICE = 1.1;
/** The towers fade out as they foreshorten to nothing, and are gone by edge on. */
const PIN_FADE = 0.3;

export interface Sheet {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

let sheets: { w: number; h: number; hive: Sheet; steem: Sheet } | null = null;

function makeSheet(w: number, h: number): Sheet | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  return { canvas, ctx };
}

/**
 * The two off-screen sheets, at the canvas's own size. Kept between frames
 * and rebuilt only when the window changes.
 */
export function globeSheets(W: number, H: number, DPR: number): { hive: Sheet; steem: Sheet } | null {
  const w = Math.max(1, Math.round(W * DPR));
  const h = Math.max(1, Math.round(H * DPR));
  if (sheets && sheets.w === w && sheets.h === h) return sheets;
  const hive = makeSheet(w, h);
  const steem = makeSheet(w, h);
  if (!hive || !steem) return null;
  sheets = { w, h, hive, steem };
  return sheets;
}

export interface BlitArgs {
  ctx: CanvasRenderingContext2D;
  /** The sheet each board was painted on; null when that board is out of view. */
  hive: HTMLCanvasElement | null;
  steem: HTMLCanvasElement | null;
  turn: number;
  W: number;
  H: number;
  DPR: number;
  z: number;
  camX: number;
  camY: number;
  /** Screen shake, applied to where the copies land and not to the sheets. */
  sx: number;
  sy: number;
  vx0: number;
  vx1: number;
  vy0: number;
  vy1: number;
}

/** How solid the towers standing off the ball are at this turn. */
function pinAlpha(c: number): number {
  return Math.max(0, Math.min(1, (c - 0.02) / PIN_FADE));
}

export function blitGlobe(a: BlitArgs): void {
  const { ctx, turn, W, H, DPR, z, camX, camY, sx, sy } = a;
  const segs = globeSegments(turn, COLUMNS);

  // Sheet pixels and screen px for the same world point. The sheets are
  // painted without the shake so the shake can be added here, once.
  const srcX = (w: number) => (W / 2 + (w - camX) * z) * DPR;
  const srcY = (w: number) => (H / 2 + (w - camY) * z) * DPR;
  const snap = (v: number) => Math.round(v * DPR) / DPR;
  const dstX = (w: number) => snap(W / 2 + sx + (w - camX) * z);
  const dstY = (w: number) => snap(H / 2 + sy + (w - camY) * z);

  const ys: number[] = [a.vy0];
  for (const r of globeRows(ROWS)) if (r > a.vy0 && r < a.vy1) ys.push(r);
  ys.push(a.vy1);

  const c = Math.cos(turn);
  const towers = a.hive;
  const pins = towers && c > 0.02 ? pinAlpha(c) : 0;
  // Which side of the ball the towers are swinging toward you on.
  const frontSide = Math.sin(turn) >= 0 ? 1 : -1;

  const band = (
    sheet: HTMLCanvasElement | null,
    s0: number,
    s1: number,
    dy: number,
    dh: number,
    sy0: number,
    sh: number
  ) => {
    if (!sheet || s1 - s0 < 1) return;
    const d0 = dstX(s0 * c);
    const d1 = dstX(s1 * c);
    if (d1 <= 0 || d0 >= W || d1 - d0 < 0.4) return;
    ctx.drawImage(sheet, srcX(s0), sy0, srcX(s1) - srcX(s0), sh, d0, dy, d1 - d0, dh);
  };

  for (let r = 0; r < ys.length - 1; r++) {
    const yTop = ys[r];
    const yBot = ys[r + 1];
    const dy = dstY(yTop);
    const dh = dstY(yBot) - dy;
    if (dh <= 0) continue;
    const sy0 = srcY(yTop);
    const sh = srcY(yBot) - sy0;
    const hw = rowHalfWidth((yTop + yBot) / 2);

    // THE TOWERS, the half turning away: cut off at the limb, so the ball
    // eats them as they go round.
    if (pins > 0) {
      ctx.globalAlpha = pins;
      const backSide = -frontSide;
      const cut = hw / c;
      if (backSide > 0) band(towers, Math.max(hw, cut), a.vx1, dy, dh, sy0, sh);
      else band(towers, a.vx0, Math.min(-hw, -cut), dy, dh, sy0, sh);
      ctx.globalAlpha = 1;
    }

    // THE BALL ITSELF.
    if (hw > 0) {
      for (const seg of segs) {
        const sheet = seg.base === 0 ? a.hive : a.steem;
        if (!sheet) continue;
        drawRun(ctx, sheet, seg, hw, dy, dh, sy0, sh, srcX, dstX, W);
      }
    }

    // THE TOWERS, the half turning toward you: they pass in front of the ball.
    if (pins > 0) {
      ctx.globalAlpha = pins;
      if (frontSide > 0) band(towers, hw, a.vx1, dy, dh, sy0, sh);
      else band(towers, a.vx0, -hw, dy, dh, sy0, sh);
      ctx.globalAlpha = 1;
    }
  }
}

/**
 * One row of one board, left to right. Columns thinner than a screen pixel
 * are merged as we go, which is what keeps the poles and the limb (where the
 * ball is all edge) from costing as much as the middle.
 */
function drawRun(
  ctx: CanvasRenderingContext2D,
  sheet: HTMLCanvasElement,
  seg: GlobeSegment,
  hw: number,
  dy: number,
  dh: number,
  sy0: number,
  sh: number,
  srcX: (w: number) => number,
  dstX: (w: number) => number,
  W: number
): void {
  const n = seg.view.length - 1;
  let i = 0;
  while (i < n) {
    let j = i + 1;
    let d0 = dstX(hw * seg.view[i]);
    let d1 = dstX(hw * seg.view[j]);
    while (j < n && d1 - d0 < MIN_SLICE) {
      j++;
      d1 = dstX(hw * seg.view[j]);
    }
    if (d1 - d0 >= 0.4 && d1 > 0 && d0 < W) {
      const s0 = srcX(hw * seg.local[i]);
      const s1 = srcX(hw * seg.local[j]);
      if (s1 - s0 > 0.2) ctx.drawImage(sheet, s0, sy0, s1 - s0, sh, d0, dy, d1 - d0, dh);
    }
    i = j;
    d0 = d1;
  }
}
