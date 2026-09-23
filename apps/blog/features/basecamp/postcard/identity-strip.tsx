'use client';

import { Link } from '@hive/ui';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import FollowNewcomerButton from '../follow-newcomer-button';
import { useFitFont } from '../hooks/use-fit-font';
import type { Readout } from '../lib/readouts';
import { RING_TRACK_COLOR } from '../lib/rings';
import { BASECAMP_LINK, BASECAMP_VIVID } from '../lib/theme';
import Hint from './hint';
import PostAge from './post-age';
import SusButton from './sus-button';

/** The name's type size, and the smallest it may shrink to before a long name would be cut. */
const NAME_FONT_PX = 13;
const NAME_FONT_FLOOR_PX = 10;

interface ProfilePipsProps {
  readout: Readout;
}

/** Six dots, one per profile field, lit when the field is filled in. Six pixels: five is under what an eye picks up; three apart, so the six fit beside the SUS button on a narrow feed. */
const ProfilePips = ({ readout }: ProfilePipsProps) => {
  const { t } = useTranslation('common_blog');
  const lit = BASECAMP_VIVID.lime;
  return (
    <Hint title={t('basecamp.card.labels.profile_completeness')} body={t('basecamp.card.hints.profile_completeness')}>
      <span
        className="flex cursor-default items-center gap-[3px]"
        data-testid={`readout-${readout.id}`}
        data-readout-known={readout.known ? 'true' : 'false'}
      >
        {(readout.segments ?? []).map((dot) => (
          <span
            key={dot.id}
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: readout.known && dot.ratio > 0 ? lit : RING_TRACK_COLOR }}
          />
        ))}
      </span>
    </Hint>
  );
};

interface IdentityStripProps {
  username: string;
  /** The post this card is showing — what a SUS report is filed against. */
  permlink: string;
  createdIso: string;
  showFollow: boolean;
  /** The profile readout, drawn as dots under the name. */
  profile?: Readout;
}

/**
 * Who this is, in two lines beside the picture. The name is the whole first
 * line: it is the one thing on the card that is never cut short, so it gives
 * up a point or two of size before it would ever be, and the post's age after
 * it is the part that gives way — whole or not at all, never as a clipped
 * fragment: when it does not fit it wraps under the line's fixed height and
 * out of sight. The second line is the profile dots, with the SUS button at
 * its far end rather than on the name line, where it would cost the name
 * half its room.
 */
const IdentityStrip = ({ username, permlink, createdIso, showFollow, profile }: IdentityStripProps) => {
  const { boxRef, textRef, fontSize } = useFitFont<HTMLDivElement, HTMLSpanElement>(
    username,
    NAME_FONT_PX,
    NAME_FONT_FLOOR_PX
  );
  return (
    <div className="flex flex-col gap-[3px]" data-testid="postcard-identity">
      <div ref={boxRef} className="flex h-4 flex-wrap items-baseline gap-x-1.5 overflow-hidden">
        <Link
          href={`/@${username}`}
          className={cn(BASECAMP_LINK, 'shrink-0 whitespace-nowrap font-semibold leading-4')}
          data-testid="newcomer-username"
        >
          <span ref={textRef} style={{ fontSize }}>
            {username}
          </span>
        </Link>
        <PostAge createdIso={createdIso} />
      </div>
      <div className="flex h-[17px] items-center justify-between gap-1">
        {profile ? <ProfilePips readout={profile} /> : <span />}
        <div className="flex shrink-0 items-center gap-1.5">
          {showFollow ? <FollowNewcomerButton username={username} /> : null}
          <SusButton account={username} permlink={permlink} />
        </div>
      </div>
    </div>
  );
};

export default IdentityStrip;
