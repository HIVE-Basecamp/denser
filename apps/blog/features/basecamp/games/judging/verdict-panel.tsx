'use client';

import { useEffect, useState } from 'react';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import { BASECAMP_MUTED } from '../../lib/theme';
import type { Verdict } from '../../lib/verdicts';

const BIG_BUTTON =
  'flex-1 rounded-2xl px-6 py-5 text-[26px] font-extrabold uppercase leading-none tracking-[0.1em] transition-all duration-150';

/**
 * The accusing button's colour. Each game gets its own so the two never blur
 * together in memory — a red BOT and an orange SOCK are different questions,
 * and the answer you are giving should be obvious from across the room.
 */
export type AccuseTone = 'red' | 'orange';

const ACCUSE_ON: Record<AccuseTone, string> = {
  red: 'border-0 bg-[#FF4D6D] text-[#2C0410] shadow-[0_0_34px_-8px_rgba(255,77,109,0.95)]',
  orange: 'border-0 bg-[#FFA23D] text-[#2A1402] shadow-[0_0_34px_-8px_rgba(255,162,61,0.95)]'
};

const ACCUSE_OFF: Record<AccuseTone, string> = {
  red: 'border-2 border-[#FF4D6D]/50 bg-[#FF4D6D]/10 text-[#FF8BA1] hover:border-[#FF4D6D] hover:bg-[#FF4D6D]/22',
  orange: 'border-2 border-[#FFA23D]/50 bg-[#FFA23D]/10 text-[#FFC98C] hover:border-[#FFA23D] hover:bg-[#FFA23D]/22'
};

const SAVE_BUTTON: Record<AccuseTone, string> = {
  red: 'bg-[#FF4D6D] text-[#2C0410] hover:bg-[#FF6E88]',
  orange: 'bg-[#FFA23D] text-[#2A1402] hover:bg-[#FFB866]'
};

const FOCUS_RING: Record<AccuseTone, string> = {
  red: 'focus:border-[#FF4D6D]/60',
  orange: 'focus:border-[#FFA23D]/60'
};

const CLEAR_ON = 'border-0 bg-[#5BE39C] text-[#032315] shadow-[0_0_34px_-8px_rgba(91,227,156,0.95)]';
const CLEAR_OFF =
  'border-2 border-[#5BE39C]/50 bg-[#5BE39C]/10 text-[#9CEFC4] hover:border-[#5BE39C] hover:bg-[#5BE39C]/22';

const WHY_FIELD =
  'w-full resize-none rounded-lg border border-white/10 bg-black/40 px-2.5 py-2 text-[12px] text-[#E8EDF5] outline-none transition-colors placeholder:text-[#5E6A7E]';

/** Each game's own words. Already translated: this component adds none of its own. */
export interface VerdictCopy {
  /** The accusing button — "BOT", "SOCK". */
  accuse: string;
  /** The clearing button. "NOT" in both games so far. */
  clear: string;
  whyLabel: string;
  whyPlaceholder: string;
  saidAccuse: string;
  saidClear: string;
}

interface VerdictPanelProps<TChoice extends string> {
  account: string;
  /** The verdict already on file for this account, if the player has been here. */
  existing: Verdict<TChoice> | null;
  /** The two answers, in this game's own words. */
  choices: { accuse: TChoice; clear: TChoice };
  copy: VerdictCopy;
  tone: AccuseTone;
  /** Called with the choice and the words; the words may be empty. */
  onDecide: (verdict: TChoice, why: string) => void;
  onSkip: () => void;
}

/**
 * Two buttons and one optional box.
 *
 * The accusing button opens a place to say why, because "why" is the part
 * worth collecting — if the same reasons keep coming back they become the
 * multiple-choice list later. But it is never obligatory: Save works with the
 * box empty, and a player who just wants to press it and move on can.
 *
 * The clearing button needs nothing. It means only "I don't think so", and the
 * game moves to the next account.
 */
function VerdictPanel<TChoice extends string>({
  account,
  existing,
  choices,
  copy,
  tone,
  onDecide,
  onSkip
}: VerdictPanelProps<TChoice>) {
  const { t } = useTranslation('common_blog');
  const [asking, setAsking] = useState(false);
  const [why, setWhy] = useState('');

  // A new account on the slab clears the half-written answer left on the last one.
  useEffect(() => {
    setAsking(false);
    setWhy(existing?.why ?? '');
  }, [account, existing]);

  const accused = existing?.verdict === choices.accuse;

  return (
    <div className="flex flex-col gap-3" data-testid="judging-verdict">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setAsking(true)}
          className={cn(BIG_BUTTON, asking || accused ? ACCUSE_ON[tone] : ACCUSE_OFF[tone])}
          data-testid="judging-accuse"
        >
          {copy.accuse}
        </button>
        <button
          type="button"
          onClick={() => onDecide(choices.clear, '')}
          className={cn(BIG_BUTTON, existing?.verdict === choices.clear ? CLEAR_ON : CLEAR_OFF)}
          data-testid="judging-clear"
        >
          {copy.clear}
        </button>
      </div>

      {asking ? (
        <div className="flex flex-col gap-2" data-testid="judging-why">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-[#B9C4D6]">{copy.whyLabel}</span>
            <textarea
              value={why}
              onChange={(event) => setWhy(event.target.value)}
              rows={3}
              placeholder={copy.whyPlaceholder}
              className={cn(WHY_FIELD, FOCUS_RING[tone])}
              data-testid="judging-why-box"
            />
          </label>
          <div className={cn(BASECAMP_MUTED, 'text-[10.5px] leading-snug')}>
            {t('basecamp.games.judging.why_optional')}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAsking(false)}
              className={cn(BASECAMP_MUTED, 'text-[11px] hover:text-[#E8EDF5]')}
            >
              {t('basecamp.games.judging.cancel')}
            </button>
            <button
              type="button"
              onClick={() => onDecide(choices.accuse, why.trim())}
              className={cn(
                'ml-auto rounded-full px-4 py-1.5 text-[12px] font-bold transition-all',
                SAVE_BUTTON[tone]
              )}
              data-testid="judging-save"
            >
              {t('basecamp.games.judging.save')}
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        {existing ? (
          <span className="text-[11px] font-semibold text-[#B9C4D6]" data-testid="judging-existing">
            {accused ? copy.saidAccuse : copy.saidClear}
          </span>
        ) : null}
        <button
          type="button"
          onClick={onSkip}
          className={cn(BASECAMP_MUTED, 'ml-auto text-[12px] underline-offset-2 hover:text-[#E8EDF5] hover:underline')}
          data-testid="judging-skip"
        >
          {t('basecamp.games.judging.skip')}
        </button>
      </div>

      <div className={cn(BASECAMP_MUTED, 'text-[10.5px] leading-snug')}>
        {t('basecamp.games.judging.where_it_goes')}
      </div>
    </div>
  );
}

export default VerdictPanel;
