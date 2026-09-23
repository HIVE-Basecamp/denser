'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getChain } from '@transaction/lib/chain';
import { operationTypeIdOf } from './operation-types';
import { StaleTime } from '@/blog/lib/react-query';
import {
  BASECAMP_CUSTOM_JSON_ID,
  decodeBasecampRecord,
  foldBasecampState,
  type BasecampRecord
} from '../lib/protocol';
import { withRetry } from '../lib/retry';

const CUSTOM_JSON_OPERATION_NAME = 'custom_json_operation';
const HISTORY_PAGE_SIZE = 1000;

/**
 * How many pages of custom_json the signed-in account's own state is read
 * from.
 *
 * The endpoint pages from the oldest record, so asking without a page number
 * returns the newest thousand — and every follow, reblog, mute and app action
 * on Hive is a custom_json. Measured on 2026-09-23: one OG account had 5,670
 * of them, and the two Basecamp records it wrote in August were already 670
 * deep. One page would have quietly forgotten them within a few weeks. Five
 * thousand is years of headroom for a person; the read is only this deep for
 * the account on the screen, never for the candidates a guide is matched
 * against, which are new and have few.
 */
const OWN_STATE_MAX_PAGES = 5;

export function basecampRecordsQueryKey(username: string) {
  return ['basecampRecords', username] as const;
}

/**
 * Looks up the operation-type id for custom_json_operation at runtime via
 * hafah-api, then reads that account's custom_json history via hivemind-api,
 * matching the pattern apps/wallet/lib/hive.ts uses for other operation types.
 *
 * `maxPages` is how far back it reads: the newest page, and up to that many
 * pages of older ones behind it. Every page is asked for again when the node
 * drops it (lib/retry.ts).
 */
export async function fetchBasecampRecords(username: string, maxPages = 1): Promise<BasecampRecord[]> {
  const chain = await getChain();
  const opTypeId = await operationTypeIdOf(CUSTOM_JSON_OPERATION_NAME);
  if (opTypeId === undefined) return [];

  const read = (page?: number) =>
    withRetry(() =>
      chain.restApi['hivemind-api'].accountsOperations({
        'account-name': username,
        'operation-types': opTypeId.toString(),
        'page-size': HISTORY_PAGE_SIZE,
        ...(page === undefined ? {} : { page })
      })
    );

  const newest = await read();
  const operations = [...(newest.operations_result ?? [])];
  const pages = Number.isFinite(newest.total_pages) ? newest.total_pages : 1;
  for (let page = pages - 1, readPages = 1; page >= 1 && readPages < maxPages; page--, readPages++) {
    const older = await read(page);
    operations.push(...(older.operations_result ?? []));
  }

  return operations
    .filter((operation) => operation.op.value.id === BASECAMP_CUSTOM_JSON_ID)
    .map((operation) =>
      decodeBasecampRecord({
        timestamp: new Date(operation.timestamp).toISOString(),
        id: operation.op.value.id,
        json: operation.op.value.json,
        account: operation.op.value.required_posting_auths?.[0]
      })
    )
    .filter((record): record is BasecampRecord => record !== null);
}

export const useBasecampState = (username: string) => {
  const { data, isFetching } = useQuery({
    queryKey: basecampRecordsQueryKey(username),
    queryFn: () => fetchBasecampRecords(username, OWN_STATE_MAX_PAGES),
    enabled: Boolean(username),
    staleTime: StaleTime.MEDIUM
  });

  const state = useMemo(() => foldBasecampState(data ?? []), [data]);

  return { state, isFetching };
};
