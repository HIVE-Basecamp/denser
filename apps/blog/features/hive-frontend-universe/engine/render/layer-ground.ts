import { drawGround } from '../ground';
import { drawFish, drawFormation } from '../icons';
import { hash2 } from './util';
import type { Pass } from './pass';

/**
 * The sea floor and the land: the tier fish in the open water, the filled
 * landmasses, the curvature dim at the rim, the honeycomb grid, and the rock
 * formations standing on the terrain.
 */
export function drawGroundLayer(p: Pass): void {
  const { scene, ctx, time, mapness, z, vx0, vx1, vy0, vy1, vis } = p;

  // The tier fish, out in the open water: plankton through whale, dim
  // silhouettes so the sea-in-space theme reads while playing.
  if (mapness < 0.5) {
    const FCELL = 1400;
    const FISH_SIZE = [14, 26, 48, 105, 240];
    for (let cx = Math.floor(vx0 / FCELL); cx <= Math.floor(vx1 / FCELL); cx++) {
      for (let cy = Math.floor(vy0 / FCELL); cy <= Math.floor(vy1 / FCELL); cy++) {
        const h = hash2(cx * 19, cy * 23);
        if (h > 0.72) continue;
        const tier = h < 0.28 ? 0 : h < 0.42 ? 1 : h < 0.5 ? 2 : h < 0.535 ? 3 : 4;
        const fx = cx * FCELL + hash2(cx * 29, cy * 31) * FCELL;
        const fy =
          cy * FCELL +
          hash2(cx * 37, cy * 41) * FCELL +
          Math.sin(time * 0.5 + hash2(cx, cy) * 6.28) * FISH_SIZE[tier] * 0.15;
        const dir = hash2(cx * 43, cy * 47) < 0.5 ? -1 : 1;
        drawFish(ctx, fx, fy, FISH_SIZE[tier], scene.tierColors[tier], dir, 0.17 + tier * 0.04);
      }
    }
  }

  // THE GROUND. Filled landmasses, drawn over the void (and over the stars and
  // fish, which belong to the open water) and under everything else. The
  // geometry was built once per window; this only fills stored paths, culled
  // to the viewport.
  if (scene.ground) {
    drawGround(ctx, scene.ground, vx0, vy0, vx1, vy1, z);
  }

  // CURVATURE: the outermost rim of the world dims a touch, implying a
  // sphere seen face-on. Rim only, and gentle: the land's brightness ruling
  // (bright red IS the identity) stands; this never touches the center.
  if (mapness > 0.15) {
    const cg = ctx.createRadialGradient(0, 0, 5400, 0, 0, 9600);
    cg.addColorStop(0, 'rgba(4, 2, 8, 0)');
    cg.addColorStop(1, `rgba(4, 2, 8, ${(0.16 * mapness).toFixed(3)})`);
    ctx.fillStyle = cg;
    ctx.fillRect(vx0, vy0, vx1 - vx0, vy1 - vy0);
  }

  // NOTE: an art-direction pass tried darkening the land toward wine at map
  // zoom here (value-hierarchy argument: the ground was the brightest large
  // surface on screen). Bryan overruled it: the bright red IS the map's
  // identity. The hierarchy is carried by the other levers instead: route
  // casing, landmark exaggeration, ground pads, street fade, vignette.

  // THE COMB: at play zoom the land's interior carries a faint hex-cell
  // grid. The planet IS a honeycomb; the bee theme lands as geometry
  // without a single new object. Clipped to the visible land cells.
  if (scene.ground && z >= 0.3) {
    const gr = scene.ground;
    const clip = new Path2D();
    let anyCell = false;
    for (let i = 0; i < gr.cellPaths.length; i++) {
      const b = gr.cellBox[i];
      if (b.x1 < vx0 || b.x0 > vx1 || b.y1 < vy0 || b.y0 > vy1) continue;
      clip.addPath(gr.cellPaths[i]);
      anyCell = true;
    }
    if (anyCell) {
      ctx.save();
      ctx.clip(clip);
      const R = 96;
      const HH = R * 0.866;
      ctx.strokeStyle = '#4a060c';
      ctx.lineWidth = 2.4;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      const q0 = Math.floor(vx0 / (R * 1.5)) - 1;
      const q1 = Math.ceil(vx1 / (R * 1.5)) + 1;
      const r0 = Math.floor(vy0 / (HH * 2)) - 1;
      const r1 = Math.ceil(vy1 / (HH * 2)) + 1;
      for (let q = q0; q <= q1; q++) {
        for (let rr = r0; rr <= r1; rr++) {
          const hx = q * R * 1.5;
          const hy = (rr * 2 + (q & 1)) * HH;
          // Right pair + top edge of each flat-top hex; neighbours supply
          // the left pair and the bottom, so no edge is drawn twice.
          ctx.moveTo(hx + R * 0.5, hy - HH);
          ctx.lineTo(hx + R, hy);
          ctx.lineTo(hx + R * 0.5, hy + HH);
          ctx.moveTo(hx - R * 0.5, hy - HH);
          ctx.lineTo(hx + R * 0.5, hy - HH);
        }
      }
      ctx.stroke();
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  // Rock formations: spiky crystal clutches standing on the terrain, under
  // everything travelable. Skipped on the pulled-out map, where 190 clutches
  // of shards would be sub-pixel noise and pure cost.
  if (mapness < 0.72) {
    for (const f of scene.formations) {
      if (!vis(f.x, f.y)) continue;
      drawFormation(ctx, f.x, f.y, f.h, f.shards, f.hue, f.phase, f.lean, time);
    }
  }
}
