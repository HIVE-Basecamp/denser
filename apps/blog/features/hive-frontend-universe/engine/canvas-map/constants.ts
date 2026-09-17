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

/**
 * The most real pixels the map will ever draw in one frame.
 *
 * A canvas costs work per pixel, and a retina screen asks for four pixels per
 * pixel you can see. In its box on the page that is cheap. Full screen on a
 * large monitor it is not: the same drawing at 2560 by 1440 on a retina screen
 * is over fourteen million pixels a frame, the frame rate falls, and because
 * the clock is capped (see the frame step in `frame-loop.ts`) a slow frame
 * rate shows up as the bug walking in slow motion.
 *
 * So the sharpness gives way instead of the speed. Below this size nothing
 * changes and the map is drawn as sharp as the screen can show. Above it the
 * drawing is done at a slightly lower resolution and stretched to fit, which
 * costs a little crispness on a very big screen and keeps the game moving at
 * the speed it is supposed to move.
 */
export const MAX_CANVAS_PIXELS = 2_600_000;
/** Never drop below this many real pixels per shown pixel; softer than this looks broken. */
export const MIN_CANVAS_SCALE = 0.75;

/** Panel accent per landmark category, matching the map's colour language. */
export const CATEGORY_ACCENT: Record<string, string> = {
  tool: 'cyan',
  dapp: 'amber',
  governance: 'violet',
  info: 'emerald',
  arcade: 'rose',
  social: 'cyan'
};
