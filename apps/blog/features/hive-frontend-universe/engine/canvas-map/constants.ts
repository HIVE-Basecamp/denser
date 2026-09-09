/**
 * The handful of fixed numbers and strings the game shell reads. Moved out of
 * `canvas-map.tsx` whole in the tidy-up for dev review.
 */

export const MAX_TRAFFIC = 30;
/** The real record of the stake moving into the DHF: the HF24 post, October 2020. */
export const HF24_POST =
  'https://hive.blog/@hiveio/has-the-eclipse-happened-explaining-how-hive-hardforks-work-and-activating-hf24-on-october-14th';
/** Presses shorter than this are taps (keyboard M mirror of the button). */
export const TAP_MS = 250;

/** Panel accent per landmark category, matching the map's colour language. */
export const CATEGORY_ACCENT: Record<string, string> = {
  tool: 'cyan',
  dapp: 'amber',
  governance: 'violet',
  info: 'emerald',
  arcade: 'rose',
  social: 'cyan'
};
