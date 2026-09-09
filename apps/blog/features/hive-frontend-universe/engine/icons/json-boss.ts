import { drawBossBackdrop, drawBossRock, drawBossRuin } from './json-boss-scene';
import { drawBossHydra } from './json-boss-hydra';
import { drawBossHoard, drawBossStorm } from './json-boss-storm';

/**
 * EMPEROR J SON, fourth design (pass 24). Bryan, pointing at the Cyclades
 * three-headed-dragon cover: "it should be distinct. like how the 3 headed
 * dragon photo where you see it on the rock floating. it should feel more
 * like that." So this is CREATURE-FIRST now: a three-headed JSON hydra
 * perched on the floating rock, wings half-spread, claws gripping the rock
 * edge, tail coiled around it, one head breathing green fire over the ruin
 * of the old keep, the hoard and the tribute march of stolen tokens at his
 * feet. The monster IS the landmark; the fortress is what he crushed.
 *
 * Modeling: tapered blob-chain necks (outline pass then body pass then a
 * thin belly highlight), three-tone violet forms, green membrane glow in
 * the wings, bloom behind every light. JSON identity: the glowing { } sigil
 * on the ruined tower, colon-and-quote marks on the chest, bracket-swept
 * horns.
 */
export function drawJsonBoss(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  R: number,
  time: number,
  /** 1 while the hoard is his; 0 once it has streamed away (engine/keep.ts). */
  hoard = 1
): void {
  const lw = Math.max(4, R * 0.05);
  ctx.save();
  ctx.translate(x, y);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  drawBossBackdrop(ctx, R, time);
  drawBossRock(ctx, R, time, lw);
  drawBossRuin(ctx, R, time, lw);
  drawBossHydra(ctx, R, time, lw);
  drawBossHoard(ctx, R, time, lw, hoard);
  drawBossStorm(ctx, R, time, lw);
  ctx.restore();
}
