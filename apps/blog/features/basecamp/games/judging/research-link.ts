/**
 * Every way out of a judging game opens a new tab.
 *
 * The games are a research desk: you go and look at their blog, their posts,
 * their replies, whoever is paying them, and you come back and answer. Follow
 * one of those in the same tab and the game is gone — the tabs are closed, the
 * queue is back at the start, and every read the panel made is made again.
 * Bryan hit exactly that playing it: "I try to go back and I need to re-enter."
 *
 * So the rule is the whole desk, not one link: anything that leaves opens
 * beside the game instead of on top of it. `rel` goes with `target` always —
 * a page opened this way must not be handed a reference back to ours.
 */
export const RESEARCH_LINK = { target: '_blank', rel: 'noopener noreferrer' } as const;
