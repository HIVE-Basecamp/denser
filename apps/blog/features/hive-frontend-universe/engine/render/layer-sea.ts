import { drawSeaCreature } from '../icons/sea-life';
import type { Pass } from './pass';

/**
 * WHAT SWIMS IN THE WATER. The stake ladder made literal: redfish and
 * dolphins for company, orcas and whales that hunt (engine/sea.ts).
 *
 * Gameplay only, on Bryan's order ("they don't need to be in the map view,
 * just in the gameplay"): they fade out as the camera pulls back and are
 * gone well before the pulled-out map, where a whale would be a smudge over
 * the routes and an orca a black speck.
 *
 * Two calls, because the swallow has to read: `drawSeaLife` paints everyone
 * EXCEPT whoever currently has the bug in its mouth, under the land and the
 * routes; `drawSwallower` paints that one afterwards, over the bug, so the
 * jaws visibly close around it.
 */

/** Fully present below this, gone above it. */
const FADE_IN = 0.34;
const FADE_OUT = 0.6;

function presence(mapness: number): number {
  if (mapness >= FADE_OUT) return 0;
  if (mapness <= FADE_IN) return 1;
  return 1 - (mapness - FADE_IN) / (FADE_OUT - FADE_IN);
}

export function drawSeaLife(p: Pass): void {
  const { scene, ctx, time, mapness, vis } = p;
  const sea = scene.sea;
  if (!sea) return;
  const here = presence(mapness);
  if (here <= 0) return;

  const holder = sea.swallow ? sea.swallow.by : -1;
  for (let i = 0; i < sea.creatures.length; i++) {
    if (i === holder) continue;
    const c = sea.creatures[i];
    // Generous cull: the body reaches well past its centre.
    if (!vis(c.x, c.y) && !vis(c.x + c.size * 1.4, c.y) && !vis(c.x - c.size * 1.4, c.y)) continue;
    // The big ones sit deeper in the water, so the sea still reads as the
    // thing you are looking through. Hunting brings one up and brightens it.
    const base = c.kind === 'redfish' ? 0.62 : c.kind === 'dolphin' ? 0.7 : c.kind === 'orca' ? 0.82 : 0.76;
    const alpha = here * (base + (c.hunt > 0 ? 0.18 : 0));
    drawSeaCreature(ctx, c.kind, c.x, c.y, c.size, c.dir, alpha, time, c.seed, c.gape);
  }
}

/** The one with the bug in its mouth, drawn last so the jaws close over it. */
export function drawSwallower(p: Pass): void {
  const { scene, ctx, time, mapness } = p;
  const sea = scene.sea;
  if (!sea || !sea.swallow) return;
  const c = sea.creatures[sea.swallow.by];
  if (!c) return;
  const here = Math.max(presence(mapness), 0.6);
  drawSeaCreature(ctx, c.kind, c.x, c.y, c.size, c.dir, here, time, c.seed, c.gape);

  // A ring of bubbles where the bug went in: the only sign left once the
  // mouth is shut. No words; the picture is the whole message.
  const f = sea.swallow.t;
  if (f > 0.45) {
    const spread = (f - 0.45) * 2;
    ctx.strokeStyle = 'rgba(214, 244, 255, 1)';
    ctx.lineWidth = 2.4;
    for (let b = 0; b < 7; b++) {
      const a = b * 0.897 + c.seed;
      const r = c.size * (0.5 + spread * 0.9);
      ctx.globalAlpha = Math.max(0, 0.75 - spread * 0.75) * (0.6 + Math.sin(b * 2.1 + time * 6) * 0.4);
      ctx.beginPath();
      ctx.arc(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, c.size * 0.07 + b * 1.4, 0, 6.283);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}
