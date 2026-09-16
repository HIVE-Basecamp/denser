/**
 * What a player decided about one account, after looking at it properly.
 *
 * The SUS button (lib/sus.ts) is a reader saying "something is off here" in
 * passing. A verdict is the slower half: the account is pulled up on its own,
 * with everything the game can gather underneath, and the player says yes or
 * no with the evidence in front of them. It is still one person's opinion, and
 * it is still the person forming it, not the card (ETHOS.md).
 *
 * One store per game, because the games ask different questions and a player
 * may well answer them differently about the same account. The choice words
 * are each game's own — 'bot' or 'not', 'sock' or 'not' — so what was stored
 * can always be read back and understood without knowing which game wrote it.
 *
 * WHERE IT GOES, HONESTLY: nowhere yet. Nothing here reads the chain and
 * nothing here writes to it — a verdict is stored in this browser and leaves
 * it never. The shape below is the thing that would be sent later, so whatever
 * gets built next has a record to read rather than a blank start.
 */

import { getStorageItem, setStorageItem, StorageTTL } from '@ui/lib/storage-with-ttl';

export interface Verdict<TChoice extends string> {
  /** The account that was judged. One verdict per account, not per post. */
  account: string;
  /** The post that got labelled, so a verdict traces back to a SUS report. */
  permlink: string;
  verdict: TChoice;
  /** May be empty — writing is optional, and most people will not write. */
  why: string;
  decidedIso: string;
}

export interface VerdictStore<TChoice extends string> {
  /** Every verdict this browser holds, newest first. */
  read(): Verdict<TChoice>[];
  find(account: string): Verdict<TChoice> | null;
  /** Saves one verdict, replacing any earlier one for the same account. */
  save(verdict: Verdict<TChoice>): void;
  /** Takes a verdict back. Changing your mind has to be as easy as deciding. */
  remove(account: string): void;
}

/** A verdict is the player's own record; it must not quietly expire. */
const TTL = StorageTTL.PERMANENT;

/**
 * One bag of verdicts under one storage key, keyed by account.
 *
 * `choices` is the game's own pair of words, and doubles as the check that a
 * stored row belongs to this game: anything else in the bag is ignored rather
 * than handed back as a verdict this game could not understand.
 */
export function createVerdictStore<TChoice extends string>(
  key: string,
  choices: readonly TChoice[]
): VerdictStore<TChoice> {
  const isVerdict = (value: unknown): value is Verdict<TChoice> => {
    if (typeof value !== 'object' || value === null) return false;
    const row: Partial<Verdict<TChoice>> = value;
    if (typeof row.account !== 'string') return false;
    return choices.some((choice) => choice === row.verdict);
  };

  const read = (): Verdict<TChoice>[] => {
    const stored = getStorageItem<unknown>(key);
    if (!Array.isArray(stored)) return [];
    return stored.filter(isVerdict);
  };

  return {
    read,
    find: (account) => read().find((row) => row.account === account) ?? null,
    save: (verdict) => setStorageItem(key, [verdict, ...read().filter((r) => r.account !== verdict.account)], TTL),
    remove: (account) => setStorageItem(key, read().filter((row) => row.account !== account), TTL)
  };
}
