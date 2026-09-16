'use client';

import { Link, accountReputation } from '@hive/ui';
import { getUserAvatarUrl } from '@ui/lib/avatar-utils';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import CommentsButton from '../../postcard/comments-button';
import { BASECAMP_LINK, BASECAMP_MICRO_LABEL, BASECAMP_MUTED } from '../../lib/theme';

interface SuspectProfileProps {
  account: string;
  reputation: number;
  accountAgeDays: number;
  /** Posts the account has ever made, when the chain gave us a number. */
  postCount: number | null;
}

/** One number with its name under it, the same shape the postcard's readouts use. */
const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[17px] font-bold leading-none tabular-nums">{value}</span>
    <span className={BASECAMP_MICRO_LABEL}>{label}</span>
  </div>
);

/**
 * Who is on the slab: a big avatar, the name, and the few facts that need no
 * interpreting. Everything that needs interpreting is on the postcard below.
 *
 * The links out are deliberately plain: their blog, their posts, their
 * comments. This is the research desk — the point is that a player can go and
 * look for themselves before saying bot or not.
 */
const SuspectProfile = ({ account, reputation, accountAgeDays, postCount }: SuspectProfileProps) => {
  const { t } = useTranslation('common_blog');

  return (
    <div className="flex flex-wrap items-center gap-4" data-testid="bot-or-not-profile">
      <Link href={`/@${account}`} className="shrink-0">
        <span
          className="block h-16 w-16 rounded-full bg-cover bg-no-repeat ring-2 ring-[#B79CFF]/45 transition-shadow hover:ring-[#B79CFF]"
          style={{ backgroundImage: `url(${getUserAvatarUrl(account, 'large')})` }}
        />
      </Link>

      <div className="flex min-w-0 flex-col gap-1">
        <Link
          href={`/@${account}`}
          className={cn(BASECAMP_LINK, 'text-[20px] font-bold leading-none')}
          data-testid="bot-or-not-account"
        >
          {account}
        </Link>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
          <Link href={`/@${account}`} className={cn(BASECAMP_LINK, 'underline-offset-2 hover:underline')}>
            {t('basecamp.games.bot_or_not.their_blog')}
          </Link>
          <Link href={`/@${account}/posts`} className={cn(BASECAMP_LINK, 'underline-offset-2 hover:underline')}>
            {t('basecamp.games.bot_or_not.their_posts')}
          </Link>
          <Link href={`/@${account}/comments`} className={cn(BASECAMP_LINK, 'underline-offset-2 hover:underline')}>
            {t('basecamp.games.bot_or_not.their_comments')}
          </Link>
          <CommentsButton account={account} />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-6">
        <Stat label={t('basecamp.games.bot_or_not.reputation')} value={String(accountReputation(reputation))} />
        <Stat
          label={t('basecamp.games.bot_or_not.age_days')}
          value={accountAgeDays >= 0 ? String(accountAgeDays) : '—'}
        />
        <Stat
          label={t('basecamp.games.bot_or_not.posts')}
          value={postCount === null ? '—' : String(postCount)}
        />
      </div>

      <p className={cn(BASECAMP_MUTED, 'w-full text-[11px] leading-snug')}>
        {t('basecamp.games.bot_or_not.research_hint')}
      </p>
    </div>
  );
};

export default SuspectProfile;
