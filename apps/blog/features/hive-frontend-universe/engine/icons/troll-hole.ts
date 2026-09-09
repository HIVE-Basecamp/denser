import { STICKER_OUTLINE } from './shared';

/* ----------------------- the Mighty J SON ----------------------- */

/**
 * A TROLL HOLE: one mouth of the Mighty J SON's network, sunk into the
 * terrain. A dark pit ringed with cracked ground, breathing a sickly violet
 * glow, with two curly-brace fangs at the rim: the mark of J SON.
 */
export function drawTrollHole(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number
): void {
  const R = 120;
  ctx.save();
  ctx.translate(x, y);
  // Cracked ground ring.
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = 7;
  ctx.lineJoin = 'round';
  ctx.fillStyle = '#1b0f26';
  ctx.beginPath();
  for (let k = 0; k <= 12; k++) {
    const a = (k / 12) * 6.283;
    const rr = R * (1 + 0.12 * Math.sin(a * 3 + 1.3));
    const px = Math.cos(a) * rr;
    const py = Math.sin(a) * rr * 0.62;
    if (k === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // The breathing violet glow inside.
  const breath = 0.5 + Math.sin(time * 1.1 + x * 0.001) * 0.5;
  const g = ctx.createRadialGradient(0, 0, 6, 0, 0, R * 0.8);
  g.addColorStop(0, 'rgba(190, 120, 255, ' + (0.35 + breath * 0.35).toFixed(3) + ')');
  g.addColorStop(1, 'rgba(90, 40, 140, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, R * 0.8, R * 0.5, 0, 0, 6.283);
  ctx.fill();
  // The brace fangs: { } carved at the rim.
  ctx.strokeStyle = '#c98bff';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * R * 0.52, -R * 0.34);
    ctx.quadraticCurveTo(side * R * 0.28, -R * 0.3, side * R * 0.3, -R * 0.1);
    ctx.quadraticCurveTo(side * R * 0.32, R * 0.02, side * R * 0.16, R * 0.05);
    ctx.quadraticCurveTo(side * R * 0.32, R * 0.08, side * R * 0.3, R * 0.2);
    ctx.quadraticCurveTo(side * R * 0.28, R * 0.42, side * R * 0.52, R * 0.46);
    ctx.stroke();
  }
  ctx.restore();
}
