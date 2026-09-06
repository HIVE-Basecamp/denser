/**
 * H.I.V.E.R. - the two sides of the board.
 *
 * Bryan's picture: the map is a board with a back. The Steem Ruins are the
 * door; park there and the board flips. The back is the old chain: the same
 * board mirrored, drained of colour, nothing alive on it. Pure and DOM-free;
 * the animation lives in the engine, the look in render.ts.
 */

export type BoardSide = 'hive' | 'steem';

/** The landmark that flips the board, both ways. */
export const FLIP_LANDMARK_ID = 'steem_ruins';

/** How long the board takes to turn over. */
export const FLIP_SECONDS = 1.1;

/** How much the board shears at the midpoint of the turn. */
const FLIP_SKEW = 0.22;

export interface FlipState {
  /** 0 at the start of the turn, 1 when it has landed. */
  t: number;
  to: BoardSide;
}

export function otherSide(side: BoardSide): BoardSide {
  return side === 'hive' ? 'steem' : 'hive';
}

/** The resting horizontal view scale for a side: 1 front, -1 back. */
export function sideFlipX(side: BoardSide): number {
  return side === 'steem' ? -1 : 1;
}

/**
 * The view scale and shear part-way through a turn. From the front the
 * scale runs 1 to -1 along a cosine, so the midpoint is edge-on.
 */
export function flipView(flip: FlipState): { flipX: number; flipSkew: number } {
  const from = sideFlipX(otherSide(flip.to));
  return {
    flipX: from * Math.cos(Math.PI * flip.t),
    flipSkew: Math.sin(Math.PI * flip.t) * FLIP_SKEW * from
  };
}

/** The side that should be showing at this point of the turn. */
export function sideAt(flip: FlipState): BoardSide {
  return flip.t >= 0.5 ? flip.to : otherSide(flip.to);
}
