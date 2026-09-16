/**
 * H.I.V.E.R. - the two sides of the world.
 *
 * Bryan's picture: the planet has a back. The rubble at the Steem Ruins'
 * door is the way round; park there and the planet turns. The far side is
 * the old chain: the busted Steem mark for land, the ruins on it, nothing
 * alive (lib/steem-side.ts).
 *
 * Bryan, 2026-09-15: "let's stop this flipping thing." It used to turn over
 * like a card, mirroring the whole board on the way. It is a ball now
 * (lib/globe.ts), so crossing over is a HALF TURN of the globe: the camera
 * pulls out, the world rolls round until the far coast is facing you, and
 * the camera drops back in. Pure and DOM-free; the animation lives in the
 * engine, the look in engine/render.
 */
import { BOARD_LON } from './globe';

export type BoardSide = 'hive' | 'steem';

/** The landmark that carries you round, both ways. */
export const FLIP_LANDMARK_ID = 'steem_ruins';

/** How long the world takes to roll round to the other side. */
export const TURN_SECONDS = 2.2;

export function otherSide(side: BoardSide): BoardSide {
  return side === 'hive' ? 'steem' : 'hive';
}

/** Where a side faces, in longitude: the living chain at 0, the old one behind. */
export function sideLongitude(side: BoardSide): number {
  return BOARD_LON[side];
}

/** A crossing in progress: the world rolling from one side to the other. */
export interface TurnState {
  /** 0 when the roll starts, 1 when it has landed. */
  t: number;
  to: BoardSide;
  /** Which way round the ball it is going: +1 east, -1 west. */
  dir: number;
  /** Where the globe was facing when the roll began, radians. Set by the loop. */
  start?: number;
}

/**
 * How far through the roll the far side takes over. Halfway: past the
 * quarter turn the old chain is the nearer face, so that is when the bug
 * is standing on it.
 */
export function sideAt(turn: TurnState): BoardSide {
  return turn.t >= 0.5 ? turn.to : otherSide(turn.to);
}

/** Eased progress, so the roll starts and stops gently instead of snapping. */
export function turnEase(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c < 0.5 ? 2 * c * c : 1 - 2 * (1 - c) * (1 - c);
}
