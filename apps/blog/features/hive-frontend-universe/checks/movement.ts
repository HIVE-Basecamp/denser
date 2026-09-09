/**
 * The movement integrator. `movement.ts` is frozen, so these are the numbers
 * anything layering on top of it is allowed to assume.
 */

import { createPlayer, placeAt, railUpdate, driftUpdate, jump, posAt, MOVE } from '../engine/movement';
import type { Vec2 } from '../engine/movement';
import { world } from './world';
import { check, assert, equal, near, atMost } from './harness';

/** A junction with somewhere to go, so riding away from it is possible. */
function busyNode(): number {
  const id = world.nodes.findIndex((n) => n.kind === 'junction' && world.incident[n.id].length >= 2);
  if (id < 0) throw new Error('no junction with two lines');
  return id;
}

export function movementChecks(): void {
  check('movement: parking puts the bug on a line at one of its ends', () => {
    const p = createPlayer();
    placeAt(p, world.edges, world.incident, busyNode());
    equal(p.mode, 'rail', 'mode');
    assert(p.t === 0 || p.t === 1, `parked at t=${p.t}, expected an end`);
    const at: Vec2 = { x: 0, y: 0 };
    posAt(world.edges[p.edge], p.t, at);
    near(p.x, at.x, 0.001, 'x follows the line');
    near(p.y, at.y, 0.001, 'y follows the line');
  });

  check('movement: a push along the line moves the bug, and only along it', () => {
    const p = createPlayer();
    const node = busyNode();
    placeAt(p, world.edges, world.incident, node);
    const e = world.edges[p.edge];
    const a = { x: 0, y: 0 };
    const b = { x: 0, y: 0 };
    posAt(e, 0, a);
    posAt(e, 1, b);
    const push: Vec2 = { x: b.x - a.x, y: b.y - a.y };
    const len = Math.hypot(push.x, push.y);
    push.x /= len;
    push.y /= len;
    if (p.t === 1) {
      push.x = -push.x;
      push.y = -push.y;
    }
    const t0 = p.t;
    for (let i = 0; i < 30; i++) railUpdate(p, world.edges, world.incident, push, 1 / 60);
    assert(Math.abs(p.t - t0) > 0, 'the bug did not move');
    const on = { x: 0, y: 0 };
    posAt(world.edges[p.edge], p.t, on);
    near(p.x, on.x, 0.001, 'still on its line, x');
    near(p.y, on.y, 0.001, 'still on its line, y');
    equal(p.mode, 'rail', 'mode after riding');
  });

  check('movement: no push, no movement', () => {
    const p = createPlayer();
    placeAt(p, world.edges, world.incident, busyNode());
    const t0 = p.t;
    for (let i = 0; i < 60; i++) railUpdate(p, world.edges, world.incident, { x: 0, y: 0 }, 1 / 60);
    equal(p.t, t0, 'position with no input');
  });

  check('movement: a jump leaves the line with a fuel countdown', () => {
    const p = createPlayer();
    placeAt(p, world.edges, world.incident, busyNode());
    jump(p, world.edges, { x: 0, y: 0 });
    equal(p.mode, 'drift', 'mode after a jump');
    near(p.fuel, MOVE.DRIFT_TIME, 0.0001, 'fuel at take-off');
    // Take-off uses JUMPV, which is above the drift speed cap on purpose:
    // the cap applies to steering once you are out there, not to the leap.
    near(Math.hypot(p.vx, p.vy), MOVE.JUMPV, 0.001, 'take-off speed');
  });

  check('movement: drifting spends the fuel and never exceeds the drift speed', () => {
    const p = createPlayer();
    placeAt(p, world.edges, world.incident, busyNode());
    jump(p, world.edges, { x: 0, y: 0 });
    const fuel0 = p.fuel;
    let landed = false;
    for (let i = 0; i < 600 && p.mode === 'drift'; i++) {
      const r = driftUpdate(p, world.edges, { x: 0, y: 0 }, 1 / 60);
      atMost(Math.hypot(p.vx, p.vy), MOVE.DRIFT_MAX + 0.001, 'drift speed');
      if (r.landed) landed = true;
    }
    assert(p.fuel < fuel0, 'the fuel did not burn');
    assert(landed || p.mode === 'rail' || p.fuel <= 0, 'the drift neither landed nor ran out');
  });
}
