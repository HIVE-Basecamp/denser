import { drawHiveMark } from '../icons';
import type { PlayerState } from '../movement';
import { PALETTE } from './palette';
import { clamp } from './util';

export function drawBug(
  ctx: CanvasRenderingContext2D,
  p: PlayerState,
  time: number,
  atX: number,
  atY: number,
  rider: HTMLImageElement | null,
  aim?: { x: number; y: number }
): void {
  const BW = 19;
  const BH = 21;
  ctx.save();
  ctx.translate(atX, atY);

  // THE BOARD IS THE GUN SIGHT (Bryan: "make it clear what direction the
  // shot will fire... built into the surf board"). It turns to the aim,
  // wears a bright nose on the leading end, and a dotted sight line runs
  // out from the nose to where the shot will go. Without an aim (no
  // combat state) it lies flat with the old idle tilt.
  const boardY = BH + 4;
  const ang = aim ? Math.atan2(aim.y, aim.x) : p.face >= 0 ? 0.18 : -0.18;
  ctx.save();
  ctx.translate(0, boardY);
  ctx.rotate(ang);
  ctx.fillStyle = PALETTE.board;
  ctx.strokeStyle = PALETTE.boardLit;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(0, 0, 27, 7.5, 0, 0, 6.283);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-24, 0);
  ctx.lineTo(24, 0);
  ctx.globalAlpha = 0.5;
  ctx.stroke();
  ctx.globalAlpha = 1;
  if (aim) {
    // The nose: a bright fin at the leading tip, pulsing so it reads.
    const pulse = 0.75 + Math.sin(time * 6) * 0.25;
    ctx.fillStyle = PALETTE.boardLit;
    ctx.globalAlpha = pulse;
    ctx.beginPath();
    ctx.moveTo(24, -6);
    ctx.lineTo(42, 0);
    ctx.lineTo(24, 6);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    // The sight line: dotted, out to where the shot will fly, arrowhead.
    ctx.strokeStyle = PALETTE.boardLit;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.setLineDash([5, 9]);
    ctx.lineDashOffset = -time * 60;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(46, 0);
    ctx.lineTo(150, 0);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(150, -7);
    ctx.lineTo(162, 0);
    ctx.lineTo(150, 7);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  // THE REINS (Bryan's mount design): the two eye tentacles grew LONGER,
  // rooted in the body, swinging wide AROUND the rider's circle and coming
  // out over the top. Stalks first; the eyeballs are drawn LAST so they
  // peek out over the rider.
  const eyeTips: [number, number][] = [];
  for (let e = -1; e <= 1; e += 2) {
    const tx = e * 12 + p.face * 3;
    const ty = -82 + Math.sin(time * 4 + e) * 2.2;
    eyeTips.push([tx, ty]);
    ctx.strokeStyle = PALETTE.hiveLit;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(e * 6, -12);
    ctx.quadraticCurveTo(e * 28, -26, e * 26, -48);
    ctx.quadraticCurveTo(e * 22, -70, tx, ty);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(0, -BH);
  ctx.lineTo(BW, 0);
  ctx.lineTo(0, BH);
  ctx.lineTo(-BW, 0);
  ctx.closePath();
  ctx.fillStyle = PALETTE.hive;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // BLACK Hive stripes on the body (Bryan's order): the real mark stamped
  // dark, so the player IS the logo at a glance. Drawn OUTSIDE any facing
  // flip: the body faces left/right via `face` coordinate offsets only,
  // never a flip transform, so the mark can never appear backwards.
  drawHiveMark(ctx, 0, 0.5, 24, '#141019');

  // THE RIDER: the signed-in player's own avatar, perched on the diamond's
  // top tip, riding the bug. Little boots dangle onto the shoulders first,
  // behind the circle.
  // BIG on purpose (Bryan: "minimum as big as the clear helmet circle...
  // it can be absurd looking... dont worry about proportions"): the face
  // is the point, so the circle matches the old helmet dome and the real
  // profile image reads at a glance.
  const rr = 28;
  const rcy = -BH - 22;
  ctx.fillStyle = '#141019';
  for (const e of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(e * 9, -17.5, 4.2, 2.8, e * 0.5, 0, 6.283);
    ctx.fill();
  }
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, rcy, rr, 0, 6.283);
  ctx.clip();
  if (rider) {
    ctx.drawImage(rider, -rr, rcy - rr, rr * 2, rr * 2);
  } else {
    // Until the avatar loads: a warm rider-shaped placeholder.
    ctx.fillStyle = '#ffd24a';
    ctx.fillRect(-rr, rcy - rr, rr * 2, rr * 2);
    ctx.fillStyle = '#8a5a00';
    ctx.beginPath();
    ctx.arc(0, rcy - 7, 9.5, 0, 6.283);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, rcy + 17, 15.5, 11, 0, Math.PI, 0);
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0, rcy, rr, 0, 6.283);
  ctx.stroke();

  // Little arms out from the rider, hands gripping the reins where the
  // stalks pass beside the circle.
  ctx.strokeStyle = '#141019';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (const e of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(e * 22, rcy - 4);
    ctx.quadraticCurveTo(e * 27, rcy - 6.5, e * 29.5, rcy - 9);
    ctx.stroke();
    ctx.fillStyle = '#141019';
    ctx.beginPath();
    ctx.arc(e * 30, rcy - 9.5, 3, 0, 6.283);
    ctx.fill();
  }

  // The EYEBALLS, bigger now and drawn over everything: peeking out over
  // the top of the rider like the bug is watching where it carries them.
  for (const [tx, ty] of eyeTips) {
    ctx.beginPath();
    ctx.arc(tx, ty, 7.5, 0, 6.283);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#5c0a16';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = PALETTE.hiveBlack;
    ctx.beginPath();
    ctx.arc(tx + p.face * 2.6, ty + 0.7, 3.2, 0, 6.283);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(tx - 2, ty - 2.3, 1.2, 0, 6.283);
    ctx.fill();
  }

  if (p.mode === 'drift') {
    const f = clamp(p.fuel / 2.4, 0, 1);
    ctx.strokeStyle = f > 0.4 ? '#ffffff' : '#ff5f7a';
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.5 + Math.sin(time * 18) * 0.3;
    ctx.beginPath();
    // 58 (was 37): rings the whole rider-and-reins rig now.
    ctx.arc(0, -14, 58, -1.57, -1.57 + 6.283 * f);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}
