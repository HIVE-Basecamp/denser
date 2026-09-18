/**
 * H.I.V.E.R. — reading a game controller.
 *
 * Pure. No browser, no canvas, no React: everything here turns numbers a
 * controller reports into the same movement and the same actions the keyboard
 * already produces. The polling itself lives in the frame loop, because a
 * controller is READ once a frame rather than sending events the way a key
 * does — the browser only updates it when you ask.
 *
 * WHICH BUTTON IS WHICH. A controller that says its layout is "standard"
 * reports its buttons in a fixed order, and that order is what
 * `PAD_BUTTONS` names. Bryan's controller (a Steren GAM-200) carries Nintendo
 * labels — ZL, ZR, Cruceta, Select — over an Xbox arrangement, so the names
 * here carry both spellings. A controller that does NOT claim the standard
 * layout still gets read on the same indexes; it may land on the wrong
 * actions, and the controller card shows what is really arriving so the map
 * can be corrected rather than guessed at.
 */

/** What a controller can do in this game. Every one of these has a key too. */
export type PadAction = 'hop' | 'fire' | 'close' | 'map' | 'dashboard' | 'fullscreen' | 'grid' | 'mode';

/**
 * The standard button order, named for both label sets. The index is the
 * thing that matters; the names are for the controller card and for reading
 * this file.
 */
export const PAD_BUTTONS: readonly string[] = [
  'A', // 0  bottom face
  'B', // 1  right face
  'X', // 2  left face
  'Y', // 3  top face
  'L', // 4  top left shoulder
  'R', // 5  top right shoulder
  'ZL', // 6 lower left shoulder (analogue)
  'ZR', // 7 lower right shoulder (analogue)
  'Select', // 8
  'Start', // 9
  'L3', // 10 press the left stick in
  'R3', // 11 press the right stick in
  'Up', // 12 the cross / Cruceta
  'Down', // 13
  'Left', // 14
  'Right', // 15
  'Home' // 16 usually taken by the computer before the page ever sees it
];

/** Cross buttons, in the order up, down, left, right. */
export const PAD_CROSS = { up: 12, down: 13, left: 14, right: 15 } as const;

/**
 * Where each action sits by default.
 *
 * The thumb never leaves the face buttons for the three things done most:
 * hopping on A, firing on B, and the map on Y. Backing out sits on X, off to
 * the side, where a mis-hit costs nothing. L, R, ZL and ZR are deliberately
 * unused: they are the room left for whatever the adventure needs next.
 */
export const DEFAULT_PAD_MAP: Readonly<Record<PadAction, number>> = {
  hop: 0, // A
  fire: 1, // B — Bryan's call: the thumb rests here, and firing is the busy one
  close: 2, // X
  map: 3, // Y — held it peeks, tapped it opens
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

/** The cross, read as a lean of 1 the way the arrow keys are. */
export function crossVector(down: readonly boolean[]): PadVector {
  let x = 0;
  let y = 0;
  if (down[PAD_CROSS.left]) x -= 1;
  if (down[PAD_CROSS.right]) x += 1;
  if (down[PAD_CROSS.up]) y -= 1;
  if (down[PAD_CROSS.down]) y += 1;
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
