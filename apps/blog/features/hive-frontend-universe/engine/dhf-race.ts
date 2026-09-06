/**
 * H.I.V.E.R. — THE DHF RACE (adventure mode).
 *
 * The first match built into the game (Bryan, 2026-09-06): getting enough
 * votes to be funded by the DHF is a race inside one round. The Hive truth
 * underneath: the Decentralized Hive Fund pays proposals ranked by
 * stake-weighted votes, and only the proposals above the return proposal
 * line get paid (research/02, section 3c). So:
 *   - Every house on the board holds one vote, weighted by the account's
 *     real stake tier (plankton 1 ... whale 5). Park at the house to take
 *     it. Once per round per house.
 *   - The RETURN LINE is a share of all the vote weight on the board.
 *   - Carry the votes to the DHF Fun Park. Above the line: FUNDED this round.
 *   - One funded per round. Solo today; with live players the first to
 *     deliver takes it (overview chart ticket 22).
 *   - The setback (third hit) drops the carried votes, like tokens, and the
 *     houses' votes come back so the round is not lost.
 *
 * Fiction only: in-game votes, no real votes, no real account judged.
 * Nothing persists; every round starts the race again. DOM-free, and
 * movement.ts untouched.
 */

/** Vote weight per stake tier, in TIERS order (board.ts). */
export const VOTE_WEIGHT_BY_TIER: readonly number[] = [1, 2, 3, 4, 5];
/** The return line, as a share of the board's total vote weight. */
const RETURN_LINE_SHARE = 0.4;
const MIN_LINE = 3;

export interface RaceState {
  /** Vote weight carried right now. */
  carried: number;
  /** All the vote weight on the board this round. */
  total: number;
  /** Weight needed at the park: the return proposal line. */
  line: number;
  /** House node ids whose vote is already taken this round. */
  taken: Set<number>;
  funded: boolean;
}

export function voteWeight(tier: number): number {
  return VOTE_WEIGHT_BY_TIER[Math.max(0, Math.min(VOTE_WEIGHT_BY_TIER.length - 1, tier))];
}

export function createRace(houseTiers: readonly number[]): RaceState {
  const total = houseTiers.reduce((sum, tier) => sum + voteWeight(tier), 0);
  const line = Math.max(MIN_LINE, Math.ceil(total * RETURN_LINE_SHARE));
  return { carried: 0, total, line, taken: new Set(), funded: false };
}

/** Park at a house: take its vote. Returns the weight taken, 0 if already taken. */
export function takeVote(state: RaceState, nodeId: number, tier: number): number {
  if (state.funded || state.taken.has(nodeId)) return 0;
  const w = voteWeight(tier);
  state.taken.add(nodeId);
  state.carried += w;
  return w;
}

/** Park at the DHF Fun Park. True when this delivery crosses the line. */
export function deliverVotes(state: RaceState): boolean {
  if (state.funded || state.carried < state.line) return false;
  state.funded = true;
  return true;
}

/**
 * The setback: carried votes drop, and the houses get their votes back, so
 * the race stays winnable after a fall (you walk the walk again, you do not
 * lose the round). Returns how much weight was lost.
 */
export function dropVotes(state: RaceState): number {
  const lost = state.carried;
  state.carried = 0;
  state.taken.clear();
  return lost;
}
