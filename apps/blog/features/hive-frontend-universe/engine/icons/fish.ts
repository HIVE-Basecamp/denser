/* ----------------------- the tier fish ----------------------- */

/**
 * A simple fish silhouette: body, tail, eye. `dir` is +1 to face right,
 * -1 to face left. These are scenery only, drawn dim in the open water.
 */
export function drawFish(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  dir: number,
  alpha: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-size * 0.9, 0);
  ctx.quadraticCurveTo(-size * 0.3, -size * 0.55, size * 0.45, -size * 0.12);
  ctx.quadraticCurveTo(size * 0.7, 0, size * 0.45, size * 0.12);
  ctx.quadraticCurveTo(-size * 0.3, size * 0.55, -size * 0.9, 0);
  ctx.closePath();
  ctx.fill();
  // tail
  ctx.beginPath();
  ctx.moveTo(-size * 0.85, 0);
  ctx.lineTo(-size * 1.25, -size * 0.35);
  ctx.lineTo(-size * 1.25, size * 0.35);
  ctx.closePath();
  ctx.fill();
  // eye
  ctx.globalAlpha = Math.min(1, alpha * 2.4);
  ctx.fillStyle = '#04070f';
  ctx.beginPath();
  ctx.arc(size * 0.32, -size * 0.03, Math.max(1.4, size * 0.07), 0, 6.283);
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
}
