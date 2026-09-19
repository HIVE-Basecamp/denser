/**
 * Newbie or Not to Be — what a player made of somebody's very first post.
 *
 * Every other judging game asks about an account with a history behind it. A
 * first post has none: no run of writing to compare, no pattern of voting, no
 * week of behaviour. So this game asks a smaller and more honest question —
 * what do you make of THIS, the one thing they have written — and gives three
 * answers rather than two, because "I cannot tell" is the truthful answer far
 * more often here than it is anywhere else and hiding it would push players
 * into guessing.
 *
 * The three answers are stored in one bag of their own, exactly as the other
 * games store theirs: a player may think somebody is a bot here and not a sock
 * over there, and neither answer touches the other.
 *
 * WHERE IT GOES, HONESTLY: nowhere yet. It is kept in this browser and leaves
 * it never. See lib/verdicts.ts, which holds the same note and the shape.
 */

import { createVerdictStore, type Verdict } from './verdicts';

/**
 * - `legit`  — this reads like a real person arriving.
 * - `suspect`— a sock, a bot or an extractor. One button, because on a single
 *              post the three are rarely told apart, and a player forced to
 *              pick which would be guessing at the difference.
 * - `unsure` — cannot decide. A real answer, not a refusal to answer.
 */
export type NewbieChoice = 'legit' | 'suspect' | 'unsure';

export type NewbieVerdict = Verdict<NewbieChoice>;

export const NEWBIE_CHOICES: readonly NewbieChoice[] = ['legit', 'suspect', 'unsure'];

const store = createVerdictStore<NewbieChoice>('basecamp.newbieOrNot.verdicts', NEWBIE_CHOICES);

export const readNewbieVerdicts = store.read;
export const findNewbieVerdict = store.find;
export const saveNewbieVerdict = store.save;
export const removeNewbieVerdict = store.remove;
