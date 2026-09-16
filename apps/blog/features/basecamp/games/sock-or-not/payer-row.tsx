'use client';

import { Link } from '@hive/ui';
import { getUserAvatarUrl } from '@ui/lib/avatar-utils';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import { BASECAMP_LINK, BASECAMP_MUTED, BASECAMP_VIVID } from '../../lib/theme';
import { formatTokenAmount } from '../../postcard/format-value';
import type { PayerRow as PayerRowData } from '../../lib/payers';

const AMBER = BASECAMP_VIVID.orange;
const LIME = BASECAMP_VIVID.lime;
const CYAN = BASECAMP_VIVID.cyan;
const AVATAR = 30;

/** So a payer with a sliver of the total still draws a mark rather than nothing. */
const BAR_MIN_SHARE = 0.02;

interface PayerRowProps {
  row: PayerRowData;
  rank: number;
  /** HP per VEST, for turning a delegation into a figure a person reads. */
  hivePerVest: number | null;
  /** True when this payer is also the account that made the account. */
  isCreator: boolean;
}

/**
 * One payer: who they are, what share of the money behind this account is
 * theirs, and the pieces that share is made of.
 *
 * The bar is the part worth looking at. Six accounts each carrying a sixth is
 * a different picture from one account carrying everything, and the bar says
 * that without anybody having to compare numbers. It says only that; who is at
 * the top of this list and why is the reader's to weigh (ETHOS.md).
 */
const PayerRow = ({ row, rank, hivePerVest, isCreator }: PayerRowProps) => {
  const { t } = useTranslation('common_blog');
  const share = row.share ?? 0;
  const lentHp = hivePerVest === null ? null : row.delegatedVests * hivePerVest;

  const pieces: string[] = [];
  if (row.hive > 0) pieces.push(t('basecamp.games.sock_or_not.sent_hive', { value: formatTokenAmount(row.hive) }));
  if (row.hbd > 0) pieces.push(t('basecamp.games.sock_or_not.sent_hbd', { value: formatTokenAmount(row.hbd) }));
  if (row.poweredUp > 0) {
    pieces.push(t('basecamp.games.sock_or_not.powered_up', { value: formatTokenAmount(row.poweredUp) }));
  }
  if (row.delegatedVests > 0 && lentHp !== null) {
    pieces.push(t('basecamp.games.sock_or_not.lent_hp', { value: formatTokenAmount(lentHp) }));
  }

  return (
    <li className="flex items-start gap-3 py-2" data-testid="sock-or-not-payer-row">
      <span className="w-5 shrink-0 pt-1 text-right text-[12px] font-bold tabular-nums" style={{ color: AMBER }}>
        {rank}
      </span>
      <Link href={`/@${row.payer}`} className="shrink-0" aria-hidden="true" tabIndex={-1}>
        <span
          className="block rounded-full bg-cover bg-no-repeat ring-1 ring-white/15"
          style={{
            width: AVATAR,
            height: AVATAR,
            backgroundImage: `url(${getUserAvatarUrl(row.payer, 'small')})`
          }}
        />
      </Link>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            href={`/@${row.payer}`}
            className={cn(BASECAMP_LINK, 'truncate text-[12.5px] font-semibold')}
            data-testid="sock-or-not-payer-name"
          >
            @{row.payer}
          </Link>
          {isCreator ? (
            <span
              className="rounded-full px-2 py-[2px] text-[9.5px] font-bold uppercase tracking-[0.06em]"
              style={{ backgroundColor: `${AMBER}22`, color: AMBER }}
              data-testid="sock-or-not-payer-creator"
            >
              {t('basecamp.games.sock_or_not.also_made_it')}
            </span>
          ) : null}
        </span>
        <span className="mt-1.5 block h-[5px] w-full overflow-hidden rounded-full bg-white/[0.07]">
          <span
            className="block h-full rounded-full"
            style={{
              width: `${Math.max(share, BAR_MIN_SHARE) * 100}%`,
              backgroundColor: AMBER,
              boxShadow: `0 0 8px -1px ${AMBER}`
            }}
          />
        </span>
        <span className={cn(BASECAMP_MUTED, 'mt-1.5 block text-[10.5px] leading-snug')}>
          {pieces.join(' · ')}
        </span>
      </span>
      <span className="w-[104px] shrink-0 text-right">
        <span
          className="block whitespace-nowrap text-[14px] font-bold leading-none tabular-nums"
          style={{ color: LIME }}
        >
          {row.worth === null
            ? '—'
            : t('basecamp.games.sock_or_not.worth', { value: formatTokenAmount(row.worth) })}
        </span>
        <span className={cn(BASECAMP_MUTED, 'block text-[9.5px] uppercase leading-none tracking-[0.06em]')}>
          {t('basecamp.games.sock_or_not.worth_label')}
        </span>
      </span>
      <span className="w-[44px] shrink-0 text-right">
        <span className="block text-[14px] font-bold leading-none tabular-nums" style={{ color: CYAN }}>
          {row.payments}
        </span>
        <span className={cn(BASECAMP_MUTED, 'block text-[9.5px] uppercase leading-none tracking-[0.06em]')}>
          {t('basecamp.games.sock_or_not.payments_label')}
        </span>
      </span>
    </li>
  );
};

export default PayerRow;
