/**
 * THE STEEM RUINS: the old chain as a place. A dead grey district in the
 * void: cracked towers, one citadel snapped mid-height, dark houses that
 * will never light again, and a rusted rail stub running toward the living
 * world and BREAKING off, which is the fork drawn as geography. Everything
 * here is desaturated on purpose: the one district with no red, no gold and
 * almost no animation. Only a faint ghost flicker in one window, sometimes.
 */
export function drawSteemRuins(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  R: number,
  time: number
): void {
  const lw = Math.max(3.5, R * 0.045);
  ctx.save();
  ctx.translate(x, y);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Cold grey mist, the only atmosphere the place has left.
  const mist = ctx.createRadialGradient(0, 0, R * 0.3, 0, 0, R * 2.4);
  mist.addColorStop(0, 'rgba(110, 118, 130, 0.14)');
  mist.addColorStop(1, 'rgba(110, 118, 130, 0)');
  ctx.fillStyle = mist;
  ctx.beginPath();
  ctx.arc(0, 0, R * 2.4, 0, 6.283);
  ctx.fill();

  // The rusted rail stub: it runs toward the living world (north-east) and
  // simply STOPS, three broken slats past the break. The fork, as geography.
  ctx.strokeStyle = '#6e4a33';
  ctx.lineWidth = lw * 1.4;
  ctx.setLineDash([R * 0.18, R * 0.1]);
  ctx.beginPath();
  ctx.moveTo(R * 0.2, R * 0.55);
  ctx.lineTo(R * 1.5, R * 0.05);
  ctx.stroke();
  ctx.setLineDash([]);
  for (let k = 0; k < 3; k++) {
    const fx = R * (1.65 + k * 0.22);
    const fy = R * (0 - k * 0.1);
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(0.6 + k * 0.9);
    ctx.beginPath();
    ctx.moveTo(-R * 0.09, 0);
    ctx.lineTo(R * 0.09, 0);
    ctx.stroke();
    ctx.restore();
  }

  // The broken citadel: the same silhouette the living ring wears, snapped
  // mid-height, crown gone.
  ctx.fillStyle = '#3a3d46';
  ctx.strokeStyle = '#23252c';
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(-R * 0.95, R * 0.6);
  ctx.lineTo(-R * 0.82, -R * 0.75);
  ctx.lineTo(-R * 0.62, -R * 0.45); // the snap
  ctx.lineTo(-R * 0.55, -R * 0.85);
  ctx.lineTo(-R * 0.42, R * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Its fallen crown, lying beside it.
  ctx.beginPath();
  ctx.ellipse(-R * 0.15, R * 0.52, R * 0.16, R * 0.07, 0.5, 0, 6.283);
  ctx.fill();
  ctx.stroke();

  // Dead houses: the same rounded blobs the living posts get, unlit.
  for (const [hx, hy, hr] of [
    [R * 0.35, R * 0.1, R * 0.16],
    [R * 0.72, R * 0.32, R * 0.13],
    [R * 0.1, -R * 0.35, R * 0.14],
    [-R * 0.15, R * 0.05, R * 0.11]
  ] as const) {
    ctx.beginPath();
    ctx.arc(hx, hy, hr, 0, 6.283);
    ctx.fillStyle = '#33363e';
    ctx.fill();
    ctx.strokeStyle = '#23252c';
    ctx.lineWidth = lw * 0.7;
    ctx.stroke();
  }

  // A toppled tower between the houses.
  ctx.save();
  ctx.translate(R * 0.45, -R * 0.15);
  ctx.rotate(1.25);
  ctx.fillStyle = '#3a3d46';
  ctx.fillRect(-R * 0.07, -R * 0.42, R * 0.14, R * 0.42);
  ctx.strokeStyle = '#23252c';
  ctx.lineWidth = lw * 0.7;
  ctx.strokeRect(-R * 0.07, -R * 0.42, R * 0.14, R * 0.42);
  ctx.restore();

  // The ghost flicker: once in a while one dead window remembers being on.
  const cycle = (time * 0.23) % 1;
  if (cycle > 0.92) {
    const flick = Math.sin(time * 30) > 0 ? 0.5 : 0.15;
    ctx.fillStyle = `rgba(160, 200, 220, ${flick})`;
    ctx.fillRect(-R * 0.78, -R * 0.5, R * 0.07, R * 0.1);
  }
  ctx.restore();
}
