/**
 * Whether the post on a card is the first thing its account has ever
 * published. Pure, like the rest of lib/.
 *
 * Two ways to know, both exact and neither a guess:
 * - the chain's own count of everything the account has published is one, so
 *   the post on the card is that one. Known before any history read lands.
 * - the history read covered the account's whole life (it examined at least
 *   as many writings as the chain counts) and found exactly one post of their
 *   own among the replies.
 *
 * A history page that was cut short is never trusted here, because an older
 * post could sit past the cut. Unknown is false: a card is never told it is
 * looking at a first post on a hunch.
 */

import type { CommentPatterns } from './patterns';

export function isFirstEverPost(accountPostCount: number | null, patterns: CommentPatterns | null): boolean {
  if (accountPostCount === 1) return true;
  if (!patterns || !patterns.known || accountPostCount === null) return false;
  return patterns.rootPostCount === 1 && patterns.writtenCount >= accountPostCount;
}
