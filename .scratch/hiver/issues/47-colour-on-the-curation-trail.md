# Colour on the curation trail

Type: task
Status: resolved
Blocked by: none

## Question

Bryan, 2026-09-14, answering ticket 16 on what curation mode should hold:

"It's fine if it's not doing too terribly much. People choose to just kind of
go... maybe it could have more visual cues. Let's say a trail — the trail is
there, and maybe some on the trail have got no votes yet. Maybe they have a
colour associated with that. And if they've had no comments, maybe they have a
colour associated with that. And, obviously, we want to have the kind of posts
that are from new users, like Basecamp under three sixty five days, and that
trail has its own colour. And if, say, there was a first post there, then
let's put some confetti popping around the post on the map, similar to the way
we do in the feed... Doing a few of those little highlight things that gives
more of a feeling to the curation trail. That's enough for now."

## To build

In curation mode only:

1. A live post with no votes yet reads as its own colour.
2. A live post with no replies yet reads as its own colour.
3. Posts by accounts under 365 days old are their own coloured trail.
4. A first ever post pops confetti around it on the map, like the neon ring
   does in the feed (`features/basecamp/postcard/first-post-confetti.tsx` is
   the feed's version; the map draws on canvas, so the effect is rewritten,
   not shared).

Today curation mode does one thing: every live post that is not a newcomer
breathes a faint blue ring (`engine/render/layer-nodes.ts`). That ring is the
thing to replace or build on.

Ticket 16 also settled how a mode should feel: it lifts its own things by
letting everything else go "slightly more dim if not the focus of the mode",
rather than by adding more glow. Worth applying here.

## Later, not now

Trails for posts by people holding a certain badge, once badges exist. Rewards
or reasons to choose the curation trail at all.

## Answer

Built 2026-09-14. Not committed.

**What a post is missing, not what it has.** In curation mode a live post with
no votes yet wears an orange ring, and one with no replies yet wears a cyan
ring, both breathing out of step so a post missing both reads as two rings
rather than one thick one. Orange and cyan are not new colours: they are the
two the feed already puts on those exact counts under a post card, so the map
and the postcard say the same thing in the same colour. A post that has both a
vote and a reply is left plain — it has had its welcome, and leaving it quiet
is the mode letting what is not its point fall back (ticket 16, question 4).

This replaces what curation mode used to do, which was give every post that
was not a newcomer the same faint blue ring — a mark that told you nothing.

**The newcomer trail already had its own colour** and keeps it: posts by
accounts under a year old burn in the trail's pink, loud while unvisited, one
steady ring once visited. Nothing needed building for that part.

**A first ever post pops confetti on the map**, the way it does in the feed.
The map draws on canvas, so the effect is its own function
(`engine/render/decor.ts`, `drawConfettiPop`) rather than the feed's DOM
version. A volley is worked out from the clock instead of remembered: which
volley we are in is the time divided by the cycle, and every piece's angle,
reach and colour falls out of that number. Nothing is stored, nothing
accumulates over a long round, and the same post pops the same way on two
machines at the same moment.

**Knowing a first post, cheaply.** The board already fetches each author's
account, and the chain's own count of everything they have published is on it.
A count of one means the post standing here is that one. That is the cheap
half of the feed's rule (`features/basecamp/lib/first-post.ts`); the other
half needs a history read per author, which the map cannot afford. So the map
misses some first posts and can never call one falsely.

## Files

- `lib/board.ts` — `BoardHouse.firstPost`.
- `engine/render/types.ts`, `engine/canvas-map.tsx` — the three facts a house
  now carries to the renderer: votes, replies, firstPost.
- `engine/render/layer-nodes.ts` — the curation marks and the confetti call.
- `engine/render/decor.ts` — `drawConfettiPop`.
- `checks/board.ts` (new), `checks/run.ts` — three headless checks.

## Checked

Types clean. 37 headless checks pass, three of them new: a post carries its own
vote and reply counts, a first ever post is known from the chain's own count,
and an unknown post count never calls a post the first.

**Not confirmed on screen.** The drawing itself was never seen: the browser
pane would not hold still long enough to pull the map out in curation mode,
and reading the canvas back pixel by pixel gave answers that did not change
between modes, so they proved nothing. The facts reaching the renderer are
checked; the rings and the confetti are twenty-five lines of drawing that have
not been looked at. Bryan to look, or a later pass to confirm.
