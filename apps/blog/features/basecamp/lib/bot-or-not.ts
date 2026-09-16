/**
 * Bot or Not — what a player decided about one account, after looking at it.
 *
 * The shape, the storage and the honesty note all live in lib/verdicts.ts;
 * this file is only the game's own key and its own pair of words. The key is
 * the one the game shipped with and must not change: verdicts already saved in
 * a player's browser are found under it.
 */

import { createVerdictStore, type Verdict } from './verdicts';

export type BotOrNotChoice = 'bot' | 'not';

export type BotOrNotVerdict = Verdict<BotOrNotChoice>;

export const BOT_OR_NOT_CHOICES: readonly BotOrNotChoice[] = ['bot', 'not'];

const store = createVerdictStore<BotOrNotChoice>('basecamp.botOrNot.verdicts', BOT_OR_NOT_CHOICES);

export const readBotOrNotVerdicts = store.read;
export const findBotOrNotVerdict = store.find;
export const saveBotOrNotVerdict = store.save;
export const removeBotOrNotVerdict = store.remove;
