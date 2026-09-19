/**
 * Newbie or Not to Be — the things you might say to somebody who just arrived.
 *
 * A first post usually gets nothing. Writing a reply from cold is the part
 * people put off, so the game offers three ready-made ones and a way to keep
 * your own. Nothing is ever sent from here: a template only fills the reply
 * box in, and the player reads it, changes it and presses Publish themselves.
 * That is the point — a welcome nobody read before it went out is not a
 * welcome, and a hundred identical replies are spam whoever sent them.
 *
 * `{{name}}` is the only thing that gets filled in, because it is the only
 * thing we can be sure of. A template that guessed at what the post was about
 * would be wrong often enough to be worse than nothing.
 *
 * Pure. The three built-in texts are translated (the game passes them in);
 * personalised ones are the player's own words and are stored as typed.
 */

import { getStorageItem, removeStorageItem, setStorageItem, StorageTTL } from '@ui/lib/storage-with-ttl';

/** The three that ship with the game. Their words live in the locale files. */
export type BuiltInTemplateId = 'welcome' | 'tips' | 'question';

export const BUILT_IN_TEMPLATES: readonly BuiltInTemplateId[] = ['welcome', 'tips', 'question'];

export interface PersonalTemplate {
  id: string;
  /** What the player calls it, so a button can be labelled. */
  name: string;
  body: string;
  savedIso: string;
}

/**
 * WHOSE TEMPLATES THESE ARE.
 *
 * One bag per signed-in account, not one per browser. Two people sharing a
 * laptop must not find each other's words in their reply box, and signing out
 * and back in as somebody else must not hand over what the last person wrote.
 * The account name is part of the key, so the separation is structural rather
 * than something the screen has to remember to do.
 */
function key(owner: string): string {
  return `basecamp.welcomeTemplates.${owner}`;
}

/**
 * PERMANENT, and it matters here more than almost anywhere else in Basecamp.
 * Bryan, 2026-09-19: "they make a template or multiple templates, then they
 * come back in a year. the templates they created should still be there."
 * Every other kind of stored thing in this app may expire; a person's own
 * writing may not.
 *
 * THE HONEST LIMIT: this is browser storage. It survives a year, a reload and
 * a sign-out, and it does NOT follow the account to another computer or
 * another browser. Making it follow the account means putting it on the
 * chain, which is a different job and not this one.
 */
const TTL = StorageTTL.PERMANENT;

/** Fills a template in. `{{name}}` becomes the account, with no leading @. */
export function fillTemplate(body: string, account: string): string {
  return body.split('{{name}}').join(account);
}

function isTemplate(value: unknown): value is PersonalTemplate {
  if (typeof value !== 'object' || value === null) return false;
  const row: Partial<PersonalTemplate> = value;
  return typeof row.id === 'string' && typeof row.name === 'string' && typeof row.body === 'string';
}

/**
 * WHERE TEMPLATES USED TO LIVE, before there was an account on the key.
 *
 * The first build of this put everybody's templates in one unscoped bag. The
 * key changed the same week, and that change quietly hid what Bryan had
 * already written: the words were never deleted, they were simply no longer
 * being looked for. Nothing that a person wrote may be lost because a key was
 * renamed, so the old bag is read once and carried across.
 */
const OLD_KEY = 'basecamp.welcomeTemplates';

function readBag(storageKey: string): PersonalTemplate[] {
  const raw = getStorageItem<unknown>(storageKey);
  if (!Array.isArray(raw)) return [];
  return raw.filter(isTemplate);
}

/**
 * Everything `owner` has written and kept, newest first.
 *
 * Anything found in the old unscoped bag is adopted into theirs the first
 * time they look, and the old bag is then cleared so it can never be adopted
 * twice or by two different people.
 */
export function readTemplates(owner: string): PersonalTemplate[] {
  if (!owner) return [];
  const mine = readBag(key(owner));
  const orphaned = readBag(OLD_KEY);
  if (orphaned.length === 0) return mine;
  const have = new Set(mine.map((row) => row.id));
  const adopted = [...mine, ...orphaned.filter((row) => !have.has(row.id))];
  setStorageItem(key(owner), adopted, TTL);
  removeStorageItem(OLD_KEY);
  return adopted;
}

/** Saves one, replacing any earlier one with the same id. Newest first. */
export function saveTemplate(owner: string, template: PersonalTemplate): void {
  if (!owner) throw new Error('No signed-in account to save a template for.');
  const rest = readTemplates(owner).filter((row) => row.id !== template.id);
  setStorageItem(key(owner), [template, ...rest], TTL);
  // Read it straight back. A write that silently did nothing - storage full,
  // storage refused, a key that never landed - must not look like a save.
  if (!readBag(key(owner)).some((row) => row.id === template.id)) {
    throw new Error('The template could not be saved to this browser.');
  }
}

export function removeTemplate(owner: string, id: string): void {
  if (!owner) return;
  setStorageItem(
    key(owner),
    readTemplates(owner).filter((row) => row.id !== id),
    TTL
  );
}

/** A new id. The clock plus a little noise: these never leave this browser. */
export function newTemplateId(): string {
  return `t${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}
