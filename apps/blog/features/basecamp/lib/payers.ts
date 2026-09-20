/**
 * Who is putting money into this account, and how much.
 *
 * Pure: no network, no React, no user-facing English. It takes incoming money
 * events and folds them into one row per payer.
 *
 * Money reaches a Hive account four ways from outside it, and they are not the
 * same thing, so they are never added up behind the reader's back:
 *
 *   - HIVE sent, and HBD sent. Straight transfers. Given away.
 *   - HIVE powered up into the account by somebody else. Also given away, but
 *     it lands as stake rather than as spendable money.
 *   - VESTS delegated. A LOAN. The delegator still owns it and can take it
 *     back the same day, and a delegation operation sets the whole delegation
 *     to a new figure rather than adding to it — so delegations are never
 *     summed. The newest record per delegator is what stands, and a record of
 *     zero is that delegator taking it all back.
 *
 * Nothing here decides anything. One account behind all of another account's
 * money is a shape a reader may find interesting; it is also what a parent
 * funding a child, a project paying a contributor and a community onboarding a
 * new member each look like from here. The table states who, how much and how
 * often, and stops there (ETHOS.md: visual indicators, not conclusions).
 */

import { RECORDS_PER_ACCOUNT, type TransferRecord } from './transfers';

/** One piece of money arriving from somebody else. */
export interface PaymentEvent {
  payer: string;
  /**
   * `hive` and `hbd` are transfers, `powerUp` is HIVE turned into this
   * account's stake, `delegation` is VESTS lent — an absolute figure, not an
   * amount handed over.
   */
  kind: 'hive' | 'hbd' | 'powerUp' | 'delegation';
  /** In the asset's own unit: HIVE, HBD or VESTS, already scaled. */
  amount: number;
  timestampMs: number;
  /** What was written on a transfer. Empty for the kinds that carry none. */
  memo?: string;
}

export interface PayerTally {
  payer: string;
  /** How many records this payer appears in, delegation changes included. */
  payments: number;
  /**
   * How many separate transfers made up `hive` and `hbd`. One payment of 289
   * and ninety-seven payments of three are the same total and not the same
   * thing, so the count is kept beside the sum.
   */
  transfers: number;
  /** How many separate power-ups made up `poweredUp`. */
  powerUps: number;
  hive: number;
  hbd: number;
  /** HIVE this payer powered up into the account. */
  poweredUp: number;
  /** What they have lent, in VESTS: their newest delegation figure, never a sum. */
  delegatedVests: number;
  /** When that newest delegation record was written, so an older one cannot replace it. */
  delegatedAtMs: number;
  /** The newest record of any kind from this payer. */
  lastMs: number;
  /** The newest straight transfers from this payer, in full, so the trail can be opened. */
  records: TransferRecord[];
}

export interface PayerTallySheet {
  byPayer: Map<string, PayerTally>;
  /** How many records have been folded in. */
  counted: number;
}

export function createPayerSheet(): PayerTallySheet {
  return { byPayer: new Map(), counted: 0 };
}

function blankTally(payer: string): PayerTally {
  return {
    payer,
    payments: 0,
    transfers: 0,
    powerUps: 0,
    hive: 0,
    hbd: 0,
    poweredUp: 0,
    delegatedVests: 0,
    delegatedAtMs: Number.NEGATIVE_INFINITY,
    lastMs: Number.NEGATIVE_INFINITY,
    records: []
  };
}

/** Adds a page of payments to a sheet, in place, and forgets them. */
export function foldPayments(sheet: PayerTallySheet, events: PaymentEvent[]): PayerTallySheet {
  for (const event of events) {
    if (!event.payer || !Number.isFinite(event.amount)) continue;
    const tally = sheet.byPayer.get(event.payer) ?? blankTally(event.payer);
    sheet.byPayer.set(event.payer, tally);
    sheet.counted++;
    tally.payments++;
    if (Number.isFinite(event.timestampMs) && event.timestampMs > tally.lastMs) tally.lastMs = event.timestampMs;

    if (event.kind === 'delegation') {
      // Newest wins. The page arrives newest first, so the first delegation
      // record seen for a delegator is already the standing one; an older one
      // must not overwrite it.
      if (event.timestampMs > tally.delegatedAtMs) {
        tally.delegatedVests = event.amount;
        tally.delegatedAtMs = event.timestampMs;
      }
      continue;
    }
    if (event.kind === 'hive' || event.kind === 'hbd') {
      if (event.kind === 'hbd') tally.hbd += event.amount;
      else tally.hive += event.amount;
      tally.transfers++;
      if (tally.records.length < RECORDS_PER_ACCOUNT) {
        tally.records.push({
          kind: event.kind,
          amount: event.amount,
          timestampMs: event.timestampMs,
          memo: event.memo ?? ''
        });
      }
    } else {
      tally.poweredUp += event.amount;
      tally.powerUps++;
    }
  }
  return sheet;
}

/** The two chain-wide rates needed to put every kind of money in one unit. */
export interface MoneyRates {
  /** HBD per HIVE, from the median price feed. */
  hbdPerHive: number | null;
  /** HP per VEST — and HP is denominated in HIVE. */
  hivePerVest: number | null;
}

/**
 * Everything one payer has put behind this account, expressed in HIVE, or null
 * when a rate needed to say it is missing.
 *
 * The loan is counted alongside the gifts, on purpose: the question the panel
 * is asked is which account is standing behind this one, and stake lent is
 * standing behind it every bit as much as HIVE sent. The row shows the two
 * apart, so a reader who wants to weigh them differently can.
 */
export function payerWorthInHive(tally: PayerTally, rates: MoneyRates): number | null {
  const { hbdPerHive, hivePerVest } = rates;
  if (tally.hbd > 0 && (hbdPerHive === null || hbdPerHive <= 0)) return null;
  if (tally.delegatedVests > 0 && hivePerVest === null) return null;
  const fromHbd = tally.hbd > 0 && hbdPerHive ? tally.hbd / hbdPerHive : 0;
  const fromDelegation = tally.delegatedVests > 0 && hivePerVest ? tally.delegatedVests * hivePerVest : 0;
  const worth = tally.hive + tally.poweredUp + fromHbd + fromDelegation;
  return Number.isFinite(worth) ? worth : null;
}

export interface PayerRow extends PayerTally {
  /** What they have put in, in HIVE, or null while a rate is still unknown. */
  worth: number | null;
  /** Their share of everything the account has been given, 0-1, or null with `worth`. */
  share: number | null;
}

export interface PayersReading {
  /** False until a read has finished. Never to be shown as a zero. */
  known: boolean;
  rows: PayerRow[];
  /** How many incoming records were read. */
  counted: number;
  /** Everything put in, in HIVE, or null while a rate is still unknown. */
  totalWorth: number | null;
  /**
   * True when the read hit the endpoint's ceiling, so what came back is the
   * newest slice of a longer history rather than the whole of it.
   */
  capped: boolean;
}

export const EMPTY_PAYERS: PayersReading = {
  known: false,
  rows: [],
  counted: 0,
  totalWorth: null,
  capped: false
};

/** How many payers the panel ranks. The same ten the voters panel shows. */
export const TOP_PAYERS_COUNT = 10;

/**
 * The payers, biggest first.
 *
 * Ranked on what they put in once both rates are known. Until then there is no
 * honest common unit — HIVE and HBD are different money and VESTS are neither
 * — so the fallback is how often each payer turns up, which is a fact of the
 * records themselves and needs no rate. The fallback orders the list; it is
 * never printed as a size.
 */
export function summarizePayers(sheet: PayerTallySheet, rates: MoneyRates, capped: boolean): PayersReading {
  const rows: PayerRow[] = Array.from(sheet.byPayer.values()).map((tally) => ({
    ...tally,
    worth: payerWorthInHive(tally, rates),
    share: null
  }));

  let totalWorth: number | null = 0;
  for (const row of rows) {
    if (row.worth === null) {
      totalWorth = null;
      break;
    }
    totalWorth += row.worth;
  }

  if (totalWorth !== null && totalWorth > 0) {
    for (const row of rows) {
      row.share = row.worth === null ? null : Math.min(Math.max(row.worth / totalWorth, 0), 1);
    }
  }

  // Newest first within a row, as on the outgoing side: a trail read out of
  // order is worse than no trail.
  for (const row of rows) row.records.sort((a, b) => b.timestampMs - a.timestampMs);

  rows.sort((a, b) => {
    if (a.worth !== null && b.worth !== null && a.worth !== b.worth) return b.worth - a.worth;
    if (a.payments !== b.payments) return b.payments - a.payments;
    return b.lastMs - a.lastMs;
  });

  return { known: true, rows, counted: sheet.counted, totalWorth, capped };
}
