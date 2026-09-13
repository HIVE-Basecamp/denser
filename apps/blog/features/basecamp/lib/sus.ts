/**
 * SUS — what a reader says is off about a post or the account behind it.
 *
 * This is patrol (CONTEXT.md) in its smallest possible form: the reader is
 * the one forming the judgement, not the card. Nothing here reads the chain
 * and nothing here writes to it — a report is one person's opinion, kept on
 * that person's own machine.
 *
 * WHERE IT GOES, HONESTLY: nowhere yet. There is no service to send these to,
 * so they are stored in this browser and nothing leaves it. The shape below
 * is the thing that would be sent later — to the Puppet Patrol games, or to a
 * group that protects Hive — so whatever gets built next has a record to read
 * rather than a blank start.
 */

import { getStorageItem, setStorageItem, StorageTTL } from '@ui/lib/storage-with-ttl';

/** Bryan's list, in his order. `other` is the one that needs its own words. */
export type SusReasonId = 'bot' | 'sock' | 'extractor' | 'scammer' | 'spammer' | 'other';

export const SUS_REASONS: readonly SusReasonId[] = ['bot', 'sock', 'extractor', 'scammer', 'spammer', 'other'];

export interface SusReport {
  /** The account the post belongs to. */
  account: string;
  /** The post itself — a report is always about one post, not a whole account. */
  permlink: string;
  /** Every box ticked. A sock can also be a spammer; the reader picks all that fit. */
  reasons: SusReasonId[];
  /** What "other" is, when `other` is among the reasons. */
  otherWords: string;
  /** The optional answer to "what seemed off about this post/account?". */
  note: string;
  /** When it was reported, so a later send knows how old the opinion is. */
  reportedIso: string;
}

/** One bag of reports for the whole browser, keyed by post. */
const KEY = 'basecamp.sus.reports';

/** A report is the reader's own record; it must not quietly expire. */
const TTL = StorageTTL.PERMANENT;

export function reportKey(account: string, permlink: string): string {
  return `${account}/${permlink}`;
}

function isReport(value: unknown): value is SusReport {
  if (typeof value !== 'object' || value === null) return false;
  const r: Partial<SusReport> = value;
  return typeof r.account === 'string' && typeof r.permlink === 'string' && Array.isArray(r.reasons);
}

/** Every report this browser holds, newest first. */
export function readSusReports(): SusReport[] {
  const stored = getStorageItem<unknown>(KEY);
  if (!Array.isArray(stored)) return [];
  return stored.filter(isReport);
}

export function findSusReport(account: string, permlink: string): SusReport | null {
  const key = reportKey(account, permlink);
  return readSusReports().find((r) => reportKey(r.account, r.permlink) === key) ?? null;
}

/** Saves one report, replacing any earlier one for the same post. */
export function saveSusReport(report: SusReport): void {
  const key = reportKey(report.account, report.permlink);
  const rest = readSusReports().filter((r) => reportKey(r.account, r.permlink) !== key);
  setStorageItem(KEY, [report, ...rest], TTL);
}

/** Takes a report back. Changing your mind has to be as easy as reporting. */
export function removeSusReport(account: string, permlink: string): void {
  const key = reportKey(account, permlink);
  setStorageItem(
    KEY,
    readSusReports().filter((r) => reportKey(r.account, r.permlink) !== key),
    TTL
  );
}
