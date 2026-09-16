import { planetPath } from '../planet';
import { PLANET } from '../../lib/planet';
import { hash2 } from './util';
import type { Pass } from './pass';

/**
 * THE SURFACE OF THE SEA. Drawn on the board, not on the screen, so it turns
 * with the globe and gets squeezed toward the limb along with the coasts.
 *
 * Bryan, 2026-09-15: "in the map form it's not clear that it's ocean and
 * waves. I can see that there's a line that's moving, it's supposed to
 * represent waves, but it doesn't really do that."
 *
 * He was right, and the reason was that the swell was drawn as CONTINUOUS
 * lines running the width of the world. An unbroken line across a map is a
 * contour, or a route: the eye files it as information, not as water. Every
 * chart, globe and illustrated sea that reads as water at a distance does
 * the same thing instead, which is what is here now:
 *
 *   1. BROKEN CRESTS. Short dashes in staggered rows, never a line across.
 *      Each dash is drawn twice: a dark trough under a bright crest, which
 *      is what makes a mark read as a wave rather than a scratch.
 *   2. DEPTH. Big soft patches of lighter and darker water drifting under
 *      the crests, so the sea is not one flat colour with texture on it.
 *   3. GLINTS. A few crests catching the light, twinkling out of step.
 *
 * The dashes are LONG at play zoom and SHORT on the map: up close you are
 * among long rollers, from orbit you see flecks. One set of numbers does
 * both because everything here is measured in SCREEN px and divided by the
 * zoom, which is the rule for this whole sea (ART-DIRECTION.md).
 */

/**
 * Crest row spacing, SCREEN px, and the step the crest curve is sampled at.
 * WIDE at play zoom and TIGHT on the map, because a wave has a real size:
 * up close you are among a few long rollers, from orbit you are looking at a
 * whole ocean of them at once. One number each and the zoom picks.
 */
const SWELL_PLAY = 92;
const SWELL_MAP = 25;
const SWELL_STEP = 0.24;
/** How much of a dash slot is dash rather than gap, at play zoom and on the map. */
const DUTY_PLAY = 0.72;
const DUTY_MAP = 0.46;
/** How wide a dash slot is, as a fraction of the row spacing. */
const SLOT_PLAY = 0.62;
const SLOT_MAP = 0.9;
/** The soft patches of deeper and shallower water, SCREEN px. Play zoom only. */
const PATCH_PLAY = 320;

/** The crest height of the row at `ly` over the point `x`. */
function crestY(x: number, ly: number, wave: number, time: number, bow: number): number {
  const phase = ly * 0.0031;
  return (
    ly +
    Math.sin(x / (wave * 1.55) + time * 0.45 + phase) * wave * 0.23 +
    Math.sin(x / (wave * 0.52) - time * 0.8 + phase * 3) * wave * 0.07 +
    bow
  );
}

export function drawWaterLayer(p: Pass): void {
  const { ctx, time, mapness, z } = p;
  const zz = Math.max(z, 0.004);
  const wave = (SWELL_PLAY + (SWELL_MAP - SWELL_PLAY) * mapness) / zz;
  const step = wave * SWELL_STEP;
  const x0 = Math.max(p.vx0, -PLANET.rx);
  const x1 = Math.min(p.vx1, PLANET.rx);
  const y0 = Math.max(p.vy0, -PLANET.ry);
  const y1 = Math.min(p.vy1, PLANET.ry);
  if (x1 <= x0 || y1 <= y0) return;

  ctx.save();
  planetPath(ctx);
  ctx.clip();
  ctx.lineCap = 'round';

  // 1) DEPTH, AT PLAY ZOOM ONLY. Slow patches of lighter and darker water,
  // pinned to a coarse grid so they are the same patches every frame,
  // drifting, never popping.
  //
  // They FADE OUT as the map pulls back, and that is deliberate. A patch is
  // large, and the two hemispheres are painted from two different sheets
  // that meet on a seam: fine texture is squeezed to nothing at that seam
  // and crosses it invisibly, but a patch is wide enough to land half on one
  // side and half on the other and draw a hard edge down the ocean. The
  // large-scale shading of the ball belongs to the light, not to the
  // surface, so on the map it is the body's own gradient that does this job
  // (engine/planet.ts) and nothing here has to cross the seam.
  const pw = PATCH_PLAY / zz;
  if (mapness < 0.99) {
    ctx.globalAlpha = 0.2 * (1 - mapness);
    for (let cx = Math.floor(x0 / pw) - 1; cx <= Math.floor(x1 / pw) + 1; cx++) {
      for (let cy = Math.floor(y0 / pw) - 1; cy <= Math.floor(y1 / pw) + 1; cy++) {
        const h = hash2(cx * 13, cy * 17);
        if (h > 0.55) continue;
        const px = (cx + hash2(cx * 7, cy * 11)) * pw + Math.sin(time * 0.08 + h * 6.28) * pw * 0.2;
        const py = (cy + hash2(cx * 23, cy * 29)) * pw + Math.cos(time * 0.06 + h * 6.28) * pw * 0.15;
        const r = pw * (0.55 + h * 0.9);
        const light = h < 0.27;
        const g = ctx.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0, light ? 'rgba(96, 196, 224, 0.5)' : 'rgba(6, 22, 60, 0.55)');
        g.addColorStop(1, light ? 'rgba(96, 196, 224, 0)' : 'rgba(6, 22, 60, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(px, py, r, r * 0.6, 0, 0, 6.283);
        ctx.fill();
      }
    }
  }

  // The crests BOW toward the limb as the camera pulls out, so on the map
  // they read as water wrapping a ball rather than a flat pond.
  const bowAt = (x: number) => {
    const u = Math.min(1, Math.abs(x) / PLANET.rx);
    return mapness * PLANET.ry * 0.11 * (1 - Math.sqrt(Math.max(0, 1 - u * u)));
  };

  // 2) SWELL BANDS. Wide soft stripes of lighter water following the wave
  // fronts, one every other row. This is the thing that reads as OCEAN from
  // a distance, before any single wave does: the sea is rolling, not flat.
  const bands = new Path2D();
  const first = Math.floor(y0 / wave) * wave;
  const coarse = wave * 0.5;
  for (let ly = first; ly <= y1 + wave; ly += wave * 2) {
    let started = false;
    for (let x = x0 - coarse; x <= x1 + coarse; x += coarse) {
      const y = crestY(x, ly, wave, time, bowAt(x));
      if (!started) {
        bands.moveTo(x, y);
        started = true;
      } else bands.lineTo(x, y);
    }
    for (let x = x1 + coarse; x >= x0 - coarse; x -= coarse) {
      bands.lineTo(x, crestY(x, ly + wave, wave, time, bowAt(x)));
    }
    bands.closePath();
  }
  ctx.fillStyle = 'rgba(126, 206, 244, 1)';
  ctx.globalAlpha = 0.05 + 0.05 * mapness;
  ctx.fill(bands);

  // 3) BROKEN CRESTS. One path for every trough and one for every crest, so
  // the whole sea is two strokes however many dashes are in it.
  const duty = DUTY_PLAY + (DUTY_MAP - DUTY_PLAY) * mapness;
  const slot = wave * (SLOT_PLAY + (SLOT_MAP - SLOT_PLAY) * mapness);
  const trough = new Path2D();
  const crest = new Path2D();
  const glint = new Path2D();
  let rowIndex = 0;
  for (let ly = first; ly <= y1 + wave; ly += wave, rowIndex++) {
    // Alternate rows are offset half a slot, so the dashes never line up
    // into columns and the sea never reads as a weave.
    const stagger = (rowIndex % 2) * slot * 0.5 + Math.sin(time * 0.12 + rowIndex) * slot * 0.3;
    const sx = Math.floor((x0 - stagger) / slot) * slot + stagger;
    for (let x = sx; x <= x1 + slot; x += slot) {
      const h = hash2(Math.round(x / slot) * 3, rowIndex * 5);
      if (h > 0.92) continue;
      const half = slot * duty * 0.5 * (0.6 + h * 0.8);
      const ax = Math.max(x0 - step, x - half);
      const bx = Math.min(x1 + step, x + half);
      if (bx - ax < step * 0.4) continue;
      let started = false;
      for (let px = ax; px <= bx + 0.001; px += Math.min(step, bx - ax)) {
        const py = crestY(px, ly, wave, time, bowAt(px));
        if (!started) {
          crest.moveTo(px, py);
          trough.moveTo(px, py + wave * 0.22);
          started = true;
        } else {
          crest.lineTo(px, py);
          trough.lineTo(px, py + wave * 0.22);
        }
      }
      // A few crests catch the light and twinkle out of step with the rest.
      const tw = Math.sin(time * 1.9 + x * 0.004 + rowIndex * 2.1);
      if (tw > 0.72) {
        const gy = crestY(x, ly, wave, time, bowAt(x));
        glint.moveTo(x - half * 0.45, gy);
        glint.lineTo(x + half * 0.45, gy - wave * 0.02);
      }
    }
  }

  ctx.lineWidth = (2.6 - 0.9 * mapness) / zz;
  ctx.strokeStyle = 'rgba(2, 14, 44, 1)';
  ctx.globalAlpha = 0.34 + 0.4 * mapness;
  ctx.stroke(trough);

  ctx.lineWidth = (2.1 - 0.5 * mapness) / zz;
  ctx.strokeStyle = 'rgba(190, 234, 255, 1)';
  ctx.globalAlpha = 0.3 + 0.5 * mapness;
  ctx.stroke(crest);

  ctx.lineWidth = (3 - 0.9 * mapness) / zz;
  ctx.strokeStyle = 'rgba(248, 253, 255, 1)';
  ctx.globalAlpha = 0.45 + 0.45 * mapness;
  ctx.stroke(glint);

  ctx.globalAlpha = 1;
  ctx.restore();
}
