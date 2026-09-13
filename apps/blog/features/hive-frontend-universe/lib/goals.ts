/**
 * H.I.V.E.R. — what you are doing this round. DOM-free.
 *
 * Bryan (2026-09-12): "in adventure mode it is not clear what the game is or
 * what you are meant to do; I picked it and still did not know." Explore mode
 * is a roam and needs no goals. Adventure mode is the game side, so it says
 * plainly what the round is for, at the welcome and in the HUD, with live
 * progress on every line.
 *
 * A first version, and deliberately made of things that already exist: the
 * DHF race, the newb trail, the helmets and the keep all kept counters
 * before this file; it gathers them, names them, and adds the one new
 * challenge (engine/post-marks.ts) — meet every new post this round.
 *
 * The game never writes to the chain. "Voted or replied" is READ from Hive.
 */

const KEY = 'hive_frontend_universe.goals';

export type GoalId = 'posts' | 'newbs' | 'race' | 'helmets' | 'keep';

export interface Goal {
  id: GoalId;
  /** The long line, for the welcome: what the goal actually asks of you. */
  labelKey: string;
  /** The short line, for the HUD. */
  shortKey: string;
  done: number;
  total: number;
  complete: boolean;
}

export interface GoalsInput {
  /** Posts both visited and voted-or-replied on, and how many there are. */
  postsMet: number;
  postsTotal: number;
  /** The newb trail: new users' posts visited, of those this round holds. */
  newbsVisited: number;
  newbsTotal: number;
  /** The DHF race: votes carried, the return line, and whether it funded. */
  raceCarried: number;
  raceLine: number;
  raceFunded: boolean;
  helmets: number;
  helmetTotal: number;
  /** The keep: whether the hoard has been set loose this round. */
  keepReleased: boolean;
}

function goal(id: GoalId, done: number, total: number, complete?: boolean): Goal {
  return {
    id,
    labelKey: `${KEY}.${id}`,
    shortKey: `${KEY}.${id}_short`,
    done,
    total,
    complete: complete ?? (total > 0 && done >= total)
  };
}

/**
 * The round's goals, in the order they are meant to be read: the two that
 * are about other people's posts first, then the three about the world.
 * A goal with nothing to do this round (no new users posted) is left out
 * rather than shown as an impossible 0 / 0.
 */
export function adventureGoals(input: GoalsInput): Goal[] {
  const out: Goal[] = [goal('posts', input.postsMet, input.postsTotal)];
  if (input.newbsTotal > 0) out.push(goal('newbs', input.newbsVisited, input.newbsTotal));
  out.push(goal('race', input.raceCarried, input.raceLine, input.raceFunded));
  out.push(goal('helmets', input.helmets, input.helmetTotal));
  out.push(goal('keep', input.keepReleased ? 1 : 0, 1, input.keepReleased));
  return out;
}
