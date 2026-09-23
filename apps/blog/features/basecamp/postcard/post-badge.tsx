'use client';

import { Link } from '@hive/ui';
import { getUserAvatarUrl } from '@ui/lib/avatar-utils';
import ActivityRings from '../activity-rings';

interface PostBadgeProps {
  username: string;
  reputation: number;
  accountAgeDays: number;
  /** Diameter of the rings; the feed's tier sets it. */
  ringsSize: number;
  avatarSize: number;
}

/**
 * The person: the three rings with their reputation in the middle, and their
 * avatar beside them. The rings keep their place at the card's top-left
 * because they are the one drawing that shows what the chain proves someone
 * has done; the avatar next to them is the way to the person, and the name
 * follows. Rings, avatar, name — left to right, as it always read.
 */
const PostBadge = ({ username, reputation, accountAgeDays, ringsSize, avatarSize }: PostBadgeProps) => (
  <div className="flex shrink-0 items-center gap-1.5" data-testid="postcard-badge">
    <ActivityRings username={username} reputation={reputation} accountAgeDays={accountAgeDays} size={ringsSize} />
    <Link
      href={`/@${username}`}
      data-testid="newcomer-avatar"
      className="block shrink-0 rounded-full bg-cover bg-no-repeat ring-1 ring-white/15 transition-shadow hover:ring-2 hover:ring-[#9D6BFF]/70"
      style={{ width: avatarSize, height: avatarSize, backgroundImage: `url(${getUserAvatarUrl(username, 'small')})` }}
    />
  </div>
);

export default PostBadge;
