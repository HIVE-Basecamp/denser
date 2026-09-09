/**
 * Small things shared by the code-drawn places: the outline colour every
 * chunky sticker uses, the monospace stack for the few lettered glyphs, and
 * the rounded-rectangle path helper.
 */

/** The sticker outline colour shared by the chunky code-drawn places. */
export const STICKER_OUTLINE = '#160f1d';

/** Monospace stack for the few glyphs drawn inside icons. */
export const ICON_MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/** Rounded rectangle path helper for the chunky sticker places. */
export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}
