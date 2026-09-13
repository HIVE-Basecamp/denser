/**
 * H.I.V.E.R. — the new-posts challenge.
 *
 * Bryan (2026-09-12): a round's goal you can state in one line — visit every
 * new post on the board AND vote or reply on it. The game does neither for
 * you: it only READS the chain and notices (data/fetch-my-mark.ts). Voting
 * and replying happen on hive.blog, where they always did.
 *
 * Two halves per post, both needed:
 *   - VISITED: the bug parked at that house this round.
 *   - MARKED:  the player's handle is on the post's votes or in its replies.
 *
 * The marks seed from the board's own voter lists, so a post the player
 * voted on before the round started counts at once. After that the chain is
 * asked again when the bug parks, because the player may have just gone and
 * done it in another tab.
 */

import type { BoardHouse } from '../lib/board';

/** How long before the same post's marks are worth asking about again, ms. */
const ASK_AGAIN_MS = 8000;

export interface PostMarkState {
  /** The signed-in player, or '' when the handle is not known. */
  handle: string;
  /** Houses the bug has parked at this round. */
  visited: Set<number>;
  /** Houses carrying this player's vote or reply. */
  marked: Set<number>;
  /** When each house was last asked about, ms. */
  askedAt: Map<number, number>;
}

/**
 * A fresh challenge for this round, with the marks the board already knows
 * about filled in. No handle means no challenge: nothing can be marked.
 */
export function createPostMarks(handle: string | undefined, houses: readonly BoardHouse[]): PostMarkState {
  const state: PostMarkState = {
    handle: handle ?? '',
    visited: new Set(),
    marked: new Set(),
    askedAt: new Map()
  };
  if (!state.handle) return state;
  houses.forEach((h, i) => {
    if (h.voters.includes(state.handle)) state.marked.add(i);
  });
  return state;
}

/** Parking at a house counts as meeting the post. */
export function visitPost(state: PostMarkState, house: number): void {
  state.visited.add(house);
}

/**
 * Worth asking the chain about this post? Only for a known player, only for
 * a post not already marked, and never twice in a few seconds.
 */
export function shouldAskMark(state: PostMarkState, house: number, nowMs: number): boolean {
  if (!state.handle || state.marked.has(house)) return false;
  const last = state.askedAt.get(house);
  if (last !== undefined && nowMs - last < ASK_AGAIN_MS) return false;
  state.askedAt.set(house, nowMs);
  return true;
}

/** What the chain answered. Only a yes changes anything. */
export function applyMark(state: PostMarkState, house: number, voted: boolean, replied: boolean): void {
  if (voted || replied) state.marked.add(house);
}

/** Posts both visited and marked: the challenge's one number. */
export function postsMet(state: PostMarkState): number {
  let n = 0;
  state.visited.forEach((house) => {
    if (state.marked.has(house)) n++;
  });
  return n;
}
