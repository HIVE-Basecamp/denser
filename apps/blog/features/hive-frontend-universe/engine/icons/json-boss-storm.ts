import { STICKER_OUTLINE } from './shared';
import { TOXIC } from './json-boss-palette';

export function drawBossHoard(
  ctx: CanvasRenderingContext2D,
  R: number,
  time: number,
  lw: number,
  hoard: number
): void {
  /* ---------- the hoard and the tribute march ---------- */
  // The mound he guards, glowing. Everything gold here fades with `hoard`:
  // once the pile is set loose (engine/keep.ts) the mound, the tribute and
  // the sky tithe go with it, and he is left on his rock with nothing.
  const mound = ctx.createRadialGradient(R * 0.1, R * 0.85, 0, R * 0.1, R * 0.85, R * 0.7);
  mound.addColorStop(0, `rgba(255, 210, 74, ${0.24 * hoard})`);
  mound.addColorStop(1, 'rgba(255, 210, 74, 0)');
  ctx.fillStyle = mound;
  ctx.beginPath();
  ctx.ellipse(R * 0.1, R * 0.88, R * 0.7, R * 0.3, 0, 0, 6.283);
  ctx.fill();
  ctx.globalAlpha = hoard;
  for (let k = 0; k < 10 * hoard; k++) {
    const hx2 = R * 0.1 + Math.sin(k * 2.7) * R * 0.45;
    const hy2 = R * (0.78 + (k % 3) * 0.08);
    ctx.beginPath();
    ctx.ellipse(hx2, hy2, R * 0.085, R * 0.048, 0, 0, 6.283);
    ctx.fillStyle = k % 2 ? '#ffd24a' : '#f0b429';
    ctx.fill();
    ctx.strokeStyle = STICKER_OUTLINE;
    ctx.lineWidth = lw * 0.5;
    ctx.stroke();
  }
  // The tribute march, still filing in from the west causeway.
  for (let k = 0; k < 6; k++) {
    const t = (time * 0.16 + k / 6) % 1;
    const px = -R * 1.9 + t * R * 1.9;
    const py = R * 1.32 - t * R * 0.45 + Math.sin(t * 12) * R * 0.02;
    ctx.globalAlpha = (t > 0.92 ? (1 - t) / 0.08 : 0.9) * hoard;
    ctx.beginPath();
    ctx.ellipse(px, py, R * 0.065, R * 0.05, 0.1, 0, 6.283);
    ctx.fillStyle = '#ffd24a';
    ctx.fill();
    ctx.strokeStyle = STICKER_OUTLINE;
    ctx.lineWidth = lw * 0.4;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // And the spiral suction above, thinned: the sky tithe.
  for (let k = 0; k < 7; k++) {
    const seed = k * 2.399963;
    const phase = (time * 0.24 + k / 7) % 1;
    const rad = R * (2.5 - phase * 2.2);
    const ang = seed + phase * 3.8;
    const tx2 = Math.cos(ang) * rad;
    const ty2 = Math.sin(ang) * rad * 0.42 + R * 0.5 * phase;
    ctx.globalAlpha = (0.2 + phase * 0.65) * hoard;
    ctx.beginPath();
    ctx.ellipse(tx2, ty2, R * 0.05, R * 0.065, ang, 0, 6.283);
    ctx.fillStyle = '#ffd24a';
    ctx.fill();
    ctx.strokeStyle = STICKER_OUTLINE;
    ctx.lineWidth = lw * 0.4;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export function drawBossStorm(ctx: CanvasRenderingContext2D, R: number, time: number, lw: number): void {
  /* ---------- lightning and the framing thorns ---------- */
  const burst = (time * 0.42) % 1;
  if (burst < 0.14) {
    const fade = 1 - burst / 0.14;
    const side = Math.floor(time * 0.42) % 2 === 0 ? 1 : -1;
    ctx.strokeStyle = TOXIC;
    ctx.globalAlpha = 0.85 * fade;
    ctx.lineWidth = lw * 0.7;
    ctx.beginPath();
    ctx.moveTo(side * R * 0.15, -R * 2.5);
    ctx.lineTo(side * R * 0.55, -R * 2.85);
    ctx.lineTo(side * R * 0.43, -R * 2.9);
    ctx.lineTo(side * R * 0.9, -R * 3.25);
    ctx.moveTo(side * R * 0.55, -R * 2.85);
    ctx.lineTo(side * R * 0.77, -R * 2.68);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * R * 1.9, R * 1.15);
    ctx.quadraticCurveTo(side * R * 1.75, R * 0.55, side * R * 1.45, R * 0.28);
    ctx.quadraticCurveTo(side * R * 1.68, R * 0.68, side * R * 1.52, R * 1.15);
    ctx.closePath();
    ctx.fillStyle = '#0b0614';
    ctx.fill();
    ctx.strokeStyle = 'rgba(124, 255, 77, 0.25)';
    ctx.lineWidth = lw * 0.4;
    ctx.stroke();
  }
}
