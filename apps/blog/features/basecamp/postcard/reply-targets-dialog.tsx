'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Link } from '@hive/ui';
import { getUserAvatarUrl } from '@ui/lib/avatar-utils';
import { Dialog, DialogContent, DialogTitle } from '@ui/components/dialog';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import { useReplyTargets } from '../hooks/use-reply-targets';
import { useHbdPerHive } from '../hooks/use-vote-value';
import { useVestsToHivePowerRate } from '../hooks/use-vests-rate';
import {
  byEarnings,
  replyShare,
  TOP_REPLY_TARGETS_COUNT,
  withEarnings,
  type ReplyTargetRow
} from '../lib/reply-targets';
import { BASECAMP_LINK, BASECAMP_MICRO_LABEL, BASECAMP_MUTED, BASECAMP_VIVID } from '../lib/theme';
import { formatHbdAmount } from './format-value';
import ReadProgressBar from './read-progress-bar';

const CYAN = BASECAMP_VIVID.cyan;
const LIME = BASECAMP_VIVID.lime;
const PINK = BASECAMP_VIVID.pink;
const AVATAR = 30;

/** So a person with a sliver of the replies still draws a mark rather than nothing. */
const BAR_MIN_SHARE = 0.02;

/** The two orders the list can be read in. Both run biggest first. */
type Order = 'replies' | 'earned';

interface HbdValueProps {
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
  // Most replies on Hive are paid nothing, so most rows are this one. "$0.000"
  // reads as a measurement to three decimal places; the truth is plainer.
  if (amount === 0) return <>{t('basecamp.card.reply_targets.amount', { value: '0' })}</>;
  const reading = formatHbdAmount(amount);
  if (reading.kind === 'under')
    return <>{t('basecamp.card.reply_targets.amount_under', { value: reading.value })}</>;
  if (reading.kind === 'over_negative')
    return <>{t('basecamp.card.reply_targets.amount_over_negative', { value: reading.value })}</>;
  return <>{t('basecamp.card.reply_targets.amount', { value: reading.value })}</>;
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

interface OrderTabProps {
  label: string;
  active: boolean;
  onSelect: () => void;
}

const OrderTab = ({ label, active, onSelect }: OrderTabProps) => (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={active}
    className={cn(
      'rounded-full border px-2.5 py-1 text-[10.5px] font-semibold transition-colors',
      active ? 'border-transparent text-[#0B0F17]' : 'border-white/15 text-[#E8EDF5] hover:border-white/40'
    )}
    style={active ? { backgroundColor: CYAN } : undefined}
    data-testid="basecamp-reply-targets-order"
    data-active={active ? 'true' : 'false'}
  >
    {label}
  </button>
);

interface TargetRowProps {
  row: ReplyTargetRow;
  rank: number;
  replies: number;
}

/**
 * One person: who they are, how many replies went to them, how much of this
 * account's replying they account for, and what replying to them has earned.
 *
 * The bar is the part worth looking at. Twenty people each taking a twentieth
 * is a different picture from one person taking nine tenths, and the bar says
 * that without anybody having to compare numbers. It says only that.
 */
const TargetRow = ({ row, rank, replies }: TargetRowProps) => {
  const { t } = useTranslation('common_blog');
  const share = replyShare(row, replies);

  return (
    <li className="flex items-center gap-3 py-2" data-testid="basecamp-reply-target-row">
      <span className="w-5 shrink-0 text-right text-[12px] font-bold tabular-nums" style={{ color: CYAN }}>
        {rank}
      </span>
      <Link
        href={`/@${row.account}`}
        className="flex min-w-0 flex-1 items-center gap-2.5"
        data-testid="basecamp-reply-target-name"
        // A new tab, for the same reason the other panels open one: this sits
        // over a feed, and going to the person in place loses it — along with
        // the read the panel just made.
        target="_blank"
        rel="noopener noreferrer"
      >
        <span
          className="block shrink-0 rounded-full bg-cover bg-no-repeat ring-1 ring-white/15"
          style={{
            width: AVATAR,
            height: AVATAR,
            backgroundImage: `url(${getUserAvatarUrl(row.account, 'small')})`
          }}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span className={cn(BASECAMP_LINK, 'block truncate text-[12.5px] font-semibold')}>
            @{row.account}
          </span>
          <span className="mt-1.5 block h-[5px] w-full overflow-hidden rounded-full bg-white/[0.07]">
            <span
              className="block h-full rounded-full"
              style={{
                width: `${Math.max(share, BAR_MIN_SHARE) * 100}%`,
                backgroundColor: CYAN,
                boxShadow: `0 0 8px -1px ${CYAN}`
              }}
            />
          </span>
        </span>
      </Link>
      <span className="w-[76px] shrink-0 text-right">
        <span className="block text-[14px] font-bold tabular-nums" style={{ color: LIME }}>
          <HbdValue amount={row.earned} />
        </span>
        <span className={cn(BASECAMP_MUTED, 'block text-[9.5px] uppercase leading-none tracking-[0.06em]')}>
          {t('basecamp.card.reply_targets.earned_label')}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-[14px] font-bold tabular-nums" style={{ color: PINK }}>
          {row.replies}
        </span>
        <span className={cn(BASECAMP_MUTED, 'block text-[9.5px] uppercase leading-none tracking-[0.06em]')}>
          {t('basecamp.card.reply_targets.replies_label')}
        </span>
      </span>
    </li>
  );
};

interface ReplyTargetsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: string;
}

/**
 * Who this account talks to, and what talking to them has paid.
 *
 * Two readings of the same rows: most replied to, and best paid. They are
 * rarely the same twenty, and the difference between them is the thing worth
 * seeing — somebody who replies everywhere but is only ever paid under one
 * person's posts looks quite unlike somebody whose two lists match.
 *
 * It states who, how many and how much, and nothing else. A newcomer replying
 * mostly to one account is a shape; it is also what having one friend, one
 * mentor or one home community each look like from here (ETHOS.md).
 */
const ReplyTargetsDialog = ({ open, onOpenChange, account }: ReplyTargetsDialogProps) => {
  const { t } = useTranslation('common_blog');
  const [order, setOrder] = useState<Order>('replies');
  const hbdPerHive = useHbdPerHive(open);
  const hivePerVest = useVestsToHivePowerRate();
  // Nothing is read until the panel is open: this is the most expensive read
  // the card can make.
  const { targets, status, reading: progress } = useReplyTargets(account, open);
  // Priced at render, not in the read: a feed rate arriving late re-prices what
  // is already here rather than sending for it again.
  const reading = useMemo(
    () => withEarnings(targets, { hbdPerHive, hivePerVest }),
    [targets, hbdPerHive, hivePerVest]
  );
  const ranked = order === 'earned' ? byEarnings(reading.rows) : reading.rows;
  const top = ranked.slice(0, TOP_REPLY_TARGETS_COUNT);

  const body = () => {
    if (status === 'loading') {
      // A bar rather than a sentence. On an account with thousands of replies
      // this read runs for half a minute, and a line that never changes is
      // indistinguishable from one that has stopped.
      return (
        <div className="py-8" data-testid="basecamp-reply-targets-loading">
          <ReadProgressBar
            progress={progress.progress}
            label={
              progress.secondsLeft === null
                ? t('basecamp.card.reply_targets.loading')
                : t('basecamp.card.reply_targets.reading_left', { seconds: progress.secondsLeft })
            }
          />
        </div>
      );
    }
    if (status === 'unavailable') {
      return (
        <div
          className="py-8 text-center text-[12px] text-[#FF90A5]"
          data-testid="basecamp-reply-targets-error"
        >
          {t('basecamp.card.reply_targets.error')}
        </div>
      );
    }
    if (top.length === 0) {
      return (
        <div
          className={cn(BASECAMP_MUTED, 'py-8 text-center text-[12px]')}
          data-testid="basecamp-reply-targets-empty"
        >
          {t('basecamp.card.reply_targets.empty', { account })}
        </div>
      );
    }
    return (
      <ul className="flex flex-col divide-y divide-white/[0.07]" data-testid="basecamp-reply-targets-list">
        {top.map((row, index) => (
          <TargetRow key={row.account} row={row} rank={index + 1} replies={reading.replies} />
        ))}
      </ul>
    );
  };

  /**
   * What the numbers above the list are drawn from, in one sentence, under
   * them. Nothing until the read has finished: a window line stating a total
   * of nought would be a measurement of an account nobody has looked at yet.
   */
  const provenance = () => {
    if (!reading.known) return null;
    const parts: string[] = [
      reading.capped
        ? t('basecamp.card.reply_targets.window_capped', { replies: reading.replies.toLocaleString() })
        : t('basecamp.card.reply_targets.window_lifetime', { replies: reading.replies.toLocaleString() })
    ];
    if (reading.selfReplies > 0) {
      parts.push(t('basecamp.card.reply_targets.self_note', { self: reading.selfReplies.toLocaleString() }));
    }
    if (reading.unmatched > 0) {
      parts.push(
        t('basecamp.card.reply_targets.unmatched_note', { rewards: reading.unmatched.toLocaleString() })
      );
    }
    parts.push(t('basecamp.card.reply_targets.value_note'));
    return parts.join(' ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[540px] gap-3 border-white/10 bg-[#0B0F17] p-5 text-[#E8EDF5] sm:max-w-[540px]"
        data-testid="basecamp-reply-targets-dialog"
      >
        <div>
          <DialogTitle className="text-[15px] font-bold" style={{ color: CYAN }}>
            {t('basecamp.card.reply_targets.title', { limit: TOP_REPLY_TARGETS_COUNT })}
          </DialogTitle>
          <div className={cn(BASECAMP_MUTED, 'mt-0.5 text-[11px]')}>
            {t('basecamp.card.reply_targets.subtitle', { account })}
          </div>
        </div>

        {/* How many replies, to how many different people, and what the lot of
            them earned. One person and fifty people are the same count of
            replies and not the same account, so the second figure stands
            beside the first. */}
        {reading.known ? (
          <div className="flex items-end gap-6">
            <Stat
              value={reading.replies.toLocaleString()}
              label={t('basecamp.card.reply_targets.replies_stat')}
              color={PINK}
            />
            <Stat
              value={reading.rows.length.toLocaleString()}
              label={t('basecamp.card.reply_targets.people_stat')}
              color={CYAN}
            />
            <Stat
              value={<HbdValue amount={reading.earned} />}
              label={t('basecamp.card.reply_targets.earned_stat')}
              color={LIME}
            />
          </div>
        ) : null}

        {/* The same rows, read two ways. Who they talk to most and who pays
            them most are different questions and the panel answers both rather
            than picking one. */}
        <div className="flex items-center gap-2">
          <span className={cn(BASECAMP_MUTED, 'text-[10.5px]')}>
            {t('basecamp.card.reply_targets.order_label')}
          </span>
          <OrderTab
            label={t('basecamp.card.reply_targets.order_replies')}
            active={order === 'replies'}
            onSelect={() => setOrder('replies')}
          />
          <OrderTab
            label={t('basecamp.card.reply_targets.order_earned')}
            active={order === 'earned'}
            onSelect={() => setOrder('earned')}
          />
        </div>

        <div className="max-h-[52vh] overflow-y-auto pr-1">{body()}</div>

        {reading.known ? (
          <p
            className={cn(BASECAMP_MUTED, 'text-[10.5px] leading-snug')}
            data-testid="basecamp-reply-targets-window"
          >
            {provenance()}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default ReplyTargetsDialog;
