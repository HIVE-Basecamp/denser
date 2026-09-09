import { drawBug } from './bug';
import { drawCombatOnBug, drawHazardsOnBug } from './bug-status';
import { avatarImage } from '../avatars';
import { drawBlocks } from '../blocks';
import { drawSuitBubble } from '../helmets';
import type { Pass } from './pass';

/**
 * What sits on top of the bug's own square of world: the blocks parked on
 * the lines, the bug itself, its worn helmet, and the warp spiral.
 */
export function drawBugLayer(p: Pass): void {
  const { scene, ctx, player, time, mapness, z, vis } = p;

  // BLOCKS on the lines, drawn late and opaque so they hide whatever passes
  // behind them; a drifting bug still sails over the top.
  if (scene.blocks && mapness < 0.7) {
    drawBlocks(ctx, scene.blocks, vis);
  }

  const bugX = scene.rideOverlay ? scene.rideOverlay.x : player.x;
  const bugY = scene.rideOverlay ? scene.rideOverlay.y : player.y;
  drawBug(
    ctx,
    player,
    time,
    bugX,
    bugY,
    scene.playerHandle ? avatarImage(scene.playerHandle) : null,
    scene.projectiles ? { x: scene.projectiles.aimX, y: scene.projectiles.aimY } : undefined
  );
  // The worn helmet resolves at play zoom only; below that the dome would
  // be sub-2px mush (LOD rule: identity survives, detail does not).
  if (scene.helmetState && z >= 0.22) {
    drawSuitBubble(ctx, bugX, bugY, scene.helmetState, time);
  }
  if (scene.hazards) {
    drawHazardsOnBug(ctx, scene.hazards, bugX, bugY, time);
  }
  if (scene.combat) {
    drawCombatOnBug(ctx, scene.combat, bugX, bugY, time);
  }

  // Warp effect: the SPIRAL, from the bike-wheel art brief. Three rotating
  // color arms unwinding outward as the effect fades: vibrant, one-shot,
  // and the only place these hues run at celebration volume in-world.
  if (scene.warpFx && scene.warpFx > 0) {
    const f = 1 - scene.warpFx;
    const ARMS = ['#FF6FB0', '#7FD9D2', '#FFD9A0'];
    ctx.lineCap = 'round';
    for (let arm = 0; arm < ARMS.length; arm++) {
      ctx.strokeStyle = ARMS[arm];
      ctx.globalAlpha = scene.warpFx * 0.85;
      ctx.lineWidth = 4.5 / Math.max(z, 0.1);
      ctx.beginPath();
      for (let s = 0; s <= 10; s++) {
        const tt = s / 10;
        const ang = arm * 2.094 + tt * 2.6 + f * 5;
        const rad = (14 + tt * (40 + f * 300)) / Math.max(z, 0.2);
        const px = player.x + Math.cos(ang) * rad;
        const py = player.y + Math.sin(ang) * rad;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}
