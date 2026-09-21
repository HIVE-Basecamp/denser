'use client';

import { useQuery } from '@tanstack/react-query';
import { getChain } from '@transaction/lib/chain';
import { getAccounts } from '@transaction/lib/hive-api';
import { StaleTime } from '@/blog/lib/react-query';
import { operationTypeIdsOf } from './operation-types';
import { EMPTY_CHECKLIST_FACTS, type ChecklistFacts } from '../lib/checklist';
import { EMPTY_COMMENT_PATTERNS, summarizePatterns, type CommentPatterns } from '../lib/patterns';
import { HOURS_IN_DAY, utcDayStart, type ActionRecord } from '../lib/hourly-actions';
import {
  BEGINNING_OPERATION_NAMES,
  HISTORY_OPERATION_NAMES,
  createOperationTally,
  foldOperations,
  hasProfile,
  historyTimeParam,
  parseHiveTimestamp,
  tallyFacts,
  type HistoryOperation
} from '../lib/account-operations';

/** The node refuses anything larger. */
const HISTORY_PAGE_SIZE = 1000;

/**
 * How many of an account's oldest records the checklist asks for.
 *
 * Small on purpose. With votes left out of that read (see
 * BEGINNING_OPERATION_NAMES) a couple of hundred records reach back years, and
 * measured across the live feed on 2026-09-21 two hundred found every tick a
 * full thousand found — 71KB instead of 378KB on the card that gained the
 * most. Deeper costs multiples for, at best, one more tick.
 */
const BEGINNING_PAGE_SIZE = 250;

/**
 * How far back "now" reaches.
 *
 * The card asks three questions about the present — what happened today, which
 * hours this account is usually awake in, and how much they have written this
 * week — and one week answers all three. It is long enough to show a routine
 * and short enough that most accounts fit inside it whole.
 *
 * It is a span, not a record count, on purpose. A thousand records is months
 * for one account and half a day for another, and only the second would draw
 * today twice and call one of them a habit.
 */
const HISTORY_WINDOW_DAYS = 7;

/**
 * Pages of the window a very busy account is allowed before the read stops.
 *
 * Three thousand operations is roughly two days for the heaviest accounts on
 * Hive, so today always arrives whole and only the spokes behind it are
 * shortened. `day.complete` says when that has happened rather than letting a
 * cut-off day pass for a whole one.
 */
const MAX_WINDOW_PAGES = 3;

const MS_PER_DAY = 1000 * 60 * 60 * 24;
/** Floor on the measured span, so a busy account's few-hour sample can't inflate rates. */
const MIN_OBSERVED_DAYS = 1;

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
 * account is usually awake in — every record of the window laid over one face,
 * so a person who posts at 03:00 every night lights that hour every night. The
 * short marks inside them are today alone.
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
  /** One count per hour across the window — a week of days, laid over one face. */
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
  /** How many records every reading on the card was taken from. */
  recordsRead: number;
}

const EMPTY_ACTIVITY: AccountActivity = { votesPerDay: 0, commentsPerDay: 0, observedDays: 0 };
const EMPTY_HISTORY: AccountHistory = {
  activity: EMPTY_ACTIVITY,
  facts: EMPTY_CHECKLIST_FACTS,
  patterns: EMPTY_COMMENT_PATTERNS,
  day: EMPTY_DAY,
  recordsRead: 0
};

interface HistoryOperationTypeIds {
  /** Everything the clock and the patterns count. */
  window: string;
  /** The three the checklist can learn anything from. */
  beginning: string;
}

async function historyOperationTypeIds(): Promise<HistoryOperationTypeIds> {
  const ids = await operationTypeIdsOf(HISTORY_OPERATION_NAMES);
  if (ids.some((id) => id === undefined)) throw new Error('Missing Hive operation type ids');
  return {
    window: ids.join(','),
    beginning: (await operationTypeIdsOf(BEGINNING_OPERATION_NAMES)).join(',')
  };
}

export function accountHistoryQueryKey(username: string) {
  return ['basecampAccountHistory', username] as const;
}

/**
 * One history read per account, serving both the activity rings and every
 * readout on the postcard. They were three separate reads of the same person's
 * history; a feed of twenty cards was asking sixty questions where twenty do.
 *
 * Two questions are asked of the chain, and they are bounded differently
 * because they are different questions.
 *
 * **The window** — the last seven days, named by date rather than by page.
 * This is the fix for a real and measured fault: the endpoint numbers its
 * pages from the *oldest* record, so asking without a page number returns the
 * last page, and the last page holds the remainder. On 2026-09-21 that was 28
 * records out of 6,028 for one account and 853 out of 46,853 for another —
 * the clock was drawing four hours of a day and calling it the day. Naming the
 * dates instead makes `total_pages` the pages *of the window*, so the read
 * knows exactly how many there are, takes them newest first, and stops. For
 * six of eight accounts measured on the live feed that is one request, and the
 * one request is the whole week.
 *
 * **The beginning** — their oldest records, and only when they were here
 * before the window opened. Every item on the checklist is a "have they ever",
 * and an ever is answered at the start of a history. Measured on the same
 * accounts it was worth one to three ticks on five of seven: without it the
 * ring under-reports people who did the thing once, early, and moved on. New
 * accounts never pay for it, because for them the window already reaches back
 * to the day they arrived.
 *
 * Together, across seven cards: twenty requests and 3.25MB became sixteen
 * requests and 2.42MB, and the checklist went from sixteen ticks to twenty-six.
 */
export async function fetchAccountHistory(username: string): Promise<AccountHistory> {
  const [chain, operationTypes] = await Promise.all([getChain(), historyOperationTypeIds()]);

  const read = (params: Record<string, number | string>) =>
    chain.restApi['hivemind-api'].accountsOperations({
      'account-name': username,
      'operation-types': operationTypes.window,
      'page-size': HISTORY_PAGE_SIZE,
      ...params
    });

  const nowMs = Date.now();
  const dayStartMs = utcDayStart(nowMs);
  const windowStartMs = nowMs - HISTORY_WINDOW_DAYS * MS_PER_DAY;
  const fromWindowStart = { 'from-block': historyTimeParam(windowStartMs) };

  const [newest, accounts] = await Promise.all([read(fromWindowStart), getAccounts([username])]);

  const windowOperations: HistoryOperation[] = [...(newest.operations_result ?? [])];
  const windowPages = Number.isFinite(newest.total_pages) ? newest.total_pages : 1;
  let page = windowPages - 1;
  let pagesRead = 1;
  while (page >= 1 && pagesRead < MAX_WINDOW_PAGES) {
    // Best effort, on purpose, and sequential rather than parallel. These
    // pages deepen the spokes; the newest page already holds today. A public
    // node that drops one of them should cost the card some history, not the
    // whole card — measured on 2026-09-21, one dropped page was leaving an
    // account reading "not measured yet" when everything the clock needed had
    // already arrived.
    try {
      const older = await read({ ...fromWindowStart, page });
      windowOperations.push(...(older.operations_result ?? []));
    } catch {
      break;
    }
    page--;
    pagesRead++;
  }
  /** True when every page the window had was read, so nothing of it is missing. */
  const windowWhole = page < 1;

  const account = accounts?.[0];
  const createdMs = parseHiveTimestamp(account?.created as string | undefined);

  const tally = createOperationTally(username, dayStartMs);
  foldOperations(tally, windowOperations, true);

  // Their oldest records, and only where there is history the window cannot
  // see. `to-block` keeps the two batches from overlapping, so nothing is
  // counted twice, and page 1 is the oldest end of what is left.
  if (Number.isFinite(createdMs) && createdMs < windowStartMs) {
    try {
      const beginning = await chain.restApi['hivemind-api'].accountsOperations({
        'account-name': username,
        'operation-types': operationTypes.beginning,
        'page-size': BEGINNING_PAGE_SIZE,
        'to-block': historyTimeParam(windowStartMs),
        page: 1
      });
      foldOperations(tally, beginning.operations_result ?? [], false);
    } catch {
      // Same bargain as the extra window pages: a dropped beginning costs the
      // checklist some ticks, never the card.
    }
  }

  const facts = tallyFacts(
    tally,
    hasProfile(account?.posting_json_metadata) || hasProfile(account?.json_metadata)
  );

  // Rates come from the window alone. A rate is a question about now, and the
  // beginning batch is by construction not now — folding it in would divide
  // this week's votes by the months since the account opened.
  const windowSpanDays = Number.isFinite(tally.oldestWindowMs)
    ? (nowMs - tally.oldestWindowMs) / MS_PER_DAY
    : HISTORY_WINDOW_DAYS;
  const observedDays = Math.min(Math.max(windowSpanDays, MIN_OBSERVED_DAYS), HISTORY_WINDOW_DAYS);

  return {
    activity: {
      votesPerDay: tally.windowVotes / observedDays,
      commentsPerDay: tally.windowComments / observedDays,
      observedDays
    },
    facts,
    patterns: summarizePatterns(tally.writtenComments, tally.castVotes, username, nowMs),
    day: {
      known: true,
      dayStartMs,
      todayHourly: tally.todayHourly,
      todayActiveHours: tally.todayHourly.filter((count) => count > 0).length,
      historyHourly: tally.historyHourly,
      historyActiveHours: tally.historyHourly.filter((count) => count > 0).length,
      oldestMs: tally.oldestWindowActionMs,
      // Newest first. The pages arrive that way, but nothing in the endpoint's
      // contract promises it, and a day read out of order is worse than none.
      actions: tally.dayActions.sort((a, b) => b.timestampMs - a.timestampMs),
      // The window starts a week before midnight, so reading it whole reaches
      // today's first hour. Only a capped read can fall short of it.
      complete: windowWhole || tally.oldestWindowMs <= dayStartMs
    },
    recordsRead: tally.recordsRead
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
