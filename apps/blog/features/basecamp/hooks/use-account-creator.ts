'use client';

import { useQuery } from '@tanstack/react-query';
import { getChain } from '@transaction/lib/chain';

/**
 * The operations that name who created an account. Hive has used several over
 * the years — a claimed-account creation and its matching virtual record both
 * carry a `creator`, and older accounts were made with the plain or
 * with-delegation form. An account carries whichever applied at the time.
 */
const ACCOUNT_CREATION_OPERATION_NAMES = [
  'account_created_operation',
  'account_create_operation',
  'account_create_with_delegation_operation',
  'create_claimed_account_operation'
];

/**
 * Two records is the most any account has: the creation operation and its
 * virtual counterpart. Asking for a handful leaves room without ever paging.
 */
const CREATION_PAGE_SIZE = 10;

/**
 * Who created this account.
 *
 * This is deliberately its own request rather than another field on the card's
 * history read, and the reason is worth recording so nobody folds it back in.
 * The history endpoint pages from the oldest record: calling it with no `page`
 * returns the NEWEST page, which is what the activity and pattern readouts
 * need, and the creation record sits at the far other end of the account's
 * life. Adding the creation operation types to that read finds nothing for any
 * account with more than one page of history.
 *
 * Filtering to only the creation operations sidesteps paging entirely: there
 * are at most two matching records in the whole account, so the newest page of
 * that filter is also the only page. The response is a couple of records rather
 * than a thousand, and a creator never changes, so it is cached for the life of
 * the tab and never refetched.
 */
export async function fetchAccountCreator(username: string): Promise<string | null> {
  const chain = await getChain();
  const opTypes = await chain.restApi['hafah-api']['operation-types']();
  const creationOpTypeIds = ACCOUNT_CREATION_OPERATION_NAMES.map(
    (name) => opTypes.find((opType) => opType.operation_name === name)?.op_type_id
  ).filter((id): id is number => id !== undefined);

  // A node that reports none of these names leaves the creator unknown rather
  // than failing the card.
  if (creationOpTypeIds.length === 0) return null;

  const response = await chain.restApi['hivemind-api'].accountsOperations({
    'account-name': username,
    'operation-types': creationOpTypeIds.join(','),
    'page-size': CREATION_PAGE_SIZE
  });

  for (const operation of response.operations_result ?? []) {
    const value = operation.op?.value as Record<string, unknown> | undefined;
    if (!value) continue;
    // An account that onboards other people carries their creation records too,
    // so the new account name must match before the creator is read — otherwise
    // a prolific onboarder would appear to have created itself.
    if (value.new_account_name !== username) continue;
    const creator = value.creator;
    if (typeof creator === 'string' && creator.length > 0) return creator;
  }

  return null;
}

/**
 * `enabled` lets the card defer this until the row is on screen, matching how
 * the history read is deferred. Null means we have not seen a creator, never
 * "nobody created this account".
 */
export const useAccountCreator = (username: string, enabled = true) => {
  const { data } = useQuery({
    queryKey: ['basecampAccountCreator', username],
    queryFn: () => fetchAccountCreator(username),
    enabled: enabled && Boolean(username),
    // An account's creator is fixed the moment it exists, so this never goes
    // stale and is never worth asking twice.
    staleTime: Infinity,
    retry: false
  });

  return data ?? null;
};
