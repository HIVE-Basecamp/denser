'use client';

import { Fragment, useState, type ReactNode } from 'react';
import { Link } from '@hive/ui';
import { Dialog, DialogContent, DialogTitle } from '@ui/components/dialog';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import { useAccountPayers } from '../hooks/use-account-payers';
import { useDelegationsOut } from '../hooks/use-delegations-out';
import { useStakeFlows } from '../hooks/use-stake-flows';
import { useTransfersSent } from '../hooks/use-transfers-sent';
import { useVestsToHivePowerRate } from '../hooks/use-vests-rate';
import { useHbdPerHive } from '../hooks/use-vote-value';
import { TOP_PAYERS_COUNT } from '../lib/payers';
import { walletTransfersHref } from '../lib/external-links';
import { stakeOrigin } from '../lib/stake-sources';
import { TOP_TRANSFERS_COUNT, type TransferRecord } from '../lib/transfers';
import { BASECAMP_LINK, BASECAMP_MICRO_LABEL, BASECAMP_MUTED, BASECAMP_VIVID } from '../lib/theme';
import { formatTokenAmount } from './format-value';

const BLUE = BASECAMP_VIVID.blue;
const CYAN = BASECAMP_VIVID.cyan;
const LIME = BASECAMP_VIVID.lime;
const AMBER = BASECAMP_VIVID.orange;

/** So a payer with a sliver of the total still draws a mark rather than nothing. */
const BAR_MIN_SHARE = 0.02;

interface StatProps {
  value: ReactNode;
  label: string;
  color: string;
}

/** One figure above the list, in its own colour. No frame: the colour does the grouping. */
const Stat = ({ value, label, color }: StatProps) => (
  <span>
    <span className="block text-[21px] font-bold leading-none tabular-nums" style={{ color }}>
      {value}
    </span>
    <span className={cn(BASECAMP_MICRO_LABEL, 'mt-1.5 block')}>{label}</span>
  </span>
);

/** One line of the breakdown: what it is on the left, how much on the right. */
const Line = ({
  label,
  value,
  muted,
  onOpen,
  open
}: {
  label: ReactNode;
  value: ReactNode;
  muted?: boolean;
  /** Given, the whole line becomes a button that opens the transfers behind it. */
  onOpen?: () => void;
  open?: boolean;
}) => (
  <li
    className={cn(
      'flex items-baseline justify-between gap-4 py-1 text-[12px]',
      onOpen && 'cursor-pointer rounded-sm hover:bg-white/[0.04]'
    )}
    role={onOpen ? 'button' : undefined}
    tabIndex={onOpen ? 0 : undefined}
    aria-expanded={onOpen ? Boolean(open) : undefined}
    onClick={onOpen}
    onKeyDown={
      onOpen
        ? (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            onOpen();
          }
        : undefined
    }
  >
    <span className={cn(muted ? BASECAMP_MUTED : 'text-[#E8EDF5]', 'min-w-0 flex-1 truncate')}>{label}</span>
    <span className="shrink-0 font-semibold tabular-nums text-[#E8EDF5]">{value}</span>
  </li>
);

/** A named section of the breakdown; drawn only when it has something to say. */
const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <div>
    <div className={cn(BASECAMP_MICRO_LABEL, 'mb-1')}>{title}</div>
    <ul className="list-none divide-y divide-white/[0.06]">{children}</ul>
  </div>
);

const AccountLink = ({ account }: { account: string }) => (
  // A new tab, as everywhere else in these panels: this sits over a feed, and
  // going to the account in place loses both the feed and the read just made.
  <Link
    href={`/@${account}`}
    className={cn(BASECAMP_LINK, 'font-semibold')}
    target="_blank"
    rel="noopener noreferrer"
  >
    @{account}
  </Link>
);

/** A sum of transfers, said in whichever kinds of money were actually used. */
const transferAmounts = (
  t: (key: string, options?: Record<string, unknown>) => string,
  money: { hive: number; hbd: number }
) => {
  const parts: string[] = [];
  if (money.hive > 0) parts.push(t('basecamp.signals.units.hive', { value: formatTokenAmount(money.hive) }));
  if (money.hbd > 0) parts.push(t('basecamp.card.stake_sources.hbd', { value: formatTokenAmount(money.hbd) }));
  return parts.join(' · ');
};

/**
 * A name with the number of records behind it.
 *
 * One payment of 289 HIVE and ninety-seven payments of three are the same
 * total and not the same account. A single large transfer is somebody funding
 * an account; a long drip is usually a bot paying per post. The sum alone
 * cannot tell them apart, so the count travels with it.
 */
const NameWithCount = ({ account, records }: { account: string; records: number }) => {
  const { t } = useTranslation('common_blog');
  return (
    <span className="flex min-w-0 items-baseline gap-2">
      <AccountLink account={account} />
      {records > 1 ? (
        <span className={cn(BASECAMP_MUTED, 'shrink-0 text-[10.5px]')}>
          {t('basecamp.card.stake_sources.records', { records })}
        </span>
      ) : null}
    </span>
  );
};

/** The day a transfer happened, written out. A trail is dates before it is sums. */
function transferDate(timestampMs: number): string {
  if (!Number.isFinite(timestampMs)) return '';
  return new Date(timestampMs).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

interface TrailProps {
  records: TransferRecord[];
  /** How many transfers there really were, which can be more than are kept. */
  total: number;
  /** Whose wallet holds the whole record. */
  account: string;
}

/**
 * The transfers themselves, opened out: when each one happened, how much it
 * was, and what was written on it.
 *
 * This is the point of the panel. "4,000 HIVE to @theguruasia" is one thing as
 * a single payment on one day and quite another as four hundred drips over
 * four months, and the sum alone will not say which. The memo is kept because
 * it is often the only place a payment says what it was for.
 */
const Trail = ({ records, total, account }: TrailProps) => {
  const { t } = useTranslation('common_blog');
  const hidden = total - records.length;

  return (
    <li className="border-t border-white/[0.06] py-2 pl-3">
      <ul className="flex flex-col gap-1">
        {records.map((record, index) => (
          <li key={`${record.timestampMs}-${index}`} className="flex items-baseline gap-2 text-[11px]">
            <span className={cn(BASECAMP_MUTED, 'w-[74px] shrink-0 tabular-nums')}>
              {transferDate(record.timestampMs)}
            </span>
            <span className="w-[90px] shrink-0 font-semibold tabular-nums">
              {record.kind === 'hbd'
                ? t('basecamp.card.stake_sources.hbd', { value: formatTokenAmount(record.amount) })
                : t('basecamp.signals.units.hive', { value: formatTokenAmount(record.amount) })}
            </span>
            <span className={cn(BASECAMP_MUTED, 'min-w-0 flex-1 truncate')} title={record.memo}>
              {record.memo}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[10.5px]">
        {hidden > 0 ? (
          <span className={BASECAMP_MUTED}>
            {t('basecamp.card.stake_sources.more_transfers', { transfers: hidden })}
          </span>
        ) : null}
        <a
          href={walletTransfersHref(account)}
          className={cn(BASECAMP_LINK, 'font-semibold')}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('basecamp.card.stake_sources.open_wallet', { account })}
        </a>
      </div>
    </li>
  );
};

interface StakeSourcesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: string;
  /** Hive Power the account owns, what it has delegated out included. Null while the rate is unknown. */
  ownHp: number | null;
  /** Hive Power delegated to other accounts, and delegated to this one. */
  delegatedOutHp: number | null;
  delegatedInHp: number | null;
  /** Lifetime author rewards, in HIVE — the whole payout, only about half of which became stake. */
  authorRewards: number | null;
  curationRewards: number | null;
}

/**
 * Where this account's Hive Power came from.
 *
 * Hive Power arrives two ways and only two: it is earned, or it is powered up.
 * So the figure that answers "did they buy their way in" is the powered-up one
 * — and every power-up names whose HIVE it was. The panel puts that beside
 * what they earned and lets the two be compared.
 *
 * What it cannot do is call a purchase a purchase. HIVE bought on an outside
 * exchange arrives as an ordinary transfer, indistinguishable from a gift, and
 * the panel says so rather than guessing. It states the numbers and the names
 * and stops there (ETHOS.md: visual indicators, not conclusions).
 */
const StakeSourcesDialog = ({
  open,
  onOpenChange,
  account,
  ownHp,
  delegatedOutHp,
  delegatedInHp,
  authorRewards,
  curationRewards
}: StakeSourcesDialogProps) => {
  const { t } = useTranslation('common_blog');
  // Which transfer row is opened out. One at a time: the trails are long, and
  // two open at once pushes the one being read off the screen.
  const [openTrail, setOpenTrail] = useState<string | null>(null);
  const hbdPerHive = useHbdPerHive();
  const hivePerVest = useVestsToHivePowerRate();
  const { flows, status: flowsStatus } = useStakeFlows(account, open);
  const { payers, status: payersStatus } = useAccountPayers(account, { hbdPerHive, hivePerVest }, open);
  const { delegations: delegatedTo } = useDelegationsOut(account, open);
  const { sent } = useTransfersSent(account, open);

  const poweredUpByOthers = payers.rows.reduce((total, row) => total + row.poweredUp, 0);
  const origin = stakeOrigin(flows, ownHp, poweredUpByOthers, hivePerVest);
  // What they actually wield, which is what their vote is worth: what they own,
  // less what they have delegated to others, plus what others have delegated to
  // them. The same figure the card prints in the middle of the pie.
  const activeHp =
    ownHp === null || delegatedOutHp === null || delegatedInHp === null
      ? null
      : Math.max(ownHp - delegatedOutHp + delegatedInHp, 0);

  const loading = flowsStatus === 'loading' || payersStatus === 'loading';
  const failed = flowsStatus === 'unavailable' && payersStatus === 'unavailable';
  const ready = flows.known || payers.known;

  const hp = (value: number | null) =>
    value === null ? '—' : t('basecamp.signals.units.hive_power', { value: Math.round(value).toLocaleString() });
  const hive = (value: number) => t('basecamp.signals.units.hive', { value: formatTokenAmount(value) });

  const poweredUpRows = payers.rows.filter((row) => row.poweredUp > 0).slice(0, TOP_PAYERS_COUNT);
  const senders = payers.rows.filter((row) => row.hive > 0 || row.hbd > 0).slice(0, TOP_PAYERS_COUNT);
  const recipients = sent.rows.slice(0, TOP_TRANSFERS_COUNT);
  // An account can delegate to a hundred people; the list is not the point past
  // the largest few, so the rest are counted rather than named.
  const delegatees = delegatedTo.slice(0, TOP_TRANSFERS_COUNT);
  const moreDelegatees = delegatedTo.length - delegatees.length;
  const delegators = payers.rows.filter((row) => row.delegatedVests > 0).slice(0, TOP_PAYERS_COUNT);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[540px] gap-3 border-white/10 bg-[#0B0F17] p-5 text-[#E8EDF5] sm:max-w-[540px]"
        data-testid="basecamp-stake-sources-dialog"
      >
        <div>
          <DialogTitle className="text-[15px] font-bold" style={{ color: BLUE }}>
            {t('basecamp.card.stake_sources.title')}
          </DialogTitle>
          <div className={cn(BASECAMP_MUTED, 'mt-0.5 text-[11px]')}>
            {t('basecamp.card.stake_sources.subtitle', { account })}
          </div>
        </div>

        {/* The whole question in three figures: what they hold, what they earned
            towards it, and what was powered up instead. */}
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <Stat value={hp(origin.ownHp)} label={t('basecamp.card.stake_sources.owns_label')} color={BLUE} />
          <Stat value={hp(activeHp)} label={t('basecamp.card.stake_sources.active_label')} color={CYAN} />
          <Stat
            value={hp(origin.fromRewardsHp)}
            label={t('basecamp.card.stake_sources.earned_label')}
            color={LIME}
          />
          <Stat
            value={ready ? hp(origin.poweredUpHp) : '—'}
            label={t('basecamp.card.stake_sources.powered_up_label')}
            color={AMBER}
          />
        </div>

        {failed ? (
          <p className="py-6 text-center text-[12px] text-[#FF90A5]" data-testid="basecamp-stake-sources-error">
            {t('basecamp.card.stake_sources.error')}
          </p>
        ) : null}
        {loading && !ready ? (
          <p
            className={cn(BASECAMP_MUTED, 'py-6 text-center text-[12px]')}
            data-testid="basecamp-stake-sources-loading"
          >
            {t('basecamp.card.stake_sources.loading')}
          </p>
        ) : null}

        <div className="flex max-h-[52vh] flex-col gap-4 overflow-y-auto pr-1">
          <Section title={t('basecamp.card.stake_sources.earned_heading')}>
            <Line
              label={t('basecamp.card.labels.author_rewards')}
              value={authorRewards === null ? '—' : hive(authorRewards)}
            />
            <Line
              label={t('basecamp.card.labels.curation_rewards')}
              value={curationRewards === null ? '—' : hive(curationRewards)}
            />
            <Line
              label={t('basecamp.card.stake_sources.powered_down')}
              value={origin.poweredDownHp === null ? '—' : hp(origin.poweredDownHp)}
            />
          </Section>

          {ready ? (
            <Section title={t('basecamp.card.stake_sources.powered_up_heading')}>
              {/* Their own power-ups are listed under their own name, beside
                  anybody else's. Nothing here needs a word Hive does not
                  already have. */}
              <Line label={<AccountLink account={account} />} value={hive(origin.poweredUpSelfHp)} />
              {poweredUpRows.map((row) => (
                <Line
                  key={row.payer}
                  label={<NameWithCount account={row.payer} records={row.powerUps} />}
                  value={hive(row.poweredUp)}
                />
              ))}
              {flows.boughtHive > 0 ? (
                <Line
                  label={t('basecamp.card.stake_sources.bought_on_market')}
                  value={hive(flows.boughtHive)}
                  muted
                />
              ) : null}
            </Section>
          ) : null}

          {senders.length > 0 ? (
            <Section title={t('basecamp.card.stake_sources.sent_heading')}>
              {senders.map((row) => {
                const id = `in:${row.payer}`;
                return (
                  <Fragment key={id}>
                    <Line
                      label={<NameWithCount account={row.payer} records={row.transfers} />}
                      value={transferAmounts(t, row)}
                      open={openTrail === id}
                      onOpen={() => setOpenTrail(openTrail === id ? null : id)}
                    />
                    {openTrail === id ? (
                      <Trail records={row.records} total={row.transfers} account={account} />
                    ) : null}
                  </Fragment>
                );
              })}
            </Section>
          ) : null}

          {recipients.length > 0 ? (
            <Section title={t('basecamp.card.stake_sources.sent_out_heading')}>
              {recipients.map((row) => {
                const id = `out:${row.account}`;
                return (
                  <Fragment key={id}>
                    <Line
                      label={<NameWithCount account={row.account} records={row.transfers} />}
                      value={transferAmounts(t, row)}
                      open={openTrail === id}
                      onOpen={() => setOpenTrail(openTrail === id ? null : id)}
                    />
                    {openTrail === id ? (
                      <Trail records={row.records} total={row.transfers} account={account} />
                    ) : null}
                  </Fragment>
                );
              })}
            </Section>
          ) : null}

          {delegators.length > 0 ? (
            <Section title={t('basecamp.card.stake_sources.delegated_heading')}>
              {delegators.map((row) => (
                <li key={row.payer} className="py-1">
                  <div className="flex items-baseline justify-between gap-4 text-[12px]">
                    <AccountLink account={row.payer} />
                    <span className="shrink-0 font-semibold tabular-nums">
                      {hivePerVest === null ? '—' : hp(row.delegatedVests * hivePerVest)}
                    </span>
                  </div>
                  <span className="mt-1.5 block h-[5px] w-full overflow-hidden rounded-full bg-white/[0.07]">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${Math.max(row.share ?? 0, BAR_MIN_SHARE) * 100}%`,
                        backgroundColor: AMBER
                      }}
                    />
                  </span>
                </li>
              ))}
            </Section>
          ) : null}

          {delegatedTo.length > 0 ? (
            <Section title={t('basecamp.card.stake_sources.delegated_out_heading')}>
              {delegatees.map((row) => (
                <Line
                  key={row.delegatee}
                  label={<AccountLink account={row.delegatee} />}
                  value={hivePerVest === null ? '—' : hp(row.vests * hivePerVest)}
                />
              ))}
              {moreDelegatees > 0 ? (
                <Line
                  label={t('basecamp.card.stake_sources.more_accounts', { accounts: moreDelegatees })}
                  value=""
                  muted
                />
              ) : null}
            </Section>
          ) : null}
        </div>

        <p className={cn(BASECAMP_MUTED, 'text-[10.5px] leading-snug')} data-testid="basecamp-stake-sources-note">
          {t('basecamp.card.stake_sources.trail_hint')} {t('basecamp.card.stake_sources.purchase_note')}{' '}
          {t('basecamp.card.stake_sources.rewards_note')}
          {payers.capped || sent.capped || !flows.complete
            ? ` ${t('basecamp.card.stake_sources.capped_note')}`
            : ''}
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default StakeSourcesDialog;
