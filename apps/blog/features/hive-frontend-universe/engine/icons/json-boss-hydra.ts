import { STICKER_OUTLINE } from './shared';
import { BELLY, HI, MID, SHADOW } from './json-boss-palette';
import { drawBossHeads } from './json-boss-heads';

export function drawBossHydra(ctx: CanvasRenderingContext2D, R: number, time: number, lw: number): void {
  /* ---------- THE HYDRA ---------- */
  // A tapered organic limb: circles shrinking along a quadratic curve,
  // drawn as outline pass then body pass. The illustration trick that makes
  // necks read as flesh instead of pipes.
  const limb = (
    x0: number, y0: number, cx: number, cy: number, x1: number, y1: number,
    r0: number, r1: number, fill: string, outline = true
  ) => {
    for (const pass of outline ? [0, 1] : [1]) {
      ctx.fillStyle = pass === 0 ? STICKER_OUTLINE : fill;
      const grow = pass === 0 ? lw * 0.55 : 0;
      for (let i = 0; i <= 14; i++) {
        const t = i / 14;
        const px = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
        const py = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
        ctx.beginPath();
        ctx.arc(px, py, r0 + (r1 - r0) * t + grow, 0, 6.283);
        ctx.fill();
      }
    }
  };

  /* wings first, spread HIGH behind the body: the silhouette-maker. */
  const flap = Math.sin(time * 0.9) * 0.06;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(R * 0.3, -R * 0.7);
    ctx.rotate(side * (0.32 + flap));
    const wx = (v: number) => side * R * v;
    // Membrane: darker than the necks so the layers separate, with a sick
    // green rim along the scalloped trailing edge.
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(wx(0.85), -R * 1.35, wx(1.9), -R * 1.5);
    ctx.quadraticCurveTo(wx(1.72), -R * 0.95, wx(1.38), -R * 0.6);
    ctx.quadraticCurveTo(wx(1.22), -R * 0.3, wx(0.85), -R * 0.1);
    ctx.quadraticCurveTo(wx(0.5), R * 0.04, 0, R * 0.12);
    ctx.closePath();
    const wg = ctx.createLinearGradient(0, -R * 1.4, 0, R * 0.1);
    wg.addColorStop(0, '#8a1f4d');
    wg.addColorStop(1, '#54102f');
    ctx.fillStyle = wg;
    ctx.fill();
    ctx.strokeStyle = STICKER_OUTLINE;
    ctx.lineWidth = lw * 0.9;
    ctx.stroke();
    // Wing fingers.
    ctx.strokeStyle = '#ff6fa5';
    ctx.lineWidth = lw * 0.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(wx(0.9), -R * 1.1, wx(1.9), -R * 1.5);
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(wx(0.8), -R * 0.65, wx(1.38), -R * 0.6);
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(wx(0.55), -R * 0.26, wx(0.85), -R * 0.1);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 127, 174, 0.5)';
    ctx.lineWidth = lw * 0.45;
    ctx.beginPath();
    ctx.moveTo(wx(1.9), -R * 1.5);
    ctx.quadraticCurveTo(wx(1.72), -R * 0.95, wx(1.38), -R * 0.6);
    ctx.quadraticCurveTo(wx(1.22), -R * 0.3, wx(0.85), -R * 0.1);
    ctx.stroke();
    ctx.restore();
  }
  /* tail: coiling around the rock's east edge, spade tip swinging. */
  const swish = Math.sin(time * 0.8) * R * 0.08;
  limb(R * 0.75, R * 0.2, R * 1.7, R * 0.45, R * 1.55 + swish, R * 1.35, R * 0.22, R * 0.07, MID);
  // Spade tip.
  ctx.save();
  ctx.translate(R * 1.55 + swish, R * 1.42);
  ctx.rotate(0.5 + swish / (R * 0.4));
  ctx.beginPath();
  ctx.moveTo(0, -R * 0.16);
  ctx.lineTo(R * 0.14, R * 0.06);
  ctx.lineTo(0, R * 0.2);
  ctx.lineTo(-R * 0.14, R * 0.06);
  ctx.closePath();
  ctx.fillStyle = '#c22553';
  ctx.fill();
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = lw * 0.7;
  ctx.stroke();
  ctx.restore();

  /* the body: a massive chest low on the rock, three-tone modeled. */
  ctx.beginPath();
  ctx.ellipse(R * 0.3, -R * 0.05, R * 0.95, R * 0.78, -0.08, 0, 6.283);
  const bodyG = ctx.createLinearGradient(-R * 0.6, -R * 0.6, R * 1.1, R * 0.5);
  bodyG.addColorStop(0, HI);
  bodyG.addColorStop(0.5, MID);
  bodyG.addColorStop(1, SHADOW);
  ctx.fillStyle = bodyG;
  ctx.fill();
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = lw;
  ctx.stroke();
  // A soft lighter underside catching the hoard light.
  ctx.beginPath();
  ctx.ellipse(R * 0.22, R * 0.32, R * 0.6, R * 0.34, -0.06, 0, 6.283);
  ctx.fillStyle = BELLY;
  ctx.globalAlpha = 0.32;
  ctx.fill();
  ctx.globalAlpha = 1;
  // The colon-and-quote marks branded on the chest: still made of JSON.
  ctx.fillStyle = '#ffd24a';
  ctx.beginPath();
  ctx.arc(-R * 0.12, -R * 0.18, R * 0.045, 0, 6.283);
  ctx.arc(-R * 0.12, -R * 0.02, R * 0.045, 0, 6.283);
  ctx.fill();

  /* forelegs gripping the rock's front edge, talons over the lip. */
  for (const [fx0, fx1] of [
    [-R * 0.25, -R * 0.55],
    [R * 0.55, R * 0.85]
  ] as const) {
    limb(fx0 + R * 0.3, R * 0.25, fx0, R * 0.55, fx1, R * 0.86, R * 0.17, R * 0.12, MID);
    // Three solid talons hooking over the rock lip.
    for (let t = -1; t <= 1; t++) {
      const bx2 = fx1 + t * R * 0.1;
      ctx.beginPath();
      ctx.moveTo(bx2 - R * 0.045, R * 0.84);
      ctx.quadraticCurveTo(bx2 + R * 0.06, R * 0.92, bx2 + R * 0.015, R * 1.1);
      ctx.quadraticCurveTo(bx2 - R * 0.015, R * 0.96, bx2 - R * 0.075, R * 0.9);
      ctx.closePath();
      ctx.fillStyle = '#f2e3c2';
      ctx.fill();
      ctx.strokeStyle = STICKER_OUTLINE;
      ctx.lineWidth = lw * 0.5;
      ctx.stroke();
    }
  }

  drawBossHeads(ctx, R, time, lw, limb);
}
