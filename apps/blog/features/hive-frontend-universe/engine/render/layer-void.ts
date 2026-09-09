import { drawCube } from './decor';
import { ISLAND_CHIPS, STEEM_RUINS, TROLL_HOLES } from '../../lib/fixed-world';
import { drawGems } from '../gems';
import { drawIslandChip, drawSteemRuins, drawTrollHole } from '../icons';
import type { Pass } from './pass';

/**
 * The places that are not on a street: troll holes, the Steem Ruins, the
 * floating island chips, the gems and the cubes.
 */
export function drawVoidPlaces(p: Pass): void {
  const { scene, ctx, time, mapness, vis } = p;

  // Emperor J SON's troll holes, sunk into the terrain. The keep is a
  // landmark and draws itself; these are the in-land mouths of his network.
  for (const hole of TROLL_HOLES) {
    if (hole.id === 'json_keep' || !vis(hole.x, hole.y)) continue;
    drawTrollHole(ctx, hole.x, hole.y, time);
  }

  // THE STEEM RUINS: the old chain, dead and grey in the western void.
  // Scenery with a story; the hover chip and click live in canvas-map.
  if (vis(STEEM_RUINS.x, STEEM_RUINS.y)) {
    drawSteemRuins(ctx, STEEM_RUINS.x, STEEM_RUINS.y, 300, time);
  }

  // FLOATING ISLAND CHIPS: the planet's shed fragments, occupying the void
  // pockets Bryan circled. They grow with mapness like the big landmarks so
  // the pockets read as inhabited from the pulled-out map too.
  const chipScale = 1 + mapness * 2.6;
  for (let i = 0; i < ISLAND_CHIPS.length; i++) {
    const chip = ISLAND_CHIPS[i];
    if (!vis(chip.x, chip.y)) continue;
    drawIslandChip(ctx, chip.x, chip.y, chip.top, chip.kind, i, time, chipScale);
  }

  // GEMS: bold faceted eye candy along the rails and around the chips.
  if (scene.gems && mapness < 0.75) {
    drawGems(ctx, scene.gems, time, vis);
  }

  // Cubes: transparent, colourful, under the lines for depth.
  for (const c of scene.cubes) {
    if (!vis(c.x, c.y)) continue;
    drawCube(ctx, c);
  }
}
