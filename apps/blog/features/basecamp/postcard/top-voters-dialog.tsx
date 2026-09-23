'use client';

import { Dialog, DialogContent, DialogTitle } from '@ui/components/dialog';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import { useFullVoteHistory, type FullReadStatus } from '../hooks/use-full-vote-history';
import { useVoteValueRate } from '../hooks/use-vote-value';
import { useVotesGiven, VOTE_PAGE_SIZE } from '../hooks/use-votes-received';
import { hbdFromRshares } from '../lib/vote-value';
import {
  countShare,
  rankByCount,
  TOP_VOTERS_COUNT,
  voterShare,
  type VoteDirection,
  type VoteSummary
} from '../lib/voters';
import { BASECAMP_MUTED, BASECAMP_VIVID } from '../lib/theme';
import { HbdValue, Stat } from './voter-row';
import VoteListSection from './vote-list-section';

const BLUE = BASECAMP_VIVID.blue;
const CYAN = BASECAMP_VIVID.cyan;
const LIME = BASECAMP_VIVID.lime;
const VIOLET = BASECAMP_VIVID.violet;

interface TopVotersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: string;
  /** The newest page of votes received, already read by the card: what the panel opens with. */
  votes: VoteSummary;
  /** When the account was made — what lets a deeper read say how far through it is. */
  createdMs: number | null;
  /** True while the card's own read is still running. */
  loading: boolean;
  failed: boolean;
}

/** A count that is a floor, said so: "10,000+" rather than a total the chain never gave. */
function countText(t: (key: string, options?: Record<string, unknown>) => string, summary: VoteSummary) {
  return summary.lifetime === null
    ? t('basecamp.card.values.at_least_short', { value: summary.atLeast.toLocaleString() })
    : summary.lifetime.toLocaleString();
}

/** What a list's rows are drawn from, in one sentence, under them. */
function provenanceText(
  t: (key: string, options?: Record<string, unknown>) => string,
  direction: VoteDirection,
  shown: VoteSummary,
  status: FullReadStatus
): string {
  const votes = shown.counted.toLocaleString();
  const given = direction === 'given';
  if (shown.complete)
    return t(given ? 'basecamp.card.top_voters.given_window_lifetime' : 'basecamp.card.top_voters.window_lifetime', {
      votes
    });
  if (status === 'failed') return t('basecamp.card.top_voters.window_failed', { votes });
  if (status === 'stopped') return t('basecamp.card.top_voters.window_stopped', { votes });
  if (status === 'reading') return t('basecamp.card.top_voters.window_reading', { votes });
  return t(given ? 'basecamp.card.top_voters.given_window_capped' : 'basecamp.card.top_voters.window_capped', {
    limit: VOTE_PAGE_SIZE.toLocaleString()
  });
}

/**
 * The votes around this account, both ways.
 *
 * First, who has been voting on it, ranked by what their votes were worth,
 * with how many votes each gave beside that. Then who it votes for, ranked by
 * how often, with what those votes were worth beside that.
 *
 * The first list opens on what the card already had — the newest thousand
 * votes, ranked — so there is never an empty panel. Behind that it reads the
 * rest of the account's life, a window at a time, and the ranking re-sorts as
 * the older votes arrive. The second list is read only once the panel is
 * open, the same way. Nothing of that happens until somebody opens it.
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
  const receivedFull = useFullVoteHistory(account, createdMs, !votes.complete);
  const received = receivedFull.votes.known ? receivedFull.votes : votes;
  const receivedTop = received.voters.slice(0, TOP_VOTERS_COUNT);

  const given = useVotesGiven(account, open);
  const givenFull = useFullVoteHistory(
    account,
    createdMs,
    open && given.status === 'ready' && !given.votes.complete,
    'given'
  );
  const givenShown = givenFull.votes.known ? givenFull.votes : given.votes;
  const givenTop = rankByCount(givenShown.voters).slice(0, TOP_VOTERS_COUNT);

  const readingOf = (full: typeof receivedFull) =>
    full.status === 'reading'
      ? { progress: full.progress, secondsLeft: full.secondsLeft, stop: full.stop }
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[calc(100%-24px)] max-w-[940px] gap-3 border-white/10 bg-[#0D0D12] p-5 text-[#E8EDF5] sm:max-w-[940px]"
        data-testid="basecamp-top-voters-dialog"
      >
        <div>
          <DialogTitle className="text-[15px] font-bold" style={{ color: BLUE }}>
            {t('basecamp.card.top_voters.title')}
          </DialogTitle>
          <div className={cn(BASECAMP_MUTED, 'mt-0.5 text-[11px]')}>
            {t('basecamp.card.top_voters.subtitle', { account })}
          </div>
        </div>

        {/* How much money, from how many different people, over how many votes,
            and how many votes went the other way. One person and a thousand
            people are the same count of votes and not the same account, so the
            second figure stands beside the first. */}
        {received.known ? (
          <div className="flex items-end gap-6">
            <Stat
              value={<HbdValue amount={hbdFromRshares(received.totalRshares, rate)} />}
              label={t('basecamp.card.top_voters.total_label')}
              color={LIME}
            />
            <Stat value={received.voters.length} label={t('basecamp.card.top_voters.people_label')} color={CYAN} />
            <Stat
              value={countText(t, received)}
              label={t('basecamp.card.top_voters.received_label')}
              color={BLUE}
            />
            {givenShown.known ? (
              <Stat
                value={countText(t, givenShown)}
                label={t('basecamp.card.top_voters.given_label')}
                color={VIOLET}
              />
            ) : null}
          </div>
        ) : null}

        {/* The two lists side by side: who votes on them on the left, who they
            vote for on the right, so the two directions can be read against
            each other without scrolling between them. */}
        <div className="grid max-h-[64vh] grid-cols-1 gap-x-6 gap-y-5 overflow-y-auto pr-1 sm:grid-cols-2">
          <VoteListSection
            title={t('basecamp.card.top_voters.received_heading', { limit: TOP_VOTERS_COUNT, account })}
            sortNote={t('basecamp.card.top_voters.received_sort')}
            color={BLUE}
            lead="worth"
            rows={receivedTop}
            shareOf={(row) => voterShare(row, received.totalRshares)}
            rate={rate}
            loading={loading}
            failed={failed}
            emptyText={t('basecamp.card.top_voters.empty', { account })}
            errorText={t('basecamp.card.top_voters.error')}
            reading={readingOf(receivedFull)}
            provenance={provenanceText(t, 'received', received, receivedFull.status)}
            testId="basecamp-top-voters"
          />
          <VoteListSection
            title={t('basecamp.card.top_voters.given_heading', { account })}
            sortNote={t('basecamp.card.top_voters.given_sort')}
            color={VIOLET}
            lead="votes"
            rows={givenTop}
            shareOf={(row) => countShare(row, givenShown.counted)}
            rate={rate}
            loading={given.status === 'loading' || given.status === 'idle'}
            failed={given.status === 'unavailable'}
            emptyText={t('basecamp.card.top_voters.given_empty', { account })}
            errorText={t('basecamp.card.top_voters.given_error')}
            reading={readingOf(givenFull)}
            provenance={provenanceText(t, 'given', givenShown, givenFull.status)}
            testId="basecamp-votes-given"
          />
        </div>

        <p className={cn(BASECAMP_MUTED, 'text-[10.5px] leading-snug')}>
          {t('basecamp.card.top_voters.value_note')}
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default TopVotersDialog;
