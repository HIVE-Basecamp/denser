/**
 * Sock or Not — what a player decided about one account, after looking at who
 * is paying for it.
 *
 * A sock is an account somebody runs alongside their own, and the question the
 * game asks is a money question: is this account's money coming from one place?
 * The verdict is stored exactly like Bot or Not's and in its own bag — a player
 * may well think an account is a sock and not a bot, or the other way round,
 * and neither answer should overwrite the other.
 */

import { createVerdictStore, type Verdict } from './verdicts';

export type SockOrNotChoice = 'sock' | 'not';

export type SockOrNotVerdict = Verdict<SockOrNotChoice>;

export const SOCK_OR_NOT_CHOICES: readonly SockOrNotChoice[] = ['sock', 'not'];

const store = createVerdictStore<SockOrNotChoice>('basecamp.sockOrNot.verdicts', SOCK_OR_NOT_CHOICES);

export const readSockOrNotVerdicts = store.read;
export const findSockOrNotVerdict = store.find;
export const saveSockOrNotVerdict = store.save;
export const removeSockOrNotVerdict = store.remove;
