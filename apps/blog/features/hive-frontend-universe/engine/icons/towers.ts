import { STICKER_OUTLINE } from './shared';

/**
 * WITTY WORLD, redesigned from Bryan's board-game photo briefs (pass 21).
 * The old three grey-violet slabs were the original placeholder; this is a
 * CARNIVAL CITADEL: a rainbow ring rising behind five candy-coloured towers
 * with striped cone roofs and waving pennants, bunting strung between them,
 * and an observatory dome with a slowly sweeping telescope on the tallest,
 * because witnesses WATCH the chain. Chunky sticker rules throughout.
 */
export function drawTowers(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  R: number,
  _col: string,
  time: number
): void {
  const lw = Math.max(4, R * 0.07);
  ctx.save();
  ctx.translate(x, y);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // THE RAINBOW RING: concentric colour arcs rising behind the skyline like
  // a fairground sunrise (the Innovacion socket-ring photo). Low alpha so
  // it reads as backdrop, not subject.
  const ringCols = ['#FF5C8A', '#FFC24D', '#5BE39C', '#5CA8FF', '#B79CFF'];
  for (let k = 0; k < ringCols.length; k++) {
    ctx.strokeStyle = ringCols[k];
    ctx.globalAlpha = 0.34;
    ctx.lineWidth = R * 0.09;
    ctx.beginPath();
    ctx.arc(0, R * 0.28, R * (1.42 - k * 0.1), Math.PI * 1.06, Math.PI * 1.94);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // The five towers: center tallest, candy colours, cone roofs contrasting.
  const towers = [
    { dx: -R * 0.88, h: R * 0.82, w: R * 0.3, body: '#5EE9D5', roof: '#FF5C8A' },
    { dx: -R * 0.45, h: R * 1.14, w: R * 0.32, body: '#FFC24D', roof: '#5CA8FF' },
    { dx: 0, h: R * 1.52, w: R * 0.38, body: '#B79CFF', roof: '#FFC24D' },
    { dx: R * 0.45, h: R * 1.06, w: R * 0.32, body: '#FF90AE', roof: '#5BE39C' },
    { dx: R * 0.88, h: R * 0.9, w: R * 0.3, body: '#5BE39C', roof: '#B79CFF' }
  ];
  // BUNTING between the tower tops first, so the ropes hang behind bodies.
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = lw * 0.45;
  for (let i = 0; i + 1 < towers.length; i++) {
    const a = towers[i];
    const b = towers[i + 1];
    const ax = a.dx;
    const ay = -a.h + R * 0.06;
    const bx = b.dx;
    const by = -b.h + R * 0.06;
    const mx = (ax + bx) / 2;
    const my = Math.max(ay, by) + R * 0.16;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.quadraticCurveTo(mx, my, bx, by);
    ctx.stroke();
    // Little triangle flags riding the rope.
    for (let f = 1; f <= 3; f++) {
      const t = f / 4;
      const px = (1 - t) * (1 - t) * ax + 2 * (1 - t) * t * mx + t * t * bx;
      const py = (1 - t) * (1 - t) * ay + 2 * (1 - t) * t * my + t * t * by;
      ctx.fillStyle = ringCols[(i * 3 + f) % ringCols.length];
      ctx.beginPath();
      ctx.moveTo(px - R * 0.045, py);
      ctx.lineTo(px + R * 0.045, py);
      ctx.lineTo(px, py + R * 0.1);
      ctx.closePath();
      ctx.fill();
    }
  }
  for (let i = 0; i < towers.length; i++) {
    const tw = towers[i];
    // Body.
    ctx.strokeStyle = STICKER_OUTLINE;
    ctx.lineWidth = lw;
    ctx.fillStyle = tw.body;
    ctx.fillRect(tw.dx - tw.w / 2, -tw.h, tw.w, tw.h + R * 0.3);
    ctx.strokeRect(tw.dx - tw.w / 2, -tw.h, tw.w, tw.h + R * 0.3);
    // One white stripe band across the middle, circus-tent style.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillRect(tw.dx - tw.w / 2, -tw.h * 0.52, tw.w, R * 0.11);
    // Lit windows, a blinking few.
    const rows = i === 2 ? 4 : 3;
    for (let r = 0; r < rows; r++) {
      const blinker = (r * 5 + i) % 4 === 0;
      const on = !blinker || Math.sin(time * 2.1 + i * 1.7 + r) > -0.3;
      ctx.fillStyle = on ? '#FFEDC2' : '#3a2f5e';
      ctx.fillRect(tw.dx - tw.w * 0.17, -tw.h + R * 0.14 + r * R * 0.26, tw.w * 0.34, R * 0.13);
    }
    if (i === 2) {
      // THE OBSERVATORY: a white dome with a slit and a telescope sweeping
      // slowly over the world. The watchers' tower.
      ctx.beginPath();
      ctx.arc(tw.dx, -tw.h, tw.w * 0.72, Math.PI, 0);
      ctx.fillStyle = '#f2f5fb';
      ctx.fill();
      ctx.strokeStyle = STICKER_OUTLINE;
      ctx.lineWidth = lw;
      ctx.stroke();
      ctx.fillStyle = '#3a2f5e';
      ctx.fillRect(tw.dx - tw.w * 0.09, -tw.h - tw.w * 0.7, tw.w * 0.18, tw.w * 0.55);
      const sweep = Math.sin(time * 0.5) * 0.5 - 0.9;
      ctx.strokeStyle = STICKER_OUTLINE;
      ctx.lineWidth = lw * 0.9;
      ctx.beginPath();
      ctx.moveTo(tw.dx, -tw.h - tw.w * 0.34);
      ctx.lineTo(tw.dx + Math.cos(sweep) * R * 0.34, -tw.h - tw.w * 0.34 + Math.sin(sweep) * R * 0.34);
      ctx.stroke();
    } else {
      // Cone roof with a white swirl stripe and a waving pennant.
      const roofH = R * 0.3;
      ctx.beginPath();
      ctx.moveTo(tw.dx - tw.w * 0.62, -tw.h);
      ctx.lineTo(tw.dx + tw.w * 0.62, -tw.h);
      ctx.lineTo(tw.dx, -tw.h - roofH);
      ctx.closePath();
      ctx.fillStyle = tw.roof;
      ctx.fill();
      ctx.strokeStyle = STICKER_OUTLINE;
      ctx.lineWidth = lw;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = lw * 0.55;
      ctx.beginPath();
      ctx.moveTo(tw.dx - tw.w * 0.34, -tw.h - roofH * 0.3);
      ctx.lineTo(tw.dx + tw.w * 0.34, -tw.h - roofH * 0.44);
      ctx.stroke();
      const wave = Math.sin(time * 3 + i * 1.4) * R * 0.05;
      ctx.strokeStyle = STICKER_OUTLINE;
      ctx.lineWidth = lw * 0.5;
      ctx.beginPath();
      ctx.moveTo(tw.dx, -tw.h - roofH);
      ctx.lineTo(tw.dx, -tw.h - roofH - R * 0.16);
      ctx.stroke();
      ctx.fillStyle = tw.roof;
      ctx.beginPath();
      ctx.moveTo(tw.dx, -tw.h - roofH - R * 0.16);
      ctx.quadraticCurveTo(tw.dx + R * 0.12, -tw.h - roofH - R * 0.13 + wave, tw.dx + R * 0.17, -tw.h - roofH - R * 0.16 + wave);
      ctx.lineTo(tw.dx, -tw.h - roofH - R * 0.08);
      ctx.closePath();
      ctx.fill();
    }
  }
  // The striped plaza band grounding the whole fair.
  ctx.fillStyle = '#2a1440';
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.ellipse(0, R * 0.3, R * 1.16, R * 0.17, 0, 0, 6.283);
  ctx.fill();
  ctx.stroke();
  for (let k = -3; k <= 3; k++) {
    ctx.fillStyle = k % 2 === 0 ? '#FF5C8A' : '#FFC24D';
    ctx.globalAlpha = 0.85;
    ctx.fillRect(k * R * 0.155 - R * 0.055, R * 0.22, R * 0.11, R * 0.07);
  }
  ctx.globalAlpha = 1;
  // Confetti sparkle drifting around the skyline: eye candy, few and small.
  for (let k = 0; k < 7; k++) {
    const a = k * 0.897 + 0.4;
    const sx = Math.cos(a * 4.1) * R * (0.65 + (k % 3) * 0.24);
    const sy = -R * (0.55 + ((k * 37) % 90) / 100) + Math.sin(time * 1.1 + k) * R * 0.05;
    ctx.fillStyle = ringCols[k % ringCols.length];
    ctx.globalAlpha = 0.5 + Math.sin(time * 2.3 + k * 2.2) * 0.4;
    ctx.beginPath();
    ctx.arc(sx, sy, R * 0.035, 0, 6.283);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}
