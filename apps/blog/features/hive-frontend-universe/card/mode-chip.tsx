'use client';

/**
 * H.I.V.E.R. — the mode chip, top right.
 *
 * Names the mode you are in and counts down to the next round. Tap it to
 * reopen the welcome and change mode. The canvas HUD (top left) repeats the
 * round clock so it is readable with the chip covered.
 */

import { useTranslation } from '@/blog/i18n/client';
import { GAME_MODES, formatCountdown, type GameMode } from '../lib/modes';
import { useRoundCountdown } from '../hooks/use-round-countdown';

export interface ModeChipProps {
  mode: GameMode;
  onChange: () => void;
}

export const ModeChip = ({ mode, onChange }: ModeChipProps) => {
  const { t } = useTranslation('common_blog');
  const left = useRoundCountdown();
  const def = GAME_MODES.find((m) => m.id === mode);
  const accent = def?.accent ?? '#e9f4f8';

  return (
    <button
      type="button"
      data-testid="hfu-mode-chip"
      onClick={onChange}
      aria-label={t('hive_frontend_universe.modes.change')}
      className="pointer-events-auto absolute right-3 top-3 z-20 flex items-center gap-2 rounded-full border bg-black/60 px-3 py-1.5 font-mono text-xs"
      style={{ borderColor: `${accent}80` }}
    >
      <span className="font-bold" style={{ color: accent }}>
        {def ? t(def.labelKey) : ''}
      </span>
      <span className="text-[#ffd24a]">{formatCountdown(left)}</span>
    </button>
  );
};
