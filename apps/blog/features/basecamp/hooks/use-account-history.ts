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
const HISTORY_OPERATION_NAMES = [
  VOTE_OPERATION_NAME,
  COMMENT_OPERATION_NAME,
  CUSTOM_JSON_OPERATION_NAME,
  POWER_UP_OPERATION_NAME
];

const FOLLOW_CUSTOM_JSON_ID = 'follow';
const INTRO_POST_TAG = 'introduceyourself';
/** Hive community accounts are all named `hive-<digits>`. */
const COMMUNITY_PERMLINK_PREFIX = 'hive-';

/** How far back the vote/comment rates are measured. */
const ACTIVITY_WINDOW_DAYS = 30;
/** Floor on the measured span, so a busy account's few-hour sample can't inflate rates. */
const MIN_OBSERVED_DAYS = 1;
/**
 * One page of history, newest first. Every checklist question is "has this
 * account ever done X", so a truncated page only loses the oldest records. New
 * users are under a year old by definition, so this usually covers everything.
 */
const HISTORY_PAGE_SIZE = 1000;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const PROFILE_FIELDS = ['profile_image', 'cover_image', 'about', 'location', 'website', 'name'] as const;

export interface AccountActivity {
  votesPerDay: number;
  commentsPerDay: number;
  /** Days of history the rates were actually measured over. */
  observedDays: number;
}

export interface AccountHistory {
  activity: AccountActivity;
  facts: ChecklistFacts;
}

const EMPTY_ACTIVITY: AccountActivity = { votesPerDay: 0, commentsPerDay: 0, observedDays: 0 };
const EMPTY_HISTORY: AccountHistory = { activity: EMPTY_ACTIVITY, facts: EMPTY_CHECKLIST_FACTS };

/**
 * Hive history timestamps are UTC but arrive as strings with no timezone
 * designator, so JavaScript would read them as local time and skew every span
 * by the viewer's offset. The 'Z' is appended explicitly.
 */
function parseHiveTimestamp(timestamp: Date | string): number {
  if (timestamp instanceof Date) return timestamp.getTime();
  if (typeof timestamp !== 'string') return Number.NaN;
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/.test(timestamp) ? timestamp : `${timestamp}Z`;
  return new Date(normalized).getTime();
}

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
    return Array.isArray(tags) && tags.some((tag) => typeof tag === 'string' && tag.toLowerCase() === INTRO_POST_TAG);
  } catch {
    return false;
  }
}

/**
 * The account this custom_json follows, or null when it is not a follow by this
 * account. Shape is ['follow', { follower, following, what: ['blog'] }]; an
 * empty `what` is an unfollow and 'ignore' is a mute, so neither counts.
 */
function followedAccountName(value: Record<string, unknown>, username: string): string | null {
  try {
    if (value.id !== FOLLOW_CUSTOM_JSON_ID) return null;
    const auths = value.required_posting_auths;
    if (!Array.isArray(auths) || !auths.includes(username)) return null;
    const parsed: unknown = JSON.parse(String(value.json));
    if (!Array.isArray(parsed) || parsed[0] !== 'follow') return null;
    const body = parsed[1];
    if (typeof body !== 'object' || body === null) return null;
    const record = body as Record<string, unknown>;
    const what = record.what;
    if (!Array.isArray(what) || !what.includes('blog')) return null;
    return typeof record.following === 'string' ? record.following : null;
  } catch {
    return null;
  }
}

export function accountHistoryQueryKey(username: string) {
  return ['basecampAccountHistory', username] as const;
}

/**
 * One history read per account, serving both the activity rate and every
 * derived checklist item. They were three separate reads of the same person's
 * history; a feed of twenty cards was asking sixty questions where twenty do.
 *
 * The endpoint returns operations the account is *involved in*, not only the
 * ones it performed — an author's own post attracts votes and comments from
 * other people. Counting the response directly would measure popularity, not
 * activity, so every rate filters on the account having acted. The same
 * property is what makes `hadConversation` possible: a comment whose
 * `parent_author` is this account but whose `author` is somebody else is
 * someone replying to them.
 */
export async function fetchAccountHistory(username: string): Promise<AccountHistory> {
  const chain = await getChain();
  const opTypes = await chain.restApi['hafah-api']['operation-types']();
  const opTypeIds = HISTORY_OPERATION_NAMES.map(
    (name) => opTypes.find((opType) => opType.operation_name === name)?.op_type_id
  );
  if (opTypeIds.some((id) => id === undefined)) throw new Error('Missing Hive operation type ids');

  const [response, accounts] = await Promise.all([
    chain.restApi['hivemind-api'].accountsOperations({
      'account-name': username,
      'operation-types': opTypeIds.join(','),
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

  // Sets, not counters: following the same person twice is one follow, and
  // three replies in a single thread is one post replied to.
  const followedAccounts = new Set<string>();
  const repliedToPosts = new Set<string>();
  let wasRepliedTo = false;

  const windowStart = Date.now() - ACTIVITY_WINDOW_DAYS * MS_PER_DAY;
  let votesCast = 0;
  let commentsWritten = 0;
  let oldestInWindow = Number.POSITIVE_INFINITY;

  for (const operation of response.operations_result ?? []) {
    const value = operation.op?.value as Record<string, unknown> | undefined;
    if (!value) continue;
    const time = parseHiveTimestamp(operation.timestamp);
    const inWindow = Number.isFinite(time) && time >= windowStart;
    let actedInWindow = false;

    switch (operation.op.type) {
      case VOTE_OPERATION_NAME:
        if (value.voter === username) {
          actedInWindow = inWindow;
          if (actedInWindow) votesCast++;
          // A downvote is not "your first upvote".
          if (Number(value.weight) > 0) facts.gaveUpvote = true;
        }
        break;
      case COMMENT_OPERATION_NAME: {
        const parentAuthor = typeof value.parent_author === 'string' ? value.parent_author : '';
        if (value.author === username) {
          actedInWindow = inWindow;
          if (actedInWindow) commentsWritten++;
          if (parentAuthor === '') {
            if (hasIntroTag(value.json_metadata)) facts.wroteIntroPost = true;
            if (String(value.parent_permlink ?? '').startsWith(COMMUNITY_PERMLINK_PREFIX)) {
              facts.postedInCommunity = true;
            }
          } else if (parentAuthor !== username) {
            repliedToPosts.add(`${parentAuthor}/${String(value.parent_permlink ?? '')}`);
          }
        } else if (parentAuthor === username) {
          wasRepliedTo = true;
        }
        break;
      }
      case CUSTOM_JSON_OPERATION_NAME: {
        const followed = followedAccountName(value, username);
        if (followed) followedAccounts.add(followed);
        break;
      }
      case POWER_UP_OPERATION_NAME:
        if (value.from === username) facts.poweredUp = true;
        break;
      default:
        break;
    }

    if (actedInWindow && time < oldestInWindow) oldestInWindow = time;
  }

  facts.followCount = followedAccounts.size;
  facts.replyToOthersCount = repliedToPosts.size;
  // Two-sided: somebody came to them, and they go out to others. Approximate by
  // design — proving one back-and-forth thread would mean walking each one.
  facts.hadConversation = wasRepliedTo && facts.replyToOthersCount > 0;

  // No qualifying records is a real zero — the account did nothing in the
  // window — not a failure. A failed lookup throws instead.
  const spanDays = Number.isFinite(oldestInWindow)
    ? (Date.now() - oldestInWindow) / MS_PER_DAY
    : ACTIVITY_WINDOW_DAYS;
  const observedDays = Math.min(Math.max(spanDays, MIN_OBSERVED_DAYS), ACTIVITY_WINDOW_DAYS);

  return {
    activity: {
      votesPerDay: votesCast / observedDays,
      commentsPerDay: commentsWritten / observedDays,
      observedDays
    },
    facts
  };
}

/**
 * Where a card's lookup stands. Kept distinct from the numbers so "not asked
 * yet" is never presented as "did nothing" — an unmeasured account and a
 * genuinely idle one both draw an empty ring, but only the second may be
 * described as having zero activity.
 */
export type HistoryStatus = 'idle' | 'loading' | 'ready' | 'unavailable';

/**
 * `enabled` lets callers defer the request until the row is on screen, so a
 * long feed doesn't fire one lookup per card up front.
 */
export const useAccountHistory = (username: string, enabled = true) => {
  const isEnabled = enabled && Boolean(username);
  const { data, isFetching, isError } = useQuery({
    queryKey: accountHistoryQueryKey(username),
    queryFn: () => fetchAccountHistory(username),
    enabled: isEnabled,
    staleTime: StaleTime.MEDIUM,
    retry: false
  });

  let status: HistoryStatus;
  if (isError) status = 'unavailable';
  else if (data) status = 'ready';
  else if (isEnabled) status = 'loading';
  else status = 'idle';

  return { ...(status === 'ready' && data ? data : EMPTY_HISTORY), status, isFetching };
};
