'use client';

import { Skeleton } from '@hive/ui';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import { useElementWidth } from './hooks/use-element-width';
import { useNewcomers } from './hooks/use-newcomers';
import NewcomersListItem, { POSTCARD_CLASS } from './newcomers-list-item';
import { FirstPostRingStyles } from './postcard/first-post-ring';
import { POST_MAX_WIDTH, POSTCARD_TIERS, postcardTierFor } from './lib/postcard-sizes';
import { BASECAMP_MUTED, BASECAMP_POSTCARD_STYLE, BASECAMP_SKELETON, accentButton } from './lib/theme';
import { HALF_MOON_ASPECT } from './viz/half-moon';

const HALF_MOON_ID = 'reply_mix';

// Mirrors the shape of a real postcard — the post on the left, five drawings
// in the middle, the flower on the right — so the feed does not jump when the
// data lands.
function NewcomerCardSkeleton() {
  const tier = POSTCARD_TIERS.regular;
  return (
    <div className={POSTCARD_CLASS} style={{ ...BASECAMP_POSTCARD_STYLE, columnGap: tier.zoneGap }}>
      <div
        className="min-w-0 flex-auto"
        style={{ flexBasis: tier.postMinWidth, minWidth: tier.postFloor, maxWidth: POST_MAX_WIDTH }}
      >
        <Skeleton className={cn(BASECAMP_SKELETON, 'w-full rounded-[10px]')} style={{ height: tier.postHeight }} />
      </div>
      <div className="flex shrink-0 items-center" style={{ columnGap: tier.drawingGap }}>
        {Object.entries(tier.drawings).map(([id, size]) => (
          <Skeleton
            key={id}
            className={cn(BASECAMP_SKELETON, id === HALF_MOON_ID ? 'rounded-t-full' : 'rounded-full')}
            style={{ width: size, height: id === HALF_MOON_ID ? Math.round(size * HALF_MOON_ASPECT) : size }}
          />
        ))}
      </div>
      <Skeleton className={cn(BASECAMP_SKELETON, 'rounded-full')} style={{ width: tier.flower, height: tier.flower }} />
    </div>
  );
}

const NewcomersList = () => {
  const { t } = useTranslation('common_blog');
  const { newcomers, isLoading, isFetching, isFetchingNextPage, fetchNextPage, hasNextPage, loadMoreRef } =
    useNewcomers();
  // The feed measures itself and every card draws at the size that fits, so a
  // narrower window shrinks the drawings together instead of folding the row.
  const { ref: feedRef, width: feedWidth } = useElementWidth<HTMLUListElement>();
  const tier = postcardTierFor(feedWidth);

  if (isLoading || (isFetching && newcomers.length === 0 && !isFetchingNextPage)) {
    return (
      <div data-testid="newcomers-list-skeleton">
        {Array.from({ length: 5 }).map((_, i) => (
          <NewcomerCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (newcomers.length === 0 && !hasNextPage) {
    return (
      <div
        className={cn(BASECAMP_MUTED, 'w-full rounded-xl border border-dashed border-white/15 py-8 text-center text-sm')}
        data-testid="newcomers-list-no-results"
      >
        {t('basecamp.newcomers_list.no_results')}
      </div>
    );
  }

  return (
    <>
      <FirstPostRingStyles />
      <ul ref={feedRef} data-testid="newcomers-list">
        {newcomers.map(({ post, accountAgeDays, account }) => (
          <NewcomersListItem
            key={`${post.author}/${post.permlink}`}
            post={post}
            accountAgeDays={accountAgeDays}
            account={account}
            tier={tier}
          />
        ))}
      </ul>
      <div className="mt-4 flex justify-center">
        <button
          ref={loadMoreRef}
          onClick={() => fetchNextPage()}
          disabled={!hasNextPage || isFetchingNextPage}
          className={cn(accentButton('violet', false), 'h-9 text-sm')}
          data-testid="newcomers-list-load-more"
        >
          {/* The feed walks back in time, so the button loads older posts, not newer ones. */}
          {isFetchingNextPage
            ? t('global.loading')
            : hasNextPage
              ? t('cards.comment_card.load_more')
              : t('user_profile.nothing_more_to_load')}
        </button>
      </div>
    </>
  );
};

export default NewcomersList;
