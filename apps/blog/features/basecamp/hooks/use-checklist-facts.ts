'use client';

import { useQuery } from '@tanstack/react-query';
import { getChain } from '@transaction/lib/chain';
import { getAccounts } from '@transaction/lib/hive-api';
import { StaleTime } from '@/blog/lib/react-query';
import { EMPTY_CHECKLIST_FACTS, type ChecklistFacts } from '../lib/checklist';

const VOTE_OPERATION_NAME = 'vote_operation';
const COMMENT_OPERATION_NAME = 'comment_operation';
const CUSTOM_JSON_OPERATION_NAME = 'custom_json_operation';
const POWER_UP_OPERATION_NAME = 'transfer_to_vesting_operation';

const FOLLOW_CUSTOM_JSON_ID = 'follow';
const INTRO_POST_TAG = 'introduceyourself';
/** Hive community accounts are all named `hive-<digits>`. */
const COMMUNITY_PERMLINK_PREFIX = 'hive-';

/**
 * One page of history, newest first. Every question here is "has this account
 * ever done X", so a truncated page only loses the oldest records — and an
 * account that did something once and never again, more than this many
 * operations ago, is not one this checklist is aimed at. New users are under a
 * year old by definition, so the whole history usually fits.
 */
const HISTORY_PAGE_SIZE = 1000;

const PROFILE_FIELDS = ['profile_image', 'cover_image', 'about', 'location', 'website', 'name'] as const;

function hasProfile(metadata: string | null | undefined): boolean {
  try {
    if (typeof metadata !== 'string' || metadata.length === 0) return false;
    const parsed: unknown = JSON.parse(metadata);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return false;
    const profile: unknown = (parsed as Record<string, unknown>).profile;
    if (typeof profile !== 'object' || profile === null || Array.isArray(profile)) return false;
    const record = profile as Record<string, unknown>;
    return PROFILE_FIELDS.some((field) => typeof record[field] === 'string' && record[field] !== '');
  } catch {
    return false;
  }
}

function hasIntroTag(jsonMetadata: unknown): boolean {
  try {
    if (typeof jsonMetadata !== 'string' || jsonMetadata.length === 0) return false;
    const parsed: unknown = JSON.parse(jsonMetadata);
    if (typeof parsed !== 'object' || parsed === null) return false;
    const tags: unknown = (parsed as Record<string, unknown>).tags;
    if (!Array.isArray(tags)) return false;
    return tags.some((tag) => typeof tag === 'string' && tag.toLowerCase() === INTRO_POST_TAG);
  } catch {
    return false;
  }
}

/** True when this custom_json is a follow (not a mute or a reblog) by this account. */
function isFollowByAccount(value: Record<string, unknown>, username: string): boolean {
  try {
    if (value.id !== FOLLOW_CUSTOM_JSON_ID) return false;
    const auths = value.required_posting_auths;
    if (!Array.isArray(auths) || !auths.includes(username)) return false;
    const parsed: unknown = JSON.parse(String(value.json));
    // Shape is ['follow', { follower, following, what: ['blog'] }]. An empty
    // `what` is an unfollow, and 'ignore' is a mute — neither counts.
    if (!Array.isArray(parsed) || parsed[0] !== 'follow') return false;
    const body = parsed[1];
    if (typeof body !== 'object' || body === null) return false;
    const what = (body as Record<string, unknown>).what;
    return Array.isArray(what) && what.includes('blog');
  } catch {
    return false;
  }
}

export function checklistFactsQueryKey(username: string) {
  return ['basecampChecklistFacts', username] as const;
}

/**
 * Gathers everything the derived half of the checklist needs, in one history
 * read plus one account read.
 *
 * The history endpoint returns operations the account is *involved in*, not
 * only the ones it performed, which is what makes `hadConversation` possible:
 * a comment whose `parent_author` is this account but whose `author` is someone
 * else is somebody replying to them. Every other check filters the other way,
 * on the account having acted.
 */
export async function fetchChecklistFacts(username: string): Promise<ChecklistFacts> {
  const chain = await getChain();
  const opTypes = await chain.restApi['hafah-api']['operation-types']();
  const wanted = [
    VOTE_OPERATION_NAME,
    COMMENT_OPERATION_NAME,
    CUSTOM_JSON_OPERATION_NAME,
    POWER_UP_OPERATION_NAME
  ].map((name) => opTypes.find((opType) => opType.operation_name === name)?.op_type_id);
  if (wanted.some((id) => id === undefined)) return EMPTY_CHECKLIST_FACTS;

  const [response, accounts] = await Promise.all([
    chain.restApi['hivemind-api'].accountsOperations({
      'account-name': username,
      'operation-types': wanted.join(','),
      'page-size': HISTORY_PAGE_SIZE
    }),
    getAccounts([username])
  ]);

  const account = accounts?.[0];
  const facts: ChecklistFacts = {
    ...EMPTY_CHECKLIST_FACTS,
    available: true,
    profileFilled: hasProfile(account?.posting_json_metadata) || hasProfile(account?.json_metadata)
  };

  let wasRepliedTo = false;

  for (const operation of response.operations_result ?? []) {
    const value = operation.op?.value as Record<string, unknown> | undefined;
    if (!value) continue;
    switch (operation.op.type) {
      case VOTE_OPERATION_NAME:
        // weight can be negative: a downvote is not "your first upvote".
        if (value.voter === username && Number(value.weight) > 0) facts.gaveUpvote = true;
        break;
      case COMMENT_OPERATION_NAME: {
        const parentAuthor = typeof value.parent_author === 'string' ? value.parent_author : '';
        if (value.author === username) {
          if (parentAuthor === '') {
            if (hasIntroTag(value.json_metadata)) facts.wroteIntroPost = true;
            if (String(value.parent_permlink ?? '').startsWith(COMMUNITY_PERMLINK_PREFIX)) {
              facts.postedInCommunity = true;
            }
          } else if (parentAuthor !== username) {
            facts.repliedToOthers = true;
          }
        } else if (parentAuthor === username) {
          wasRepliedTo = true;
        }
        break;
      }
      case CUSTOM_JSON_OPERATION_NAME:
        if (isFollowByAccount(value, username)) facts.followedSomeone = true;
        break;
      case POWER_UP_OPERATION_NAME:
        if (value.from === username) facts.poweredUp = true;
        break;
      default:
        break;
    }
  }

  // Two-sided: somebody came to them, and they go out to others. Approximate
  // by design — proving a specific back-and-forth thread would need walking
  // each conversation, and this is a checklist item, not a court exhibit.
  facts.hadConversation = wasRepliedTo && facts.repliedToOthers;

  return facts;
}

/**
 * `enabled` lets a caller defer the lookup until the card is on screen, the
 * same way the activity rings do, so a long feed doesn't fire one per card.
 */
export const useChecklistFacts = (username: string, enabled = true) => {
  const isEnabled = enabled && Boolean(username);
  const { data, isFetching, isError } = useQuery({
    queryKey: checklistFactsQueryKey(username),
    queryFn: () => fetchChecklistFacts(username),
    enabled: isEnabled,
    staleTime: StaleTime.MEDIUM,
    retry: false
  });

  return {
    facts: data ?? EMPTY_CHECKLIST_FACTS,
    isFetching,
    isUnavailable: isError
  };
};
