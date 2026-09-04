'use client';

import { Skeleton } from '@hive/ui';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import { useElementWidth } from './hooks/use-element-width';
import { useNewcomers } from './hooks/use-newcomers';
import NewcomersListItem from './newcomers-list-item';
import { POST_FLOOR_WIDTH, POST_MAX_WIDTH, POSTCARD_TIERS, postcardTierFor } from './lib/postcard-sizes';
import { BASECAMP_CARD, BASECAMP_MUTED, BASECAMP_SKELETON, accentButton } from './lib/theme';
import { POST_CARD_HEIGHT } from './postcard/post-card';
import { HALF_MOON_ASPECT } from './viz/half-moon';

const HALF_MOON_ID = 'reply_mix';

// Mirrors the shape of a real postcard — identity and post on the left, five
// drawings in the middle, the flower on the right — so the feed does not jump
// when the data lands.
function NewcomerCardSkeleton() {
  const tier = POSTCARD_TIERS.regular;
  return (
    <div
      className={cn(
        BASECAMP_CARD,
        'my-2 flex flex-wrap items-center justify-between gap-y-2 rounded-2xl px-3 py-[10px] sm:flex-nowrap'
      )}
      style={{ columnGap: tier.zoneGap }}
    >
      <div
        className="min-w-0 flex-auto"
        style={{ flexBasis: tier.postMinWidth, minWidth: POST_FLOOR_WIDTH, maxWidth: POST_MAX_WIDTH }}
      >
        <div className="flex items-center gap-2">
          <Skeleton className={cn(BASECAMP_SKELETON, 'h-11 w-11 shrink-0 rounded-full')} />
          <Skeleton className={cn(BASECAMP_SKELETON, 'h-3 w-24')} />
        </div>
        <Skeleton className={cn(BASECAMP_SKELETON, 'mt-1.5 w-full rounded-[10px]')} style={{ height: POST_CARD_HEIGHT }} />
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
          {isFetchingNextPage
            ? t('global.loading')
            : hasNextPage
              ? t('user_profile.load_newer')
              : t('user_profile.nothing_more_to_load')}
        </button>
      </div>
    </>
  );
};

export default NewcomersList;
