'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@ui/components/dialog';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import { BASECAMP_MUTED, BASECAMP_VIVID } from '../lib/theme';
import { SUS_REASONS, removeSusReport, saveSusReport, type SusReasonId, type SusReport } from '../lib/sus';

const RED = BASECAMP_VIVID.red;

/** A text box in Basecamp's own colours; the shared ones carry the light theme with them. */
const FIELD =
  'w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-2 text-[12px] text-[#E8EDF5] outline-none transition-colors placeholder:text-[#5E6A7E] focus:border-[#FF4D6D]/60';

interface ReasonChipProps {
  id: SusReasonId;
  label: string;
  picked: boolean;
  onToggle: (id: SusReasonId) => void;
}

const ReasonChip = ({ id, label, picked, onToggle }: ReasonChipProps) => (
  <button
    type="button"
    onClick={() => onToggle(id)}
    aria-pressed={picked}
    data-testid={`sus-reason-${id}`}
    className={cn(
      'rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all duration-150',
      picked
        ? 'border-0 bg-[#FF4D6D] text-[#2C0410] shadow-[0_0_20px_-6px_rgba(255,77,109,0.9)]'
        : 'border border-[#FF4D6D]/40 bg-[#FF4D6D]/10 text-[#FFB3C1] hover:border-[#FF4D6D] hover:bg-[#FF4D6D]/20'
    )}
  >
    {label}
  </button>
);

export interface SusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: string;
  permlink: string;
  /** The report already on file for this post, if there is one. */
  existing: SusReport | null;
  /** Told what is on file now — null when the report was taken back. */
  onSaved: (report: SusReport | null) => void;
}

/**
 * The card that pops up behind the SUS button: what seemed off, in the
 * reader's own words.
 *
 * The tool does not decide (ETHOS.md) — this is the reader deciding, and it
 * says plainly at the bottom that the answer stays on their machine for now.
 * Every box can be ticked at once: a sock is often a spammer too.
 */
const SusDialog = ({ open, onOpenChange, account, permlink, existing, onSaved }: SusDialogProps) => {
  const { t } = useTranslation('common_blog');
  const [reasons, setReasons] = useState<SusReasonId[]>(existing?.reasons ?? []);
  const [otherWords, setOtherWords] = useState(existing?.otherWords ?? '');
  const [note, setNote] = useState(existing?.note ?? '');

  const toggle = (id: SusReasonId) =>
    setReasons((picked) => (picked.includes(id) ? picked.filter((r) => r !== id) : [...picked, id]));

  const send = () => {
    const report: SusReport = {
      account,
      permlink,
      reasons,
      otherWords: reasons.includes('other') ? otherWords.trim() : '',
      note: note.trim(),
      reportedIso: new Date().toISOString()
    };
    saveSusReport(report);
    onSaved(report);
    onOpenChange(false);
  };

  const takeBack = () => {
    removeSusReport(account, permlink);
    onSaved(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[400px] gap-3 border-white/10 bg-[#0B0F17] p-5 text-[#E8EDF5] sm:max-w-[400px]"
        data-testid="sus-dialog"
      >
        <div>
          <DialogTitle className="text-[15px] font-bold" style={{ color: RED }}>
            {t('basecamp.card.sus.title')}
          </DialogTitle>
          <div className={cn(BASECAMP_MUTED, 'mt-0.5 text-[11px]')}>
            {t('basecamp.card.sus.subtitle', { account })}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {SUS_REASONS.map((id) => (
            <ReasonChip
              key={id}
              id={id}
              label={t(`basecamp.card.sus.reasons.${id}`)}
              picked={reasons.includes(id)}
              onToggle={toggle}
            />
          ))}
        </div>

        {reasons.includes('other') ? (
          <input
            type="text"
            value={otherWords}
            onChange={(event) => setOtherWords(event.target.value)}
            placeholder={t('basecamp.card.sus.other_placeholder')}
            className={FIELD}
            data-testid="sus-other"
          />
        ) : null}

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-[#B9C4D6]">{t('basecamp.card.sus.note_label')}</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            placeholder={t('basecamp.card.sus.note_placeholder')}
            className={cn(FIELD, 'resize-none')}
            data-testid="sus-note"
          />
        </label>

        <div className={cn(BASECAMP_MUTED, 'text-[10.5px] leading-snug')}>{t('basecamp.card.sus.where_it_goes')}</div>

        <div className="flex items-center gap-2">
          {existing ? (
            <button
              type="button"
              onClick={takeBack}
              className={cn(BASECAMP_MUTED, 'text-[11px] underline-offset-2 hover:text-[#E8EDF5] hover:underline')}
              data-testid="sus-remove"
            >
              {t('basecamp.card.sus.remove')}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={cn(BASECAMP_MUTED, 'ml-auto rounded-full px-3 py-1.5 text-[12px] hover:text-[#E8EDF5]')}
          >
            {t('basecamp.card.sus.cancel')}
          </button>
          <button
            type="button"
            onClick={send}
            disabled={reasons.length === 0}
            className="rounded-full bg-[#FF4D6D] px-4 py-1.5 text-[12px] font-bold text-[#2C0410] transition-all hover:bg-[#FF6E88] disabled:opacity-35 disabled:hover:bg-[#FF4D6D]"
            data-testid="sus-send"
          >
            {t('basecamp.card.sus.send')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SusDialog;
