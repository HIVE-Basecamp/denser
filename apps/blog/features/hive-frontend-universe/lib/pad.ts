/**
 * H.I.V.E.R. — reading a game controller.
 *
 * Pure. No browser, no canvas, no React: everything here turns numbers a
 * controller reports into the same movement and the same actions the keyboard
 * already produces. The polling itself lives in the frame loop, because a
 * controller is READ once a frame rather than sending events the way a key
 * does — the browser only updates it when you ask.
 *
 * WHICH BUTTON IS WHICH. A button's NAME is printed on the plastic. Its
 * NUMBER is what travels over the wire. Different people decide those two,
 * and they disagree more often than not, so no photograph and no manual can
 * settle a map — only pressing the buttons can.
 *
 * Bryan pressed them on 2026-09-17. His controller (a Steren GAM-200) sent
 * the right-hand face button as 0 and the left-hand one as 3, which is not
 * the order the standard asks for (A, B, X, Y) but the Nintendo one: B, A, Y,
 * X. That single fact identifies the whole order, so the rest of this list is
 * the Nintendo order too rather than four known entries and a shrug.
 *
 * The shoulders, Select, Start and the stick clicks sit in the same places in
 * both orders, so they were right all along. Two things do move, and both are
 * handled: Home comes in at 12 instead of 16, and the Cruceta is not a set of
 * buttons at all — see `crossVector`.
 */

/** What a controller can do in this game. Every one of these has a key too. */
export type PadAction = 'hop' | 'fire' | 'close' | 'map' | 'dashboard' | 'fullscreen' | 'grid' | 'mode';

/**
 * The standard button order, named for both label sets. The index is the
 * thing that matters; the names are for the controller card and for reading
 * this file.
 */
export const PAD_BUTTONS: readonly string[] = [
  'B', // 0  right face
  'A', // 1  bottom face
  'Y', // 2  top face
  'X', // 3  left face
  'L', // 4  top left shoulder
  'R', // 5  top right shoulder
  'ZL', // 6 lower left shoulder (analogue)
  'ZR', // 7 lower right shoulder (analogue)
  'Select', // 8  "minus" on a Nintendo controller
  'Start', // 9   "plus"
  'L3', // 10 press the left stick in
  'R3', // 11 press the right stick in
  'Home', // 12 often taken by the computer before the page ever sees it
  'Capture', // 13 the screenshot button, where there is one
  'Up', // 14 the Cruceta, WHERE it arrives as buttons at all
  'Down', // 15
  'Left', // 16
  'Right' // 17
];

/**
 * The Cruceta, if it arrives as buttons.
 *
 * Two places, because there are two habits. The standard order puts the four
 * directions at 12 to 15. The Nintendo order fills 12 and 13 with Home and
 * Capture and pushes the directions along to 14 to 17.
 *
 * The two OVERLAP, so they cannot both be read: 14 is "left" in one and "up"
 * in the other, and a reading that believed both would walk diagonally on a
 * straight push. One has to be chosen, and the controller chooses it by how
 * many buttons it says it has — see `crossButtons`.
 */
export const PAD_CROSS = { up: 12, down: 13, left: 14, right: 15 } as const;
export const PAD_CROSS_ALT = { up: 14, down: 15, left: 16, right: 17 } as const;

/**
 * Which of the two the controller is using.
 *
 * The standard order ends at 16, so a controller that reports MORE buttons
 * than that is not using it, and the only other habit puts the directions at
 * the end. It is one fact, read off the controller itself, rather than a
 * setting anyone has to know to change.
 */
export function crossButtons(buttonCount: number): typeof PAD_CROSS | typeof PAD_CROSS_ALT {
  return buttonCount > 17 ? PAD_CROSS_ALT : PAD_CROSS;
}

/**
 * The Cruceta, if it arrives as a HAT instead.
 *
 * This is the third habit, and the one no name could ever reveal: rather than
 * four buttons the controller sends ONE number saying which of eight ways the
 * cross is pushed, wrapped clockwise from straight up. Pushed nowhere, the
 * number is parked outside the range — which is why anything past the end of
 * the circle counts as at rest.
 */
export const PAD_HAT_AXIS = 9;
/** The eight ways a hat can point, clockwise from up, as lean. */
const HAT_WAYS: readonly PadVectorLike[] = [
  { x: 0, y: -1 }, // up
  { x: 1, y: -1 }, // up and right
  { x: 1, y: 0 }, // right
  { x: 1, y: 1 }, // down and right
  { x: 0, y: 1 }, // down
  { x: -1, y: 1 }, // down and left
  { x: -1, y: 0 }, // left
  { x: -1, y: -1 } // up and left
];
interface PadVectorLike {
  x: number;
  y: number;
}

/**
 * A hat's one number, read as a lean.
 *
 * The circle runs from -1 straight up round to 1, so eight steps of a quarter
 * apart. Anything outside that circle is the cross at rest.
 */
export function hatVector(value: number | undefined): PadVector {
  if (value === undefined || value < -1.05 || value > 1.05) return { x: 0, y: 0 };
  const way = HAT_WAYS[Math.round((value + 1) * 3.5) % HAT_WAYS.length];
  const m = Math.hypot(way.x, way.y);
  return m > 1 ? { x: way.x / m, y: way.y / m } : { x: way.x, y: way.y };
}

/**
 * Where each action sits by default.
 *
 * The thumb never leaves the face buttons for the three things done most:
 * hopping on A, firing on B, and the map on Y. Backing out sits on X, off to
 * the side, where a mis-hit costs nothing. L, R, ZL and ZR are deliberately
 * unused: they are the room left for whatever the adventure needs next.
 */
export const DEFAULT_PAD_MAP: Readonly<Record<PadAction, number>> = {
  hop: 1, // A
  fire: 0, // B — Bryan's call: the thumb rests here, and firing is the busy one
  close: 3, // X
  map: 2, // Y — held it peeks, tapped it opens
  dashboard: 9, // Start
  fullscreen: 8, // Select
  grid: 10, // L3
  mode: 11 // R3
};

/**
 * How far the stick must lean before the bug moves.
 *
 * A stick at rest never reads exactly zero — it wanders a little, and a worn
 * one wanders more. Under this the lean is ignored, so the bug stands still
 * when the controller is put down.
 */
export const PAD_DEADZONE = 0.18;

export interface PadVector {
  x: number;
  y: number;
}

/**
 * The lean of a stick, with the dead middle taken out.
 *
 * The leftover lean is stretched back over the whole range, so the very first
 * movement past the dead zone is a slow walk rather than a jump to a third of
 * full speed. Full lean in any direction is 1, and a diagonal is never faster
 * than a straight push.
 */
export function padStick(x: number, y: number): PadVector {
  const m = Math.hypot(x, y);
  if (m <= PAD_DEADZONE) return { x: 0, y: 0 };
  const scaled = Math.min(1, (m - PAD_DEADZONE) / (1 - PAD_DEADZONE));
  return { x: (x / m) * scaled, y: (y / m) * scaled };
}

/**
 * The Cruceta, read as a lean of 1, the way the arrow keys are.
 *
 * All three habits: the standard four buttons, the Nintendo four buttons, and
 * the hat. Which of the two button orders is in use is read off the
 * controller's own button count, and a controller with no direction buttons
 * at all falls through to the hat. Nothing has to be told which kind of
 * controller it is holding.
 */
export function crossVector(down: readonly boolean[], axes: readonly number[] = []): PadVector {
  const cross = crossButtons(down.length);
  let x = 0;
  let y = 0;
  if (down[cross.left]) x -= 1;
  if (down[cross.right]) x += 1;
  if (down[cross.up]) y -= 1;
  if (down[cross.down]) y += 1;
  // Silence on the buttons is where a hat gets its turn to answer.
  if (x === 0 && y === 0) return hatVector(axes[PAD_HAT_AXIS]);
  const m = Math.hypot(x, y);
  return m > 1 ? { x: x / m, y: y / m } : { x, y };
}

/**
 * The buttons that went down between one frame and the next.
 *
 * Actions fire on the press, once, not for as long as the button is held: a
 * held fire button is not a machine gun, the same rule the F key follows.
 */
export function wentDown(before: readonly boolean[], now: readonly boolean[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < now.length; i++) {
    if (now[i] && !before[i]) out.push(i);
  }
  return out;
}
