# First-post ring: rainbow letters and confetti

Type: task
Status: resolved
Blocked by: none

## Question

Bryan, 2026-09-12: "BASECAMP FIRST-POST RING. The ring is good but every
letter is the same colour. Make each new post's letters a different colour,
like a rainbow. And every so often, random order and timing, a new post
should explode into confetti, at different spots around the post, so there
is basically always at least one new post exploding."

## Answer

Built 2026-09-12. Not committed.

- Rainbow letters: each word running around one ring now sweeps through the
  colour wheel instead of the old single pink (`first-post-ring.tsx`). The
  words already had their own position number for the wiggle animation, so
  the same number now also picks each word's hue — one full lap of the long
  sides is one full rainbow. Each ring (each first-ever post) also starts its
  rainbow at its own point on the wheel, worked out from React's own id for
  that card, so two first-post cards on screen at once don't show the same
  colours in the same places. The pink neon border and corner dots are left
  as they were — only the marquee letters go rainbow.
- Confetti: every so often, one first-post ring on screen bursts into a
  shower of small coloured chips from a random point around its border, then
  fades. Which ring bursts, and when, is picked by one shared scheduler
  (`postcard/first-post-confetti.tsx`) so the whole feed shares one rotation
  instead of every card timing itself — that is what makes it "random order":
  with more than one first-post card up, it is not always the same one going
  off, and it is not all of them at once. Timing is tuned so a new burst
  always starts before the last one has fully faded, which is what guarantees
  something is always exploding somewhere, even on a slow day with only one
  first post showing.
- Reduced motion: if the visitor has asked their system for less motion, the
  words fall back to the plain pink and confetti never fires at all — checked
  in two places, both the CSS and the confetti scheduler itself, so it can't
  half-apply.
- No `Math.random()` runs during the first draw of the page. Confetti only
  starts after the card has already appeared on screen (from a timer, not
  from the initial render), so the page the server sends and the page the
  browser first shows are always identical.

Checked: `npx tsc --noEmit -p apps/blog/tsconfig.json` (clean, no errors) and
`npx eslint` on both files touched (clean, no errors). Did not start the app
or open a browser, per instructions for this piece of work.

Judgement calls for Bryan:
- "each new post's letters a different colour" could mean each post is one
  solid colour, different from its neighbours, or the letters within one post
  cycling through the rainbow. Went with the second — the ring's letters
  already move individually, so a colour sweep across them reads more like an
  actual rainbow, and pairing it with a random starting point per post still
  keeps neighbouring posts looking different from each other.
- Confetti chips are drawn in the same eight colours already used elsewhere
  on the postcard, not a fresh rainbow palette — reused what was already
  there rather than inventing new colours.
- Didn't touch how often a post counts as "first ever" (`lib/first-post.ts`)
  or how many first-post cards can appear in the feed at once — if that
  number is usually 0 or 1 in practice, "basically always exploding" still
  holds, just for whichever one card is showing.

## Comments

Bryan, 2026-09-12, on seeing the first pass: "way more confetti new post
explosions. like always multiple exploding. it should feel like fireworks are
going off."

Turned up, same day. It was one burst at a time across the whole feed, taking
turns. Now it is a firework display:

- Volleys, not turns. Every 0.13-0.42 seconds a volley of 2 to 4 bursts goes
  up at once, at different spots, on whichever rings are on screen. Roughly
  eleven bursts a second.
- A ring holds many bursts at once instead of one — up to nine alight
  together, which is what one lone first post on screen will sit at.
- Bursts last 1.7 seconds instead of 2.4, so they pop and clear rather than
  hanging about while the next dozen arrive.
- They go off AROUND the post, not on its border: each one is thrown up to a
  tenth of the card's width outside the edge.
- More and mixed chips: 18 a burst instead of 14, sizes 4 to 9 px instead of
  all the same, thrown up to 108 px instead of 64.

The rate is a property of the feed, not of each card: ten first posts on
screen share the same volley rate rather than multiplying it into a blizzard.
Reduced motion still turns all of it off. Type-check and lint clean.
