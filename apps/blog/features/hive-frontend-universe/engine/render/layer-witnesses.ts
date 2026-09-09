import { towerLean } from '../../lib/planet';
import { avatarImage } from '../avatars';
import { drawWitnessCitadel } from '../icons';
import type { Pass } from './pass';

/**
 * The witness ring: the real top 21, standing outside the world in rank
 * order and looking in.
 */
export function drawWitnessRing(p: Pass): void {
  const { scene, ctx, time, mapness, z, vx0, vx1, vy0, vy1 } = p;

  // THE WITNESS RING: the real top 21, standing outside the world in rank
  // order and looking in. Drawn at a fixed world size so they stay legible on
  // the pulled-out map, which is where the ring reads as a ring.
  for (const wt of scene.witnesses) {
    // Bigger than pass nine: the citadels were getting lost against the map.
    const towerH = 1680 - (wt.rank - 1) * 22;
    // The cull box must cover the tractor lane too, or the landing light
    // vanishes exactly where the player stands to use it.
    const laneDist =
      wt.laneX !== undefined && wt.laneY !== undefined
        ? Math.hypot(wt.laneX - wt.x, wt.laneY - wt.y) + 220
        : 0;
    const cullR = Math.max(towerH, laneDist);
    if (wt.x + cullR < vx0 || wt.x - cullR > vx1 || wt.y + cullR < vy0 || wt.y - cullR > vy1) {
      continue;
    }
    // THE TRACTOR LANE: the citadel's light reaching down toward the land,
    // ending one jump from the nearest rail node. Jump into it while
    // drifting and it carries you up. Drawn as a soft tapering beam with
    // bright motes travelling UP it, so it reads as suction, not string.
    if (wt.laneX !== undefined && wt.laneY !== undefined && z < 0.12) {
      // Map zoom: the lanes are a hint, not a light show. One flat stroke
      // each; the full gradient-and-motes treatment for 21 lanes measured
      // 6ms of map frame, and this measures under 1ms.
      ctx.strokeStyle = 'rgba(150, 110, 235, 0.18)';
      ctx.lineCap = 'round';
      ctx.lineWidth = 90;
      ctx.beginPath();
      ctx.moveTo(wt.x, wt.y);
      ctx.lineTo(wt.laneX, wt.laneY);
      ctx.stroke();
    } else if (wt.laneX !== undefined && wt.laneY !== undefined) {
      const lx = wt.laneX;
      const ly = wt.laneY;
      const pulse2 = 0.55 + Math.sin(time * 2.2 + wt.rank) * 0.45;
      const grad = ctx.createLinearGradient(wt.x, wt.y, lx, ly);
      grad.addColorStop(0, 'rgba(170, 130, 250, 0.75)');
      grad.addColorStop(1, 'rgba(170, 130, 250, 0.16)');
      ctx.strokeStyle = grad;
      ctx.lineCap = 'round';
      ctx.lineWidth = 130;
      ctx.globalAlpha = 0.5 + pulse2 * 0.3;
      ctx.beginPath();
      ctx.moveTo(wt.x, wt.y);
      ctx.lineTo(lx, ly);
      ctx.stroke();
      // A bright core line inside the wash, so the lane reads as a BEAM.
      ctx.lineWidth = 26;
      ctx.globalAlpha = 0.3 + pulse2 * 0.25;
      ctx.strokeStyle = '#cdb4ff';
      ctx.beginPath();
      ctx.moveTo(wt.x, wt.y);
      ctx.lineTo(lx, ly);
      ctx.stroke();
      ctx.globalAlpha = 1;
      // Motes riding the lane toward the tower: the direction of the ride.
      for (let k = 0; k < 4; k++) {
        const f = 1 - ((time * 0.35 + k / 4 + wt.rank * 0.17) % 1);
        ctx.globalAlpha = 0.6 + f * 0.4;
        ctx.fillStyle = '#e6dbff';
        ctx.beginPath();
        ctx.arc(lx + (wt.x - lx) * f, ly + (wt.y - ly) * f, 22, 0, 6.283);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // The landing light at the lane's end: the "jump HERE" invitation,
      // breathing wide so it is findable from the nearest junction.
      ctx.strokeStyle = '#cdb4ff';
      ctx.lineWidth = 6 / Math.max(z, 0.08);
      ctx.globalAlpha = 0.35 + pulse2 * 0.55;
      ctx.beginPath();
      ctx.arc(lx, ly, 120 + pulse2 * 50, 0, 6.283);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // On the pulled-out map the tower leans outward from the planet's
    // centre, a pin in a globe; up close it stands (lib/planet.ts).
    const lean = towerLean(wt.x, wt.y, mapness);
    ctx.save();
    ctx.translate(wt.x, wt.y);
    ctx.rotate(lean);
    ctx.translate(-wt.x, -wt.y);
    drawWitnessCitadel(
      ctx,
      wt.x,
      wt.y,
      towerH,
      wt.rank,
      wt.name,
      avatarImage(wt.name),
      time,
      wt.rank * 0.7,
      z >= 0.12,
      lean
    );
    // Lit windows up the tower, a blinking few among them: 21 lonely
    // monuments become 21 inhabited outposts (population silhouette tier).
    const wr = 1.3 / Math.max(z, 0.05);
    ctx.fillStyle = '#FFD9A0';
    for (let k = 0; k < 3; k++) {
      const blinker = (wt.rank + k) % 7 === 0;
      const on = !blinker || Math.sin(time * 1.6 + wt.rank * 2 + k) > -0.2;
      if (!on) continue;
      ctx.globalAlpha = 0.75;
      ctx.fillRect(
        wt.x - wr / 2 + (k - 1) * wr * 1.6,
        wt.y - towerH * (0.3 + k * 0.13),
        wr,
        wr * 1.4
      );
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
