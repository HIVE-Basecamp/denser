'use client';

import { Link } from '@hive/ui';
import { getUserAvatarUrl } from '@ui/lib/avatar-utils';
import TimeAgo from '@ui/components/time-ago';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import ActivityRings from '../activity-rings';
import FollowNewcomerButton from '../follow-newcomer-button';
import type { Readout } from '../lib/readouts';
import { RING_TRACK_COLOR } from '../lib/rings';
import { BASECAMP_LINK, BASECAMP_MUTED, BASECAMP_VIVID } from '../lib/theme';
import Hint from './hint';

/** Small enough to share a band with the post; still the card's anchor. */
const RINGS_SIZE = 44;

interface ProfilePipsProps {
  readout: Readout;
}

/** Six dots, one per profile field, lit when the field is filled in. Six pixels: five is under what an eye picks up. */
const ProfilePips = ({ readout }: ProfilePipsProps) => {
  const { t } = useTranslation('common_blog');
  const lit = BASECAMP_VIVID.lime;
  return (
    <Hint title={t('basecamp.card.labels.profile_completeness')} body={t('basecamp.card.hints.profile_completeness')}>
      <span
        className="flex cursor-default items-center gap-1"
        data-testid={`readout-${readout.id}`}
        data-readout-known={readout.known ? 'true' : 'false'}
      >
        {(readout.segments ?? []).map((dot) => {
          const on = readout.known && dot.ratio > 0;
          return (
            <span
              key={dot.id}
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: on ? lit : RING_TRACK_COLOR, boxShadow: on ? `0 0 4px ${lit}99` : undefined }}
            />
          );
        })}
      </span>
    </Hint>
  );
};

interface IdentityStripProps {
  username: string;
  reputation: number;
  accountAgeDays: number;
  createdIso: string;
  showFollow: boolean;
  /** The profile readout, drawn as dots under the name. */
  profile?: Readout;
}

/**
 * Who this is. The three rings keep their place because they are the only
 * drawing that shows what the chain proves someone has done, rather than what
 * it measures about how they behave. The time sits at the line's far end, the
 * way a message list puts it, so the line is held at both edges however short
 * the name.
 */
const IdentityStrip = ({ username, reputation, accountAgeDays, createdIso, showFollow, profile }: IdentityStripProps) => (
  <div className="flex items-center gap-2" data-testid="postcard-identity">
    <ActivityRings
      username={username}
      reputation={reputation}
      accountAgeDays={accountAgeDays}
      size={RINGS_SIZE}
    />
    <Link href={`/@${username}`} data-testid="newcomer-avatar" className="shrink-0">
      <span
        className="block h-6 w-6 rounded-full bg-cover bg-no-repeat ring-1 ring-white/15 transition-shadow hover:ring-2 hover:ring-[#B79CFF]/60"
        style={{ backgroundImage: `url(${getUserAvatarUrl(username, 'small')})` }}
      />
    </Link>
    <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
      <div className="flex items-baseline justify-between gap-2">
        <Link
          href={`/@${username}`}
          className={cn(BASECAMP_LINK, 'block min-w-[40px] truncate text-[13px] font-semibold leading-4')}
          data-testid="newcomer-username"
        >
          {username}
        </Link>
        <span className={cn(BASECAMP_MUTED, 'shrink-0 text-[11px] leading-none')}>
          <TimeAgo date={createdIso} />
        </span>
      </div>
      {profile ? <ProfilePips readout={profile} /> : null}
    </div>
    {showFollow ? <FollowNewcomerButton username={username} /> : null}
  </div>
);

export default IdentityStrip;
