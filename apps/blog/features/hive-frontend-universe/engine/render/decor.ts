import type { Cube } from '../scenery';
import { CUBE_HEX } from './palette';
/** Transparent isometric-ish cube. */
export function drawCube(ctx: CanvasRenderingContext2D, c: Cube): void {
  const s = c.size;
  const col = CUBE_HEX[c.hue];
  ctx.globalAlpha = c.alpha;
  ctx.fillStyle = col;
  // top face
  ctx.beginPath();
  ctx.moveTo(c.x, c.y - s);
  ctx.lineTo(c.x + s * 0.87, c.y - s * 0.5);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(c.x - s * 0.87, c.y - s * 0.5);
  ctx.closePath();
  ctx.fill();
  // left face, darker
  ctx.globalAlpha = c.alpha * 0.6;
  ctx.beginPath();
  ctx.moveTo(c.x - s * 0.87, c.y - s * 0.5);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(c.x, c.y + s * 0.9);
  ctx.lineTo(c.x - s * 0.87, c.y + s * 0.4);
  ctx.closePath();
  ctx.fill();
  // right face, darkest
  ctx.globalAlpha = c.alpha * 0.4;
  ctx.beginPath();
  ctx.moveTo(c.x + s * 0.87, c.y - s * 0.5);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(c.x, c.y + s * 0.9);
  ctx.lineTo(c.x + s * 0.87, c.y + s * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

/**
 * A breathing beacon around a landmark: soft radial glow plus one pulsing
 * ring, both sized from the landmark's drawn size `s`. `rgb` is the glow
 * as "r, g, b"; `hex` the ring.
 */
export function drawBeacon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  z: number,
  phase: number,
  rgb: string,
  hex: string
): void {
  const fb = 0.5 + Math.sin(phase * 2.2) * 0.5;
  const br = s * 1.7;
  const bg = ctx.createRadialGradient(x, y, s * 0.6, x, y, br);
  bg.addColorStop(0, `rgba(${rgb}, ${(0.2 + fb * 0.14).toFixed(3)})`);
  bg.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(x, y, br, 0, 6.283);
  ctx.fill();
  ctx.strokeStyle = hex;
  ctx.globalAlpha = 0.35 + fb * 0.5;
  ctx.lineWidth = 3 / Math.max(z, 0.1);
  ctx.beginPath();
  ctx.arc(x, y, s * 1.25 + fb * s * 0.08, 0, 6.283);
  ctx.stroke();
  ctx.globalAlpha = 1;
}
