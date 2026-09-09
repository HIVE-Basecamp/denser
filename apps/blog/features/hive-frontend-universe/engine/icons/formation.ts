import { STICKER_OUTLINE } from './shared';

/* ----------------------- rock formations ----------------------- */

/**
 * Crystal palettes for the rock formations. Cool mineral bodies with hot lit
 * tips, so the terrain reads as a space base rather than a meadow.
 */
const CRYSTAL = [
  { body: '#2b3f7a', lit: '#7fb4ff', tip: '#cfe6ff' },
  { body: '#4a2a6b', lit: '#b98cff', tip: '#e8d6ff' },
  { body: '#0f4a52', lit: '#54dbd0', tip: '#c2fff7' },
  { body: '#5e2340', lit: '#ff86b0', tip: '#ffd4e4' },
  { body: '#5a3a12', lit: '#ffbf4d', tip: '#ffe9b8' }
];

/**
 * A clutch of spiky shards standing on the ground. Drawn chunky: thick dark
 * outline, flat body, one lit face, and a glowing tip that breathes.
 *
 * `h` is the tallest shard's height and `phase` fixes the clutch's shape, so a
 * formation looks identical every frame and every window.
 */
export function drawFormation(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  h: number,
  shards: number,
  hue: number,
  phase: number,
  lean: number,
  time: number
): void {
  const pal = CRYSTAL[hue % CRYSTAL.length];
  const lw = Math.max(1.5, h * 0.045);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.lineJoin = 'round';

  // Ground shadow pool, so the clutch sits on the terrain.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
  ctx.beginPath();
  ctx.ellipse(0, 0, h * 0.5, h * 0.15, 0, 0, 6.283);
  ctx.fill();

  for (let i = 0; i < shards; i++) {
    // Fan the shards out from the centre, tallest in the middle.
    const t = shards === 1 ? 0.5 : i / (shards - 1);
    const spread = (t - 0.5) * h * 0.62;
    const tall = h * (0.45 + 0.55 * Math.sin(Math.PI * t) + 0.16 * Math.sin(phase + i * 2.1));
    const halfW = Math.max(4, tall * (0.17 + 0.06 * Math.sin(phase + i)));
    const tipX = spread + Math.sin(phase + i * 1.7) * tall * 0.12;

    // Body.
    ctx.beginPath();
    ctx.moveTo(spread - halfW, 0);
    ctx.lineTo(tipX, -tall);
    ctx.lineTo(spread + halfW, 0);
    ctx.closePath();
    ctx.fillStyle = pal.body;
    ctx.fill();
    ctx.strokeStyle = STICKER_OUTLINE;
    ctx.lineWidth = lw;
    ctx.stroke();

    // Lit face: the right half, so the whole field is lit from one side.
    ctx.beginPath();
    ctx.moveTo(tipX, -tall);
    ctx.lineTo(spread + halfW, 0);
    ctx.lineTo(spread + halfW * 0.15, 0);
    ctx.closePath();
    ctx.fillStyle = pal.lit;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Breathing tip glow. Kept small and tinted to the crystal rather than
    // white: at a wider radius and near-white it read as fog sitting over the
    // terrain instead of as a lit point.
    const beat = 0.55 + Math.sin(time * 1.4 + phase + i) * 0.45;
    const g = ctx.createRadialGradient(tipX, -tall, 0, tipX, -tall, tall * 0.2);
    g.addColorStop(0, pal.tip);
    g.addColorStop(0.45, pal.lit);
    g.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.globalAlpha = 0.16 + beat * 0.3;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(tipX, -tall, tall * 0.3, 0, 6.283);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
