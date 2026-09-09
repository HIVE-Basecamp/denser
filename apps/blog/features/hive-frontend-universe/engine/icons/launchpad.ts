import { STICKER_OUTLINE } from './shared';

/**
 * Window slots on the dApp station, in station-radius units. Exported so the
 * renderer can paint REAL dApp logos (their Hive account avatars) into the
 * same holes this function draws: one list, two consumers, never apart.
 */
export const DAPP_WINDOWS: readonly { dx: number; dy: number; r: number }[] = [
  // Six slots since the two dApp ships merged into this one bigger craft
  // (Bryan: "basically the same thing... 1 ship, bigger, hold both").
  { dx: -0.68, dy: -0.03, r: 0.19 },
  { dx: -0.36, dy: -0.16, r: 0.21 },
  { dx: 0, dy: -0.2, r: 0.22 },
  { dx: 0.36, dy: -0.16, r: 0.21 },
  { dx: 0.68, dy: -0.03, r: 0.19 },
  { dx: 0, dy: 0.03, r: 0.17 }
];

/**
 * THE dAPP STATION: a round orbital base, one of the big landmarks. A wide
 * saucer hull with a glass dome, a ring of round windows along the rim (the
 * renderer fills them with real dApp logos once their avatars load), landing
 * legs and a blinking beacon. Its landing card lists the real dApps.
 */
export function drawLaunchpad(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  R: number,
  col: string,
  time: number
): void {
  const lw = Math.max(4, R * 0.06);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = lw;
  // Landing legs first, so the saucer sits over them.
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + side * R * 0.55, y + R * 0.28);
    ctx.lineTo(x + side * R * 0.8, y + R * 0.72);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x + side * R * 0.8, y + R * 0.74, R * 0.14, R * 0.06, 0, 0, 6.283);
    ctx.fillStyle = '#aab6c8';
    ctx.fill();
    ctx.stroke();
  }
  // The saucer: a fat rounded disc.
  ctx.beginPath();
  ctx.ellipse(x, y, R * 1.02, R * 0.5, 0, 0, 6.283);
  ctx.fillStyle = '#e9eef8';
  ctx.fill();
  ctx.stroke();
  // A red rim band, the station's livery.
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, R * 1.02, R * 0.5, 0, 0, 6.283);
  ctx.clip();
  ctx.fillStyle = '#e3123a';
  ctx.fillRect(x - R * 1.1, y + R * 0.22, R * 2.2, R * 0.3);
  ctx.restore();
  ctx.beginPath();
  ctx.ellipse(x, y, R * 1.02, R * 0.5, 0, 0, 6.283);
  ctx.stroke();
  // The window holes. The renderer paints real logos into these same slots
  // (DAPP_WINDOWS above); until an avatar arrives, each glows in its own
  // ecosystem colour with a slow lighthouse chase.
  const PORT = ['#5EE9D5', '#FFC24D', '#B79CFF', '#5BE39C'];
  for (let k = 0; k < DAPP_WINDOWS.length; k++) {
    const w = DAPP_WINDOWS[k];
    const lit = (Math.floor(time * 1.2) % DAPP_WINDOWS.length) === k;
    ctx.beginPath();
    ctx.arc(x + w.dx * R, y + w.dy * R, w.r * R, 0, 6.283);
    ctx.fillStyle = PORT[k % PORT.length];
    ctx.globalAlpha = lit ? 1 : 0.7;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = lw * 0.7;
    ctx.stroke();
  }
  // The glass dome up top, with a hint of the crew quarters inside.
  ctx.beginPath();
  ctx.arc(x, y - R * 0.38, R * 0.42, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = 'rgba(155, 232, 255, 0.4)';
  ctx.fill();
  ctx.lineWidth = lw;
  ctx.stroke();
  // Beacon, blinking on the dome.
  const blink = 0.5 + Math.sin(time * 5) * 0.5;
  ctx.beginPath();
  ctx.arc(x, y - R * 0.86, R * 0.07, 0, 6.283);
  ctx.fillStyle = '#ff5f7a';
  ctx.globalAlpha = 0.3 + blink * 0.7;
  ctx.fill();
  ctx.globalAlpha = 1;
  // Soft thruster glow beneath: it hovers as much as it stands.
  const f = 0.5 + Math.sin(time * 3.2) * 0.5;
  ctx.fillStyle = col;
  ctx.globalAlpha = 0.12 + f * 0.12;
  ctx.beginPath();
  ctx.ellipse(x, y + R * 0.62, R * 0.7, R * 0.16, 0, 0, 6.283);
  ctx.fill();
  ctx.globalAlpha = 1;
}
