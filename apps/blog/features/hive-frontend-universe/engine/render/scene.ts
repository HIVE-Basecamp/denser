import { drawPlanetBody, drawPlanetLight } from '../planet';
import { PALETTE } from './palette';
import { drawSky, drawNebulae } from './sky';
import { drawHud } from './hud';
import type { Pass } from './pass';
import type { RenderScene } from './types';
import type { BoardSide } from '../../lib/board-side';
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
import { drawSeaLife, drawSwallower } from './layer-sea';
import { drawWaterLayer } from './layer-water';
import { drawOverlays } from './layer-overlay';
import { drawSteemSide } from './layer-steem';
import { blitGlobe, globeSheets } from './globe';
import { wrapPi } from '../../lib/globe';
import { PLANET } from '../../lib/planet';

/** Closer to the face than this and the globe is drawn flat, with no warp. */
const REST = 0.004;
/** A sliver of the far board narrower than this is not worth painting, screen px. */
const SLIVER = 3;

export function drawScene(scene: RenderScene): void {
  const { ctx, W, H, DPR, cam, time, mapness } = scene;

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
  const pad = 320 / z;
  const vx0 = cam.x - W / 2 / z - pad;
  const vx1 = cam.x + W / 2 / z + pad;
  const vy0 = cam.y - H / 2 / z - pad;
  const vy1 = cam.y + H / 2 / z + pad;

  /** Put a context into world space: the same frame the board is painted in. */
  const intoWorld = (c: CanvasRenderingContext2D, ox: number, oy: number) => {
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.translate(W / 2 + ox, H / 2 + oy);
    c.scale(z, z);
    c.translate(-cam.x, -cam.y);
  };

  // THE SKY AND THE BODY OF THE SEA are the light on the ball, not the
  // surface of it: they belong to the viewer, so they do not turn with the
  // globe and are painted straight onto the screen.
  ctx.save();
  intoWorld(ctx, sx, sy);
  drawSky(ctx, time, z, vx0, vy0, vx1, vy1);
  drawNebulae(ctx, vx0, vy0, vx1, vy1);
  drawPlanetBody(ctx, mapness);
  // At play zoom the glitter, the night and the sheen sit UNDER the board,
  // exactly as they always did; on the map they move over it (see below) so
  // the turning ball gets a terminator that darkens the land too.
  drawPlanetLight(ctx, mapness, 1 - mapness);
  ctx.restore();

  // THE TURN (lib/globe.ts). 0 looks the living chain in the face, PI looks
  // at the old chain on the far side, and everything between is the world
  // rolling under you.
  const spin = wrapPi(scene.turn ?? 0);
  const atRest = Math.abs(spin) < REST ? 'hive' : Math.abs(Math.abs(spin) - Math.PI) < REST ? 'steem' : null;
  const sheets = atRest ? null : globeSheets(W, H, DPR);

  const makePass = (c: CanvasRenderingContext2D, side: BoardSide, ox: number, oy: number): Pass => ({
    scene,
    ctx: c,
    W,
    H,
    DPR,
    cam,
    nodes: scene.nodes,
    edges: scene.edges,
    player: scene.player,
    time,
    mapness,
    sx: ox,
    sy: oy,
    z,
    side,
    pad,
    zx: z,
    vx0,
    vx1,
    vy0,
    vy1,
    vis: (x: number, y: number) => x > vx0 && x < vx1 && y > vy0 && y < vy1,
    edgeVis: (e: WorldEdge) => {
      const m = e.pts.length;
      const minX = Math.min(e.pts[0], e.pts[m - 2]) - e.len * 0.3;
      const maxX = Math.max(e.pts[0], e.pts[m - 2]) + e.len * 0.3;
      const minY = Math.min(e.pts[1], e.pts[m - 1]) - e.len * 0.3;
      const maxY = Math.max(e.pts[1], e.pts[m - 1]) + e.len * 0.3;
      return maxX > vx0 && minX < vx1 && maxY > vy0 && minY < vy1;
    }
  });

  if (atRest || !sheets) {
    const side: BoardSide = atRest ?? (Math.abs(spin) < Math.PI / 2 ? 'hive' : 'steem');
    ctx.save();
    intoWorld(ctx, sx, sy);
    drawBoard(makePass(ctx, side, sx, sy));
    ctx.restore();
  } else {
    // THE WORLD IS TURNED. Each board is painted flat onto its own sheet and
    // then squeezed onto the ball in rows (render/globe.ts). A board whose
    // visible sliver is thinner than a few pixels is not painted at all.
    const hiveW = PLANET.rx * (1 + Math.cos(spin)) * z;
    const steemW = PLANET.rx * (1 - Math.cos(spin)) * z;
    const paint = (sheet: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }, side: BoardSide) => {
      const c = sheet.ctx;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, sheet.canvas.width, sheet.canvas.height);
      intoWorld(c, 0, 0);
      drawBoard(makePass(c, side, 0, 0));
      return sheet.canvas;
    };
    const hive = hiveW > SLIVER ? paint(sheets.hive, 'hive') : null;
    const steem = steemW > SLIVER ? paint(sheets.steem, 'steem') : null;
    blitGlobe({
      ctx,
      hive,
      steem,
      turn: spin,
      W,
      H,
      DPR,
      z,
      camX: cam.x,
      camY: cam.y,
      sx,
      sy,
      vx0,
      vx1,
      vy0,
      vy1
    });
  }

  // The light on top, on the map: the terminator falls across the land as
  // well as the water, which is what makes the ball read as round.
  ctx.save();
  intoWorld(ctx, sx, sy);
  drawPlanetLight(ctx, mapness, mapness);
  ctx.restore();

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  // VIGNETTE, screen space, map zoom only: darkened corners pull the eye
  // into the world and hide the dead frame edges the citadel ring cannot
  // fill. One radial gradient; play zoom stays clean.
  if (mapness > 0.1) {
    const vg = ctx.createRadialGradient(
      W / 2,
      H / 2,
      Math.min(W, H) * 0.45,
      W / 2,
      H / 2,
      Math.max(W, H) * 0.75
    );
    vg.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vg.addColorStop(1, `rgba(0, 0, 0, ${(0.38 * mapness).toFixed(3)})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  drawHud(scene);
}

/**
 * ONE BOARD, painted flat in world space. Called straight onto the screen
 * when the globe is at rest, and onto an off-screen sheet when it is turned.
 */
function drawBoard(p: Pass): void {
  if (p.side === 'steem') {
    // THE FAR SIDE OF THE PLANET is the old chain: the busted Steem mark for
    // land, the rusted tracks, the ruins and the Blurt island
    // (layer-steem.ts). Nothing of the living side is drawn; the bug alone
    // still rides.
    drawWaterLayer(p);
    drawSteemSide(p);
    if (p.scene.side === 'steem') {
      drawBugLayer(p);
      drawOverlays(p);
    }
    return;
  }
  // THE SURFACE OF THE SEA goes down first: it is on the ball, so it turns
  // with the coasts that sit in it (layer-water.ts).
  drawWaterLayer(p);
  // THE SEA'S OWN POPULATION next, so the coasts and everything travelable
  // sit over it: a whale passes UNDER the land it swims past.
  drawSeaLife(p);
  drawGroundLayer(p);
  drawWitnessRing(p);
  drawVoidPlaces(p);
  drawRails(p);
  drawTraffic(p);
  drawNodes(p);
  drawBuzzingStation(p);
  drawLandmarks(p);
  drawCommunities(p);
  if (p.scene.side === 'hive') drawBugLayer(p);
  // The one with the bug in its mouth, over the bug (layer-sea.ts).
  drawSwallower(p);
  // The bug's own marker and the planning grid belong to the board the bug
  // is standing on, never to the one that has turned away behind it.
  if (p.scene.side === 'hive') drawOverlays(p);
}
