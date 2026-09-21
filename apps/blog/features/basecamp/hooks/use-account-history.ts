'use client';

import { useQuery } from '@tanstack/react-query';
import { getChain } from '@transaction/lib/chain';
import { getAccounts } from '@transaction/lib/hive-api';
import { StaleTime } from '@/blog/lib/react-query';
import { EMPTY_CHECKLIST_FACTS, type ChecklistFacts } from '../lib/checklist';
import {
  EMPTY_COMMENT_PATTERNS,
  summarizePatterns,
  type CommentPatterns,
  type CommentRecord,
  type VoteRecord
} from '../lib/patterns';
import { HOURS_IN_DAY, utcDayStart, type ActionRecord } from '../lib/hourly-actions';

const VOTE_OPERATION_NAME = 'vote_operation';
const COMMENT_OPERATION_NAME = 'comment_operation';
const CUSTOM_JSON_OPERATION_NAME = 'custom_json_operation';
const POWER_UP_OPERATION_NAME = 'transfer_to_vesting_operation';
const TRANSFER_OPERATION_NAME = 'transfer_operation';
const DELEGATE_OPERATION_NAME = 'delegate_vesting_shares_operation';
const CLAIM_OPERATION_NAME = 'claim_reward_balance_operation';
const POWER_DOWN_OPERATION_NAME = 'withdraw_vesting_operation';
const WITNESS_VOTE_OPERATION_NAME = 'account_witness_vote_operation';
const PROXY_OPERATION_NAME = 'account_witness_proxy_operation';
const PROPOSAL_VOTE_OPERATION_NAME = 'update_proposal_votes_operation';
/**
 * Everything that counts as something this account did.
 *
 * The last three are here for the clock. It shows the hours of today the
 * account was doing anything, and a day in which they only moved money would
 * otherwise read as a day they were asleep.
 */
const HISTORY_OPERATION_NAMES = [
  VOTE_OPERATION_NAME,
  COMMENT_OPERATION_NAME,
  CUSTOM_JSON_OPERATION_NAME,
  POWER_UP_OPERATION_NAME,
  TRANSFER_OPERATION_NAME,
  DELEGATE_OPERATION_NAME,
  CLAIM_OPERATION_NAME,
  POWER_DOWN_OPERATION_NAME,
  WITNESS_VOTE_OPERATION_NAME,
  PROXY_OPERATION_NAME,
  PROPOSAL_VOTE_OPERATION_NAME
];

/** The asset identifiers Hive stamps on an amount. */
const NAI_HIVE = '@@000000021';
const NAI_HBD = '@@000000013';
/** A vote weight is in hundredths of a percent. */
const WEIGHT_PER_PERCENT = 100;

const FOLLOW_CUSTOM_JSON_ID = 'follow';
const INTRO_POST_TAG = 'introduceyourself';
/** Hive community accounts are all named `hive-<digits>`. */
const COMMUNITY_PERMLINK_PREFIX = 'hive-';

/** How far back the vote/comment rates are measured. */
const ACTIVITY_WINDOW_DAYS = 30;
/** Floor on the measured span, so a busy account's few-hour sample can't inflate rates. */
const MIN_OBSERVED_DAYS = 1;
/** The node refuses anything larger. */
const HISTORY_PAGE_SIZE = 1000;

/**
 * How many pages are read before it stops.
 *
 * The endpoint pages from the OLDEST record, so asking with no page number
 * returns the LAST page — and that page holds the remainder, which on a busy
 * account is thirty records rather than a thousand. Measured on 2026-09-21:
 * one account with 46,853 records handed back 853 of them, and another handed
 * back 28 of 6,028. Reading only that page left the clock drawing four hours
 * of an account's day and calling it the day.
 */
const MAX_HISTORY_PAGES = 3;

/**
 * How far back the spokes want to reach.
 *
 * The dial draws two things and they want different amounts of history.
 * Today's marks need only enough to pass midnight. The spokes behind them are
 * the hours this account is usually awake in, and that is a question about
 * days, not about records: a thousand records is months for one account and
 * half a day for another, and only the second one would draw today twice and
 * call one of them a habit.
 *
 * A week is enough to show a routine and short enough that most accounts reach
 * it inside their first page.
 */
const HABIT_WINDOW_DAYS = 7;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const PROFILE_FIELDS = ['profile_image', 'cover_image', 'about', 'location', 'website', 'name'] as const;

export interface AccountActivity {
  votesPerDay: number;
  commentsPerDay: number;
  /** Days of history the rates were actually measured over. */
  observedDays: number;
}

/**
 * The two readings the clock draws, from one set of records.
 *
 * The dial answers two questions at once. The long spokes are the hours this
 * account is usually awake in — every record the read reached, laid over one
 * face, so a person who posts at 03:00 every night lights that hour every
 * night. The short marks inside them are today alone.
 *
 * Neither is the other's summary. An account whose red marks sit outside its
 * own usual hours is doing something it does not normally do, and that is only
 * visible because both are on the same dial. What it means is the reader's to
 * weigh (ETHOS.md).
 */
export interface DayActivity {
  /** False until a read has finished. Never to be drawn as a day of zeroes. */
  known: boolean;
  /** Midnight UTC of the day the short marks cover. */
  dayStartMs: number;
  /** One count per hour of today, index 0 = 00:00 UTC. Every kind of action. */
  todayHourly: number[];
  /** How many of the twenty-four hours of today hold anything. */
  todayActiveHours: number;
  /**
   * One count per hour across every record the read reached. Not a lifetime:
   * it is as far back as the read got, and the popover says so rather than
   * calling a window a life.
   */
  historyHourly: number[];
  historyActiveHours: number;
  /** The oldest record behind the long spokes. */
  oldestMs: number | null;
  /** Today's actions themselves, newest first, with their amounts. */
  actions: ActionRecord[];
  /**
   * False when the read stopped before it reached midnight, so the earliest
   * hours of today are missing and the panel must say so.
   */
  complete: boolean;
}

const EMPTY_DAY: DayActivity = {
  known: false,
  dayStartMs: 0,
  todayHourly: new Array(HOURS_IN_DAY).fill(0),
  todayActiveHours: 0,
  historyHourly: new Array(HOURS_IN_DAY).fill(0),
  historyActiveHours: 0,
  oldestMs: null,
  actions: [],
  complete: false
};

export interface AccountHistory {
  activity: AccountActivity;
  facts: ChecklistFacts;
  patterns: CommentPatterns;
  /** What they did today, for the clock and for the panel behind it. */
  day: DayActivity;
}

const EMPTY_ACTIVITY: AccountActivity = { votesPerDay: 0, commentsPerDay: 0, observedDays: 0 };
const EMPTY_HISTORY: AccountHistory = {
  activity: EMPTY_ACTIVITY,
  facts: EMPTY_CHECKLIST_FACTS,
  patterns: EMPTY_COMMENT_PATTERNS,
  day: EMPTY_DAY
};

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

interface NaiAsset {
  nai?: unknown;
  amount?: unknown;
  precision?: unknown;
}

/** `{ amount: "125000", precision: 3 }` -> 125. Zero where it is not an amount. */
function assetValue(asset: unknown): number {
  if (typeof asset !== 'object' || asset === null) return 0;
  const { amount, precision } = asset as NaiAsset;
  const raw = Number(amount);
  const places = Number(precision);
  if (!Number.isFinite(raw) || !Number.isFinite(places)) return 0;
  return raw / 10 ** places;
}

function assetNai(asset: unknown): string | null {
  if (typeof asset !== 'object' || asset === null) return null;
  const { nai } = asset as NaiAsset;
  return typeof nai === 'string' ? nai : null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * One operation as a line a reader can read, or nothing where it is something
 * this account did not do.
 *
 * Both directions of a transfer and a delegation are kept. Money arriving is
 * not an action the account took, but it is half of what happened to them
 * today, and a day showing only the outgoing half would read as a person who
 * gives everything away.
 */
function toAction(
  type: string | undefined,
  value: Record<string, unknown>,
  timestampMs: number,
  username: string
): ActionRecord | null {
  switch (type) {
    case VOTE_OPERATION_NAME: {
      if (value.voter !== username) return null;
      const weight = Number(value.weight);
      return {
        kind: 'vote',
        timestampMs,
        counterparty: text(value.author),
        permlink: text(value.permlink),
        percent: Number.isFinite(weight) ? weight / WEIGHT_PER_PERCENT : undefined
      };
    }
    case COMMENT_OPERATION_NAME: {
      if (value.author !== username) return null;
      const parentAuthor = text(value.parent_author);
      if (parentAuthor === '') {
        return { kind: 'post', timestampMs, counterparty: '', permlink: text(value.permlink) };
      }
      return {
        kind: 'reply',
        timestampMs,
        counterparty: parentAuthor,
        permlink: text(value.parent_permlink)
      };
    }
    case CUSTOM_JSON_OPERATION_NAME: {
      const followed = followedAccountName(value, username);
      return followed ? { kind: 'follow', timestampMs, counterparty: followed } : null;
    }
    case POWER_UP_OPERATION_NAME: {
      if (value.from !== username) return null;
      const to = text(value.to);
      return {
        kind: 'powerUp',
        timestampMs,
        // Powering up their own stake names nobody; powering up somebody else
        // is a gift, and the name is the point of the line.
        counterparty: to === username ? '' : to,
        hive: assetValue(value.amount)
      };
    }
    case TRANSFER_OPERATION_NAME: {
      const nai = assetNai(value.amount);
      if (nai !== NAI_HIVE && nai !== NAI_HBD) return null;
      const amount = assetValue(value.amount);
      const money = nai === NAI_HBD ? { hbd: amount } : { hive: amount };
      const memo = text(value.memo);
      if (value.from === username && value.to !== username) {
        return { kind: 'sent', timestampMs, counterparty: text(value.to), memo, ...money };
      }
      if (value.to === username && value.from !== username) {
        return { kind: 'received', timestampMs, counterparty: text(value.from), memo, ...money };
      }
      return null;
    }
    case DELEGATE_OPERATION_NAME: {
      const vests = assetValue(value.vesting_shares);
      // Hive cancels a delegation by setting it to nothing. It is a different
      // event from lending, not a loan of zero, and it says the opposite thing
      // about the two accounts.
      const ended = vests === 0;
      if (value.delegator === username) {
        return {
          kind: ended ? 'delegationEnded' : 'delegated',
          timestampMs,
          counterparty: text(value.delegatee),
          vests
        };
      }
      if (value.delegatee === username) {
        return {
          kind: ended ? 'delegationInEnded' : 'delegationIn',
          timestampMs,
          counterparty: text(value.delegator),
          vests
        };
      }
      return null;
    }
    case POWER_DOWN_OPERATION_NAME: {
      if (value.account !== username) return null;
      const vests = assetValue(value.vesting_shares);
      // Hive stops a power down by setting it to nothing, the same way it
      // cancels a delegation. Stopping one is the opposite decision to
      // starting one, and the line says which.
      return vests === 0
        ? { kind: 'powerDownStopped', timestampMs, counterparty: '' }
        : { kind: 'powerDown', timestampMs, counterparty: '', vests };
    }
    case WITNESS_VOTE_OPERATION_NAME: {
      // The witness is an impacted account too, so without this a witness's
      // own card would count every vote it was given as something it did.
      if (value.account !== username) return null;
      return {
        kind: value.approve === false ? 'witnessUnvote' : 'witnessVote',
        timestampMs,
        counterparty: text(value.witness)
      };
    }
    case PROXY_OPERATION_NAME: {
      if (value.account !== username) return null;
      const proxy = text(value.proxy);
      return proxy === ''
        ? { kind: 'proxyCleared', timestampMs, counterparty: '' }
        : { kind: 'proxySet', timestampMs, counterparty: proxy };
    }
    case PROPOSAL_VOTE_OPERATION_NAME: {
      if (value.voter !== username) return null;
      const ids = Array.isArray(value.proposal_ids)
        ? value.proposal_ids.map(Number).filter((id) => Number.isFinite(id))
        : [];
      return {
        kind: value.approve === false ? 'proposalUnvote' : 'proposalVote',
        timestampMs,
        counterparty: '',
        proposalIds: ids
      };
    }
    case CLAIM_OPERATION_NAME: {
      if (value.account !== username) return null;
      return {
        kind: 'claimed',
        timestampMs,
        counterparty: '',
        hive: assetValue(value.reward_hive),
        hbd: assetValue(value.reward_hbd),
        vests: assetValue(value.reward_vests)
      };
    }
    default:
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

  const read = (page?: number) =>
    chain.restApi['hivemind-api'].accountsOperations({
      'account-name': username,
      'operation-types': opTypeIds.join(','),
      'page-size': HISTORY_PAGE_SIZE,
      ...(page === undefined ? {} : { page })
    });

  const dayStartMs = utcDayStart(Date.now());

  // The last page first — it is the newest, and the only one whose number is
  // not known in advance.
  const [newest, accounts] = await Promise.all([read(), getAccounts([username])]);
  const operations = [...(newest.operations_result ?? [])];

  /** The oldest record held so far. While it is after midnight, today is cut off. */
  const oldestRead = () => {
    let oldest = Number.POSITIVE_INFINITY;
    for (const operation of operations) {
      const time = parseHiveTimestamp(operation.timestamp);
      if (Number.isFinite(time) && time < oldest) oldest = time;
    }
    return oldest;
  };

  const totalPages = Number.isFinite(newest.total_pages) ? newest.total_pages : 1;
  let page = totalPages - 1;
  let pagesRead = 1;
  // Backwards until both readings have what they need, and no further. An
  // account whose whole history is one page never costs a second request.
  const habitStartMs = Date.now() - HABIT_WINDOW_DAYS * MS_PER_DAY;
  while (page >= 1 && pagesRead < MAX_HISTORY_PAGES && oldestRead() > habitStartMs) {
    // Best effort, on purpose. These pages deepen the spokes; the first page
    // already holds today. A public node that drops one of them should cost
    // the card some history, not the whole card — measured on 2026-09-21, one
    // dropped page was leaving an account reading "not measured yet" when
    // everything the clock needed had already arrived.
    try {
      const older = await read(page);
      operations.push(...(older.operations_result ?? []));
    } catch {
      break;
    }
    page--;
    pagesRead++;
  }

  const dayComplete = oldestRead() <= dayStartMs;

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

  // Everything this account wrote and every vote it cast, kept as records so
  // the pattern maths stays a pure function over them. Only the account's own
  // actions are collected: the endpoint also returns operations it was merely
  // involved in, and counting those would measure popularity, not behaviour.
  const writtenComments: CommentRecord[] = [];
  const castVotes: VoteRecord[] = [];

  // Today only, in full. Bounded by the day rather than by a count, so a feed
  // of these holds one short list per card instead of a thousand records each.
  const dayActions: ActionRecord[] = [];
  const todayHourly = new Array<number>(HOURS_IN_DAY).fill(0);
  const historyHourly = new Array<number>(HOURS_IN_DAY).fill(0);
  let oldestActionMs: number | null = null;

  for (const operation of operations) {
    const value = operation.op?.value as Record<string, unknown> | undefined;
    if (!value) continue;
    const time = parseHiveTimestamp(operation.timestamp);
    const inWindow = Number.isFinite(time) && time >= windowStart;
    let actedInWindow = false;

    if (Number.isFinite(time)) {
      // Classified once. The long spokes and the short marks are the same
      // events counted over two spans, so they can never disagree about what
      // an action is.
      const action = toAction(operation.op?.type, value, time, username);
      if (action) {
        const hour = new Date(time).getUTCHours();
        if (hour >= 0 && hour < HOURS_IN_DAY) {
          historyHourly[hour]++;
          if (time >= dayStartMs) todayHourly[hour]++;
        }
        if (time >= dayStartMs) dayActions.push(action);
        if (oldestActionMs === null || time < oldestActionMs) oldestActionMs = time;
      }
    }

    switch (operation.op.type) {
      case VOTE_OPERATION_NAME:
        if (value.voter === username) {
          actedInWindow = inWindow;
          if (actedInWindow) votesCast++;
          castVotes.push({
            author: typeof value.author === 'string' ? value.author : '',
            weight: Number(value.weight)
          });
          // A downvote is not "your first upvote".
          if (Number(value.weight) > 0) facts.gaveUpvote = true;
        }
        break;
      case COMMENT_OPERATION_NAME: {
        const parentAuthor = typeof value.parent_author === 'string' ? value.parent_author : '';
        if (value.author === username) {
          actedInWindow = inWindow;
          if (actedInWindow) commentsWritten++;
          writtenComments.push({
            body: typeof value.body === 'string' ? value.body : '',
            timestampMs: time,
            parentAuthor
          });
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
    facts,
    patterns: summarizePatterns(writtenComments, castVotes, username, Date.now()),
    day: {
      known: true,
      dayStartMs,
      todayHourly,
      todayActiveHours: todayHourly.filter((count) => count > 0).length,
      historyHourly,
      historyActiveHours: historyHourly.filter((count) => count > 0).length,
      oldestMs: oldestActionMs,
      // Newest first. The pages arrive that way, but nothing in the endpoint's
      // contract promises it, and a day read out of order is worse than none.
      actions: dayActions.sort((a, b) => b.timestampMs - a.timestampMs),
      complete: dayComplete
    }
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
    // ONE retry, not none. This is the heaviest read on the card - a whole
    // account's history in one page - and public Hive nodes go slow under
    // load. Without a retry, a single timeout leaves that one card's HOURS,
    // REPLY MIX, week activity and reply targets blank until the feed is
    // reloaded, which reads as a broken card rather than a slow node. Bryan
    // hit exactly that on 2026-09-14: "the hours arent all showing".
    retry: 1
  });

  let status: HistoryStatus;
  if (isError) status = 'unavailable';
  else if (data) status = 'ready';
  else if (isEnabled) status = 'loading';
  else status = 'idle';

  return { ...(status === 'ready' && data ? data : EMPTY_HISTORY), status, isFetching };
};
