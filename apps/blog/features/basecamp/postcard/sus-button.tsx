'use client';

import { useEffect, useState } from 'react';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import { findSusReport, type SusReport } from '../lib/sus';
import Hint from './hint';
import SusDialog from './sus-dialog';

/**
 * The one thing on the postcard that is not a reading of the chain: a word
 * from the reader. It sits in the empty stretch beside the name — space the
 * card already had — so nothing else on the card moves or shrinks to make
 * room for it.
 *
 * Red and shouting on purpose. Everything else here is a drawing that refuses
 * to draw a conclusion; this is the button for the person who has drawn one.
 */
interface SusButtonProps {
  account: string;
  permlink: string;
}

const SusButton = ({ account, permlink }: SusButtonProps) => {
  const { t } = useTranslation('common_blog');
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState<SusReport | null>(null);

  // Read on the client only: the server has no localStorage, and a button
  // that renders marked on the server and unmarked in the browser is a
  // hydration mismatch.
  useEffect(() => {
    setReport(findSusReport(account, permlink));
  }, [account, permlink]);

  const marked = report !== null;

  return (
    <>
      <Hint
        title={t('basecamp.card.sus.button')}
        body={marked ? t('basecamp.card.sus.hint_marked') : t('basecamp.card.sus.hint')}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-pressed={marked}
          data-testid="postcard-sus-button"
          data-sus-marked={marked || undefined}
          className={cn(
            'shrink-0 rounded-md px-2 py-[3px] text-[11px] font-extrabold uppercase leading-none tracking-[0.08em] transition-all duration-150',
            marked
              ? 'bg-[#FF4D6D] text-[#2C0410] shadow-[0_0_18px_-4px_rgba(255,77,109,0.95)]'
              : 'border border-[#FF4D6D]/55 bg-[#FF4D6D]/12 text-[#FF6E88] hover:border-[#FF4D6D] hover:bg-[#FF4D6D]/25 hover:text-[#FF90A5]'
          )}
        >
          {t('basecamp.card.sus.button')}
        </button>
      </Hint>
      {open ? (
        <SusDialog
          open={open}
          onOpenChange={setOpen}
          account={account}
          permlink={permlink}
          existing={report}
          onSaved={setReport}
        />
      ) : null}
    </>
  );
};

export default SusButton;
