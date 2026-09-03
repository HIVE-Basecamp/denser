/**
 * The Basecamp checklist, split by how a task is known to be done.
 *
 * Two kinds, and the difference is the whole point:
 *
 *   - `derived` — the chain already proves it. The person followed someone, so
 *     a follow record exists; nothing needs storing, nothing can be faked, and
 *     it costs the account no resource credits to "tick". A curator reading the
 *     card can trust every derived item without qualification.
 *   - `declared` — nothing on chain could ever show it. Backing up your keys
 *     happens on a piece of paper. These stay self-ticked and are written as
 *     `task` records, and they are shown apart from the derived ones so that a
 *     claim is never mistaken for a fact.
 *
 * Pure, and import-free like protocol.ts and signals.ts, so it can be lifted
 * into a standalone package and unit tested without a chain or a browser.
 */

/** Facts about one account, gathered once and shared by every derived task. */
export interface ChecklistFacts {
  /** False when the lookup failed. Callers must not render a failure as "not done". */
  available: boolean;
  profileFilled: boolean;
  wroteIntroPost: boolean;
  followedSomeone: boolean;
  repliedToOthers: boolean;
  gaveUpvote: boolean;
  postedInCommunity: boolean;
  poweredUp: boolean;
  hadConversation: boolean;
}

export const EMPTY_CHECKLIST_FACTS: ChecklistFacts = {
  available: false,
  profileFilled: false,
  wroteIntroPost: false,
  followedSomeone: false,
  repliedToOthers: false,
  gaveUpvote: false,
  postedInCommunity: false,
  poweredUp: false,
  hadConversation: false
};

export type ChecklistItemKind = 'derived' | 'declared';

export interface ChecklistItem {
  id: string;
  kind: ChecklistItemKind;
  /** Resolved under basecamp.checklist.items.<id> by the rendering layer. */
  labelKey: string;
  /** Derived items only: reads the answer out of the gathered facts. */
  isDone?: (facts: ChecklistFacts) => boolean;
}

/** Done on Hive. Every one of these is visible on the chain. */
export const DERIVED_CHECKLIST_ITEMS: readonly ChecklistItem[] = [
  {
    id: 'profile_setup',
    kind: 'derived',
    labelKey: 'basecamp.checklist.items.profile_setup',
    isDone: (facts) => facts.profileFilled
  },
  {
    id: 'intro_post',
    kind: 'derived',
    labelKey: 'basecamp.checklist.items.intro_post',
    isDone: (facts) => facts.wroteIntroPost
  },
  {
    id: 'first_follow',
    kind: 'derived',
    labelKey: 'basecamp.checklist.items.first_follow',
    isDone: (facts) => facts.followedSomeone
  },
  {
    // Outward, on someone else's post — not a reply on their own thread.
    id: 'first_replies',
    kind: 'derived',
    labelKey: 'basecamp.checklist.items.first_replies',
    isDone: (facts) => facts.repliedToOthers
  },
  {
    // The moment they become a curator too, which is not an OG-only role.
    id: 'first_vote',
    kind: 'derived',
    labelKey: 'basecamp.checklist.items.first_vote',
    isDone: (facts) => facts.gaveUpvote
  },
  {
    id: 'community_post',
    kind: 'derived',
    labelKey: 'basecamp.checklist.items.community_post',
    isDone: (facts) => facts.postedInCommunity
  },
  {
    // Someone replied to them and they replied back: two-sided, and the
    // hardest item on this list to manufacture alone.
    id: 'conversation',
    kind: 'derived',
    labelKey: 'basecamp.checklist.items.conversation',
    isDone: (facts) => facts.hadConversation
  },
  {
    // Stake is where a Hive account's voice actually grows.
    id: 'power_up',
    kind: 'derived',
    labelKey: 'basecamp.checklist.items.power_up',
    isDone: (facts) => facts.poweredUp
  }
];

/**
 * Said so. Nothing on chain can show these, so they stay self-ticked and are
 * still written as `task` records. Their ids are `BasecampTaskId`s; the derived
 * ids above are deliberately not, because nothing writes them any more.
 */
export const DECLARED_CHECKLIST_ITEM_IDS = ['key_backup', 'wallet_tour'] as const;

export const DECLARED_CHECKLIST_ITEMS: readonly ChecklistItem[] = DECLARED_CHECKLIST_ITEM_IDS.map((id) => ({
  id,
  kind: 'declared' as const,
  labelKey: `basecamp.checklist.items.${id}`
}));

export const CHECKLIST_TOTAL = DERIVED_CHECKLIST_ITEMS.length + DECLARED_CHECKLIST_ITEMS.length;

/**
 * How many items are done. An unavailable lookup contributes no derived
 * completions rather than counting them all as undone — the caller is expected
 * to say "not measured" instead of drawing a confident empty ring.
 */
export function countCompletedChecklistItems(
  facts: ChecklistFacts,
  declaredCompleted: readonly string[]
): number {
  const derived = facts.available
    ? DERIVED_CHECKLIST_ITEMS.filter((item) => item.isDone?.(facts)).length
    : 0;
  const declared = DECLARED_CHECKLIST_ITEMS.filter((item) => declaredCompleted.includes(item.id)).length;
  return derived + declared;
}
