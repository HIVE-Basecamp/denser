import { STICKER_OUTLINE } from './shared';

/**
 * How fast the DHF ferris wheel turns, radians per second. Exported because
 * the RIDE in canvas-map.tsx must move the bug with the drawn gondola, so the
 * drawing and the ride share this one number. 0.45 makes a full rotation (the
 * ride that earns a breath of air) take about 14 seconds.
 */
export const FERRIS_SPIN = 0.45;

/** Fairground colours for the DHF Fun Park gondolas. */
const GONDOLA_HEX = ['#ff4d6d', '#ffd75e', '#48d17a', '#3fb6ff', '#ff9d4d', '#c77dff'];

/* --------------- the destination-world structures --------------- */

export function drawFerris(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  R: number,
  col: string,
  time: number
): void {
  // Chunky sticker ferris wheel: fat dark outlines, flat bright fills.
  const lw = Math.max(4, R * 0.09);
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = lw;
  // Legs: a filled A-frame.
  ctx.beginPath();
  ctx.moveTo(x - R * 0.72, y + R * 1.18);
  ctx.lineTo(x, y + R * 0.05);
  ctx.lineTo(x + R * 0.72, y + R * 1.18);
  ctx.lineTo(x + R * 0.45, y + R * 1.18);
  ctx.lineTo(x, y + R * 0.36);
  ctx.lineTo(x - R * 0.45, y + R * 1.18);
  ctx.closePath();
  ctx.fillStyle = '#8f76d6';
  ctx.fill();
  ctx.stroke();
  // Rim: dark fat ring, then a flat violet band inside it.
  ctx.beginPath();
  ctx.arc(x, y, R, 0, 6.283);
  ctx.lineWidth = lw * 1.7;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, R, 0, 6.283);
  ctx.strokeStyle = col;
  ctx.lineWidth = lw * 0.9;
  ctx.stroke();
  // Spokes and cars.
  const rot = time * FERRIS_SPIN;
  for (let i = 0; i < 8; i++) {
    const a = rot + (i * 6.283) / 8;
    const cx = x + Math.cos(a) * R;
    const cy = y + Math.sin(a) * R;
    ctx.strokeStyle = col;
    ctx.lineWidth = lw * 0.65;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    // Gondolas: flat pods in mixed fairground colours, each with the dark
    // outline, hanging below the rim and always swinging level.
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy + R * 0.09);
    ctx.strokeStyle = STICKER_OUTLINE;
    ctx.lineWidth = lw * 0.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy + R * 0.17, R * 0.13, 0, 6.283);
    ctx.fillStyle = GONDOLA_HEX[i % GONDOLA_HEX.length];
    ctx.fill();
    ctx.strokeStyle = STICKER_OUTLINE;
    ctx.lineWidth = lw * 0.7;
    ctx.stroke();
  }
  // Hub.
  ctx.beginPath();
  ctx.arc(x, y, R * 0.16, 0, 6.283);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = lw * 0.8;
  ctx.stroke();
}
