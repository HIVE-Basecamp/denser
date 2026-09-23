'use client';

import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import type { VoterTally } from '../lib/voters';
import { BASECAMP_MUTED } from '../lib/theme';
import ReadProgressBar from './read-progress-bar';
import { VoterRow, type RowLead } from './voter-row';

/** The deeper read behind a list, while it runs. */
export interface ListReading {
  progress: number | null;
  secondsLeft: number | null;
  stop: () => void;
}

interface VoteListSectionProps {
  title: string;
  /** What the list is ranked by, said under the title so the order is never a guess. */
  sortNote: string;
  color: string;
  lead: RowLead;
  rows: VoterTally[];
  /** A row's share of the whole, 0-1, for its bar. The caller says what "the whole" is. */
  shareOf: (row: VoterTally) => number;
  /** HBD per rshare, or null while unknown. */
  rate: number | null;
  loading: boolean;
  failed: boolean;
  emptyText: string;
  errorText: string;
  /** Set while the whole-life read behind this list is still running. */
  reading: ListReading | null;
  /** What the rows are drawn from, in one sentence, under them. */
  provenance: string;
  testId: string;
}

/**
 * One ranked list in the votes panel: a heading that says what it is and how
 * it is ordered, the rows, and a line underneath saying how much of the
 * account's life they were read from. The two lists in the panel are this
 * component twice, reading in opposite directions.
 */
const VoteListSection = ({
  title,
  sortNote,
  color,
  lead,
  rows,
  shareOf,
  rate,
  loading,
  failed,
  emptyText,
  errorText,
  reading,
  provenance,
  testId
}: VoteListSectionProps) => {
  const { t } = useTranslation('common_blog');

  const body = () => {
    if (loading) {
      return (
        <div className={cn(BASECAMP_MUTED, 'py-6 text-center text-[12px]')} data-testid={`${testId}-loading`}>
          {t('basecamp.card.top_voters.loading')}
        </div>
      );
    }
    if (failed) {
      return (
        <div className="py-6 text-center text-[12px] text-[#FF90A5]" data-testid={`${testId}-error`}>
          {errorText}
        </div>
      );
    }
    if (rows.length === 0) {
      return (
        <div className={cn(BASECAMP_MUTED, 'py-6 text-center text-[12px]')} data-testid={`${testId}-empty`}>
          {emptyText}
        </div>
      );
    }
    return (
      <ul className="flex flex-col divide-y divide-white/[0.07]" data-testid={`${testId}-list`}>
        {rows.map((row, index) => (
          <VoterRow
            key={row.account}
            tally={row}
            rank={index + 1}
            share={shareOf(row)}
            rate={rate}
            lead={lead}
            color={color}
          />
        ))}
      </ul>
    );
  };

  return (
    <section className="flex flex-col gap-2" data-testid={testId}>
      <div>
        <h3 className="text-[13px] font-bold" style={{ color }}>
          {title}
        </h3>
        <div className={cn(BASECAMP_MUTED, 'text-[10.5px]')}>{sortNote}</div>
      </div>

      {reading ? (
        <ReadProgressBar
          progress={reading.progress}
          label={
            reading.secondsLeft === null
              ? t('basecamp.card.top_voters.reading')
              : t('basecamp.card.top_voters.reading_left', { seconds: reading.secondsLeft })
          }
          onStop={reading.stop}
          stopLabel={t('basecamp.card.top_voters.stop')}
          testId={`${testId}-progress`}
        />
      ) : null}

      {body()}

      <p className={cn(BASECAMP_MUTED, 'text-[10.5px] leading-snug')} data-testid={`${testId}-window`}>
        {provenance}
      </p>
    </section>
  );
};

export default VoteListSection;
