/**
 * Reading a game controller (lib/pad.ts).
 *
 * A controller cannot be plugged into a headless run, so what is checked here
 * is the arithmetic between the controller and the game: the dead middle of a
 * stick, the shape of a full lean, the cross standing in for the stick, and
 * that an action fires on the press and not for as long as a button is held.
 */

import { DEFAULT_PAD_MAP, PAD_BUTTONS, crossVector, hatVector, padStick, wentDown } from '../lib/pad';
import { step } from '../lib/panel-focus';
import { assert, check, equal, near } from './harness';

/**
 * A run of buttons with only the named ones down.
 *
 * The LENGTH matters as much as what is pressed: it is how the reading tells
 * the standard button order (17 buttons, directions at 12 to 15) from the
 * Nintendo one (18, directions at 14 to 17), so each of these says which kind
 * of controller it is pretending to be.
 */
function downOf(count: number, ...on: number[]): boolean[] {
  const out = new Array<boolean>(count).fill(false);
  for (const i of on) out[i] = true;
  return out;
}
/** A controller using the standard button order. */
const standard = (...on: number[]): boolean[] => downOf(17, ...on);
/** A controller using the Nintendo order, as Bryan's does. */
const nintendo = (...on: number[]): boolean[] => downOf(18, ...on);
/** Enough buttons for the face-button checks, where the order does not matter. */
const down = standard;

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

  check('pad: the Cruceta walks the way the arrow keys do', () => {
    const left = crossVector(standard(14));
    equal(left.x, -1, 'the standard order pressed left');
    equal(left.y, 0, 'the standard order pressed left goes nowhere up or down');
    near(size(crossVector(standard(12, 15))), 1, 0.001, 'up and right together');
    equal(size(crossVector(standard())), 0, 'nothing pressed on the Cruceta');
  });

  check('pad: a Cruceta that sends one number instead of four buttons still walks', () => {
    // A hat runs clockwise from straight up at -1 round to 1.
    const up = hatVector(-1);
    equal(up.x, 0, 'hat up goes nowhere sideways');
    equal(up.y, -1, 'hat up goes up');
    near(size(hatVector(-0.429)), 1, 0.001, 'hat right is a full push');
    near(size(hatVector(-0.714)), 1, 0.001, 'hat up and right is not faster than straight');
    // Parked outside the circle is the cross at rest, which is how a hat says
    // "not pushed" - and the reason a naive reading walks the bug forever.
    equal(size(hatVector(3.2857)), 0, 'a parked hat stands still');
    equal(size(hatVector(undefined)), 0, 'a controller with no hat at all');
  });

  check('pad: a straight push on the Nintendo order is straight, not diagonal', () => {
    // The two orders OVERLAP - 14 is "left" in one and "up" in the other - so
    // only one may ever be read. Read both and a straight push walks the bug
    // diagonally, which is the bug these two checks exist to hold shut.
    const up = crossVector(nintendo(14));
    equal(up.x, 0, 'pushed up, and nowhere sideways');
    equal(up.y, -1, 'pushed up, fully');
    const right = crossVector(nintendo(17));
    equal(right.x, 1, 'pushed right, fully');
    equal(right.y, 0, 'pushed right, and nowhere up or down');
  });

  check('pad: the Cruceta and the hat never fight', () => {
    // Buttons win where there are buttons; the hat answers only in silence.
    const both = crossVector(standard(13), [0, 0, 0, 0, 0, 0, 0, 0, 0, -1]);
    equal(both.y, 1, 'a pressed button is not overruled by a hat');
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

/**
 * Moving around a card with a controller (lib/panel-focus.ts).
 *
 * The picking and the order are arithmetic and can be checked here; the
 * focusing itself needs a real page and cannot be.
 */
export function panelFocusChecks(): void {
  const items = ['a', 'b', 'c'] as unknown as HTMLElement[];

  check('card: nothing chosen yet lands on the first thing going forward', () => {
    equal(step(items, null, true), items[0], 'first forward');
  });

  check('card: nothing chosen yet lands on the last thing going back', () => {
    equal(step(items, null, false), items[2], 'first backward');
  });

  check('card: the choice wraps round at both ends', () => {
    equal(step(items, items[2], true), items[0], 'past the last comes the first');
    equal(step(items, items[0], false), items[2], 'before the first comes the last');
  });

  check('card: a card with nothing to press chooses nothing', () => {
    equal(step([], null, true), null, 'an empty card');
  });
}
