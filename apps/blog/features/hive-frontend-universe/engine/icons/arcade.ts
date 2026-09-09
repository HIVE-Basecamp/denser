import { STICKER_OUTLINE, roundRect } from './shared';

export function drawArcade(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  R: number,
  col: string,
  time: number
): void {
  const lw = Math.max(4, R * 0.07);
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';

  const W = R * 1.5; // cabinet width
  const left = x - W / 2;

  // Cabinet body: one tall rounded slab in flat cabinet red.
  ctx.fillStyle = '#d8365a';
  roundRect(ctx, left, y - R * 1.18, W, R * 2.32, R * 0.16);
  ctx.fill();
  ctx.stroke();

  // Side panel highlight, so the slab reads as a three dimensional cabinet
  // without resorting to gradients.
  ctx.fillStyle = '#ef5c7c';
  roundRect(ctx, left + W * 0.06, y - R * 1.1, W * 0.16, R * 2.14, R * 0.1);
  ctx.fill();

  // Marquee header: rounded, bright, with a colour stripe across it.
  const mY = y - R * 1.1;
  const mH = R * 0.44;
  ctx.fillStyle = '#ffd75e';
  roundRect(ctx, left + W * 0.04, mY, W * 0.92, mH, R * 0.13);
  ctx.fill();
  ctx.stroke();
  const stripe = ['#ff4d6d', '#ffa63d', '#48d17a', '#3fb6ff'];
  const sw = (W * 0.84) / stripe.length;
  for (let i = 0; i < stripe.length; i++) {
    ctx.fillStyle = stripe[i];
    ctx.fillRect(left + W * 0.08 + i * sw, mY + mH * 0.58, sw, mH * 0.26);
  }
  ctx.strokeRect(left + W * 0.08, mY + mH * 0.58, W * 0.84, mH * 0.26);

  // The screen: dark bezel, then a tiny wavy landscape inside it.
  const scX = left + W * 0.11;
  const scY = y - R * 0.54;
  const scW = W * 0.78;
  const scH = R * 0.78;
  ctx.fillStyle = '#140a1c';
  roundRect(ctx, scX - lw, scY - lw, scW + lw * 2, scH + lw * 2, R * 0.08);
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  ctx.rect(scX, scY, scW, scH);
  ctx.clip();
  // Sky.
  ctx.fillStyle = '#5fd0ff';
  ctx.fillRect(scX, scY, scW, scH);
  // Two green hill bands, gently waving.
  for (let band = 0; band < 2; band++) {
    ctx.fillStyle = band === 0 ? '#43c268' : '#2c9c4c';
    ctx.beginPath();
    ctx.moveTo(scX, scY + scH);
    const baseY = scY + scH * (0.52 + band * 0.22);
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const px = scX + t * scW;
      const py = baseY + Math.sin(t * 6.283 * 1.5 + time * 0.9 + band * 2) * scH * 0.09;
      if (i === 0) ctx.lineTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.lineTo(scX + scW, scY + scH);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Control deck: an angled shelf with two joysticks and rows of buttons.
  const dY = y + R * 0.42;
  ctx.fillStyle = '#2b1730';
  roundRect(ctx, left + W * 0.02, dY, W * 0.96, R * 0.42, R * 0.08);
  ctx.fill();
  ctx.stroke();
  for (const side of [-1, 1]) {
    const jx = x + side * W * 0.3;
    // Stick.
    ctx.strokeStyle = STICKER_OUTLINE;
    ctx.lineWidth = lw * 1.1;
    ctx.beginPath();
    ctx.moveTo(jx, dY + R * 0.26);
    ctx.lineTo(jx + side * R * 0.05, dY - R * 0.1);
    ctx.stroke();
    // Red ball on top.
    ctx.beginPath();
    ctx.arc(jx + side * R * 0.05, dY - R * 0.15, R * 0.11, 0, 6.283);
    ctx.fillStyle = '#ff3b57';
    ctx.fill();
    ctx.lineWidth = lw * 0.8;
    ctx.stroke();
  }
  // Button rows: small yellow and blue.
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 3; i++) {
      const bx = x - W * 0.1 + i * R * 0.15;
      const by = dY + R * 0.12 + row * R * 0.16;
      ctx.beginPath();
      ctx.arc(bx, by, R * 0.05, 0, 6.283);
      ctx.fillStyle = row === 0 ? '#ffd75e' : '#3fb6ff';
      ctx.fill();
      ctx.lineWidth = lw * 0.5;
      ctx.stroke();
    }
  }

  // Coin slot and a dark base plinth.
  ctx.fillStyle = '#140a1c';
  ctx.fillRect(x - R * 0.06, y + R * 0.95, R * 0.12, R * 0.05);
  ctx.fillStyle = '#7d1c33';
  roundRect(ctx, left + W * 0.06, y + R * 1.06, W * 0.88, R * 0.16, R * 0.05);
  ctx.fill();
  ctx.lineWidth = lw;
  ctx.stroke();

  // Sparkles floating around the cabinet: four-point stars, gently twinkling.
  const spark = [
    [-0.72, -1.12, 0.075],
    [0.74, -0.92, 0.06],
    [-0.78, 0.3, 0.055],
    [0.8, 0.55, 0.07],
    [0.1, -1.3, 0.065]
  ];
  ctx.strokeStyle = '#fff3b0';
  for (let i = 0; i < spark.length; i++) {
    const [sxr, syr, sr] = spark[i];
    const tw = 0.45 + Math.sin(time * 2.4 + i * 1.7) * 0.55;
    const sx = x + sxr * R;
    const sy = y + syr * R;
    const rr = sr * R * (0.7 + tw * 0.5);
    ctx.globalAlpha = 0.35 + tw * 0.65;
    ctx.lineWidth = Math.max(1.5, R * 0.028);
    ctx.beginPath();
    ctx.moveTo(sx - rr, sy);
    ctx.lineTo(sx + rr, sy);
    ctx.moveTo(sx, sy - rr);
    ctx.lineTo(sx, sy + rr);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
