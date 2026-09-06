'use client';

/**
 * H.I.V.E.R. — the welcome at Basecamp.
 *
 * Shown when the stage mounts, which is the start of every round: a welcome,
 * the clock to the next round, and the four modes to pick from. Picking one
 * closes it; the mode chip (mode-chip.tsx) reopens it. Display and buttons
 * only; the game behind it keeps running.
 */

import { useTranslation } from '@/blog/i18n/client';
import { GAME_MODES, formatCountdown, type GameMode } from '../lib/modes';
import { useRoundCountdown } from '../hooks/use-round-countdown';

export interface WelcomeRoomProps {
  onPick: (mode: GameMode) => void;
}

export const WelcomeRoom = ({ onPick }: WelcomeRoomProps) => {
  const { t } = useTranslation('common_blog');
  const left = useRoundCountdown();

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-4"
      data-testid="hfu-welcome"
    >
      <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#070a12]/95 p-5 text-center shadow-2xl">
        <div className="font-mono text-lg font-bold text-[#e9f4f8]">{t('hive_frontend_universe.modes.welcome')}</div>
        <div className="mt-1 font-mono text-sm text-[#ffd24a]" data-testid="hfu-round-clock">
          {t('hive_frontend_universe.modes.next_round', { time: formatCountdown(left) })}
        </div>
        <div className="mb-3 mt-4 text-xs text-[#8fa6b4]">{t('hive_frontend_universe.modes.pick')}</div>
        <div className="flex flex-col gap-2">
          {GAME_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              data-testid={`hfu-mode-${m.id}`}
              onClick={() => onPick(m.id)}
              className="rounded-xl border-2 bg-white/[0.03] px-4 py-2.5 text-left transition hover:bg-white/[0.08] active:bg-white/[0.12]"
              style={{ borderColor: `${m.accent}66` }}
            >
              <span className="block font-mono text-sm font-bold" style={{ color: m.accent }}>
                {t(m.labelKey)}
              </span>
              <span className="block text-xs text-[#bfd3dd]">{t(m.blurbKey)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
