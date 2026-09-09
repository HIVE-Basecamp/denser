import { STICKER_OUTLINE } from './shared';

/**
 * MOUNT SOCKO, second design, to Bryan's spec: a WHITE sock volcano with
 * the TOE as the summit crater, zigzag stripes down the tube, and two
 * mischievous puppet eyes. Ominous but still laundry. It floats on its own
 * isle in the north-east void (U-7), where enveloped bugs get posted; the
 * toll is the long ride home.
 */
export function drawSockMount(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  R: number,
  time: number
): void {
  const lw = Math.max(4, R * 0.05);
  ctx.save();
  ctx.translate(x, y);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // Cold mist pooling around the isle.
  const mist = ctx.createRadialGradient(0, R * 0.7, R * 0.2, 0, R * 0.7, R * 1.9);
  mist.addColorStop(0, 'rgba(150, 140, 190, 0.2)');
  mist.addColorStop(1, 'rgba(150, 140, 190, 0)');
  ctx.fillStyle = mist;
  ctx.beginPath();
  ctx.arc(0, R * 0.7, R * 1.9, 0, 6.283);
  ctx.fill();
  // THE SOCK, toe up: a wide cuff planted at the base, the tube rising and
  // leaning, the heel bulging on the right, and the rounded TOE as the
  // volcano's summit.
  ctx.beginPath();
  ctx.moveTo(-R * 0.95, R * 0.95); // cuff, left foot of the mountain
  ctx.lineTo(-R * 0.55, -R * 0.5); // tube, left slope
  ctx.quadraticCurveTo(-R * 0.45, -R * 1.15, -R * 0.05, -R * 1.42); // shoulder to toe
  ctx.quadraticCurveTo(R * 0.4, -R * 1.55, R * 0.52, -R * 1.1); // the TOE, rounded summit
  ctx.quadraticCurveTo(R * 0.58, -R * 0.7, R * 0.42, -R * 0.35); // down the instep
  ctx.quadraticCurveTo(R * 0.75, -R * 0.1, R * 0.8, R * 0.3); // the heel bulge
  ctx.quadraticCurveTo(R * 0.85, R * 0.7, R * 0.95, R * 0.95); // heel to base
  ctx.closePath();
  ctx.fillStyle = '#f2f5fb';
  ctx.fill();
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = lw;
  ctx.stroke();
  // ZIGZAG STRIPES across the tube, following the lean.
  ctx.save();
  ctx.clip();
  for (let s = 0; s < 3; s++) {
    const sy = R * (0.55 - s * 0.55);
    ctx.beginPath();
    ctx.moveTo(-R * 1.1, sy);
    for (let k = 0; k <= 8; k++) {
      const zx = -R * 1.1 + (k * R * 2.2) / 8;
      const zy = sy + (k % 2 === 0 ? 0 : -R * 0.14) - s * R * 0.05;
      ctx.lineTo(zx, zy);
    }
    ctx.strokeStyle = s % 2 === 0 ? '#e3123a' : '#5CA8FF';
    ctx.lineWidth = R * 0.11;
    ctx.stroke();
  }
  // The TOE CRATER: a dark mouth at the summit with a lava glow breathing
  // inside; it is a volcano, after all.
  const glow = 0.5 + Math.sin(time * 1.7) * 0.5;
  ctx.beginPath();
  ctx.ellipse(R * 0.22, -R * 1.32, R * 0.3, R * 0.13, -0.2, 0, 6.283);
  ctx.fillStyle = '#1a0a10';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(R * 0.22, -R * 1.3, R * 0.2, R * 0.08, -0.2, 0, 6.283);
  ctx.fillStyle = `rgba(255, 90, 30, ${(0.45 + glow * 0.55).toFixed(3)})`;
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = lw * 0.8;
  ctx.beginPath();
  ctx.ellipse(R * 0.22, -R * 1.32, R * 0.3, R * 0.13, -0.2, 0, 6.283);
  ctx.stroke();
  // Wisps of sock-steam curling off the crater.
  ctx.strokeStyle = 'rgba(220, 225, 240, 0.55)';
  ctx.lineWidth = lw * 0.6;
  for (let k = 0; k < 2; k++) {
    const drift = Math.sin(time * 0.9 + k * 2.2) * R * 0.08;
    ctx.beginPath();
    ctx.moveTo(R * (0.12 + k * 0.2), -R * 1.42);
    ctx.quadraticCurveTo(
      R * (0.05 + k * 0.25) + drift,
      -R * 1.75,
      R * (0.18 + k * 0.22) + drift,
      -R * (1.95 + k * 0.12)
    );
    ctx.stroke();
  }
  // MISCHIEVOUS PUPPET EYES on the tube: wide white eyes with slanted lids
  // and darting pupils. It is a puppet; it is watching; it is delighted.
  const dart = Math.sin(time * 0.8) * R * 0.03;
  for (const [ex, ey] of [
    [-R * 0.18, -R * 0.55],
    [R * 0.18, -R * 0.6]
  ] as const) {
    ctx.beginPath();
    ctx.arc(ex, ey, R * 0.13, 0, 6.283);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = STICKER_OUTLINE;
    ctx.lineWidth = lw * 0.7;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ex + dart, ey + R * 0.03, R * 0.055, 0, 6.283);
    ctx.fillStyle = STICKER_OUTLINE;
    ctx.fill();
    // The slanted lid: half the eye hooded, pure mischief.
    ctx.beginPath();
    ctx.moveTo(ex - R * 0.14, ey - R * 0.11);
    ctx.lineTo(ex + R * 0.14, ey - R * 0.02);
    ctx.lineWidth = lw * 0.8;
    ctx.stroke();
  }
  // A crooked stitched grin under the eyes.
  ctx.beginPath();
  ctx.moveTo(-R * 0.15, -R * 0.28);
  ctx.quadraticCurveTo(R * 0.05, -R * 0.18, R * 0.25, -R * 0.32);
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = lw * 0.7;
  ctx.stroke();
  ctx.restore();
}
