'use client';

/**
 * H.I.V.E.R. — the full screen button, the very corner of the stage.
 *
 * Four corner brackets, the symbol every video player uses, pointing out
 * while the game is in its box and pointing in while it owns the screen. It
 * sits above the welcome as well as above play, so the round can be made big
 * before a mode is even picked.
 *
 * Drawn by hand rather than pulled from an icon set: it is eight strokes, and
 * the rest of this module draws its own art too.
 */

import { useTranslation } from '@/blog/i18n/client';

export interface FullscreenButtonProps {
  /** True while the game owns the screen; flips the arrows inwards. */
  on: boolean;
  onToggle: () => void;
}

/** Brackets pointing out of the corners: make this big. */
const OUT = 'M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5';
/** Brackets pointing into the corners: give the screen back. */
const IN = 'M8 3v5H3M21 8h-5V3M16 21v-5h5M3 16h5v5';

export const FullscreenButton = ({ on, onToggle }: FullscreenButtonProps) => {
  const { t } = useTranslation('common_blog');
  const label = t(on ? 'hive_frontend_universe.fullscreen.exit' : 'hive_frontend_universe.fullscreen.enter');

  return (
    <button
      type="button"
      data-testid="hfu-fullscreen"
      onClick={onToggle}
      aria-label={label}
      title={label}
      // z-40 puts it over the welcome (z-30), which is the one screen Bryan
      // asked to be able to blow up before play starts.
      className="pointer-events-auto absolute right-3 top-3 z-40 flex h-8 w-8 items-center justify-center rounded-full border border-[#5df0ff]/50 bg-black/60 text-[#5df0ff] transition-colors hover:bg-[#5df0ff]/15"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={on ? IN : OUT} />
      </svg>
    </button>
  );
};

export default FullscreenButton;
