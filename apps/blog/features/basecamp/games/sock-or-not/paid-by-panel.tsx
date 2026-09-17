'use client';

import { useState } from 'react';
import { Link } from '@hive/ui';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import { useAccountCreator } from '../../hooks/use-account-creator';
import { useAccountPayers } from '../../hooks/use-account-payers';
import { useHbdPerHive } from '../../hooks/use-vote-value';
import { useVestsToHivePowerRate } from '../../hooks/use-vests-rate';
import { useVotesReceived } from '../../hooks/use-votes-received';
import { TOP_PAYERS_COUNT } from '../../lib/payers';
import { BASECAMP_LINK, BASECAMP_MICRO_LABEL, BASECAMP_MUTED, BASECAMP_VIVID } from '../../lib/theme';
import { formatTokenAmount } from '../../postcard/format-value';
import TopVotersDialog from '../../postcard/top-voters-dialog';
import { RESEARCH_LINK } from '../judging/research-link';
import PayerRow from './payer-row';

const AMBER = BASECAMP_VIVID.orange;
const CYAN = BASECAMP_VIVID.cyan;
const LIME = BASECAMP_VIVID.lime;

/** One figure with its name under it. No frame — the colour does the grouping. */
const Stat = ({ value, label, color }: { value: string; label: string; color: string }) => (
  <span>
    <span className="block text-[21px] font-bold leading-none tabular-nums" style={{ color }}>
      {value}
    </span>
    <span className={cn(BASECAMP_MICRO_LABEL, 'mt-1.5 block')}>{label}</span>
  </span>
);

interface PaidByPanelProps {
  account: string;
  /** When the account was made — what lets the deeper vote read say how far through it is. */
  createdMs: number | null;
}

/**
 * Who is paying for this account.
 *
 * This is the whole reason Sock or Not is a different game from Bot or Not. A
 * bot gives itself away by what it writes; a sock gives itself away by where
 * its money comes from — the same hand made it, funds it and votes it up. So
 * the panel puts those three in one place:
 *
 *   - who made the account,
 *   - who has sent or lent it money, ranked by how much,
 *   - and a way into who has been voting it up, which is how most money
 *     actually reaches a Hive account.
 *
 * It states who, how much and how often, and stops there. One account behind
 * all of another's money is a shape worth seeing; it is also what a parent
 * funding a child, a project paying a contributor and a community onboarding
 * someone each look like from here. The reader decides (ETHOS.md).
 */
const PaidByPanel = ({ account, createdMs }: PaidByPanelProps) => {
  const { t } = useTranslation('common_blog');
  const [votersOpen, setVotersOpen] = useState(false);

  const creator = useAccountCreator(account);
  const hbdPerHive = useHbdPerHive();
  const hivePerVest = useVestsToHivePowerRate();
  const { payers, status } = useAccountPayers(account, { hbdPerHive, hivePerVest });
  const { votes, status: votesStatus } = useVotesReceived(account);

  const top = payers.rows.slice(0, TOP_PAYERS_COUNT);

  return (
    <div className="flex flex-col gap-3" data-testid="sock-or-not-paid-by">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className={BASECAMP_MICRO_LABEL}>{t('basecamp.games.sock_or_not.paid_by_heading')}</span>
        <span className={cn(BASECAMP_MUTED, 'text-[11px] leading-snug')}>
          {t('basecamp.games.sock_or_not.paid_by_intro')}
        </span>
      </div>

      <p className="text-[12.5px] leading-snug" data-testid="sock-or-not-creator">
        {creator ? (
          <>
            <span className={BASECAMP_MUTED}>{t('basecamp.games.sock_or_not.made_by')}</span>{' '}
            <Link href={`/@${creator}`} className={cn(BASECAMP_LINK, 'font-semibold')} {...RESEARCH_LINK}>
              @{creator}
            </Link>
          </>
        ) : (
          <span className={BASECAMP_MUTED}>{t('basecamp.games.sock_or_not.made_by_unknown')}</span>
        )}
      </p>

      {status === 'unavailable' ? (
        <p className={cn(BASECAMP_MUTED, 'text-sm')}>{t('basecamp.games.sock_or_not.payers_failed')}</p>
      ) : null}

      {status === 'loading' ? (
        <p className={cn(BASECAMP_MUTED, 'text-sm')}>{t('basecamp.games.judging.loading')}</p>
      ) : null}

      {payers.known ? (
        <>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <Stat
              value={String(payers.rows.length)}
              label={t('basecamp.games.sock_or_not.payers_label')}
              color={AMBER}
            />
            <Stat
              value={String(payers.counted)}
              label={t('basecamp.games.sock_or_not.records_label')}
              color={CYAN}
            />
            <Stat
              value={
                payers.totalWorth === null
                  ? '—'
                  : t('basecamp.games.sock_or_not.worth', { value: formatTokenAmount(payers.totalWorth) })
              }
              label={t('basecamp.games.sock_or_not.total_label')}
              color={LIME}
            />
          </div>

          {top.length === 0 ? (
            <p className={cn(BASECAMP_MUTED, 'text-sm')}>
              {t('basecamp.games.sock_or_not.nobody_paying', { account })}
            </p>
          ) : (
            <ul className="list-none divide-y divide-white/[0.06]">
              {top.map((row, position) => (
                <PayerRow
                  key={row.payer}
                  row={row}
                  rank={position + 1}
                  hivePerVest={hivePerVest}
                  isCreator={row.payer === creator}
                />
              ))}
            </ul>
          )}
        </>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <button
          type="button"
          onClick={() => setVotersOpen(true)}
          className="rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-all"
          style={{ backgroundColor: AMBER, color: '#2A1402' }}
          data-testid="sock-or-not-voters-button"
        >
          {t('basecamp.games.sock_or_not.who_votes')}
        </button>
        <span className={cn(BASECAMP_MUTED, 'text-[11px] leading-snug')}>
          {t('basecamp.games.sock_or_not.who_votes_hint')}
        </span>
      </div>

      <p className={cn(BASECAMP_MUTED, 'text-[10.5px] leading-snug')}>
        {payers.capped ? `${t('basecamp.games.sock_or_not.payers_capped', { count: payers.counted })} ` : null}
        {t('basecamp.games.sock_or_not.payers_note')}
      </p>

      {votersOpen ? (
        <TopVotersDialog
          open={votersOpen}
          onOpenChange={setVotersOpen}
          account={account}
          votes={votes}
          createdMs={createdMs}
          loading={votesStatus === 'loading'}
          failed={votesStatus === 'unavailable'}
        />
      ) : null}
    </div>
  );
};

export default PaidByPanel;
