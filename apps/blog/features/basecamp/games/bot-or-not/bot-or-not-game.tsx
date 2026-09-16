'use client';

import { useCallback, useEffect, useState } from 'react';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import NewcomersListItem from '../../newcomers-list-item';
import { useElementWidth } from '../../hooks/use-element-width';
import { postcardTierFor } from '../../lib/postcard-sizes';
import { BASECAMP_MICRO_LABEL, BASECAMP_MUTED, BASECAMP_PANEL } from '../../lib/theme';
import { findBotOrNotVerdict, saveBotOrNotVerdict, type BotOrNotVerdict } from '../../lib/bot-or-not';
import GameNotice from './game-notice';
import SuspectProfile from './suspect-profile';
import VerdictPanel from './verdict-panel';
import { useBotQueue } from './use-bot-queue';
import { useSuspect } from './use-suspect';

/**
 * Bot or Not: one account at a time, with everything needed to judge it.
 *
 * Top to bottom it is a research desk, not a quiz. The profile is who they
 * are; the two buttons are the player's call; the postcard underneath is the
 * same card the feed shows, so the digging happens on the same readouts a
 * curator already knows. Nothing here tells the player what the readouts mean
 * (ETHOS.md) — it puts them in one place and gets out of the way.
 *
 * The queue is seeded from the SUS button: accounts already ticked `bot`.
 * A random account would be a game; these are accounts somebody already
 * wondered about, which is the point.
 */
const BotOrNotGame = () => {
  const { t } = useTranslation('common_blog');
  const { queue, loaded } = useBotQueue();
  const [index, setIndex] = useState(0);
  const [verdict, setVerdict] = useState<BotOrNotVerdict | null>(null);

  const suspect = queue[index] ?? null;
  const { detail, isLoading, isError } = useSuspect(suspect);
  // The panel is narrower than the feed, so the card has to be told what width
  // it is drawing at or the row squeezes and the username gets clipped. Same
  // measurement the feed makes (newcomers-list.tsx).
  const { ref: cardListRef, width: cardListWidth } = useElementWidth<HTMLUListElement>();

  // Storage is read on the client only, for the same reason the queue is.
  useEffect(() => {
    setVerdict(suspect ? findBotOrNotVerdict(suspect.account) : null);
  }, [suspect]);

  const advance = useCallback(() => setIndex((current) => current + 1), []);

  const decide = useCallback(
    (choice: 'bot' | 'not', why: string) => {
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

  if (!suspect) {
    return (
      <GameNotice
        title={t('basecamp.games.bot_or_not.done_title')}
        body={t('basecamp.games.bot_or_not.done_body')}
        action={{ label: t('basecamp.games.bot_or_not.start_again'), onClick: () => setIndex(0) }}
      />
    );
  }

  return (
    <div className={cn(BASECAMP_PANEL, 'mt-3 flex flex-col gap-4')} data-testid="bot-or-not-game">
      <div className="flex items-baseline justify-between gap-3">
        <p className={cn(BASECAMP_MUTED, 'text-sm leading-snug')}>{t('basecamp.games.bot_or_not.intro')}</p>
        <span className={cn(BASECAMP_MICRO_LABEL, 'shrink-0')} data-testid="bot-or-not-position">
          {t('basecamp.games.bot_or_not.position', { current: index + 1, total: queue.length })}
        </span>
      </div>

      {isError || (!isLoading && !detail) ? (
        <p className={cn(BASECAMP_MUTED, 'text-sm')}>{t('basecamp.games.bot_or_not.gone')}</p>
      ) : null}

      {isLoading ? <p className={cn(BASECAMP_MUTED, 'text-sm')}>{t('basecamp.games.bot_or_not.loading')}</p> : null}

      {detail ? (
        <SuspectProfile
          account={suspect.account}
          reputation={detail.reputation}
          accountAgeDays={detail.newcomer.accountAgeDays}
          postCount={detail.newcomer.account.postCount}
        />
      ) : null}

      <VerdictPanel account={suspect.account} existing={verdict} onDecide={decide} onSkip={advance} />

      {detail ? (
        <div>
          <span className={BASECAMP_MICRO_LABEL}>{t('basecamp.games.bot_or_not.card_heading')}</span>
          <ul className="list-none" ref={cardListRef}>
            <NewcomersListItem
              post={detail.newcomer.post}
              accountAgeDays={detail.newcomer.accountAgeDays}
              account={detail.newcomer.account}
              tier={postcardTierFor(cardListWidth)}
            />
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default BotOrNotGame;
