/**
 * THE DOOR TO THE BACK: the Steem Ruins are round the far side of the
 * planet now, out of sight. What marks the way on the living side is the
 * rubble that came round: a few shards of the old mark in Steem's blue,
 * half sunk off the diamond's western coast, a cold mist over them. Park
 * here and the planet turns.
 */
const STEEM_BLUE = '#4BA2F2';
const STEEM_SHADE = '#2c6fb5';
const STEEM_LIT = '#bfe0ff';

/** The shards: polygons in units of R, each with a waterline below it. */
const SHARDS: readonly (readonly (readonly [number, number])[])[] = [
  [
    [-0.9, 0.35],
    [-0.55, -0.4],
    [-0.15, -0.1],
    [-0.35, 0.45]
  ],
  [
    [0.05, 0.1],
    [0.4, -0.55],
    [0.75, -0.3],
    [0.55, 0.3],
    [0.15, 0.4]
  ],
  [
    [-0.25, 0.75],
    [0.05, 0.5],
    [0.35, 0.65],
    [0.1, 0.95]
  ],
  [
    [0.65, 0.55],
    [0.95, 0.4],
    [1.05, 0.7],
    [0.8, 0.8]
  ]
];

export function drawSteemRubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  R: number,
  time: number
): void {
  const lw = Math.max(3, R * 0.05);
  ctx.save();
  ctx.translate(x, y);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Cold mist over the wreckage, breathing very slowly.
  const breath = 0.85 + Math.sin(time * 0.4) * 0.15;
  const mist = ctx.createRadialGradient(0, 0.2 * R, R * 0.2, 0, 0.2 * R, R * 2.2 * breath);
  mist.addColorStop(0, 'rgba(75, 162, 242, 0.16)');
  mist.addColorStop(1, 'rgba(75, 162, 242, 0)');
  ctx.fillStyle = mist;
  ctx.beginPath();
  ctx.arc(0, 0.2 * R, R * 2.2 * breath, 0, 6.283);
  ctx.fill();

  for (const shard of SHARDS) {
    // The waterline: the shard's sunk half shows as a dark slick under it.
    let sx = 0;
    let sy = -Infinity;
    for (const [px, py] of shard) {
      sx += px / shard.length;
      sy = Math.max(sy, py);
    }
    ctx.beginPath();
    ctx.ellipse(sx * R, sy * R, R * 0.42, R * 0.13, 0, 0, 6.283);
    ctx.fillStyle = 'rgba(5, 10, 26, 0.55)';
    ctx.fill();
    // The shard itself, its top edge lit.
    ctx.beginPath();
    shard.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px * R, py * R) : ctx.lineTo(px * R, py * R)));
    ctx.closePath();
    ctx.fillStyle = STEEM_BLUE;
    ctx.fill();
    ctx.strokeStyle = STEEM_SHADE;
    ctx.lineWidth = lw;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(shard[0][0] * R, shard[0][1] * R);
    ctx.lineTo(shard[1][0] * R, shard[1][1] * R);
    ctx.lineTo(shard[2][0] * R, shard[2][1] * R);
    ctx.strokeStyle = STEEM_LIT;
    ctx.lineWidth = lw * 0.5;
    ctx.globalAlpha = 0.7;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
