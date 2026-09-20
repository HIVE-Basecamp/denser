/**
 * Money this account has sent out, by whom it went to.
 *
 * Pure: no network, no React, no user-facing English. The mirror of
 * lib/payers.ts, which does the same for money coming in — kept apart from it
 * because a payer and a payee are different questions and adding them together
 * would answer neither.
 *
 * Only straight transfers. Powering somebody else up and delegating to them
 * are counted elsewhere, because they are not the same act: one is money given
 * away, one is money given away as stake, and one is a loan.
 *
 * Nothing here decides anything. An account sending everything it receives
 * straight back to one address is a shape a reader may find interesting; it is
 * also what paying a bill, funding a second account of your own and cashing
 * out through a service each look like (ETHOS.md).
 */

/** One transfer leaving the account. */
export interface TransferEvent {
  counterparty: string;
  kind: 'hive' | 'hbd';
  amount: number;
  timestampMs: number;
  /** What was written on it. Often the only thing that says what a payment was for. */
  memo: string;
}

/** One transfer, kept so a reader can open the row and see the trail itself. */
export interface TransferRecord {
  kind: 'hive' | 'hbd';
  amount: number;
  timestampMs: number;
  memo: string;
}

/**
 * How many individual transfers are kept per account.
 *
 * A sum is a starting point, not an answer: "4,000 HIVE to @theguruasia" reads
 * one way as a single payment and another as four hundred drips, and only the
 * dates say which. So the records are kept — but bounded, because a tally of
 * ten accounts must not become ten thousand rows in memory.
 */
export const RECORDS_PER_ACCOUNT = 100;

export interface TransferTally {
  account: string;
  hive: number;
  hbd: number;
  /** How many separate transfers made up those sums. */
  transfers: number;
  /** The newest of them. */
  lastMs: number;
  /** The newest RECORDS_PER_ACCOUNT of them, in full. */
  records: TransferRecord[];
}

export interface TransferSheet {
  byAccount: Map<string, TransferTally>;
  counted: number;
}

export function createTransferSheet(): TransferSheet {
  return { byAccount: new Map(), counted: 0 };
}

/** Adds a page of transfers to a sheet, in place, and forgets them. */
export function foldTransfers(sheet: TransferSheet, events: TransferEvent[]): TransferSheet {
  for (const event of events) {
    if (!event.counterparty || !Number.isFinite(event.amount)) continue;
    const tally = sheet.byAccount.get(event.counterparty) ?? {
      account: event.counterparty,
      hive: 0,
      hbd: 0,
      transfers: 0,
      lastMs: Number.NEGATIVE_INFINITY,
      records: []
    };
    sheet.byAccount.set(event.counterparty, tally);
    sheet.counted++;
    tally.transfers++;
    if (tally.records.length < RECORDS_PER_ACCOUNT) {
      tally.records.push({
        kind: event.kind,
        amount: event.amount,
        timestampMs: event.timestampMs,
        memo: event.memo
      });
    }
    if (event.kind === 'hbd') tally.hbd += event.amount;
    else tally.hive += event.amount;
    if (Number.isFinite(event.timestampMs) && event.timestampMs > tally.lastMs) tally.lastMs = event.timestampMs;
  }
  return sheet;
}

export interface TransfersReading {
  /** False until a read has finished. Never to be shown as a zero. */
  known: boolean;
  rows: TransferTally[];
  counted: number;
  /** True when the read hit its ceiling, so the oldest records are missing. */
  capped: boolean;
}

export const EMPTY_TRANSFERS: TransfersReading = { known: false, rows: [], counted: 0, capped: false };

/** How many recipients the panel lists. The same ten the other lists show. */
export const TOP_TRANSFERS_COUNT = 10;

/**
 * The recipients, biggest first.
 *
 * HIVE and HBD are different money and the panel never adds them together, so
 * the ranking is on HIVE first and HBD only where two rows tie on it. A reader
 * comparing the two has both figures on the row.
 */
export function summarizeTransfers(sheet: TransferSheet, capped: boolean): TransfersReading {
  const rows = Array.from(sheet.byAccount.values()).sort(
    (a, b) => b.hive - a.hive || b.hbd - a.hbd || b.transfers - a.transfers
  );
  // Newest first within a row: the pages arrive that way, but nothing in the
  // endpoint's contract promises it, and a trail read out of order is worse
  // than no trail.
  for (const row of rows) row.records.sort((a, b) => b.timestampMs - a.timestampMs);
  return { known: true, rows, counted: sheet.counted, capped };
}
