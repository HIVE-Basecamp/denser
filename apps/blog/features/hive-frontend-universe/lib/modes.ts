/**
 * H.I.V.E.R. — the four modes and the round clock. DOM-free.
 *
 * Bryan (2026-09-06): when you land at Basecamp you see a welcome, a clock
 * counting down to the next round, and a choice of four modes. The modes are
 * not finished. Each one changes one small, agreed thing today and grows later
 * (overview chart tickets 16 and 34):
 *   - explore:   roam; nothing sends the bug home.
 *   - curation:  live posts stand out; the place to go say hi.
 *   - adventure: the game side; consequences on; the DHF race lands here.
 *   - frontend:  the hive.blog pages stand out; use the map like the site.
 *
 * A ROUND is one 30-minute game. The code's "window" (lib/board.ts) is the
 * same thing; we say round when we talk.
 */

import { WINDOW_MS, windowStartFor } from './board';

export type GameMode = 'explore' | 'curation' | 'adventure' | 'frontend';

export interface GameModeDef {
  id: GameMode;
  labelKey: string;
  blurbKey: string;
  /** Accent colour, in the map's own colour language. */
  accent: string;
}

const KEY = 'hive_frontend_universe.modes';

export const GAME_MODES: readonly GameModeDef[] = [
  { id: 'explore', labelKey: `${KEY}.explore`, blurbKey: `${KEY}.explore_blurb`, accent: '#5df0ff' },
  { id: 'curation', labelKey: `${KEY}.curation`, blurbKey: `${KEY}.curation_blurb`, accent: '#ff5fd0' },
  { id: 'adventure', labelKey: `${KEY}.adventure`, blurbKey: `${KEY}.adventure_blurb`, accent: '#ff6a4d' },
  { id: 'frontend', labelKey: `${KEY}.frontend`, blurbKey: `${KEY}.frontend_blurb`, accent: '#ffd24a' }
];

/** Milliseconds until the next round starts. */
export function msToNextRound(nowMs: number): number {
  return windowStartFor(nowMs) + WINDOW_MS - nowMs;
}

/** "mm:ss", never negative. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Explore mode has no consequences (Bryan): the third hit clears instead of
 * sending the bug home. Before a mode is picked the game behaves as it
 * always has.
 */
export function modeHasConsequences(mode: GameMode | null): boolean {
  return mode !== 'explore';
}
