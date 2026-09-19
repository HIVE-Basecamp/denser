'use client';

import { useEffect, useState } from 'react';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import { BASECAMP_MUTED } from '../../lib/theme';
import type { NewbieChoice, NewbieVerdict } from '../../lib/newbie-or-not';

/**
 * Three buttons, not two.
 *
 * The other judging games ask a yes-or-no about an account with a history
 * behind it. This one asks about a single post by somebody who has written
 * nothing else, where "I cannot tell" is often the only honest answer. Left
 * out, that answer becomes a guess pressed onto one of the other two, and a
 * guess recorded as a judgement is worse than no judgement.
 *
 * All three open the same box to say why, including the good one. Why somebody
 * reads as real is as worth collecting as why they read as fake — more so,
 * because nobody ever writes that down anywhere.
 */
const BUTTON =
  'flex-1 rounded-2xl px-3 py-4 text-[15px] font-extrabold uppercase leading-tight tracking-[0.06em] transition-all duration-150 sm:text-[17px]';

const TONE: Record<NewbieChoice, { on: string; off: string; save: string; ring: string }> = {
  legit: {
    on: 'border-0 bg-[#5BE39C] text-[#032315] shadow-[0_0_34px_-8px_rgba(91,227,156,0.95)]',
    off: 'border-2 border-[#5BE39C]/50 bg-[#5BE39C]/10 text-[#9CEFC4] hover:border-[#5BE39C] hover:bg-[#5BE39C]/22',
    save: 'bg-[#5BE39C] text-[#032315] hover:bg-[#8AEEBA]',
    ring: 'focus:border-[#5BE39C]/60'
  },
  suspect: {
    on: 'border-0 bg-[#FF4D6D] text-[#2C0410] shadow-[0_0_34px_-8px_rgba(255,77,109,0.95)]',
    off: 'border-2 border-[#FF4D6D]/50 bg-[#FF4D6D]/10 text-[#FF8BA1] hover:border-[#FF4D6D] hover:bg-[#FF4D6D]/22',
    save: 'bg-[#FF4D6D] text-[#2C0410] hover:bg-[#FF6E88]',
    ring: 'focus:border-[#FF4D6D]/60'
  },
  unsure: {
    on: 'border-0 bg-[#B79CFF] text-[#130726] shadow-[0_0_34px_-8px_rgba(183,156,255,0.95)]',
    off: 'border-2 border-[#B79CFF]/50 bg-[#B79CFF]/10 text-[#CFBDFF] hover:border-[#B79CFF] hover:bg-[#B79CFF]/22',
    save: 'bg-[#B79CFF] text-[#130726] hover:bg-[#CFBDFF]',
    ring: 'focus:border-[#B79CFF]/60'
  }
};

const WHY_FIELD =
  'w-full resize-none rounded-lg border border-white/10 bg-black/40 px-2.5 py-2 text-[12px] text-[#E8EDF5] outline-none transition-colors placeholder:text-[#5E6A7E]';

export interface ThreeWayVerdictProps {
  /** The post on the slab. A new one clears any half-written answer. */
  account: string;
  existing: NewbieVerdict | null;
  onDecide: (choice: NewbieChoice, why: string) => void;
  onSkip: () => void;
}

const ThreeWayVerdict = ({ account, existing, onDecide, onSkip }: ThreeWayVerdictProps) => {
  const { t } = useTranslation('common_blog');
  const [asking, setAsking] = useState<NewbieChoice | null>(null);
  const [why, setWhy] = useState('');

  useEffect(() => {
    setAsking(null);
    setWhy(existing?.why ?? '');
  }, [account, existing]);

  const k = 'basecamp.games.newbie_or_not';
  const chosen = asking ?? existing?.verdict ?? null;

  return (
    <div className="flex flex-col gap-3" data-testid="newbie-verdict">
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        {(['legit', 'suspect', 'unsure'] as const).map((choice) => (
          <button
            key={choice}
            type="button"
            onClick={() => setAsking(choice)}
            className={cn(BUTTON, chosen === choice ? TONE[choice].on : TONE[choice].off)}
            data-testid={`newbie-${choice}`}
          >
            {t(`${k}.choice.${choice}`)}
          </button>
        ))}
      </div>

      {asking ? (
        <div className="flex flex-col gap-2" data-testid="newbie-why">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-[#B9C4D6]">{t(`${k}.why.${asking}`)}</span>
            <textarea
              value={why}
              onChange={(event) => setWhy(event.target.value)}
              rows={3}
              placeholder={t(`${k}.why_placeholder`)}
              className={cn(WHY_FIELD, TONE[asking].ring)}
              data-testid="newbie-why-box"
            />
          </label>
          <div className={cn(BASECAMP_MUTED, 'text-[10.5px] leading-snug')}>
            {t('basecamp.games.judging.why_optional')}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAsking(null)}
              className={cn(BASECAMP_MUTED, 'text-[11px] hover:text-[#E8EDF5]')}
            >
              {t('basecamp.games.judging.cancel')}
            </button>
            <button
              type="button"
              onClick={() => onDecide(asking, why.trim())}
              className={cn(
                'ml-auto rounded-full px-4 py-1.5 text-[12px] font-bold transition-all',
                TONE[asking].save
              )}
              data-testid="newbie-save"
            >
              {t('basecamp.games.judging.save')}
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        {existing ? (
          <span className="text-[11px] font-semibold text-[#B9C4D6]" data-testid="newbie-existing">
            {t(`${k}.said.${existing.verdict}`)}
          </span>
        ) : null}
        <button
          type="button"
          onClick={onSkip}
          className={cn(
            BASECAMP_MUTED,
            'ml-auto text-[12px] underline-offset-2 hover:text-[#E8EDF5] hover:underline'
          )}
          data-testid="newbie-skip"
        >
          {t('basecamp.games.judging.skip')}
        </button>
      </div>

      <div className={cn(BASECAMP_MUTED, 'text-[10.5px] leading-snug')}>
        {t('basecamp.games.judging.where_it_goes')}
      </div>
    </div>
  );
};

export default ThreeWayVerdict;
