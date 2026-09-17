'use client';

import { useCallback, useEffect, useState } from 'react';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import { BASECAMP_MICRO_LABEL, BASECAMP_MUTED, BASECAMP_PANEL } from '../../lib/theme';
import {
  BOT_OR_NOT_CHOICES,
  findBotOrNotVerdict,
  readBotOrNotVerdicts,
  saveBotOrNotVerdict,
  type BotOrNotChoice,
  type BotOrNotVerdict
} from '../../lib/bot-or-not';
import GameNotice from '../judging/game-notice';
import ResearchCard from '../judging/research-card';
import SuspectProfile from '../judging/suspect-profile';
import VerdictPanel from '../judging/verdict-panel';
import { useSuspectQueue } from '../judging/use-suspect-queue';
import { useSuspect } from '../judging/use-suspect';

const [ACCUSE, CLEAR] = BOT_OR_NOT_CHOICES;

/** How few are left before the game goes and asks the feed for more. */
const TOP_UP_AT = 5;

/** Module scope so the queue's effect does not re-run on every render. */
const judgedAccounts = () => readBotOrNotVerdicts().map((verdict) => verdict.account);

/**
 * Bot or Not: one account at a time, with everything needed to judge it.
 *
 * Top to bottom it is a research desk, not a quiz. The profile is who they
 * are; the two buttons are the player's call; the postcard underneath is the
 * same card the feed shows, so the digging happens on the same readouts a
 * curator already knows. Nothing here tells the player what the readouts mean
 * (ETHOS.md) — it puts them in one place and gets out of the way.
 *
 * The queue puts accounts ticked `bot` with the SUS button first — somebody
 * already wondered about those, which is the point — and new accounts from the
 * feed behind them, so there is always somebody to look at. An account this
 * game has already been answered on never comes back.
 */
const BotOrNotGame = () => {
  const { t } = useTranslation('common_blog');
  const { queue, loaded, loadMore, hasMore } = useSuspectQueue('bot', judgedAccounts);
  const [index, setIndex] = useState(0);
  const [verdict, setVerdict] = useState<BotOrNotVerdict | null>(null);

  const suspect = queue[index] ?? null;
  const { detail, isLoading, isError } = useSuspect(suspect);

  // Storage is read on the client only, for the same reason the queue is.
  useEffect(() => {
    setVerdict(suspect ? findBotOrNotVerdict(suspect.account) : null);
  }, [suspect]);

  // Ask the feed for more before the last few are used up, so the game never
  // arrives at an empty screen mid-play.
  useEffect(() => {
    if (index >= queue.length - TOP_UP_AT) loadMore();
  }, [index, queue.length, loadMore]);

  const advance = useCallback(() => setIndex((current) => current + 1), []);

  const decide = useCallback(
    (choice: BotOrNotChoice, why: string) => {
      if (!suspect) return;
      saveBotOrNotVerdict({
        account: suspect.account,
        permlink: suspect.permlink,
        verdict: choice,
        why,
        decidedIso: new Date().toISOString()
      });
      advance();
    },
    [suspect, advance]
  );

  if (!loaded) return null;

  if (queue.length === 0) {
    return (
      <GameNotice
        title={t('basecamp.games.bot_or_not.empty_title')}
        body={t('basecamp.games.bot_or_not.empty_body')}
      />
    );
  }

  // Run off the end while the feed still has people: that is a wait, not the
  // end of the game, and it must never read as one.
  if (!suspect && hasMore) {
    return (
      <GameNotice
        title={t('basecamp.games.judging.finding_title')}
        body={t('basecamp.games.judging.finding_body')}
      />
    );
  }

  if (!suspect) {
    return (
      <GameNotice
        title={t('basecamp.games.bot_or_not.done_title')}
        body={t('basecamp.games.bot_or_not.done_body')}
        action={{ label: t('basecamp.games.judging.start_again'), onClick: () => setIndex(0) }}
      />
    );
  }

  return (
    <div className={cn(BASECAMP_PANEL, 'mt-3 flex flex-col gap-4')} data-testid="bot-or-not-game">
      <div className="flex items-baseline justify-between gap-3">
        <p className={cn(BASECAMP_MUTED, 'text-sm leading-snug')}>{t('basecamp.games.bot_or_not.intro')}</p>
        <span className={cn(BASECAMP_MICRO_LABEL, 'shrink-0')} data-testid="bot-or-not-position">
          {t('basecamp.games.judging.position', { current: index + 1, total: queue.length })}
        </span>
      </div>

      {suspect.source === 'feed' ? (
        <p className={cn(BASECAMP_MUTED, 'text-[11px] leading-snug')} data-testid="judging-from-feed">
          {t('basecamp.games.judging.from_feed')}
        </p>
      ) : null}

      {isError || (!isLoading && !detail) ? (
        <p className={cn(BASECAMP_MUTED, 'text-sm')}>{t('basecamp.games.judging.gone')}</p>
      ) : null}

      {isLoading ? <p className={cn(BASECAMP_MUTED, 'text-sm')}>{t('basecamp.games.judging.loading')}</p> : null}

      {detail ? (
        <SuspectProfile
          account={suspect.account}
          reputation={detail.reputation}
          accountAgeDays={detail.newcomer.accountAgeDays}
          postCount={detail.newcomer.account.postCount}
        />
      ) : null}

      <VerdictPanel
        account={suspect.account}
        existing={verdict}
        choices={{ accuse: ACCUSE, clear: CLEAR }}
        tone="red"
        copy={{
          accuse: t('basecamp.games.bot_or_not.bot'),
          clear: t('basecamp.games.bot_or_not.not'),
          whyLabel: t('basecamp.games.bot_or_not.why_label'),
          whyPlaceholder: t('basecamp.games.bot_or_not.why_placeholder'),
          saidAccuse: t('basecamp.games.bot_or_not.said_bot'),
          saidClear: t('basecamp.games.bot_or_not.said_not')
        }}
        onDecide={decide}
        onSkip={advance}
      />

      {detail ? <ResearchCard detail={detail} /> : null}
    </div>
  );
};

export default BotOrNotGame;
