'use client';

import { useCallback, useEffect, useState } from 'react';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import { parseIsoMs } from '../../lib/signals';
import { BASECAMP_MICRO_LABEL, BASECAMP_MUTED, BASECAMP_PANEL } from '../../lib/theme';
import {
  findSockOrNotVerdict,
  readSockOrNotVerdicts,
  saveSockOrNotVerdict,
  SOCK_OR_NOT_CHOICES,
  type SockOrNotChoice,
  type SockOrNotVerdict
} from '../../lib/sock-or-not';
import GameNotice from '../judging/game-notice';
import ResearchCard from '../judging/research-card';
import SuspectProfile from '../judging/suspect-profile';
import VerdictPanel from '../judging/verdict-panel';
import { useSuspectQueue } from '../judging/use-suspect-queue';
import { useSuspect } from '../judging/use-suspect';
import PaidByPanel from './paid-by-panel';

const [ACCUSE, CLEAR] = SOCK_OR_NOT_CHOICES;

/** Module scope so the queue's effect does not re-run on every render. */
const judgedAccounts = () => readSockOrNotVerdicts().map((verdict) => verdict.account);

/**
 * Sock or Not: one account at a time, and a money question about it.
 *
 * Built on the same desk as Bot or Not, and deliberately so — the profile, the
 * two oversized buttons, the optional "why", the postcard underneath, the way
 * into the comments. What changes is what the desk has on it. Bot or Not asks
 * what an account WRITES; this one asks who PAYS FOR IT, because that is what
 * a sock gives away: the same hand made the account, funds it, and votes it up.
 *
 * So between the buttons and the postcard sits the money panel — who made this
 * account, who has sent or lent it anything, and a way into who has been
 * voting it up. Nothing there says what any of it means (ETHOS.md).
 *
 * The queue is seeded from the SUS button: accounts already ticked `sock`. Its
 * own queue and its own record — a player may well think an account is a sock
 * and not a bot, and neither answer touches the other.
 */
const SockOrNotGame = () => {
  const { t } = useTranslation('common_blog');
  const { queue, loaded, source } = useSuspectQueue('sock', judgedAccounts);
  const [index, setIndex] = useState(0);
  const [verdict, setVerdict] = useState<SockOrNotVerdict | null>(null);

  const suspect = queue[index] ?? null;
  const { detail, isLoading, isError } = useSuspect(suspect);

  // Storage is read on the client only, for the same reason the queue is.
  useEffect(() => {
    setVerdict(suspect ? findSockOrNotVerdict(suspect.account) : null);
  }, [suspect]);

  const advance = useCallback(() => setIndex((current) => current + 1), []);

  const decide = useCallback(
    (choice: SockOrNotChoice, why: string) => {
      if (!suspect) return;
      saveSockOrNotVerdict({
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
        title={t('basecamp.games.sock_or_not.empty_title')}
        body={t('basecamp.games.sock_or_not.empty_body')}
      />
    );
  }

  if (!suspect) {
    return (
      <GameNotice
        title={t('basecamp.games.sock_or_not.done_title')}
        body={t('basecamp.games.sock_or_not.done_body')}
        action={{ label: t('basecamp.games.judging.start_again'), onClick: () => setIndex(0) }}
      />
    );
  }

  return (
    <div className={cn(BASECAMP_PANEL, 'mt-3 flex flex-col gap-4')} data-testid="sock-or-not-game">
      <div className="flex items-baseline justify-between gap-3">
        <p className={cn(BASECAMP_MUTED, 'text-sm leading-snug')}>{t('basecamp.games.sock_or_not.intro')}</p>
        <span className={cn(BASECAMP_MICRO_LABEL, 'shrink-0')} data-testid="sock-or-not-position">
          {t('basecamp.games.judging.position', { current: index + 1, total: queue.length })}
        </span>
      </div>

      {source === 'feed' ? (
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
        tone="orange"
        copy={{
          accuse: t('basecamp.games.sock_or_not.sock'),
          clear: t('basecamp.games.sock_or_not.not'),
          whyLabel: t('basecamp.games.sock_or_not.why_label'),
          whyPlaceholder: t('basecamp.games.sock_or_not.why_placeholder'),
          saidAccuse: t('basecamp.games.sock_or_not.said_sock'),
          saidClear: t('basecamp.games.sock_or_not.said_not')
        }}
        onDecide={decide}
        onSkip={advance}
      />

      <PaidByPanel account={suspect.account} createdMs={parseIsoMs(detail?.newcomer.account.createdIso ?? null)} />

      {detail ? <ResearchCard detail={detail} /> : null}
    </div>
  );
};

export default SockOrNotGame;
