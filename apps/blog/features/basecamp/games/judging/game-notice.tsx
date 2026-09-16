'use client';

import { cn } from '@ui/lib/utils';
import { BASECAMP_MUTED, BASECAMP_PANEL } from '../../lib/theme';

interface GameNoticeProps {
  title: string;
  body: string;
  /** An optional way onward — "Start again" when the queue has run out. */
  action?: { label: string; onClick: () => void };
}

/** The panel the game shows when there is nobody to look at: nothing to play yet, or nobody left. */
const GameNotice = ({ title, body, action }: GameNoticeProps) => (
  <div
    className={cn(BASECAMP_PANEL, 'mt-3 flex flex-col items-center gap-2 py-10 text-center')}
    data-testid="judging-notice"
  >
    <span className="text-base font-semibold">{title}</span>
    <span className={cn(BASECAMP_MUTED, 'max-w-[440px] text-sm leading-snug')}>{body}</span>
    {action ? (
      <button
        type="button"
        onClick={action.onClick}
        className="mt-2 rounded-full bg-[#B79CFF] px-4 py-1.5 text-[12px] font-bold text-[#160B2E] transition-all hover:bg-[#C9B4FF]"
        data-testid="judging-notice-action"
      >
        {action.label}
      </button>
    ) : null}
  </div>
);

export default GameNotice;
