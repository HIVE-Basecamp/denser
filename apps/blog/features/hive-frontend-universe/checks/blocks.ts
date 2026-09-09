/**
 * Blocks on the lines (ticket 17): a rail bug that pushes into one is
 * stopped, and a hop carries it over.
 */

import { placeBlocks, blockPlayer } from '../engine/blocks';
import { createPlayer } from '../engine/movement';
import { world, WINDOW_START } from './world';
import { check, assert, equal, atMost } from './harness';

const state = placeBlocks(world, WINDOW_START);

/** A player parked on the block's own line, just short of it. */
function bugBefore(edge: number, t: number) {
  const p = createPlayer();
  p.mode = 'rail';
  p.edge = edge;
  p.t = t;
  return p;
}

export function blockChecks(): void {
  check('blocks: some are placed, and only on ordinary streets', () => {
    assert(state.blocks.length > 0, 'no blocks placed at all');
    for (const b of state.blocks) {
      const e = world.edges[b.edge];
      equal(e.kind, 'mesh', `block on line ${b.edge} kind`);
      assert(world.incident[e.a].length >= 2, 'a block on a dead-end line');
      assert(world.incident[e.b].length >= 2, 'a block on a dead-end line');
    }
  });

  check('blocks: the same round places the same blocks', () => {
    const again = placeBlocks(world, WINDOW_START);
    equal(again.blocks.length, state.blocks.length, 'block count');
    const same = again.blocks.every((b, i) => b.edge === state.blocks[i].edge && b.t === state.blocks[i].t);
    assert(same, 'the blocks moved between builds of the same round');
  });

  check('blocks: a rail bug pushing into one is stopped at its edge', () => {
    const b = state.blocks[0];
    const s = placeBlocks(world, WINDOW_START);
    // Riding up to it from the low side, ending just inside its span.
    const p = bugBefore(b.edge, b.t - b.halfSpan * 0.5);
    s.prevMode = 'rail';
    blockPlayer(s, p, world.edges, 1 / 60);
    atMost(p.t, b.t - b.halfSpan, 'the bug was let through the block');
    equal(s.holdIdx, 0, 'the bug is held against the block');
  });

  check('blocks: a hop carries the bug over instead of into', () => {
    const b = state.blocks[0];
    const s = placeBlocks(world, WINDOW_START);
    // Landing from a hop, inside the span, having been heading up the line.
    const p = bugBefore(b.edge, b.t + b.halfSpan * 0.2);
    p.vx = 1;
    p.vy = 0;
    s.prevMode = 'drift';
    blockPlayer(s, p, world.edges, 1 / 60);
    assert(p.t <= b.t - b.halfSpan || p.t >= b.t + b.halfSpan, `landed inside the block at t=${p.t}`);
  });

  check('blocks: a drifting bug is never touched', () => {
    const b = state.blocks[0];
    const s = placeBlocks(world, WINDOW_START);
    const p = bugBefore(b.edge, b.t);
    p.mode = 'drift';
    const bumped = blockPlayer(s, p, world.edges, 1 / 60);
    equal(bumped, false, 'a drifting bug was bumped');
    equal(p.t, b.t, 'a drifting bug was moved');
  });
}
