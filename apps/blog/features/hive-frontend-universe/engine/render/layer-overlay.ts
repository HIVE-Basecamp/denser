import { drawHiveMark } from '../icons';
import { MONO, PALETTE } from './palette';
import { GRID_CELL, GRID_EXT } from './util';
import type { Pass } from './pass';

/**
 * The player marker on the map, and the planning grid.
 */
export function drawOverlays(p: Pass): void {
  const { scene, ctx, player, time, mapness, z, vx0, vx1, vy0, vy1 } = p;

  // The player marker on the map: always findable.
  if (mapness > 0.3) {
    const beat = 0.5 + Math.sin(time * 5) * 0.5;
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 0.5 + beat * 0.5;
    ctx.lineWidth = 2.5 / z;
    ctx.beginPath();
    ctx.arc(player.x, player.y, (16 + beat * 6) / z, 0, 6.283);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = PALETTE.hive;
    ctx.save();
    ctx.translate(player.x, player.y);
    // 12 (was 9): grown so the black Hive stripes stay legible on it.
    const s = 12 / z;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5 / z;
    ctx.stroke();
    // The black Hive stripes on the map marker too (Bryan's order covers
    // "the red diamond that represents the players location" at BOTH
    // zooms). Sized in screen space with the diamond, never mirrored.
    drawHiveMark(ctx, 0, 0, s * 1.05, '#141019');
    ctx.restore();
  }

  // THE PLANNING GRID (G key). Lines every 700 world px across the full
  // extent, every box lettered in its corner. A directing tool, not art:
  // it draws over the whole world and under the HUD, and vanishes with one
  // keypress for demo recordings.
  if (scene.debugGrid) {
    const CELL = GRID_CELL;
    const EXT = GRID_EXT;
    ctx.strokeStyle = 'rgba(140, 220, 255, 0.3)';
    ctx.lineWidth = 1.4 / Math.max(z, 0.04);
    ctx.beginPath();
    for (let gx = -EXT; gx <= EXT; gx += CELL) {
      if (gx < vx0 - CELL || gx > vx1 + CELL) continue;
      ctx.moveTo(gx, Math.max(-EXT, vy0));
      ctx.lineTo(gx, Math.min(EXT, vy1));
    }
    for (let gy = -EXT; gy <= EXT; gy += CELL) {
      if (gy < vy0 - CELL || gy > vy1 + CELL) continue;
      ctx.moveTo(Math.max(-EXT, vx0), gy);
      ctx.lineTo(Math.min(EXT, vx1), gy);
    }
    ctx.stroke();
    const fs = Math.min(240, 11 / Math.max(z, 0.04));
    ctx.font = `700 ${fs}px ${MONO}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(140, 220, 255, 0.75)';
    const c0 = Math.max(0, Math.floor((vx0 + EXT) / CELL));
    const c1 = Math.min(25, Math.floor((vx1 + EXT) / CELL));
    const r0 = Math.max(0, Math.floor((vy0 + EXT) / CELL));
    const r1 = Math.min(25, Math.floor((vy1 + EXT) / CELL));
    // At full map, 676 labels cost real frame time; every second box still
    // names every region (read the neighbour), so the wide view thins out.
    const step = c1 - c0 > 15 ? 2 : 1;
    for (let ci = c0; ci <= c1; ci += step) {
      for (let ri = r0; ri <= r1; ri += step) {
        ctx.fillText(
          `${String.fromCharCode(65 + ci)}-${ri + 1}`,
          -EXT + ci * CELL + fs * 0.3,
          -EXT + ri * CELL + fs * 0.25
        );
      }
    }
    // THE HOVERED BOX: highlighted, with its name drawn BIG in the middle
    // (Bryan has bad eyes; the corner labels are for orientation, this is
    // for reading). Screen-constant ~40px type at any zoom.
    if (scene.hoverGridCell) {
      const { ci, ri } = scene.hoverGridCell;
      const bx = -EXT + ci * CELL;
      const by = -EXT + ri * CELL;
      ctx.fillStyle = 'rgba(140, 220, 255, 0.14)';
      ctx.fillRect(bx, by, CELL, CELL);
      ctx.strokeStyle = 'rgba(140, 220, 255, 0.9)';
      ctx.lineWidth = 3.5 / Math.max(z, 0.04);
      ctx.strokeRect(bx, by, CELL, CELL);
      const bigFs = 40 / Math.max(z, 0.04);
      ctx.font = `800 ${bigFs}px ${MONO}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const name = `${String.fromCharCode(65 + ci)}-${ri + 1}`;
      ctx.lineWidth = bigFs * 0.14;
      ctx.strokeStyle = 'rgba(4, 3, 10, 0.9)';
      ctx.strokeText(name, bx + CELL / 2, by + CELL / 2);
      ctx.fillStyle = '#d6f2ff';
      ctx.fillText(name, bx + CELL / 2, by + CELL / 2);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
  }
}
