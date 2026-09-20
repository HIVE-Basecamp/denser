'use client';

import type { ReactNode } from 'react';
import { Link } from '@hive/ui';
import { getUserAvatarUrl } from '@ui/lib/avatar-utils';
import { Dialog, DialogContent, DialogTitle } from '@ui/components/dialog';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import { useFullVoteHistory } from '../hooks/use-full-vote-history';
import { useVoteValueRate } from '../hooks/use-vote-value';
import { VOTE_PAGE_SIZE } from '../hooks/use-votes-received';
import { hbdFromRshares } from '../lib/vote-value';
import { TOP_VOTERS_COUNT, voterShare, type VoterTally, type VotesReceived } from '../lib/voters';
import { BASECAMP_LINK, BASECAMP_MICRO_LABEL, BASECAMP_MUTED, BASECAMP_VIVID } from '../lib/theme';
import { formatHbdAmount } from './format-value';
import ReadProgressBar from './read-progress-bar';

const BLUE = BASECAMP_VIVID.blue;
const CYAN = BASECAMP_VIVID.cyan;
const LIME = BASECAMP_VIVID.lime;
const AVATAR = 30;

/** So a voter with a sliver of the weight still draws a mark rather than nothing. */
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
const HbdValue = ({ amount }: HbdValueProps) => {
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

/** One figure above the list, in its own colour. No frame: the colour does the grouping. */
const Stat = ({ value, label, color }: StatProps) => (
  <span>
    <span className="block text-[21px] font-bold tabular-nums leading-none" style={{ color }}>
      {value}
    </span>
    <span className={cn(BASECAMP_MICRO_LABEL, 'mt-1.5 block')}>{label}</span>
  </span>
);

interface VoterRowProps {
  tally: VoterTally;
  rank: number;
  totalRshares: number;
  /** HBD per rshare, or null while the chain-wide rate is still unknown. */
  rate: number | null;
}

/**
 * One voter: who they are, what their votes on this account were worth, how
 * many of them there were, and how much of everything the account has been
 * given they are responsible for.
 *
 * The bar is the part worth looking at. Ten voters each carrying a tenth is a
 * different picture from one voter carrying nine tenths, and the bar says that
 * without anybody having to compare numbers. It says only that; who is at the
 * top of this list and why is the reader's to weigh.
 */
const VoterRow = ({ tally, rank, totalRshares, rate }: VoterRowProps) => {
  const { t } = useTranslation('common_blog');
  const share = voterShare(tally, totalRshares);

  return (
    <li className="flex items-center gap-3 py-2" data-testid="basecamp-top-voter-row">
      <span className="w-5 shrink-0 text-right text-[12px] font-bold tabular-nums" style={{ color: BLUE }}>
        {rank}
      </span>
      <Link
        href={`/@${tally.voter}`}
        className="flex min-w-0 flex-1 items-center gap-2.5"
        data-testid="basecamp-top-voter-name"
        // A new tab, for the same reason the comments panel opens one: this
        // sits over a feed or a game, and going to a voter in place loses it —
        // along with the whole-life read the panel just made.
        target="_blank"
        rel="noopener noreferrer"
      >
        <span
          className="block shrink-0 rounded-full bg-cover bg-no-repeat ring-1 ring-white/15"
          style={{
            width: AVATAR,
            height: AVATAR,
            backgroundImage: `url(${getUserAvatarUrl(tally.voter, 'small')})`
          }}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span className={cn(BASECAMP_LINK, 'block truncate text-[12.5px] font-semibold')}>
            @{tally.voter}
          </span>
          <span className="mt-1.5 block h-[5px] w-full overflow-hidden rounded-full bg-white/[0.07]">
            <span
              className="block h-full rounded-full"
              style={{
                width: `${Math.max(share, BAR_MIN_SHARE) * 100}%`,
                backgroundColor: BLUE,
                boxShadow: `0 0 8px -1px ${BLUE}`
              }}
            />
          </span>
        </span>
      </Link>
      <span className="w-[76px] shrink-0 text-right">
        <span className="block text-[14px] font-bold tabular-nums" style={{ color: LIME }}>
          <HbdValue amount={hbdFromRshares(tally.rshares, rate)} />
        </span>
        <span className={cn(BASECAMP_MUTED, 'block text-[9.5px] uppercase leading-none tracking-[0.06em]')}>
          {t('basecamp.card.top_voters.worth_label')}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-[14px] font-bold tabular-nums" style={{ color: CYAN }}>
          {tally.votes}
        </span>
        <span className={cn(BASECAMP_MUTED, 'block text-[9.5px] uppercase leading-none tracking-[0.06em]')}>
          {t('basecamp.card.top_voters.votes_label')}
        </span>
      </span>
    </li>
  );
};

interface TopVotersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: string;
  /** The newest page, already read by the card: what the panel opens with. */
  votes: VotesReceived;
  /** When the account was made — what lets the deeper read say how far through it is. */
  createdMs: number | null;
  /** True while the card's own read is still running. */
  loading: boolean;
  failed: boolean;
}

/**
 * Who has been voting on this account, ranked by weight.
 *
 * It opens on what the card already had — the newest thousand votes, ranked —
 * so there is never an empty panel. Behind that it reads the rest of the
 * account's life, a window at a time, and the ranking re-sorts as the older
 * votes arrive. Nothing of that happens until somebody opens the panel.
 *
 * It states who, how many and how much, and nothing else. One account behind
 * most of a new account's money is a shape worth seeing; it is also what a
 * patron, a curation trail and a community account each look like from here.
 * The reader decides (ETHOS.md).
 */
const TopVotersDialog = ({
  open,
  onOpenChange,
  account,
  votes,
  createdMs,
  loading,
  failed
}: TopVotersDialogProps) => {
  const { t } = useTranslation('common_blog');
  const rate = useVoteValueRate(open);
  // Nothing to go deeper for when the card's one read already reached the
  // account's first vote.
  const full = useFullVoteHistory(account, createdMs, !votes.complete);
  const shown = full.votes.known ? full.votes : votes;
  const top = shown.voters.slice(0, TOP_VOTERS_COUNT);
  const reading = full.status === 'reading';

  const body = () => {
    if (loading) {
      return (
        <div
          className={cn(BASECAMP_MUTED, 'py-8 text-center text-[12px]')}
          data-testid="basecamp-top-voters-loading"
        >
          {t('basecamp.card.top_voters.loading')}
        </div>
      );
    }
    if (failed) {
      return (
        <div className="py-8 text-center text-[12px] text-[#FF90A5]" data-testid="basecamp-top-voters-error">
          {t('basecamp.card.top_voters.error')}
        </div>
      );
    }
    if (top.length === 0) {
      return (
        <div
          className={cn(BASECAMP_MUTED, 'py-8 text-center text-[12px]')}
          data-testid="basecamp-top-voters-empty"
        >
          {t('basecamp.card.top_voters.empty', { account })}
        </div>
      );
    }
    return (
      <ul className="flex flex-col divide-y divide-white/[0.07]" data-testid="basecamp-top-voters-list">
        {top.map((tally, index) => (
          <VoterRow
            key={tally.voter}
            tally={tally}
            rank={index + 1}
            totalRshares={shown.totalRshares}
            rate={rate}
          />
        ))}
      </ul>
    );
  };

  /** What the numbers above the list are drawn from, in one sentence, under them. */
  const provenance = () => {
    if (shown.complete)
      return t('basecamp.card.top_voters.window_lifetime', { votes: shown.counted.toLocaleString() });
    if (full.status === 'failed')
      return t('basecamp.card.top_voters.window_failed', { votes: shown.counted.toLocaleString() });
    if (full.status === 'stopped')
      return t('basecamp.card.top_voters.window_stopped', { votes: shown.counted.toLocaleString() });
    if (reading)
      return t('basecamp.card.top_voters.window_reading', { votes: shown.counted.toLocaleString() });
    return t('basecamp.card.top_voters.window_capped', { limit: VOTE_PAGE_SIZE.toLocaleString() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[540px] gap-3 border-white/10 bg-[#0B0F17] p-5 text-[#E8EDF5] sm:max-w-[540px]"
        data-testid="basecamp-top-voters-dialog"
      >
        <div>
          <DialogTitle className="text-[15px] font-bold" style={{ color: BLUE }}>
            {t('basecamp.card.top_voters.title', { limit: TOP_VOTERS_COUNT })}
          </DialogTitle>
          <div className={cn(BASECAMP_MUTED, 'mt-0.5 text-[11px]')}>
            {t('basecamp.card.top_voters.subtitle', { account })}
          </div>
        </div>

        {/* How much money, from how many different people, over how many votes.
            One person and a thousand people are the same count of votes and not
            the same account, so the second figure stands beside the first. */}
        {shown.known ? (
          <div className="flex items-end gap-6">
            <Stat
              value={<HbdValue amount={hbdFromRshares(shown.totalRshares, rate)} />}
              label={t('basecamp.card.top_voters.total_label')}
              color={LIME}
            />
            <Stat
              value={shown.voters.length}
              label={t('basecamp.card.top_voters.people_label')}
              color={CYAN}
            />
            <Stat
              value={
                shown.lifetime === null
                  ? t('basecamp.card.values.at_least_short', { value: shown.atLeast.toLocaleString() })
                  : shown.lifetime.toLocaleString()
              }
              label={t('basecamp.card.top_voters.received_label')}
              color={BLUE}
            />
          </div>
        ) : null}

        {reading ? (
          <ReadProgressBar
            progress={full.progress}
            label={
              full.secondsLeft === null
                ? t('basecamp.card.top_voters.reading')
                : t('basecamp.card.top_voters.reading_left', { seconds: full.secondsLeft })
            }
            onStop={full.stop}
            stopLabel={t('basecamp.card.top_voters.stop')}
            testId="basecamp-top-voters-progress"
          />
        ) : null}

        <div className="max-h-[52vh] overflow-y-auto pr-1">{body()}</div>

        <p
          className={cn(BASECAMP_MUTED, 'text-[10.5px] leading-snug')}
          data-testid="basecamp-top-voters-window"
        >
          {provenance()} {t('basecamp.card.top_voters.value_note')}
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default TopVotersDialog;
