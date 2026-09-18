/**
 * Reading a game controller (lib/pad.ts).
 *
 * A controller cannot be plugged into a headless run, so what is checked here
 * is the arithmetic between the controller and the game: the dead middle of a
 * stick, the shape of a full lean, the cross standing in for the stick, and
 * that an action fires on the press and not for as long as a button is held.
 */

import { DEFAULT_PAD_MAP, PAD_BUTTONS, crossVector, padStick, wentDown } from '../lib/pad';
import { assert, check, equal, near } from './harness';

/** A full run of buttons with only the named ones down. */
function down(...on: number[]): boolean[] {
  const out = new Array<boolean>(PAD_BUTTONS.length).fill(false);
  for (const i of on) out[i] = true;
  return out;
}

const size = (v: { x: number; y: number }): number => Math.hypot(v.x, v.y);

export function padChecks(): void {
  check('pad: a stick left alone does not walk the bug', () => {
    const rest = padStick(0.1, -0.12);
    equal(rest.x, 0, 'a resting stick leans nowhere sideways');
    equal(rest.y, 0, 'a resting stick leans nowhere up or down');
  });

  check('pad: a full lean is the same full lean in every direction', () => {
    near(size(padStick(1, 0)), 1, 0.001, 'full lean right');
    near(size(padStick(0, -1)), 1, 0.001, 'full lean up');
    // A diagonal must not walk the bug faster than a straight push.
    near(size(padStick(0.8, 0.8)), 1, 0.001, 'full lean on the diagonal');
  });

  check('pad: the first push past the dead middle is a slow walk, not a jump', () => {
    const v = padStick(0.2, 0);
    assert(v.x > 0 && v.x < 0.1, `just past the dead middle should crawl, got ${v.x}`);
  });

  check('pad: the cross walks the way the arrow keys do', () => {
    const left = crossVector(down(14));
    equal(left.x, -1, 'the cross pressed left');
    equal(left.y, 0, 'the cross pressed left goes nowhere up or down');
    near(size(crossVector(down(12, 15))), 1, 0.001, 'up and right together');
    equal(size(crossVector(down())), 0, 'nothing pressed on the cross');
  });

  check('pad: an action fires on the press, not for as long as it is held', () => {
    const press = wentDown(down(), down(0));
    equal(press.length, 1, 'one button went down');
    equal(press[0], 0, 'and it was the first one');
    equal(wentDown(down(0), down(0)).length, 0, 'a held button fires nothing more');
    equal(wentDown(down(0), down()).length, 0, 'letting go fires nothing');
  });

  check('pad: no two actions sit on the same button', () => {
    const used = Object.values(DEFAULT_PAD_MAP);
    equal(new Set(used).size, used.length, 'buttons used once each');
    for (const b of used) assert(b < PAD_BUTTONS.length, `button ${b} is off the end of the controller`);
  });
}
