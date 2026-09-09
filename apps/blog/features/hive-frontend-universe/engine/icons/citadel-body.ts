import { STICKER_OUTLINE } from './shared';

/* ----------------------- witness citadels ----------------------- */

/**
 * Cached static tower bodies, keyed by energy colour.
 *
 * At map zoom the body never animates (the motes, beam, fins and pennant are
 * all detail-only), so redrawing fifteen paths per tower per frame was pure
 * waste: 21 towers measured 8.6ms of the frame. The body is rendered once in
 * NORMALISED units (height 1) and stretched to whatever height a rank needs,
 * which is why one canvas per colour serves all 21.
 */
const CITADEL_TEX_H = 200;
/** Normalised body box: x in [-0.45, 0.45], y in [-0.82, 0.06], height 1. */
export const CITADEL_BOX = { x0: -0.45, y0: -0.82, w: 0.9, h: 0.88 };
const citadelBodyCache = new Map<string, HTMLCanvasElement>();

export function citadelBody(energy: string): HTMLCanvasElement | null {
  const hit = citadelBodyCache.get(energy);
  if (hit) return hit;
  if (typeof document === 'undefined') return null;
  const texH = CITADEL_TEX_H;
  const texW = Math.round((CITADEL_BOX.w / CITADEL_BOX.h) * texH);
  const canvas = document.createElement('canvas');
  canvas.width = texW;
  canvas.height = texH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const k = texH / CITADEL_BOX.h;
  ctx.setTransform(k, 0, 0, k, -CITADEL_BOX.x0 * k, -CITADEL_BOX.y0 * k);

  const w = 0.26;
  const topW = w * 0.56;
  const shaftTop = -0.74;
  const stone = '#2a1b3d';
  const stoneLit = '#402c5c';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = 0.016;

  // Plinth.
  ctx.fillStyle = stone;
  ctx.beginPath();
  ctx.moveTo(-w * 1.6, 0);
  ctx.lineTo(-w * 1.15, -0.1);
  ctx.lineTo(w * 1.15, -0.1);
  ctx.lineTo(w * 1.6, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Shaft, two-tone so it reads as lit from one side.
  for (const side of [-1, 1]) {
    ctx.fillStyle = side < 0 ? stone : stoneLit;
    ctx.beginPath();
    ctx.moveTo(0, -0.1);
    ctx.lineTo(side * w, -0.1);
    ctx.lineTo(side * topW, shaftTop);
    ctx.lineTo(0, shaftTop);
    ctx.closePath();
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(-w, -0.1);
  ctx.lineTo(-topW, shaftTop);
  ctx.lineTo(topW, shaftTop);
  ctx.lineTo(w, -0.1);
  ctx.closePath();
  ctx.stroke();

  // Lit gallery.
  ctx.fillStyle = energy;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(-topW * 1.25, shaftTop - 0.045, topW * 2.5, 0.045);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.strokeRect(-topW * 1.25, shaftTop - 0.045, topW * 2.5, 0.045);

  citadelBodyCache.set(energy, canvas);
  return canvas;
}
