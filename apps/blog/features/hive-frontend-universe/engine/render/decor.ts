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

/**
 * The colours a first post's confetti is thrown in. The same rainbow idea as
 * the feed's neon ring (`features/basecamp/postcard/first-post-confetti.tsx`),
 * written out as flat hex because the map's canvas has no CSS to lean on.
 */
const CONFETTI_HEX = ['#ff6fb1', '#ffd24a', '#5df0ff', '#b6f36b', '#b79cff', '#ff8a3d'];
/** One volley, start to gone, in seconds. */
const CONFETTI_CYCLE_S = 2.2;
const CONFETTI_PIECES = 16;

/**
 * Confetti popping over a first ever post, on the map.
 *
 * The feed throws real DOM confetti at a first post; out here the same welcome
 * has to be drawn by hand every frame, so a volley is worked out from the
 * clock rather than remembered: which volley we are in is the time divided by
 * the cycle, and every piece's angle, reach and colour comes from that volley
 * number. Nothing is stored, nothing accumulates, and the same post pops the
 * same way on two machines at the same moment.
 */
export function drawConfettiPop(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  z: number,
  timeSec: number,
  seed: number
): void {
  const volley = Math.floor(timeSec / CONFETTI_CYCLE_S);
  // How far through this volley we are, 0 to 1.
  const t = (timeSec % CONFETTI_CYCLE_S) / CONFETTI_CYCLE_S;
  // Pieces fly out fast and slow down, the way thrown paper does.
  const reach = 1 - Math.pow(1 - t, 2.4);
  // They are whole for most of the flight, then gone in the last quarter.
  const fade = t < 0.72 ? 1 : 1 - (t - 0.72) / 0.28;
  const size = Math.max(1.6, (s * 0.2) / Math.max(z, 0.35));
  for (let i = 0; i < CONFETTI_PIECES; i++) {
    // A cheap repeatable scramble: the piece, the post and the volley.
    const n = Math.sin((i + 1) * 12.9898 + seed * 78.233 + volley * 43.758) * 43758.5453;
    const r = n - Math.floor(n);
    const angle = (i / CONFETTI_PIECES) * 6.283 + r * 0.9;
    const dist = s * (1.1 + r * 2.4) * reach;
    const px = x + Math.cos(angle) * dist;
    const py = y + Math.sin(angle) * dist + s * reach * 0.6; // a little fall
    ctx.fillStyle = CONFETTI_HEX[(i + volley) % CONFETTI_HEX.length];
    ctx.globalAlpha = fade * (0.55 + r * 0.45);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle + t * 6);
    ctx.fillRect(-size / 2, -size / 2, size, size * 0.6);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}
