'use client';

/**
 * H.I.V.E.R. — the welcome at Basecamp.
 *
 * Shown when the stage mounts, which is the start of every round: a welcome,
 * the clock to the next round, and the four modes to pick from. Picking one
 * closes it; the mode chip (mode-chip.tsx) reopens it. Display and buttons
 * only; the game behind it keeps running.
 *
 * Bryan (2026-09-14): the adventure goals used to sit on this first page,
 * under the Adventure button, for everyone to see whether they picked
 * adventure or not. He wants them hidden until you actually click Adventure.
 * So picking Adventure no longer starts the round straight away — it swaps
 * this same panel to a second step showing the goals, with a button to
 * start and a button to go back to the four modes. The other three modes
 * are unchanged: one click starts them.
 */

import { useState } from 'react';
import { useTranslation } from '@/blog/i18n/client';
import { GAME_MODES, formatCountdown, type GameMode } from '../lib/modes';
import type { Goal } from '../lib/goals';
import { useRoundCountdown } from '../hooks/use-round-countdown';

export interface WelcomeRoomProps {
  onPick: (mode: GameMode) => void;
  /** What adventure mode asks of you this round, with progress (lib/goals.ts). */
  goals?: readonly Goal[];
}

/** One line per goal: a tick or a dot, the sentence, and the count. */
const GoalList = ({ goals }: { goals: readonly Goal[] }) => {
  const { t } = useTranslation('common_blog');
  return (
    <ul className="space-y-1.5 text-left">
      {goals.map((g) => (
        <li key={g.id} className="flex items-start gap-2 text-[11px] leading-snug">
          <span className={g.complete ? 'text-[#8cf5b0]' : 'text-[#8fa6b4]'}>{g.complete ? '✓' : '·'}</span>
          <span className="flex-1 text-[#bfd3dd]">{t(g.labelKey)}</span>
          <span className="font-mono text-[10px] text-[#8fa6b4]">
            {g.id === 'keep' ? '' : `${g.done} / ${g.total}`}
          </span>
        </li>
      ))}
    </ul>
  );
};

/**
 * Step two, only reachable by clicking Adventure: what the round asks of
 * you, then a choice to start it or go back to the four modes.
 */
const AdventureGoalsStep = ({
  goals,
  onStart,
  onBack
}: {
  goals: readonly Goal[];
  onStart: () => void;
  onBack: () => void;
}) => {
  const { t } = useTranslation('common_blog');
  return (
    <div data-testid="hfu-welcome-goals">
      <div className="font-mono text-sm font-bold text-[#ff6a4d]">
        {t('hive_frontend_universe.modes.adventure')}
      </div>
      <div className="mb-3 mt-2 rounded-xl border border-[#ff6a4d]/30 bg-[#ff6a4d]/[0.06] px-3 py-2">
        <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-wide text-[#ff9d86]">
          {t('hive_frontend_universe.goals.heading')}
        </div>
        <GoalList goals={goals} />
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          data-testid="hfu-adventure-start"
          onClick={onStart}
          className="rounded-xl border-2 bg-white/[0.03] px-4 py-2.5 font-mono text-sm font-bold text-[#ff6a4d] transition hover:bg-white/[0.08] active:bg-white/[0.12]"
          style={{ borderColor: '#ff6a4d66' }}
        >
          {t('hive_frontend_universe.modes.adventure_start')}
        </button>
        <button
          type="button"
          data-testid="hfu-adventure-back"
          onClick={onBack}
          className="rounded-xl px-4 py-2 font-mono text-xs text-[#8fa6b4] transition hover:text-[#bfd3dd]"
        >
          {t('hive_frontend_universe.modes.change')}
        </button>
      </div>
    </div>
  );
};

export const WelcomeRoom = ({ onPick, goals }: WelcomeRoomProps) => {
  const { t } = useTranslation('common_blog');
  const left = useRoundCountdown();
  const [showAdventureGoals, setShowAdventureGoals] = useState(false);

  const handlePick = (mode: GameMode) => {
    // Every mode but adventure starts on click, same as always. Adventure
    // instead opens the goals step; onPick('adventure') only fires from there.
    if (mode === 'adventure') {
      setShowAdventureGoals(true);
      return;
    }
    onPick(mode);
  };

  return (
    <div
      data-hfu-panel
      className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-4"
      data-testid="hfu-welcome"
    >
      <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#070a12]/95 p-5 text-center shadow-2xl">
        <div className="font-mono text-lg font-bold text-[#e9f4f8]">
          {t('hive_frontend_universe.modes.welcome')}
        </div>
        <div className="mt-1 font-mono text-sm text-[#ffd24a]" data-testid="hfu-round-clock">
          {t('hive_frontend_universe.modes.next_round', { time: formatCountdown(left) })}
        </div>
        {showAdventureGoals && goals ? (
          <div className="mt-4">
            <AdventureGoalsStep
              goals={goals}
              onStart={() => onPick('adventure')}
              onBack={() => setShowAdventureGoals(false)}
            />
          </div>
        ) : (
          <>
            <div className="mb-3 mt-4 text-xs text-[#8fa6b4]">{t('hive_frontend_universe.modes.pick')}</div>
            <div className="flex flex-col gap-2">
              {GAME_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  data-testid={`hfu-mode-${m.id}`}
                  onClick={() => handlePick(m.id)}
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
          </>
        )}
      </div>
    </div>
  );
};
