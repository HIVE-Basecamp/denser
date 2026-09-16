/**
 * Bot or Not — what a player decided about one account, after looking at it.
 *
 * The SUS button (lib/sus.ts) is a reader saying "something is off here" in
 * passing. This is the slower half: the account is pulled up on its own, with
 * the postcard and its comments underneath, and the player says bot or not
 * with the evidence in front of them. It is still one person's opinion, and
 * it is still the person forming it, not the card (ETHOS.md).
 *
 * WHERE IT GOES, HONESTLY: nowhere yet. Nothing here reads the chain and
 * nothing here writes to it — a verdict is stored in this browser and leaves
 * it never. The shape below is the thing that would be sent later, so
 * whatever gets built next has a record to read rather than a blank start.
 */

import { getStorageItem, setStorageItem, StorageTTL } from '@ui/lib/storage-with-ttl';

export interface BotOrNotVerdict {
  /** The account that was judged. One verdict per account, not per post. */
  account: string;
  /** The post that got labelled, so a verdict traces back to a SUS report. */
  permlink: string;
  verdict: 'bot' | 'not';
  /** May be empty — writing is optional, and most people will not write. */
  why: string;
  decidedIso: string;
}

/** One bag of verdicts for the whole browser, keyed by account. */
const KEY = 'basecamp.botOrNot.verdicts';

/** A verdict is the player's own record; it must not quietly expire. */
const TTL = StorageTTL.PERMANENT;

function isVerdict(value: unknown): value is BotOrNotVerdict {
  if (typeof value !== 'object' || value === null) return false;
  const v: Partial<BotOrNotVerdict> = value;
  return typeof v.account === 'string' && (v.verdict === 'bot' || v.verdict === 'not');
}

/** Every verdict this browser holds, newest first. */
export function readBotOrNotVerdicts(): BotOrNotVerdict[] {
  const stored = getStorageItem<unknown>(KEY);
  if (!Array.isArray(stored)) return [];
  return stored.filter(isVerdict);
}

export function findBotOrNotVerdict(account: string): BotOrNotVerdict | null {
  return readBotOrNotVerdicts().find((v) => v.account === account) ?? null;
}

/** Saves one verdict, replacing any earlier one for the same account. */
export function saveBotOrNotVerdict(verdict: BotOrNotVerdict): void {
  const rest = readBotOrNotVerdicts().filter((v) => v.account !== verdict.account);
  setStorageItem(KEY, [verdict, ...rest], TTL);
}

/** Takes a verdict back. Changing your mind has to be as easy as deciding. */
export function removeBotOrNotVerdict(account: string): void {
  setStorageItem(
    KEY,
    readBotOrNotVerdicts().filter((v) => v.account !== account),
    TTL
  );
}
