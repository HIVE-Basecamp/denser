'use client';

import { useMemo, useState } from 'react';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { Link } from '@hive/ui';
import { Dialog, DialogContent, DialogTitle } from '@ui/components/dialog';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import type { DayActivity } from '../hooks/use-account-history';
import { useVestsToHivePowerRate } from '../hooks/use-vests-rate';
import {
  actionPostHref,
  bucketDay,
  HOURS_IN_DAY,
  type ActionKind,
  type ActionRecord,
  type HourBucket
} from '../lib/hourly-actions';
import { BASECAMP_LINK, BASECAMP_MICRO_LABEL, BASECAMP_MUTED, BASECAMP_VIVID } from '../lib/theme';
import { formatTokenAmount } from './format-value';

const CYAN = BASECAMP_VIVID.cyan;
const VIOLET = BASECAMP_VIVID.violet;

/** A colour per kind, so a day reads as a pattern before it reads as a list. */
const KIND_COLOR: Record<ActionKind, string> = {
  post: BASECAMP_VIVID.violet,
  reply: BASECAMP_VIVID.cyan,
  vote: BASECAMP_VIVID.blue,
  follow: BASECAMP_VIVID.lime,
  powerUp: BASECAMP_VIVID.orange,
  sent: BASECAMP_VIVID.orange,
  received: BASECAMP_VIVID.lime,
  delegated: BASECAMP_VIVID.violet,
  delegationIn: BASECAMP_VIVID.violet,
  delegationEnded: BASECAMP_VIVID.pink,
  delegationInEnded: BASECAMP_VIVID.pink,
  claimed: BASECAMP_VIVID.lime,
  powerDown: BASECAMP_VIVID.pink,
  powerDownStopped: BASECAMP_VIVID.pink,
  witnessVote: BASECAMP_VIVID.yellow,
  witnessUnvote: BASECAMP_VIVID.yellow,
  proxySet: BASECAMP_VIVID.yellow,
  proxyCleared: BASECAMP_VIVID.yellow,
  proposalVote: BASECAMP_VIVID.yellow,
  proposalUnvote: BASECAMP_VIVID.yellow
};

/** So an hour with one write still draws a mark rather than nothing. */
const BAR_MIN_SHARE = 0.04;

/** Two digits, UTC, because that is the hour the chain stamped and the clock drew. */
function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

function clockTime(timestampMs: number): string {
  const when = new Date(timestampMs);
  return `${String(when.getUTCHours()).padStart(2, '0')}:${String(when.getUTCMinutes()).padStart(2, '0')}`;
}

/**
 * The day, in UTC. Printed once at the top rather than on every line, because
 * every line inside the panel is on this one day.
 */
const DAY_FORMAT = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC'
});

function dayLabel(dayStartMs: number): string {
  return DAY_FORMAT.format(new Date(dayStartMs));
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

/**
 * The money on a line, in the units Hive states it in.
 *
 * HIVE, HBD and HP are never added together. A claim that landed as all three
 * prints as all three, because one figure covering them would be a conversion
 * nobody asked for and a number that appears nowhere on chain.
 */
function amountText(action: ActionRecord, hivePerVest: number | null, t: Translate): string {
  const parts: string[] = [];
  if (action.hive) parts.push(t('basecamp.card.hourly.units.hive', { value: formatTokenAmount(action.hive) }));
  if (action.hbd) parts.push(t('basecamp.card.hourly.units.hbd', { value: formatTokenAmount(action.hbd) }));
  if (action.vests) {
    parts.push(
      hivePerVest === null
        ? t('basecamp.card.hourly.units.unknown')
        : t('basecamp.card.hourly.units.hp', { value: formatTokenAmount(action.vests * hivePerVest) })
    );
  }
  return parts.length > 0 ? parts.join(' · ') : t('basecamp.card.hourly.units.unknown');
}

/** The proposals one governance vote covered, as plain numbers. */
function proposalList(action: ActionRecord): string {
  const ids = action.proposalIds ?? [];
  return ids.length > 0 ? ids.join(', ') : '';
}

/**
 * What happened, as a phrase, with the other account left out of it.
 *
 * The name is a link and a link cannot live inside a translated sentence, so
 * every phrase here ends where the name begins — "sent 5.000 HIVE to", then
 * the name. Languages that put the name first can carry the whole phrase
 * after it instead; nothing here assumes English word order beyond that.
 */
function actionPhrase(action: ActionRecord, hivePerVest: number | null, t: Translate): string {
  const key = (name: string) => `basecamp.card.hourly.lines.${name}`;
  const amount = () => amountText(action, hivePerVest, t);

  switch (action.kind) {
    case 'post':
      return t(key('post'));
    case 'reply':
      return t(key('reply'));
    case 'follow':
      return t(key('follow'));
    case 'vote': {
      const percent = action.percent ?? 0;
      // A downvote is not a small upvote, and calling it one would be the
      // panel's own opinion about what happened.
      return percent < 0
        ? t(key('downvote'), { percent: Math.abs(percent) })
        : t(key('vote'), { percent });
    }
    case 'powerUp':
      return action.counterparty
        ? t(key('powerUpTo'), { amount: amount() })
        : t(key('powerUp'), { amount: amount() });
    case 'sent':
      return t(key('sent'), { amount: amount() });
    case 'received':
      return t(key('received'), { amount: amount() });
    case 'delegated':
      return t(key('delegated'), { amount: amount() });
    case 'delegationIn':
      return t(key('delegationIn'), { amount: amount() });
    case 'delegationEnded':
      return t(key('delegationEnded'));
    case 'delegationInEnded':
      return t(key('delegationInEnded'));
    case 'claimed':
      return t(key('claimed'), { amount: amount() });
    case 'powerDown':
      return t(key('powerDown'), { amount: amount() });
    case 'powerDownStopped':
      return t(key('powerDownStopped'));
    case 'witnessVote':
      return t(key('witnessVote'));
    case 'witnessUnvote':
      return t(key('witnessUnvote'));
    case 'proxySet':
      return t(key('proxySet'));
    case 'proxyCleared':
      return t(key('proxyCleared'));
    case 'proposalVote':
      return t(key('proposalVote'), { proposals: proposalList(action) });
    case 'proposalUnvote':
      return t(key('proposalUnvote'), { proposals: proposalList(action) });
    default:
      return '';
  }
}

interface ActionLineProps {
  action: ActionRecord;
  account: string;
  hivePerVest: number | null;
}

/**
 * One action, on one line: when, what, how much, and with whom.
 *
 * Two separate destinations, because they answer different questions. The name
 * goes to the person, which is where a reader goes to ask who they are; the
 * arrow goes to the post itself, which is where they go to see what was
 * actually said or voted on.
 */
const ActionLine = ({ action, account, hivePerVest }: ActionLineProps) => {
  const { t } = useTranslation('common_blog');
  const href = actionPostHref(action, account);

  return (
    <div
      className="flex items-baseline gap-1.5 break-inside-avoid py-[1px] text-[10.5px] leading-[15px]"
      data-testid="basecamp-hourly-action"
    >
      <span className={cn(BASECAMP_MUTED, 'shrink-0 tabular-nums')}>{clockTime(action.timestampMs)}</span>
      <span className="shrink-0 font-semibold" style={{ color: KIND_COLOR[action.kind] }}>
        {actionPhrase(action, hivePerVest, t)}
      </span>
      {action.counterparty ? (
        <Link
          href={`/@${action.counterparty}`}
          className={cn(BASECAMP_LINK, 'shrink-0 truncate')}
          target="_blank"
          rel="noopener noreferrer"
        >
          @{action.counterparty}
        </Link>
      ) : null}
      {href ? (
        <Link
          href={href}
          className="shrink-0"
          title={t('basecamp.card.hourly.open_post')}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink className="h-2.5 w-2.5" style={{ color: CYAN }} aria-hidden="true" />
          <span className="sr-only">{t('basecamp.card.hourly.open_post')}</span>
        </Link>
      ) : null}
      {action.memo ? (
        <span className={cn(BASECAMP_MUTED, 'min-w-0 truncate italic')} title={action.memo}>
          {action.memo}
        </span>
      ) : null}
    </div>
  );
};

interface HourRowProps {
  bucket: HourBucket;
  busiest: number;
  open: boolean;
  onToggle: () => void;
  account: string;
  hivePerVest: number | null;
}

/**
 * One hour of the day: how much writing landed in it, and — once opened —
 * everything that did.
 *
 * Closed by default, every one of them. An account with a thousand actions
 * would be a wall of text otherwise, and the wall is not the reading: the
 * twenty-four bars are, and they fit on one screen.
 */
const HourRow = ({ bucket, busiest, open, onToggle, account, hivePerVest }: HourRowProps) => {
  const count = bucket.actions.length;
  const empty = count === 0;
  const share = busiest > 0 ? count / busiest : 0;

  return (
    <li data-testid="basecamp-hourly-row" data-hour={bucket.hour}>
      <button
        type="button"
        onClick={empty ? undefined : onToggle}
        aria-expanded={empty ? undefined : open}
        disabled={empty}
        className={cn(
          'flex w-full items-center gap-2 rounded px-1 py-[3px] text-left transition-colors',
          empty ? 'cursor-default opacity-40' : 'hover:bg-white/[0.05]'
        )}
      >
        <span
          className={cn(BASECAMP_MUTED, 'w-[38px] shrink-0 text-[10.5px] tabular-nums')}
          style={empty ? undefined : { color: '#E8EDF5' }}
        >
          {hourLabel(bucket.hour)}
        </span>
        <span className="h-[5px] flex-1 overflow-hidden rounded-full bg-white/[0.06]">
          {empty ? null : (
            <span
              className="block h-full rounded-full"
              style={{
                width: `${Math.max(share, BAR_MIN_SHARE) * 100}%`,
                backgroundColor: CYAN,
                boxShadow: `0 0 7px -2px ${CYAN}`
              }}
            />
          )}
        </span>
        <span
          className="w-[26px] shrink-0 text-right text-[11px] font-bold tabular-nums"
          style={{ color: CYAN }}
        >
          {empty ? '' : count}
        </span>
        <ChevronRight
          className={cn('h-3 w-3 shrink-0 transition-transform', open && 'rotate-90', empty && 'invisible')}
          style={{ color: VIOLET }}
          aria-hidden="true"
        />
      </button>
      {open ? (
        // Two columns where there is room: an hour with sixty actions is three
        // screens in one column and less than one in two.
        <div
          className="mb-1 ml-[44px] mr-1 mt-0.5 gap-x-5 border-l border-white/[0.07] pl-2.5 sm:columns-2"
          data-testid="basecamp-hourly-actions"
        >
          {bucket.actions.map((action, index) => (
            <ActionLine
              key={`${action.timestampMs}-${action.kind}-${index}`}
              action={action}
              account={account}
              hivePerVest={hivePerVest}
            />
          ))}
        </div>
      ) : null}
    </li>
  );
};

interface HourlyActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: string;
  /** Today, already read by the card. Opening this costs nothing. */
  day: DayActivity;
  loading: boolean;
  failed: boolean;
}

/**
 * The clock, opened: which hours of the day this account is awake in, and what
 * it does in them.
 *
 * Hour of the day, not the last day — the same twenty-four hours the clock is
 * drawn from, so the panel and the drawing agree. The bars count writing,
 * which is what the clock counts; everything else they did sits beside it as a
 * quieter figure, because a day of votes and a day of posts are not the same
 * day and adding them together would say neither.
 *
 * It states when and what, and nothing else. Every hour of the day lit is a
 * shape a reader may find interesting; it is also what a shared account, a
 * scheduler and somebody in the wrong timezone each look like from here
 * (ETHOS.md).
 */
const HourlyActionsDialog = ({
  open,
  onOpenChange,
  account,
  day,
  loading,
  failed
}: HourlyActionsDialogProps) => {
  const { t } = useTranslation('common_blog');
  const [openHour, setOpenHour] = useState<number | null>(null);
  const hivePerVest = useVestsToHivePowerRate();
  const hours = useMemo(() => bucketDay(day.actions), [day.actions]);
  const busiest = hours.reduce((most, bucket) => Math.max(most, bucket.actions.length), 0);

  const body = () => {
    if (loading) {
      return (
        <div
          className={cn(BASECAMP_MUTED, 'py-8 text-center text-[12px]')}
          data-testid="basecamp-hourly-loading"
        >
          {t('basecamp.card.hourly.loading')}
        </div>
      );
    }
    if (failed) {
      return (
        <div className="py-8 text-center text-[12px] text-[#FF90A5]" data-testid="basecamp-hourly-error">
          {t('basecamp.card.hourly.error')}
        </div>
      );
    }
    // A day with nothing in it is a true reading of the day, not a failure.
    if (day.actions.length === 0) {
      return (
        <div
          className={cn(BASECAMP_MUTED, 'py-8 text-center text-[12px]')}
          data-testid="basecamp-hourly-quiet"
        >
          {t('basecamp.card.hourly.quiet_today', { account })}
        </div>
      );
    }
    return (
      <ul className="flex flex-col" data-testid="basecamp-hourly-list">
        {hours.map((bucket) => (
          <HourRow
            key={bucket.hour}
            bucket={bucket}
            busiest={busiest}
            open={openHour === bucket.hour}
            onToggle={() => setOpenHour((current) => (current === bucket.hour ? null : bucket.hour))}
            account={account}
            hivePerVest={hivePerVest}
          />
        ))}
      </ul>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[560px] gap-2.5 border-white/10 bg-[#0D0D12] p-5 text-[#E8EDF5] sm:max-w-[560px]"
        data-testid="basecamp-hourly-dialog"
      >
        <div>
          <DialogTitle className="text-[15px] font-bold" style={{ color: CYAN }}>
            {t('basecamp.card.hourly.title')}
          </DialogTitle>
          <div className={cn(BASECAMP_MUTED, 'mt-0.5 text-[11px]')}>
            {t('basecamp.card.hourly.subtitle', { account })}
          </div>
        </div>

        {day.known && day.actions.length > 0 ? (
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-bold" style={{ color: VIOLET }}>
              {dayLabel(day.dayStartMs)}
            </span>
            <span className={cn(BASECAMP_MICRO_LABEL, 'flex items-center gap-3 normal-case tracking-normal')}>
              <span>
                {t('basecamp.card.hourly.active_hours', { hours: day.todayActiveHours, of: HOURS_IN_DAY })}
              </span>
              <span>{t('basecamp.card.hourly.actions', { actions: day.actions.length })}</span>
            </span>
          </div>
        ) : null}

        <div className="max-h-[58vh] overflow-y-auto pr-1">{body()}</div>

        <p className={cn(BASECAMP_MUTED, 'text-[10.5px] leading-snug')} data-testid="basecamp-hourly-window">
          {day.complete
            ? t('basecamp.card.hourly.note_complete')
            : t('basecamp.card.hourly.note_capped')}
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default HourlyActionsDialog;
