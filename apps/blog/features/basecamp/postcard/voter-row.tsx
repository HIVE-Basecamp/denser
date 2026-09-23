'use client';

import type { ReactNode } from 'react';
import { Link } from '@hive/ui';
import { getUserAvatarUrl } from '@ui/lib/avatar-utils';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import { hbdFromRshares } from '../lib/vote-value';
import type { VoterTally } from '../lib/voters';
import { BASECAMP_LINK, BASECAMP_MICRO_LABEL, BASECAMP_MUTED, BASECAMP_VIVID } from '../lib/theme';
import { formatHbdAmount } from './format-value';

const CYAN = BASECAMP_VIVID.cyan;
const LIME = BASECAMP_VIVID.lime;
const AVATAR = 26;

/** So a row with a sliver of the whole still draws a mark rather than nothing. */
const BAR_MIN_SHARE = 0.02;

interface HbdValueProps {
  /** The amount in HBD, or null while the chain-wide rate is still unknown. */
  amount: number | null;
}

/**
 * One money figure. Three separate translations rather than one, because the
 * "smaller than" mark has to be literal text inside the translation: passed in
 * as part of the value it would come back escaped, as `&lt;`.
 */
export const HbdValue = ({ amount }: HbdValueProps) => {
  const { t } = useTranslation('common_blog');
  if (amount === null) return <>{'—'}</>;
  const reading = formatHbdAmount(amount);
  if (reading.kind === 'under')
    return <>{t('basecamp.card.top_voters.amount_under', { value: reading.value })}</>;
  if (reading.kind === 'over_negative') {
    return <>{t('basecamp.card.top_voters.amount_over_negative', { value: reading.value })}</>;
  }
  return <>{t('basecamp.card.top_voters.amount', { value: reading.value })}</>;
};

interface StatProps {
  value: ReactNode;
  label: string;
  color: string;
}

/** One figure above the lists, in its own colour. No frame: the colour does the grouping. */
export const Stat = ({ value, label, color }: StatProps) => (
  <span>
    <span className="block text-[21px] font-bold tabular-nums leading-none" style={{ color }}>
      {value}
    </span>
    <span className={cn(BASECAMP_MICRO_LABEL, 'mt-1.5 block')}>{label}</span>
  </span>
);

interface FigureProps {
  value: ReactNode;
  label: string;
  color: string;
  /** The money column is wider; a count fits in less. */
  wide?: boolean;
}

/** One of the two figures on a row: the number, and under it what it is. */
const Figure = ({ value, label, color, wide = false }: FigureProps) => (
  <span className={cn('shrink-0 text-right', wide && 'w-[62px]')}>
    <span className="block text-[13px] font-bold tabular-nums" style={{ color }}>
      {value}
    </span>
    <span className={cn(BASECAMP_MUTED, 'block text-[9px] uppercase leading-none tracking-[0.06em]')}>
      {label}
    </span>
  </span>
);

/** Which figure a list is sorted by. It stands first on the row; the other sits beside it. */
export type RowLead = 'worth' | 'votes';

interface VoterRowProps {
  tally: VoterTally;
  rank: number;
  /** How much of the whole this row is, 0-1: the length of the bar. */
  share: number;
  /** HBD per rshare, or null while the chain-wide rate is still unknown. */
  rate: number | null;
  lead: RowLead;
  /** The list's colour: the rank and the bar. */
  color: string;
}

/**
 * One account: who they are, what the votes between them and this account
 * were worth, how many of them there were, and how much of the whole list
 * they are.
 *
 * The bar is the part worth looking at. Ten people each carrying a tenth is a
 * different picture from one carrying nine tenths, and the bar says that
 * without anybody having to compare numbers. It says only that; who is at the
 * top of this list and why is the reader's to weigh.
 */
export const VoterRow = ({ tally, rank, share, rate, lead, color }: VoterRowProps) => {
  const { t } = useTranslation('common_blog');
  const worth = (
    <Figure
      key="worth"
      value={<HbdValue amount={hbdFromRshares(tally.rshares, rate)} />}
      label={t('basecamp.card.top_voters.worth_label')}
      color={LIME}
      wide
    />
  );
  const votes = (
    <Figure key="votes" value={tally.votes} label={t('basecamp.card.top_voters.votes_label')} color={CYAN} />
  );

  return (
    <li className="flex items-center gap-2 py-1.5" data-testid="basecamp-top-voter-row">
      <span className="w-4 shrink-0 text-right text-[11px] font-bold tabular-nums" style={{ color }}>
        {rank}
      </span>
      <Link
        href={`/@${tally.account}`}
        className="flex min-w-0 flex-1 items-center gap-2"
        data-testid="basecamp-top-voter-name"
        // A new tab, for the same reason the comments panel opens one: this
        // sits over a feed or a game, and going to an account in place loses
        // it — along with the whole-life read the panel just made.
        target="_blank"
        rel="noopener noreferrer"
      >
        <span
          className="block shrink-0 rounded-full bg-cover bg-no-repeat ring-1 ring-white/15"
          style={{
            width: AVATAR,
            height: AVATAR,
            backgroundImage: `url(${getUserAvatarUrl(tally.account, 'small')})`
          }}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span className={cn(BASECAMP_LINK, 'block truncate text-[12px] font-semibold')}>
            @{tally.account}
          </span>
          <span className="mt-1 block h-[4px] w-full overflow-hidden rounded-full bg-white/[0.07]">
            <span
              className="block h-full rounded-full"
              style={{
                width: `${Math.max(share, BAR_MIN_SHARE) * 100}%`,
                backgroundColor: color,
                boxShadow: `0 0 8px -1px ${color}`
              }}
            />
          </span>
        </span>
      </Link>
      {lead === 'worth' ? [worth, votes] : [votes, worth]}
    </li>
  );
};
