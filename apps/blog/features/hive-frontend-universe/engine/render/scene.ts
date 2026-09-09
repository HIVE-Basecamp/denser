import { drawPlanet } from '../planet';
import { PALETTE } from './palette';
import { drawSky, drawNebulae } from './sky';
import { drawHud } from './hud';
import type { Pass } from './pass';
import type { RenderScene } from './types';
import type { WorldEdge } from '../world';
import { drawGroundLayer } from './layer-ground';
import { drawWitnessRing } from './layer-witnesses';
import { drawVoidPlaces } from './layer-void';
import { drawRails } from './layer-rails';
import { drawTraffic } from './layer-traffic';
import { drawNodes } from './layer-nodes';
import { drawBuzzingStation } from './layer-buzz';
import { drawLandmarks } from './layer-landmarks';
import { drawCommunities } from './layer-communities';
import { drawBugLayer } from './layer-bug';
import { drawOverlays } from './layer-overlay';
import { planetPath } from '../planet';

export function drawScene(scene: RenderScene): void {
  const { ctx, W, H, DPR, cam, nodes, edges, player, time, mapness } = scene;

  // NOTHING ON THIS MAP IS LETTERED. Names used to be painted beside every
  // post, place, community and tower, and at map zoom that was most of the
  // pixels: the map read as a list rather than as a world. Identity is now
  // carried by the art (profile photos, emblems, illustrated places) and the
  // NAME APPEARS ON HOVER, in the DOM layer above the canvas.

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, W, H);

  const sx = scene.shake ? (Math.random() - 0.5) * scene.shake : 0;
  const sy = scene.shake ? (Math.random() - 0.5) * scene.shake : 0;
  const z = cam.z;

  // THE SKY AND THE PLANET'S BODY sit behind the board and do not turn with
  // it: when the board flips at the ruins the sphere stays round and only
  // its face slides across. Plain world space, no flip.
  const flipX = scene.flipX ?? 1;
  ctx.save();
  ctx.translate(W / 2 + sx, H / 2 + sy);
  ctx.scale(z, z);
  ctx.translate(-cam.x, -cam.y);

  const pad = 320 / z;
  const zx = z * Math.max(Math.abs(flipX), 0.25);
  const vx0 = cam.x - W / 2 / zx - pad;
  const vx1 = cam.x + W / 2 / zx + pad;
  const vy0 = cam.y - H / 2 / z - pad;
  const vy1 = cam.y + H / 2 / z + pad;
  const vis = (x: number, y: number) => x > vx0 && x < vx1 && y > vy0 && y < vy1;
  const edgeVis = (e: WorldEdge) => {
    const m = e.pts.length;
    const minX = Math.min(e.pts[0], e.pts[m - 2]) - e.len * 0.3;
    const maxX = Math.max(e.pts[0], e.pts[m - 2]) + e.len * 0.3;
    const minY = Math.min(e.pts[1], e.pts[m - 1]) - e.len * 0.3;
    const maxY = Math.max(e.pts[1], e.pts[m - 1]) + e.len * 0.3;
    return maxX > vx0 && minX < vx1 && maxY > vy0 && minY < vy1;
  };

  // THE SKY: colorful stars, diagonal streaks, Hive constellations. Visible
  // at every zoom; loudest exactly where the map used to be dead black.
  drawSky(ctx, time, z, vx0, vy0, vx1, vy1);
  drawNebulae(ctx, vx0, vy0, vx1, vy1);
  // THE PLANET (lib/planet.ts): the sphere the mark sits on, seen face-on.
  drawPlanet(ctx, mapness);
  ctx.restore();

  // THE FLIP: the board turns on its vertical axis. flipX runs 1 to -1
  // (cosine), so past the midpoint the world is mirrored: you are looking
  // at the back. Everything from here on is the planet's face.
  ctx.save();
  ctx.translate(W / 2 + sx, H / 2 + sy);
  ctx.transform(flipX, 0, scene.flipSkew ?? 0, 1, 0, 0);
  ctx.scale(z, z);
  ctx.translate(-cam.x, -cam.y);

  const p: Pass = {
    scene,
    ctx,
    W,
    H,
    DPR,
    cam,
    nodes,
    edges,
    player,
    time,
    mapness,
    sx,
    sy,
    z,
    flipX,
    pad,
    zx,
    vx0,
    vx1,
    vy0,
    vy1,
    vis,
    edgeVis
  };

  drawGroundLayer(p);
  drawWitnessRing(p);
  drawVoidPlaces(p);
  drawRails(p);
  drawTraffic(p);
  drawNodes(p);
  drawBuzzingStation(p);
  drawLandmarks(p);
  drawCommunities(p);
  drawBugLayer(p);
  drawOverlays(p);

  // THE BACK OF THE BOARD is the dead chain: everything drained of its
  // saturation, then pulled cold. Two blend fills over the whole view; the
  // world underneath is drawn exactly as on the front.
  if (scene.side === 'steem') {
    ctx.save();
    planetPath(ctx, 1.15);
    ctx.clip();
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = '#4a5560';
    ctx.fillRect(vx0, vy0, vx1 - vx0, vy1 - vy0);
    ctx.globalCompositeOperation = 'color';
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#5c7590';
    ctx.fillRect(vx0, vy0, vx1 - vx0, vy1 - vy0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }

  ctx.restore();

  // Mid-turn the far side comes round: darken the sphere's face, not the
  // sky, so the turn has weight and the planet stays a planet.
  if (Math.abs(flipX) < 1) {
    ctx.save();
    ctx.translate(W / 2 + sx, H / 2 + sy);
    ctx.scale(z, z);
    ctx.translate(-cam.x, -cam.y);
    planetPath(ctx, 1.15);
    ctx.clip();
    ctx.globalAlpha = (1 - Math.abs(flipX)) * 0.7;
    ctx.fillStyle = '#000000';
    ctx.fillRect(vx0, vy0, vx1 - vx0, vy1 - vy0);
    ctx.restore();
  }

  // VIGNETTE, screen space, map zoom only: darkened corners pull the eye
  // into the world and hide the dead frame edges the citadel ring cannot
  // fill. One radial gradient; play zoom stays clean.
  if (mapness > 0.1) {
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vg.addColorStop(1, `rgba(0, 0, 0, ${(0.38 * mapness).toFixed(3)})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  drawHud(scene);
}
