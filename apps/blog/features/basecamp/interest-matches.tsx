'use client';

import { useMemo } from 'react';
import { Skeleton } from '@hive/ui';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import { BASECAMP_MUTED, BASECAMP_SKELETON } from './lib/theme';
import { useElementWidth } from './hooks/use-element-width';
import { useNewcomers } from './hooks/use-newcomers';
import { useInterestMatches } from './hooks/use-interest-matches';
import NewcomersListItem from './newcomers-list-item';
import { postcardTierFor } from './lib/postcard-sizes';
import type { BasecampInterest } from './lib/protocol';

// How many of the already-loaded new users to check for shared interests, and
// how many matches to show. Each candidate costs a history read, so the
// candidate limit is the expensive one.
const CANDIDATE_LIMIT = 20;
const DISPLAY_LIMIT = 5;

/**
 * The payoff for putting interests on record: new users whose interests overlap
 * with this guide's own. Shows the same card as the main feed — there is only
 * one card, and a match deserves the full one.
 *
 * When nothing matches it says so. It deliberately does NOT fall back to the
 * most recent new users: presenting non-matches under a matching heading tells
 * the guide something untrue.
 */
const InterestMatches = ({ guideInterests }: { guideInterests: BasecampInterest[] }) => {
  const { t } = useTranslation('common_blog');
  // Same sizing rule as the feed: the list measures itself so a row never wraps.
  const { ref: listRef, width: listWidth } = useElementWidth<HTMLUListElement>();
  const { newcomers } = useNewcomers();
  const candidates = useMemo(() => newcomers.slice(0, CANDIDATE_LIMIT), [newcomers]);
  const { matches, isFetching } = useInterestMatches(candidates, guideInterests);

  if (isFetching && candidates.length > 0) {
    return (
      <div className="my-4" data-testid="interest-matches-skeleton">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className={cn(BASECAMP_SKELETON, 'my-2 h-16 w-full rounded-xl')} />
        ))}
      </div>
    );
  }

  return (
    <div className="my-4" data-testid="interest-matches">
      <span className="text-sm font-semibold">{t('basecamp.interest_matches.heading')}</span>
      {matches.length === 0 ? (
        <p className={cn(BASECAMP_MUTED, 'mt-1 text-sm')} data-testid="interest-matches-none">
          {t('basecamp.interest_matches.none_yet')}
        </p>
      ) : (
        <ul ref={listRef}>
          {matches.slice(0, DISPLAY_LIMIT).map((newcomer) => (
            <NewcomersListItem
              key={`${newcomer.post.author}/${newcomer.post.permlink}`}
              {...newcomer}
              showFollow
              tier={postcardTierFor(listWidth)}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default InterestMatches;
