import { SHADOW, TOXIC } from './json-boss-palette';

export function drawBossBackdrop(ctx: CanvasRenderingContext2D, R: number, time: number): void {
  /* ---------- backdrop: aura, streaks, storm rings, far spires ---------- */
  const aura = ctx.createRadialGradient(0, -R * 0.5, R * 0.4, 0, -R * 0.5, R * 3.1);
  aura.addColorStop(0, 'rgba(24, 6, 34, 0.65)');
  aura.addColorStop(1, 'rgba(10, 4, 18, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, -R * 0.5, R * 3.1, 0, 6.283);
  ctx.fill();
  for (let k = 0; k < 5; k++) {
    const sy = -R * (2.3 - k * 0.9);
    ctx.strokeStyle = k % 2 === 0 ? 'rgba(124, 255, 77, 0.05)' : 'rgba(122, 79, 168, 0.08)';
    ctx.lineWidth = R * (0.22 - k * 0.02);
    ctx.beginPath();
    ctx.moveTo(-R * 2.6, sy + R * 0.5);
    ctx.quadraticCurveTo(0, sy - R * 0.3, R * 2.6, sy + R * 0.2);
    ctx.stroke();
  }
  for (let k = 0; k < 3; k++) {
    const rr = R * (1.6 + k * 0.36);
    const rot = time * (k % 2 === 0 ? 0.18 : -0.13) + k * 2.1;
    ctx.strokeStyle = TOXIC;
    ctx.globalAlpha = 0.12 - k * 0.03;
    ctx.lineWidth = R * (0.1 - k * 0.02);
    ctx.setLineDash([rr * 0.9, rr * 0.55]);
    ctx.lineDashOffset = -rot * rr;
    ctx.beginPath();
    ctx.ellipse(0, -R * 0.45, rr, rr * 0.6, 0, 0, 6.283);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;
  ctx.globalAlpha = 1;
  const FAR_SPIRES: readonly [number, number, number][] = [
    [-1.9, 1.1, 0.2],
    [-1.4, 1.5, 0.24],
    [1.55, 1.45, 0.24],
    [2.0, 1.0, 0.18]
  ];
  for (const [sx, h, w] of FAR_SPIRES) {
    ctx.fillStyle = '#1a1030';
    ctx.beginPath();
    ctx.moveTo(R * (sx - w), R * 0.9);
    ctx.lineTo(R * (sx - w * 0.3), R * (0.9 - h));
    ctx.lineTo(R * sx, R * (0.9 - h - 0.2));
    ctx.lineTo(R * (sx + w * 0.3), R * (0.9 - h));
    ctx.lineTo(R * (sx + w), R * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(124, 255, 77, 0.2)';
    ctx.fillRect(R * (sx - 0.025), R * (0.9 - h * 0.55), R * 0.05, R * 0.1);
  }
}

export function drawBossRock(ctx: CanvasRenderingContext2D, R: number, time: number, lw: number): void {
  /* ---------- the floating rock (kept: Bryan likes the rock) ---------- */
  ctx.beginPath();
  ctx.moveTo(-R * 1.75, R * 1.0);
  ctx.lineTo(-R * 1.1, R * 1.7);
  ctx.lineTo(-R * 0.35, R * 2.0);
  ctx.lineTo(R * 0.5, R * 1.85);
  ctx.lineTo(R * 1.25, R * 1.5);
  ctx.lineTo(R * 1.75, R * 1.0);
  ctx.closePath();
  ctx.fillStyle = '#171024';
  ctx.fill();
  ctx.strokeStyle = '#2b1d45';
  ctx.lineWidth = lw * 0.8;
  ctx.stroke();
  ctx.fillStyle = '#221737';
  ctx.beginPath();
  ctx.moveTo(-R * 1.75, R * 1.0);
  ctx.lineTo(-R * 1.1, R * 1.7);
  ctx.lineTo(-R * 0.55, R * 1.15);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(R * 1.75, R * 1.0);
  ctx.lineTo(R * 1.25, R * 1.5);
  ctx.lineTo(R * 0.7, R * 1.1);
  ctx.closePath();
  ctx.fill();
  // The rock's top plateau, lit faintly by the hoard.
  ctx.beginPath();
  ctx.moveTo(-R * 1.75, R * 1.0);
  ctx.lineTo(-R * 1.2, R * 0.82);
  ctx.lineTo(R * 1.1, R * 0.82);
  ctx.lineTo(R * 1.75, R * 1.0);
  ctx.closePath();
  ctx.fillStyle = '#2b1d45';
  ctx.fill();
  // Crystals hanging beneath, green-tipped.
  for (const [cx, cy, ch] of [
    [-R * 0.85, R * 1.8, R * 0.5],
    [-R * 0.15, R * 2.0, R * 0.62],
    [R * 0.6, R * 1.82, R * 0.44]
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(cx - R * 0.14, cy - R * 0.06);
    ctx.lineTo(cx, cy + ch);
    ctx.lineTo(cx + R * 0.14, cy - R * 0.06);
    ctx.closePath();
    ctx.fillStyle = SHADOW;
    ctx.fill();
    ctx.strokeStyle = '#4d2a6e';
    ctx.lineWidth = lw * 0.5;
    ctx.stroke();
    const tipGlow = 0.4 + Math.sin(time * 1.4 + cx) * 0.25;
    ctx.fillStyle = `rgba(124, 255, 77, ${tipGlow.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(cx, cy + ch, R * 0.045, 0, 6.283);
    ctx.fill();
  }
  // Drifting shards.
  for (const [ox, oy, os, ph] of [
    [-R * 2.15, R * 0.3, 0.16, 0],
    [R * 2.2, R * 0.05, 0.13, 2.1],
    [R * 1.95, R * 1.15, 0.1, 4.2]
  ] as const) {
    const bob = Math.sin(time * 0.7 + ph) * R * 0.06;
    ctx.beginPath();
    ctx.moveTo(ox - R * os, oy + bob);
    ctx.lineTo(ox, oy - R * os * 0.9 + bob);
    ctx.lineTo(ox + R * os, oy + bob);
    ctx.lineTo(ox, oy + R * os * 1.4 + bob);
    ctx.closePath();
    ctx.fillStyle = '#1d1332';
    ctx.fill();
    ctx.strokeStyle = '#2b1d45';
    ctx.lineWidth = lw * 0.4;
    ctx.stroke();
  }
}

export function drawBossRuin(ctx: CanvasRenderingContext2D, R: number, time: number, lw: number): void {
  /* ---------- the ruined keep he crushed ---------- */
  // A cracked stub of the old tower, leaning, still carrying the glowing
  // sigil. Environmental storytelling: the fortress fell to its own boss.
  ctx.save();
  ctx.translate(-R * 1.05, R * 0.82);
  ctx.rotate(-0.09);
  ctx.beginPath();
  ctx.moveTo(-R * 0.24, 0);
  ctx.lineTo(-R * 0.2, -R * 0.85);
  ctx.lineTo(-R * 0.06, -R * 0.72);
  ctx.lineTo(R * 0.05, -R * 1.0);
  ctx.lineTo(R * 0.14, -R * 0.7);
  ctx.lineTo(R * 0.22, -R * 0.78);
  ctx.lineTo(R * 0.24, 0);
  ctx.closePath();
  ctx.fillStyle = '#100a1c';
  ctx.fill();
  ctx.strokeStyle = '#4d2a6e';
  ctx.lineWidth = lw * 0.7;
  ctx.stroke();
  // Brick courses and a crack of green light.
  ctx.strokeStyle = 'rgba(107, 77, 150, 0.18)';
  ctx.lineWidth = lw * 0.3;
  ctx.beginPath();
  for (let r = 1; r < 5; r++) {
    ctx.moveTo(-R * 0.21, -r * R * 0.17);
    ctx.lineTo(R * 0.22, -r * R * 0.17);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(124, 255, 77, 0.5)';
  ctx.lineWidth = lw * 0.35;
  ctx.beginPath();
  ctx.moveTo(-R * 0.06, -R * 0.05);
  ctx.lineTo(-R * 0.01, -R * 0.3);
  ctx.lineTo(-R * 0.1, -R * 0.5);
  ctx.stroke();
  // The sigil, still burning on the dead wall: { } as JSON prints it.
  const sig = 0.6 + Math.sin(time * 1.9) * 0.4;
  ctx.strokeStyle = `rgba(124, 255, 77, ${(0.45 + sig * 0.55).toFixed(3)})`;
  ctx.lineWidth = lw * 0.8;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * R * 0.035, -R * 0.62);
    ctx.quadraticCurveTo(side * R * 0.1, -R * 0.61, side * R * 0.09, -R * 0.545);
    ctx.quadraticCurveTo(side * R * 0.08, -R * 0.5, side * R * 0.125, -R * 0.485);
    ctx.quadraticCurveTo(side * R * 0.08, -R * 0.47, side * R * 0.09, -R * 0.425);
    ctx.quadraticCurveTo(side * R * 0.1, -R * 0.36, side * R * 0.035, -R * 0.35);
    ctx.stroke();
  }
  ctx.restore();
  // Rubble at the ruin's foot.
  for (const [rx, ry, rs] of [
    [-R * 1.38, R * 0.9, 0.09],
    [-R * 0.78, R * 0.94, 0.07],
    [-R * 1.15, R * 0.98, 0.055]
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(rx - R * rs, ry);
    ctx.lineTo(rx, ry - R * rs);
    ctx.lineTo(rx + R * rs, ry);
    ctx.closePath();
    ctx.fillStyle = '#1d1332';
    ctx.fill();
  }
}
