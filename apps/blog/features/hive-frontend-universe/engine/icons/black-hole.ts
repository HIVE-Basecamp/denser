/**
 * THE DEVELOPER PORTAL: a black hole, one of the big five.
 *
 * Dark core, two COUNTER-ROTATING glowing accretion rings around it, and faint
 * particles spiralling inward. Cool colours and deliberately a little ominous:
 * this is the one place on the map that does not look friendly.
 *
 * The rings are drawn as many short arc segments of varying alpha rather than
 * one stroked circle, which is what makes them read as moving matter instead
 * of as a drawn outline.
 */
export function drawBlackHole(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  R: number,
  time: number
): void {
  ctx.save();

  // Outer halo: the light being bent around it.
  const halo = ctx.createRadialGradient(x, y, R * 0.5, x, y, R * 1.9);
  halo.addColorStop(0, 'rgba(90, 170, 255, 0.30)');
  halo.addColorStop(0.5, 'rgba(70, 110, 220, 0.13)');
  halo.addColorStop(1, 'rgba(40, 60, 150, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, R * 1.9, 0, 6.283);
  ctx.fill();

  // Infalling particles: seeded specks on inward spirals, cool and faint.
  for (let i = 0; i < 26; i++) {
    const seed = i * 2.399963;
    // Each particle runs its own inward pass, wrapping when it reaches the core.
    const phase = (time * 0.16 + i / 26) % 1;
    const rad = R * (1.85 - phase * 1.25);
    const ang = seed + phase * 5.4 + time * 0.5;
    const px = x + Math.cos(ang) * rad;
    const py = y + Math.sin(ang) * rad * 0.42;
    ctx.globalAlpha = 0.15 + (1 - phase) * 0.5;
    ctx.fillStyle = i % 3 === 0 ? '#bfe4ff' : '#6fa8ff';
    ctx.beginPath();
    ctx.arc(px, py, R * 0.028, 0, 6.283);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // The two accretion rings, counter-rotating. Drawn flattened, one tilted
  // against the other, in segments so the brightness varies around each.
  const rings = [
    { r: R * 1.28, squash: 0.34, spin: time * 0.55, tilt: -0.22, col: '#7fc4ff', w: R * 0.13 },
    { r: R * 0.98, squash: 0.46, spin: -time * 0.42, tilt: 0.3, col: '#9d8bff', w: R * 0.1 }
  ];
  for (const ring of rings) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ring.tilt);
    ctx.scale(1, ring.squash);
    ctx.lineCap = 'butt';
    const SEG = 44;
    for (let i = 0; i < SEG; i++) {
      const a0 = (i / SEG) * 6.283 + ring.spin;
      const a1 = ((i + 1.05) / SEG) * 6.283 + ring.spin;
      // Brightest on one side, like matter heated as it swings around.
      const b = 0.5 + Math.sin(a0 * 1 - ring.spin * 0.5) * 0.5;
      ctx.globalAlpha = 0.22 + b * 0.72;
      ctx.strokeStyle = ring.col;
      ctx.lineWidth = ring.w * (0.6 + b * 0.7);
      ctx.beginPath();
      ctx.arc(0, 0, ring.r, a0, a1);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  // The core: flat black with a hard rim, so it reads as a hole punched in
  // the world rather than as a dark ball.
  const core = ctx.createRadialGradient(x, y, R * 0.3, x, y, R * 0.78);
  core.addColorStop(0, '#000000');
  core.addColorStop(0.72, '#02030a');
  core.addColorStop(1, 'rgba(20, 30, 70, 0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y, R * 0.78, 0, 6.283);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(x, y, R * 0.52, 0, 6.283);
  ctx.fill();
  ctx.strokeStyle = 'rgba(150, 200, 255, 0.55)';
  ctx.lineWidth = Math.max(1.5, R * 0.03);
  ctx.stroke();

  ctx.restore();
}
