import type { WorldEdge, WorldNode } from '../world';
import type { PlayerState } from '../movement';
import type { Camera, RenderScene } from './types';
import type { BoardSide } from '../../lib/board-side';

/**
 * One frame's shared working set, handed to every layer below.
 *
 * These were local variables inside one 1237-line `drawScene`. The layers are
 * the same code in the same order, reading the same numbers; this is the bag
 * they used to read them out of the enclosing scope. Nothing is recomputed
 * per layer, and the layers still run inside the one canvas transform
 * `drawScene` sets up, so the drawing is unchanged.
 */
export interface Pass {
  scene: RenderScene;
  ctx: CanvasRenderingContext2D;
  W: number;
  H: number;
  DPR: number;
  cam: Camera;
  nodes: WorldNode[];
  edges: WorldEdge[];
  player: PlayerState;
  time: number;
  mapness: number;
  /** Screen shake offsets for this frame. */
  sx: number;
  sy: number;
  z: number;
  /**
   * WHICH BOARD this pass is painting. With the globe turned, both are
   * painted in the same frame, each onto its own sheet: `scene.side` is
   * where the bug is standing, `side` is what is under the brush.
   */
  side: BoardSide;
  pad: number;
  zx: number;
  /** The viewport box in world space, padded. */
  vx0: number;
  vx1: number;
  vy0: number;
  vy1: number;
  /** True when a world point is inside the padded viewport. */
  vis: (x: number, y: number) => boolean;
  /** True when any part of an edge is inside the padded viewport. */
  edgeVis: (e: WorldEdge) => boolean;
}
