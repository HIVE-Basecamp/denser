import type { ComponentType } from 'react';
import type { BasecampAccent } from '../lib/theme';
import BuggerGame from './bugger-game';
import NewbieOrNotGame from './newbie-or-not-game';
import SockOrNotGame from './sock-or-not-game';
import SpotTheBotGame from './spot-the-bot-game';

/**
 * The Puppet Patrol games.
 *
 * Adding a game is two steps and touches nothing else:
 *   1. Create `games/<name>-game.tsx` rendering <GameComingSoon /> (copy an
 *      existing one — they are three lines).
 *   2. Add an entry below with a unique `accent` so it gets its own colour.
 *
 * The section renders its buttons and panels straight from this list, so the
 * selection logic never needs editing.
 */
export interface BasecampGame {
  id: string;
  /** Translation key under `basecamp.games.titles` for the game's name. */
  titleKey: string;
  /** Drives the button colour, so each game reads as its own thing. */
  accent: BasecampAccent;
  Component: ComponentType;
}

export const BASECAMP_GAMES: readonly BasecampGame[] = [
  { id: 'bugger', titleKey: 'bugger', accent: 'amber', Component: BuggerGame },
  { id: 'newbie_or_not', titleKey: 'newbie_or_not', accent: 'emerald', Component: NewbieOrNotGame },
  { id: 'sock_or_not', titleKey: 'sock_or_not', accent: 'cyan', Component: SockOrNotGame },
  { id: 'spot_the_bot', titleKey: 'spot_the_bot', accent: 'violet', Component: SpotTheBotGame }
  // (Hive Frontend Universe was promoted out of this row: it lives on the
  // Basecamp front page now as the H.I.V.E.R. tab, at Bryan's order.)
  //
  // CUT THE STRINGS is off the row until it is built (Bryan, 2026-09-19). A
  // button that leads to "coming soon" spends a player's attention and gives
  // nothing back, and it makes the row of real games look thinner than it is.
  // Nothing was deleted: `cut-the-strings-game.tsx` and its words are where
  // they were, so building it means putting one line back here.
  // { id: 'cut_the_strings', titleKey: 'cut_the_strings', accent: 'rose', Component: CutTheStringsGame },
];
