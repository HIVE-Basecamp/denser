/**
 * The globe (ticket 49): the world is a ball and the map turns it.
 *
 * Bryan's two conditions are the first two checks here. The resting map must
 * look exactly like the map has always looked ("you always have a starting
 * position where everything is seen how it is now"), and wherever the bug
 * stands must come round to the middle when you pull out ("wherever the bug
 * is, when you hit map you're always centred").
 */

import { PLANET } from '../lib/planet';
import {
  BOARD_LON,
  LAND_HOLD,
  globeRows,
  globeSegments,
  longitudeAt,
  project,
  rowHalfWidth,
  turnToward,
  unproject,
  wrapPi
} from '../lib/globe';
import { BODY_CELLS, sampleBodyPoint } from '../lib/landmass';
import { check, assert, near } from './harness';

/** A spread of spots on the ball, coasts and open water alike. */
const SPOTS: readonly [number, number][] = [
  [0, 0],
  [3000, 1200],
  [-4200, -2600],
  [7000, 500],
  [-7900, 0],
  [600, -6800],
  [-1500, 6400],
  [8083, 0]
];

export function globeChecks(): void {
  check('globe: at rest the map is exactly the map we already had', () => {
    for (const [x, y] of SPOTS) {
      const p = project(x, y, 0, 0);
      near(p.x, x, 0.001, `resting x at (${x}, ${y})`);
      assert(p.depth >= 0, `(${x}, ${y}) faces the viewer at rest`);
    }
    // Including the citadels, which stand off the ball past the limb.
    for (const x of [9400, -10200, 12000]) {
      near(project(x, 0, 0, 0).x, x, 0.001, `a tower at ${x} does not move at rest`);
    }
  });

  check('globe: turning to where the bug stands puts it in the middle', () => {
    for (const [x, y] of SPOTS) {
      if (rowHalfWidth(y) <= 0) continue;
      const turn = longitudeAt(x, y);
      near(project(x, y, turn, 0).x, 0, 0.001, `(${x}, ${y}) centred by its own turn`);
    }
  });

  check('globe: the old chain is the far side, not a card turned over', () => {
    // Facing the old chain head on, its own board is undistorted...
    for (const [x, y] of SPOTS) {
      const p = project(x, y, BOARD_LON.steem, BOARD_LON.steem);
      near(p.x, x, 0.001, `old chain at rest at (${x}, ${y})`);
      assert(p.depth >= 0, 'the old chain faces you when you have turned to it');
    }
    // ...and the living side is behind you.
    assert(project(0, 0, BOARD_LON.steem, BOARD_LON.hive).depth < 0, 'the living side is round the back');
  });

  check('globe: nothing on the ball is ever painted wider than the ball', () => {
    for (let t = -Math.PI; t <= Math.PI; t += 0.17) {
      for (const [x, y] of SPOTS) {
        const hw = rowHalfWidth(y);
        if (hw <= 0 || Math.abs(x) > hw) continue;
        const p = project(x, y, t, 0);
        assert(Math.abs(p.x) <= hw + 0.001, `x stays inside the limb at turn ${t.toFixed(2)}`);
      }
    }
  });

  check('globe: the cursor reads back onto the board it is standing on', () => {
    for (const t of [0, 0.3, 1.1, -0.8, 2.4, Math.PI]) {
      for (const [x, y] of SPOTS) {
        const hw = rowHalfWidth(y);
        if (hw <= 0 || Math.abs(x) >= hw - 1) continue;
        const p = project(x, y, t, 0);
        if (p.depth <= 0.02) continue;
        const back = unproject(p.x, y, t);
        if (!back) throw new Error('the cursor finds a board');
        assert(back.base === 0, `a living-side spot reads as the living side at turn ${t.toFixed(2)}`);
        near(back.x, x, 1, `the cursor lands back on (${x}, ${y}) at turn ${t.toFixed(2)}`);
      }
    }
  });

  check('globe: the far coast comes round the limb as the world turns', () => {
    // At rest none of the old chain shows; a quarter turn and half the face
    // is the old chain; facing it, all of it is.
    const share = (turn: number) => {
      const segs = globeSegments(turn, 40);
      let far = 0;
      let all = 0;
      for (const s of segs) {
        const w = Math.abs(s.view[s.view.length - 1] - s.view[0]);
        all += w;
        if (s.base !== 0) far += w;
      }
      return far / all;
    };
    near(share(0), 0, 0.001, 'nothing of the old chain shows at rest');
    near(share(Math.PI / 2), 0.5, 0.02, 'a quarter turn shows half of it');
    near(share(Math.PI), 1, 0.001, 'turned right round, it is all you see');
  });

  check('globe: the rows and the columns cover the ball with no gaps', () => {
    const rows = globeRows(30);
    near(rows[0], -PLANET.ry, 0.001, 'the rows start at the north pole');
    near(rows[rows.length - 1], PLANET.ry, 0.001, 'and end at the south');
    for (let i = 1; i < rows.length; i++) assert(rows[i] > rows[i - 1], 'the rows only ever go down');
    for (const turn of [0.4, 1.6, 3.0, -2.2]) {
      const segs = globeSegments(turn, 40);
      let edge = -1;
      for (const s of segs) {
        near(s.view[0], edge, 0.002, `run picks up where the last one left off at turn ${turn}`);
        edge = s.view[s.view.length - 1];
        for (let i = 1; i < s.view.length; i++) {
          assert(s.view[i] >= s.view[i - 1] - 1e-9, 'the screen side only ever goes right');
          assert(s.local[i] >= s.local[i - 1] - 1e-9, 'the board side only ever goes right');
        }
      }
      near(edge, 1, 0.002, `the runs reach the far limb at turn ${turn}`);
    }
  });

  check('globe: standing anywhere on the land, the map does not turn at all', () => {
    // Bryan, 2026-09-16: "if the bug is anywhere on the Hive logo the view
    // stays the same as always on the map." A thousand spots on the real
    // terrain, and not one of them may move the world.
    let rng = 12345;
    const rand = () => {
      rng = (rng * 1664525 + 1013904223) >>> 0;
      return rng / 4294967296;
    };
    for (let i = 0; i < 1000; i++) {
      const spot = sampleBodyPoint(rand);
      const turn = turnToward(spot.x, spot.y, LAND_HOLD.hive);
      assert(turn === 0, `on land at (${Math.round(spot.x)}, ${Math.round(spot.y)}) the world holds still`);
      near(project(spot.x, spot.y, turn, 0).x, spot.x, 0.001, 'and so the map is exactly the map we had');
    }
    // Every cell's own middle too, so no landmass is missed by sampling.
    for (const c of BODY_CELLS)
      assert(turnToward(c.x, c.y, LAND_HOLD.hive) === 0, 'every terrain cell holds still');
  });

  check('globe: leaving the land east or west turns the world, and only then', () => {
    const { min, max } = LAND_HOLD.hive;
    near(turnToward(min, 0, LAND_HOLD.hive), 0, 1e-9, 'the western shore is still the resting map');
    near(turnToward(max, 0, LAND_HOLD.hive), 0, 1e-9, 'so is the eastern one');
    let last = 0;
    for (let x = max; x <= PLANET.rx; x += 200) {
      const turn = turnToward(x, 0, LAND_HOLD.hive);
      assert(turn >= last - 1e-9, 'going east turns the world east, further every step');
      last = turn;
    }
    assert(last > 0.2, 'out at the eastern limb the world has really turned');
    last = 0;
    for (let x = min; x >= -PLANET.rx; x -= 200) {
      const turn = turnToward(x, 0, LAND_HOLD.hive);
      assert(turn <= last + 1e-9, 'and going west turns it west');
      last = turn;
    }
    assert(last < -0.2, 'out at the western limb too');
  });

  check('globe: an angle always comes back inside half a turn', () => {
    for (const a of [0, 3.1, 3.2, -3.2, 7, -7, Math.PI, -Math.PI]) {
      const w = wrapPi(a);
      assert(w > -Math.PI - 1e-9 && w <= Math.PI + 1e-9, `${a} wraps into range`);
      near(Math.sin(w), Math.sin(a), 1e-9, `${a} keeps its bearing`);
    }
  });
}
