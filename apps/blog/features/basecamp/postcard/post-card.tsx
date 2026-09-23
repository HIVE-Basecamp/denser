'use client';

import { useMemo } from 'react';
import { ChevronUp, MessageSquare } from 'lucide-react';
import { Link } from '@hive/ui';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import { find_first_img } from '@/blog/features/list-of-posts/post-img';
import type { PostcardTier } from '../lib/postcard-sizes';
import type { Readout } from '../lib/readouts';
import { BASECAMP_LINK, BASECAMP_MUTED, BASECAMP_POST_CARD, BASECAMP_VIVID } from '../lib/theme';
import IdentityStrip from './identity-strip';
import PostBadge from './post-badge';
import type { Entry } from '@hive/common-hiveio-packages/wax';

/** When there is no picture: a wash in the card's violet with the title's first letter. */
const NO_IMAGE_BACKGROUND = 'linear-gradient(135deg, rgba(157, 107, 255, 0.35) 0%, rgba(157, 107, 255, 0.12) 100%)';
/** Above and below the person's row. Two pixels: the post's row under it needs every one for a three-line title and its counts. */
const PERSON_ROW_PADDING = 2;

interface PostCardProps {
  post: Entry;
  /** Sizes for the feed's width: the card's height, the picture's width, the rings. */
  tier: PostcardTier;
  accountAgeDays: number;
  showFollow: boolean;
  /** The profile readout, drawn as dots under the name. */
  profile?: Readout;
}

/**
 * The post, as the whole of the postcard's first zone, with the person on it
 * — two rows in one frame. The person's row: rings and avatar on the left,
 * the name and its two lines beside them. The post's row: the picture down
 * the left edge, bleeding to the frame's corner, and beside it the title with
 * the height to run to three lines, then its two counts in plain text. No
 * chips, no second frame, and nothing drawn over the picture. The community's
 * name at the end of the counts row is whole or absent: when the row is too
 * narrow for it, it wraps under the row's fixed height and out of sight,
 * never to a clipped letter.
 */
const PostCard = ({ post, tier, accountAgeDays, showFollow, profile }: PostCardProps) => {
  const { t } = useTranslation('common_blog');
  const href = `/${post.category}/@${post.author}/${post.permlink}`;
  // Stable for a given post, and the extraction walks the body, so it is not
  // repeated on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const image = useMemo(() => find_first_img(post), [post.author, post.permlink]);
  const voteCount = typeof post.stats?.total_votes === 'number' ? post.stats.total_votes : 0;
  const replyCount = typeof post.children === 'number' ? post.children : 0;
  const initial = post.title.trim().charAt(0).toUpperCase();
  const personRowHeight = tier.rings + PERSON_ROW_PADDING * 2;

  return (
    <div
      className={cn(BASECAMP_POST_CARD, 'flex flex-col overflow-hidden')}
      style={{ height: tier.postHeight }}
      data-testid="postcard-post-card"
    >
      <div
        className="flex shrink-0 items-center gap-2 pl-1.5 pr-1.5"
        style={{ height: personRowHeight, paddingTop: PERSON_ROW_PADDING, paddingBottom: PERSON_ROW_PADDING }}
      >
        <PostBadge
          username={post.author}
          reputation={post.author_reputation}
          accountAgeDays={accountAgeDays}
          ringsSize={tier.rings}
          avatarSize={tier.avatar}
        />
        <div className="min-w-0 flex-1">
          <IdentityStrip
            username={post.author}
            permlink={post.permlink}
            createdIso={post.created}
            showFollow={showFollow}
            profile={profile}
          />
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <Link href={href} className="relative block h-full shrink-0" data-testid="postcard-post-image">
          <span
            className="flex h-full items-center justify-center bg-cover bg-center text-[20px] font-bold text-white/50"
            style={{ width: tier.thumb, backgroundImage: image ? `url(${image})` : NO_IMAGE_BACKGROUND }}
          >
            {image ? null : initial}
          </span>
          <span
            className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
            aria-hidden="true"
          />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5 pl-2 pr-1.5">
          <Link
            href={href}
            className={cn(BASECAMP_LINK, 'line-clamp-3 text-[13px] font-semibold leading-4 text-white')}
            data-testid="newcomer-post-title"
          >
            {post.title}
          </Link>
          <div className="flex h-3 flex-wrap items-center gap-x-2.5 overflow-hidden text-[11px] font-medium leading-none tabular-nums text-white/70">
            <span className="flex items-center gap-1" title={t('basecamp.card.hints.votes_on_post')}>
              <ChevronUp className="h-3 w-3" style={{ color: BASECAMP_VIVID.orange }} aria-hidden="true" />
              {voteCount}
            </span>
            <Link
              href={`${href}/#comments`}
              className="flex items-center gap-1 transition-colors hover:text-white"
              title={t('basecamp.card.hints.replies_on_post')}
            >
              <MessageSquare className="h-3 w-3" style={{ color: BASECAMP_VIVID.cyan }} aria-hidden="true" />
              {replyCount}
            </Link>
            <span className={cn(BASECAMP_MUTED, 'ml-auto whitespace-nowrap text-[10px]')}>{post.category}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
