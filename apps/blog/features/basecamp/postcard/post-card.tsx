'use client';

import { useMemo } from 'react';
import { ChevronUp, MessageSquare } from 'lucide-react';
import { Link } from '@hive/ui';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import { find_first_img } from '@/blog/features/list-of-posts/post-img';
import { BASECAMP_LINK, BASECAMP_MUTED, BASECAMP_POST_CARD, BASECAMP_VIVID } from '../lib/theme';
import type { Entry } from '@hive/common-hiveio-packages/wax';

/** The picture is exactly as tall as the text beside it, so it reads as a picture and not an icon. */
export const POST_CARD_HEIGHT = 64;
/** Four by three, the crop most covers survive. */
const THUMB_WIDTH = 86;
/** When there is no picture: a wash in the card's colour with the title's first letter. */
const NO_IMAGE_BACKGROUND = 'linear-gradient(135deg, rgba(183, 156, 255, 0.35) 0%, rgba(183, 156, 255, 0.12) 100%)';

interface PostCardProps {
  post: Entry;
}

/**
 * The post, as its own small card inside the postcard — the one thing here the
 * person actually made. The picture bleeds to the card's left edge so the
 * picture is the corner; the title and its two counts sit beside it in plain
 * text, no chips, no second frame. The community's name at the end of the
 * counts row is whole or absent: when the row is too narrow for it, it wraps
 * under the row's fixed height and out of sight, never to a clipped letter.
 */
const PostCard = ({ post }: PostCardProps) => {
  const { t } = useTranslation('common_blog');
  const href = `/${post.category}/@${post.author}/${post.permlink}`;
  // Stable for a given post, and the extraction walks the body, so it is not
  // repeated on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const image = useMemo(() => find_first_img(post), [post.author, post.permlink]);
  const voteCount = typeof post.stats?.total_votes === 'number' ? post.stats.total_votes : 0;
  const replyCount = typeof post.children === 'number' ? post.children : 0;
  const initial = post.title.trim().charAt(0).toUpperCase();

  return (
    <div
      className={cn(BASECAMP_POST_CARD, 'flex overflow-hidden')}
      style={{ height: POST_CARD_HEIGHT }}
      data-testid="postcard-post-card"
    >
      <Link href={href} className="relative block h-full shrink-0" data-testid="postcard-post-image">
        <span
          className="flex h-full items-center justify-center bg-cover bg-center text-[20px] font-bold text-white/50"
          style={{ width: THUMB_WIDTH, backgroundImage: image ? `url(${image})` : NO_IMAGE_BACKGROUND }}
        >
          {image ? null : initial}
        </span>
        <span
          className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
          aria-hidden="true"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col justify-between py-1.5 pl-2.5 pr-2">
        <Link
          href={href}
          className={cn(BASECAMP_LINK, 'line-clamp-2 text-[13px] font-semibold leading-[17px] text-white/[0.92]')}
          data-testid="newcomer-post-title"
        >
          {post.title}
        </Link>
        <div className="flex h-3 flex-wrap items-center gap-x-2.5 overflow-hidden text-[11px] font-medium leading-none tabular-nums text-white/60">
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
  );
};

export default PostCard;
