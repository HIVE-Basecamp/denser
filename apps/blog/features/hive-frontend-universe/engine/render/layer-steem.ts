import { BLURT_ISLAND, STEEM_DISTRICT, STEEM_LAND } from '../../lib/steem-side';
import { drawSteemLand } from '../steem-land';
import { drawBlurtIsland, drawSteemRuins } from '../icons';
import type { Pass } from './pass';

/**
 * THE BACK OF THE PLANET, the old chain. The Steem mark is the land there,
 * busted; the rusted tracks the bug still rides are what is left of the
 * streets; the ruined district stands on the right stroke and the Blurt
 * island lies off the coast. Nothing of the living side shows.
 */
export function drawSteemSide(p: Pass): void {
  const { ctx, edges, time, mapness, z, flipX, edgeVis, vis } = p;

  // The back is seen mirrored (the world turned over), but a mark is never
  // drawn backwards: the land and the island turn the right way round about
  // their own centres, squashed with the turn like everything else.
  const rightWayRound = (cx: number, cy: number, draw: () => void) => {
    ctx.save();
    if (flipX < 0) {
      ctx.translate(cx, cy);
      ctx.scale(-1, 1);
      ctx.translate(-cx, -cy);
    }
    draw();
    ctx.restore();
  };

  rightWayRound(STEEM_LAND.x, STEEM_LAND.y, () => drawSteemLand(ctx, mapness, z));

  // THE RUSTED TRACKS: the same streets as the living side, dead. One
  // stroke, faint and rust-coloured, so the land stays the thing you see
  // and a bug on the back still knows where it can ride.
  const stride = z < 0.1 ? 8 : z < 0.3 ? 4 : 2;
  ctx.strokeStyle = '#7a5238';
  ctx.globalAlpha = 0.16 + 0.1 * (1 - mapness);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'bevel';
  ctx.lineWidth = (z < 0.12 ? 2.4 : 3.2) / Math.max(z, 0.05);
  ctx.beginPath();
  for (const e of edges) {
    if (!edgeVis(e)) continue;
    ctx.moveTo(e.pts[0], e.pts[1]);
    for (let i = stride; i < e.pts.length - 2; i += stride) ctx.lineTo(e.pts[i], e.pts[i + 1]);
    ctx.lineTo(e.pts[e.pts.length - 2], e.pts[e.pts.length - 1]);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;

  if (vis(STEEM_DISTRICT.x, STEEM_DISTRICT.y)) {
    rightWayRound(STEEM_DISTRICT.x, STEEM_DISTRICT.y, () =>
      drawSteemRuins(ctx, STEEM_DISTRICT.x, STEEM_DISTRICT.y, STEEM_DISTRICT.r, time)
    );
  }
  if (vis(BLURT_ISLAND.x, BLURT_ISLAND.y)) {
    rightWayRound(BLURT_ISLAND.x, BLURT_ISLAND.y, () =>
      drawBlurtIsland(ctx, BLURT_ISLAND.x, BLURT_ISLAND.y, BLURT_ISLAND.r, time, z)
    );
  }
}
