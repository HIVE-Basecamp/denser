/**
 * The world's own invariants, measured on a real build.
 *
 * `engine/world.ts` measures itself and reports in `world.stats`; this asks
 * for a world from one fixed round start and holds those numbers to the
 * README's promises. If generation changes, this tells on it.
 */

import { buildWorld } from '../engine/world';
import { MESH_MAX_DEGREE, MESH_MIN_ANGLE_DEG } from '../lib/mesh';
import { check, assert, equal, atMost, atLeast } from './harness';

/** One fixed round, so every run builds the identical world. */
export const WINDOW_START = 1_757_000_000_000;
export const HOUSE_COUNT = 26;

export const world = buildWorld(WINDOW_START, HOUSE_COUNT);

export function worldChecks(): void {
  check('world: the mesh is planar (zero crossings)', () => {
    equal(world.stats.crossings, 0, 'crossings');
  });

  check('world: no junction has more than four lines', () => {
    const worst = world.incident.reduce((m, lines) => Math.max(m, lines.length), 0);
    equal(MESH_MAX_DEGREE, 4, 'the max-degree constant');
    atMost(worst, 4, 'busiest junction');
  });

  check('world: lines leave a junction at least 35 degrees apart', () => {
    equal(MESH_MIN_ANGLE_DEG, 35, 'the min-angle constant');
    atLeast(world.stats.minAngleDeg, 35, 'narrowest angle');
  });

  check('world: it is a world, not an empty one', () => {
    atLeast(world.stats.junctions, 100, 'junctions');
    atLeast(world.stats.edges, 100, 'lines');
    atLeast(world.stats.houses, 1, 'houses');
  });

  check('world: the same round start builds the same world', () => {
    const again = buildWorld(WINDOW_START, HOUSE_COUNT);
    equal(again.nodes.length, world.nodes.length, 'node count');
    equal(again.edges.length, world.edges.length, 'line count');
    const drift = again.nodes.reduce(
      (m, n, i) => Math.max(m, Math.abs(n.x - world.nodes[i].x) + Math.abs(n.y - world.nodes[i].y)),
      0
    );
    assert(drift === 0, `nodes moved between builds by ${drift}px`);
  });
}
