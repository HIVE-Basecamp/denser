'use client';

import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Link } from '@hive/ui';
import { Dialog, DialogContent, DialogTitle } from '@ui/components/dialog';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import { ACCOUNT_COMMENTS_LIMIT, useAccountComments, type AccountComment } from '../hooks/use-account-comments';
import {
  rankCommentVotes,
  topCommentVoters,
  TOP_COMMENT_VOTERS_COUNT,
  type VoteWorth,
  type VoterSummary
} from '../lib/comment-payouts';
import { shortAge } from '../lib/short-age';
import { BASECAMP_LINK, BASECAMP_MICRO_LABEL, BASECAMP_MUTED, BASECAMP_VIVID } from '../lib/theme';
import { formatHbdAmount } from './format-value';

const CYAN = BASECAMP_VIVID.cyan;
const LIME = BASECAMP_VIVID.lime;

/** One reply, so the panel scrolls rather than the page. */
const ROW = 'rounded-lg bg-white/[0.04] px-3 py-2.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]';

/**
 * One HBD figure. Three separate translations rather than one, because the
 * "smaller than" mark has to be literal text inside the translation: passed in
 * as part of the value it would come back escaped, as `&lt;`.
 */
const Hbd = ({ amount }: { amount: number | null }) => {
  const { t } = useTranslation('common_blog');
  if (amount === null) return <>{'\u2014'}</>;
  if (amount === 0) return <>{t('basecamp.card.comments.amount', { value: '0' })}</>;
  const reading = formatHbdAmount(amount);
  if (reading.kind === 'under') return <>{t('basecamp.card.comments.amount_under', { value: reading.value })}</>;
  if (reading.kind === 'over_negative')
    return <>{t('basecamp.card.comments.amount_over_negative', { value: reading.value })}</>;
  return <>{t('basecamp.card.comments.amount', { value: reading.value })}</>;
};

/** One voter and what their vote was worth on this reply. */
const VoterChip = ({ vote }: { vote: VoteWorth }) => (
  <span
    className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] py-[3px] pl-2 pr-2.5 text-[10.5px]"
    data-testid="basecamp-comment-voter"
  >
    <Link
      href={`/@${vote.voter}`}
      className={cn(BASECAMP_LINK, 'max-w-[140px] truncate font-semibold')}
      target="_blank"
      rel="noopener noreferrer"
    >
      @{vote.voter}
    </Link>
    <span className="shrink-0 font-bold tabular-nums" style={{ color: LIME }}>
      <Hbd amount={vote.value} />
    </span>
  </span>
);

/**
 * What a reply earned, and who it earned it from.
 *
 * The total is the chain's own figure; the amount beside each name is that
 * voter's share of the weight behind it, so the names add up to the total
 * rather than to something near it. Every voter is listed, not a top few: on a
 * reply the whole list is usually short, and which few accounts keep turning up
 * across twenty-five of them is exactly what a reader is here to notice.
 */
const CommentEarnings = ({ comment }: { comment: AccountComment }) => {
  const { t } = useTranslation('common_blog');
  const votes = rankCommentVotes(comment.votes, comment.payout);

  return (
    <div className="mt-2 border-t border-white/[0.07] pt-2" data-testid="basecamp-comment-earnings">
      <div className="flex items-baseline gap-2">
        <span className="text-[12px] font-bold tabular-nums" style={{ color: LIME }}>
          <Hbd amount={comment.payout} />
        </span>
        <span className={cn(BASECAMP_MICRO_LABEL, 'normal-case tracking-normal')}>
          {comment.paidOut
            ? t('basecamp.card.comments.earned')
            : t('basecamp.card.comments.earned_pending')}
        </span>
        <span className={cn(BASECAMP_MUTED, 'ml-auto shrink-0 text-[10px] tabular-nums')}>
          {votes.length === 1
            ? t('basecamp.card.comments.one_vote')
            : t('basecamp.card.comments.votes', { votes: votes.length })}
        </span>
      </div>
      {votes.length > 0 ? (
        <div className="mt-1.5 flex flex-wrap gap-1.5" data-testid="basecamp-comment-voters">
          {votes.map((vote) => (
            <VoterChip key={vote.voter} vote={vote} />
          ))}
        </div>
      ) : null}
    </div>
  );
};

interface CommentRowProps {
  comment: AccountComment;
  /** Read once in the browser, so the server and the client never print different ages. */
  nowMs: number | null;
}

/**
 * One reply, whole. The body is printed as it was written — line breaks kept,
 * nothing shortened, no "…" — because the length and the shape of a reply are
 * the clue a reader came here for. Hive markdown is left as its own
 * characters rather than rendered: the renderer is heavy, and a reader
 * looking for a bot wants to see the raw thing anyway.
 */
const CommentRow = ({ comment, nowMs }: CommentRowProps) => {
  const { t } = useTranslation('common_blog');
  const age = nowMs === null || !comment.createdIso ? null : shortAge(comment.createdIso, nowMs);
  const body = comment.body.trim();

  return (
    <li className={ROW} data-testid="basecamp-comment-row">
      <div className="mb-1.5 flex items-center gap-2">
        <span className={cn(BASECAMP_MICRO_LABEL, 'min-w-0 flex-1 truncate normal-case tracking-normal')}>
          {comment.parentAuthor
            ? t('basecamp.card.comments.replying_to', { author: comment.parentAuthor })
            : t('basecamp.card.comments.standalone')}
        </span>
        {age ? (
          <span className={cn(BASECAMP_MUTED, 'shrink-0 text-[10px] tabular-nums')}>
            {t(`basecamp.card.values.age.${age.unit}`, { value: age.value })}
          </span>
        ) : null}
        <Link
          href={comment.url}
          className={cn(BASECAMP_LINK, 'flex shrink-0 items-center gap-1 text-[10px]')}
          title={t('basecamp.card.comments.open')}
          // A new tab, always. This is a panel over whatever the reader was
          // doing — a feed they had scrolled, a game they were half way
          // through — and following a link in place throws that away.
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink className="h-3 w-3" style={{ color: CYAN }} aria-hidden="true" />
          <span className="sr-only">{t('basecamp.card.comments.open')}</span>
        </Link>
      </div>
      <div
        className="whitespace-pre-wrap break-words text-[12px] leading-[17px] text-[#D6DEEB]"
        data-testid="basecamp-comment-body"
      >
        {body.length > 0 ? body : t('basecamp.card.comments.blank_body')}
      </div>
      <CommentEarnings comment={comment} />
    </li>
  );
};

/**
 * One of the accounts paying, over all the replies at once: who, how much of
 * the money they are responsible for, and how many of the replies they turned
 * up on.
 */
const SummaryChip = ({ summary }: { summary: VoterSummary }) => {
  const { t } = useTranslation('common_blog');

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] py-1 pl-2 pr-2.5 text-[10.5px]"
      data-testid="basecamp-comments-top-voter"
    >
      <Link
        href={`/@${summary.voter}`}
        className={cn(BASECAMP_LINK, 'max-w-[150px] truncate font-semibold')}
        target="_blank"
        rel="noopener noreferrer"
      >
        @{summary.voter}
      </Link>
      <span className="shrink-0 font-bold tabular-nums" style={{ color: LIME }}>
        <Hbd amount={summary.earned} />
      </span>
      <span className={cn(BASECAMP_MUTED, 'shrink-0 tabular-nums')}>
        {summary.votes === 1
          ? t('basecamp.card.comments.one_vote')
          : t('basecamp.card.comments.votes', { votes: summary.votes })}
      </span>
    </span>
  );
};

/**
 * Who has been paying across the replies below, at a glance, before anybody
 * scrolls.
 *
 * The list under it is left exactly as it happened — that order is where the
 * rhythm of an account shows — so this answers the other question beside it
 * rather than by rearranging the first. One account on all five chips is a
 * shape; it is also what one friend, one curation trail and one community
 * account each look like from here (ETHOS.md).
 */
const TopVotersStrip = ({ comments }: { comments: AccountComment[] }) => {
  const { t } = useTranslation('common_blog');
  const top = topCommentVoters(comments);
  if (top.length === 0) return null;

  return (
    <div data-testid="basecamp-comments-top-voters">
      <div className={cn(BASECAMP_MICRO_LABEL, 'mb-1.5')}>
        {t('basecamp.card.comments.top_voters', { limit: TOP_COMMENT_VOTERS_COUNT })}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {top.map((summary) => (
          <SummaryChip key={summary.voter} summary={summary} />
        ))}
      </div>
    </div>
  );
};

interface CommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: string;
}

/**
 * The last replies this account wrote, in full, in one scrollable panel.
 *
 * It states nothing about them. Twenty-five replies side by side say plenty
 * on their own — the same sentence twenty-five times, or a bot trigger and
 * nothing else — and the reader is the one who decides what that means
 * (ETHOS.md). No count is flagged, no reply is marked.
 */
const CommentsDialog = ({ open, onOpenChange, account }: CommentsDialogProps) => {
  const { t } = useTranslation('common_blog');
  const { comments, isLoading, isError } = useAccountComments(account, open);
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    if (open) setNowMs(Date.now());
  }, [open]);

  const body = () => {
    if (isLoading) {
      return (
        <div className={cn(BASECAMP_MUTED, 'py-8 text-center text-[12px]')} data-testid="basecamp-comments-loading">
          {t('basecamp.card.comments.loading')}
        </div>
      );
    }
    if (isError) {
      return (
        <div className="py-8 text-center text-[12px] text-[#FF90A5]" data-testid="basecamp-comments-error">
          {t('basecamp.card.comments.error')}
        </div>
      );
    }
    if (comments.length === 0) {
      return (
        <div className={cn(BASECAMP_MUTED, 'py-8 text-center text-[12px]')} data-testid="basecamp-comments-empty">
          {t('basecamp.card.comments.empty', { account })}
        </div>
      );
    }
    return (
      <ul className="flex flex-col gap-2" data-testid="basecamp-comments-list">
        {comments.map((comment) => (
          <CommentRow key={`${comment.author}/${comment.permlink}`} comment={comment} nowMs={nowMs} />
        ))}
      </ul>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[560px] gap-3 border-white/10 bg-[#0B0F17] p-5 text-[#E8EDF5] sm:max-w-[560px]"
        data-testid="basecamp-comments-dialog"
      >
        <div>
          <DialogTitle className="text-[15px] font-bold" style={{ color: CYAN }}>
            {t('basecamp.card.comments.title', { limit: ACCOUNT_COMMENTS_LIMIT })}
          </DialogTitle>
          <div className={cn(BASECAMP_MUTED, 'mt-0.5 text-[11px]')}>
            {t('basecamp.card.comments.subtitle', { account, limit: ACCOUNT_COMMENTS_LIMIT })}
          </div>
        </div>

        {/* Above the scroll, so it stays put while the replies go by. */}
        {comments.length > 0 ? <TopVotersStrip comments={comments} /> : null}

        <div className="max-h-[60vh] overflow-y-auto pr-1">{body()}</div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentsDialog;
