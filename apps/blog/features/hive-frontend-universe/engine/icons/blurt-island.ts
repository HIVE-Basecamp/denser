import { STICKER_OUTLINE } from './shared';

/**
 * THE BLURT ISLAND: the other fork, drawn as its own mark the way the
 * Steem land is drawn as Steem's: the orange ball with the black band, the
 * two wide eyes and the raised brows, the wordmark in the band, a slab of
 * rock under it so it reads as an island and not a sticker on the sea.
 * Never mirrored: the caller draws it un-mirrored on the back.
 */
const BLURT_ORANGE = '#ff6a14';
const BLURT_SHADE = '#d9530c';
const BLURT_BLACK = '#0b0b0b';
/** The wordmark, as the logo spells it. Real letters, so a real sans. */
const BLURT_WORD = 'B!URT';
const BLURT_FONT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export function drawBlurtIsland(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  R: number,
  time: number,
  /** Screen px per world px; the wordmark stays home below legibility. */
  z: number
): void {
  const lw = Math.max(3, R * 0.04);
  ctx.save();
  ctx.translate(x, y);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // The slab's shadow on the sea, then the rock the ball sits in.
  const shadow = ctx.createRadialGradient(R * 0.12, R * 0.2, R * 0.6, R * 0.12, R * 0.2, R * 1.35);
  shadow.addColorStop(0, 'rgba(7, 16, 31, 0.55)');
  shadow.addColorStop(1, 'rgba(7, 16, 31, 0)');
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.arc(R * 0.12, R * 0.2, R * 1.35, 0, 6.283);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, R * 0.1, R * 1.06, 0, 6.283);
  ctx.fillStyle = '#2a2338';
  ctx.fill();
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = lw;
  ctx.stroke();

  // The ball, lit from the upper left.
  const ball = ctx.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.1, 0, 0, R * 1.05);
  ball.addColorStop(0, '#ff8a3d');
  ball.addColorStop(0.6, BLURT_ORANGE);
  ball.addColorStop(1, BLURT_SHADE);
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, 6.283);
  ctx.fillStyle = ball;
  ctx.fill();
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = lw;
  ctx.stroke();

  // The black band across the lower half, and the word in it.
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, 6.283);
  ctx.clip();
  ctx.fillStyle = BLURT_BLACK;
  ctx.fillRect(-R, R * 0.16, R * 2, R * 0.56);
  if (R * z >= 22) {
    ctx.font = `800 ${R * 0.36}px ${BLURT_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(BLURT_WORD, 0, R * 0.45);
  }
  ctx.restore();

  // The eyes: wide whites, pupils looking down and left together, a
  // catchlight each, and a raised brow over each one.
  const dart = Math.sin(time * 0.7) * R * 0.02;
  for (const side of [-1, 1]) {
    const ex = side * R * 0.36;
    const ey = -R * 0.18;
    ctx.beginPath();
    ctx.ellipse(ex, ey, R * 0.2, R * 0.24, 0, 0, 6.283);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = BLURT_BLACK;
    ctx.lineWidth = R * 0.05;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ex - R * 0.03 + dart, ey + R * 0.05, R * 0.13, 0, 6.283);
    ctx.fillStyle = BLURT_BLACK;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex - R * 0.07 + dart, ey - R * 0.01, R * 0.045, 0, 6.283);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(ex - side * R * 0.16, ey - R * 0.36);
    ctx.quadraticCurveTo(ex, ey - R * 0.5, ex + side * R * 0.16, ey - R * 0.38);
    ctx.strokeStyle = BLURT_BLACK;
    ctx.lineWidth = R * 0.06;
    ctx.stroke();
  }

  // The gleam on the top left of the ball.
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.84, Math.PI * 1.12, Math.PI * 1.3);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = R * 0.05;
  ctx.stroke();
  ctx.restore();
}
