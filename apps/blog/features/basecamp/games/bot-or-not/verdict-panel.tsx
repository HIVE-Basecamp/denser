'use client';

import { useEffect, useState } from 'react';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import { BASECAMP_MUTED } from '../../lib/theme';
import type { BotOrNotVerdict } from '../../lib/bot-or-not';

const BIG_BUTTON =
  'flex-1 rounded-2xl px-6 py-5 text-[26px] font-extrabold uppercase leading-none tracking-[0.1em] transition-all duration-150';

const BOT_ON = 'border-0 bg-[#FF4D6D] text-[#2C0410] shadow-[0_0_34px_-8px_rgba(255,77,109,0.95)]';
const BOT_OFF =
  'border-2 border-[#FF4D6D]/50 bg-[#FF4D6D]/10 text-[#FF8BA1] hover:border-[#FF4D6D] hover:bg-[#FF4D6D]/22';
const NOT_ON = 'border-0 bg-[#5BE39C] text-[#032315] shadow-[0_0_34px_-8px_rgba(91,227,156,0.95)]';
const NOT_OFF =
  'border-2 border-[#5BE39C]/50 bg-[#5BE39C]/10 text-[#9CEFC4] hover:border-[#5BE39C] hover:bg-[#5BE39C]/22';

const WHY_FIELD =
  'w-full resize-none rounded-lg border border-white/10 bg-black/40 px-2.5 py-2 text-[12px] text-[#E8EDF5] outline-none transition-colors placeholder:text-[#5E6A7E] focus:border-[#FF4D6D]/60';

interface VerdictPanelProps {
  account: string;
  /** The verdict already on file for this account, if the player has been here. */
  existing: BotOrNotVerdict | null;
  /** Called with the choice and the words; the words may be empty. */
  onDecide: (verdict: 'bot' | 'not', why: string) => void;
  onSkip: () => void;
}

/**
 * Two buttons and one optional box.
 *
 * BOT opens a place to say why, because "why" is the part worth collecting —
 * if the same reasons keep coming back they become the multiple-choice list
 * later. But it is never obligatory: Save works with the box empty, and a
 * player who just wants to press BOT and move on can.
 *
 * NOT needs nothing. It means only "I don't think this is a bot", and the
 * game moves to the next account.
 */
const VerdictPanel = ({ account, existing, onDecide, onSkip }: VerdictPanelProps) => {
  const { t } = useTranslation('common_blog');
  const [asking, setAsking] = useState(false);
  const [why, setWhy] = useState('');

  // A new account on the slab clears the half-written answer left on the last one.
  useEffect(() => {
    setAsking(false);
    setWhy(existing?.why ?? '');
  }, [account, existing]);

  return (
    <div className="flex flex-col gap-3" data-testid="bot-or-not-verdict">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setAsking(true)}
          className={cn(BIG_BUTTON, asking || existing?.verdict === 'bot' ? BOT_ON : BOT_OFF)}
          data-testid="bot-or-not-bot"
        >
          {t('basecamp.games.bot_or_not.bot')}
        </button>
        <button
          type="button"
          onClick={() => onDecide('not', '')}
          className={cn(BIG_BUTTON, existing?.verdict === 'not' ? NOT_ON : NOT_OFF)}
          data-testid="bot-or-not-not"
        >
          {t('basecamp.games.bot_or_not.not')}
        </button>
      </div>

      {asking ? (
        <div className="flex flex-col gap-2" data-testid="bot-or-not-why">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-[#B9C4D6]">
              {t('basecamp.games.bot_or_not.why_label')}
            </span>
            <textarea
              value={why}
              onChange={(event) => setWhy(event.target.value)}
              rows={3}
              placeholder={t('basecamp.games.bot_or_not.why_placeholder')}
              className={WHY_FIELD}
              data-testid="bot-or-not-why-box"
            />
          </label>
          <div className={cn(BASECAMP_MUTED, 'text-[10.5px] leading-snug')}>
            {t('basecamp.games.bot_or_not.why_optional')}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAsking(false)}
              className={cn(BASECAMP_MUTED, 'text-[11px] hover:text-[#E8EDF5]')}
            >
              {t('basecamp.games.bot_or_not.cancel')}
            </button>
            <button
              type="button"
              onClick={() => onDecide('bot', why.trim())}
              className="ml-auto rounded-full bg-[#FF4D6D] px-4 py-1.5 text-[12px] font-bold text-[#2C0410] transition-all hover:bg-[#FF6E88]"
              data-testid="bot-or-not-save"
            >
              {t('basecamp.games.bot_or_not.save')}
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        {existing ? (
          <span className="text-[11px] font-semibold text-[#B9C4D6]" data-testid="bot-or-not-existing">
            {existing.verdict === 'bot'
              ? t('basecamp.games.bot_or_not.said_bot')
              : t('basecamp.games.bot_or_not.said_not')}
          </span>
        ) : null}
        <button
          type="button"
          onClick={onSkip}
          className={cn(BASECAMP_MUTED, 'ml-auto text-[12px] underline-offset-2 hover:text-[#E8EDF5] hover:underline')}
          data-testid="bot-or-not-skip"
        >
          {t('basecamp.games.bot_or_not.skip')}
        </button>
      </div>

      <div className={cn(BASECAMP_MUTED, 'text-[10.5px] leading-snug')}>
        {t('basecamp.games.bot_or_not.where_it_goes')}
      </div>
    </div>
  );
};

export default VerdictPanel;
