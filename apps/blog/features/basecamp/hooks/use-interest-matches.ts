'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StaleTime } from '@/blog/lib/react-query';
import { fetchBasecampRecords } from './use-basecamp-state';
import { foldBasecampState, type BasecampInterest } from '../lib/protocol';
import type { Newcomer } from './use-newcomers';

/**
 * For a set of candidate new users, looks up each author's interests on record
 * (their Basecamp custom_json history, same read path as useBasecampState) and
 * returns the subset whose interests overlap with the guide's own.
 *
 * One history read per candidate: the chain answers "what did this named
 * account declare", never "who declared photography", so there is no way to
 * ask for the matches directly. Keep the candidate list short.
 */
export function useInterestMatches(candidates: Newcomer[], guideInterests: BasecampInterest[]) {
  const authors = useMemo(() => Array.from(new Set(candidates.map((candidate) => candidate.post.author))), [
    candidates
  ]);

  const { data, isFetching } = useQuery({
    queryKey: ['basecampInterestsOnRecord', authors],
    queryFn: async () => {
      const entries = await Promise.all(
        authors.map(async (author) => {
          const records = await fetchBasecampRecords(author);
          const state = foldBasecampState(records);
          return [author, state.interests] as const;
        })
      );
      return new Map(entries);
    },
    enabled: authors.length > 0,
    staleTime: StaleTime.MEDIUM
  });

  const matches = useMemo(() => {
    if (!data) return [];
    return candidates.filter((candidate) => {
      const authorInterests = data.get(candidate.post.author) ?? [];
      return authorInterests.some((interest) => guideInterests.includes(interest as BasecampInterest));
    });
  }, [data, candidates, guideInterests]);

  return { matches, isFetching: isFetching && authors.length > 0 };
}
