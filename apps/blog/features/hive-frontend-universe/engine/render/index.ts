'use client';

/**
 * Hive Frontend Universe — canvas rendering.
 *
 * Space and ocean mixed, since the stake tiers run plankton through whale.
 * Draws: a still starfield, transparent cubes at junctions (texture, obstacle
 * placeholders), wobbled curved lines, the operation flows painted from the
 * window's real counts, json factories, houses as bright blobs, field
 * landmarks in a per-category colour-and-shape language, the rim worlds (DHF
 * Fun Park, the witness towers) and community bubbles, the bug (kept exactly
 * as it was), a map marker so the player can always find themselves, and the
 * warp effect.
 *
 * Stake fog scales with `mapness`: weak up close so it never obscures the
 * lines, full on the pulled-out map where it reads as size.
 *
 * This was one 2515-line file until the tidy-up for dev review. `scene.ts`
 * still runs one draw pass in the same order; each band of it now lives in a
 * `layer-*.ts` beside it, reading the same frame numbers out of `Pass`.
 */

export { PALETTE, ACCENT_HEX, CATEGORY_HEX, BIG_SIZE } from './palette';
export { gridCellName } from './util';
export { drawScene } from './scene';
export type {
  RouteLayer,
  HouseVisual,
  LandmarkVisual,
  CommunityVisual,
  WitnessVisual,
  TrafficMarker,
  Camera,
  RenderScene
} from './types';
