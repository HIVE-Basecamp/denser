# The comments pull

Type: task
Status: resolved
Blocked by: none

## Question

Bryan, 2026-09-16: "A really important tool is comments. I'd like to create a
pull from chain that retrieves the last 25 comments of this user. I want to
see the FULL comment in order to scroll through. Comments are a good clue to
look for bot. This comment pull will be used in many areas, so each area
should be able to access the pull mechanism for the last 25 comments. In the
REPLY MIX area of the postcard I want a button that can be clicked that says
'comments', and when you hover over it, it says 'click to see the last 25
comments'."

## Answer

Built 2026-09-16. Not committed.

**The pull, made once and shared.** `useAccountComments(account, enabled)`
reads an account's last 25 replies and hands them to anyone who asks. It is a
hook with its own query key, not something the postcard owns, so every area
that wants those 25 replies gets the same one read instead of asking the
chain again — the Spot the Bot game already uses it. `enabled` defers the
read, so a feed of cards asks the chain nothing until a reader actually opens
a panel.

**Twenty-five needs two reads.** The chain refuses 25 in one call — the
bridge's own limit on this read is twenty, and asking for more comes back
`limit = 25 outside valid range [1:20]`. So the pull takes twenty, then the
remaining five starting after the last one, de-duplicating in case a cursor
hands the anchor back. Two small reads, cached together as one answer. The
25 is a named constant (`ACCOUNT_COMMENTS_LIMIT`) so changing his number is
one edit.

**The body is never shortened.** Not in the pull, not in the panel. What a
reply is made of — how long it is, whether it repeats, whether it is only a
bot trigger — is the clue he is after, and a data layer that truncates has
thrown the clue away before anyone looks. The panel prints each body with its
line breaks kept, in a box that scrolls. Hive markdown is left as its own
characters rather than rendered: the heavy renderer would cost the page real
weight, and someone looking for a bot wants the raw thing anyway.

**The panel.** "Last 25 comments", and under it "Everything @name wrote most
recently, in full." Each reply says who it was written to, how long ago, and
carries a link to where it sits. Loading, failed and "nothing written yet"
all say so plainly. It states nothing about the account: twenty-five replies
side by side say plenty on their own — the same sentence six times over, or a
delegation request with the name swapped — and the reader is the one who
decides what that means (ETHOS.md). Checked against a live account whose
replies repeat: the pattern is obvious at a glance and nothing on the panel
had to point at it.

**Where the button went, and why it costs no height.** Under the REPLY MIX
half-moon, between its four numbers and its name — inside the drawing's box,
not below the caption.

Below the caption was not possible. The card's drawing columns already stand
as tall as the card allows: at the regular tier the column is 110px and the
whole card's content height is 114px. Anything added under the caption makes
every card in the feed taller, and the cap is 138px with the card sitting at
136. The box the drawing is centred in, on the other hand, has real dead
space — a half-moon 53px tall centred in a 96px box leaves 30px empty — which
is exactly the "dumb amount of open space" complaint from the design
standards. Putting the button there fills space the card was wasting and
costs nothing. Measured in the browser with the button shown and hidden: the
card is the same height either way, at every width.

`CircleReadout` gained an optional `action` prop for this. Its popover used
to wrap the whole column; a control inside a popover trigger would have been
a trigger inside a trigger and two popovers would have opened at once, so the
popover is now on the drawing and on the name separately. Hovering either one
still explains the readout, which is the rule from the design standards.

## Files

- `apps/blog/features/basecamp/hooks/use-account-comments.ts` — new. The
  pull: `ACCOUNT_COMMENTS_LIMIT`, `AccountComment`, `useAccountComments`,
  plus `fetchAccountComments` for anything that wants it outside React.
- `apps/blog/features/basecamp/postcard/comments-dialog.tsx` — new. The
  scrolling panel of full replies, with its loading, failed and empty states.
- `apps/blog/features/basecamp/postcard/comments-button.tsx` — new. The
  button and its popover; owns its own open state and only mounts the panel
  once it is open.
- `apps/blog/features/basecamp/postcard/circle-readout.tsx` — optional
  `action` slot inside the drawing's box; popover split off the whole column.
- `apps/blog/features/basecamp/newcomers-list-item.tsx` — passes the button
  to the `reply_mix` readout only.
- `apps/blog/locales/*/common_blog.json` (nine) — `basecamp.card.comments`,
  translated in all nine, not left in English.

## Checked

Types clean, lint clean on all five files. No `basecamp.card.comments` key
missing from any of the nine locales, and none missing in the usage check.

In the browser at 1440, 1280, 950 and 900 viewports, each with a fresh load:
the button sits inside the REPLY MIX column at every tier, never leans on the
clock beside it, and the card measures 136 / 132 / 128 exactly as it did
before — proved by measuring the same card with the button hidden. The one
card that overflows its row (the first-post ring) overflows by the same
amount with the button and without it, so that is not from this.

Panel opened on a live account: 25 rows, bodies up to 682 characters printed
whole, the box scrolls (3342px of content in 540px), each row shows who it
replies to, its age and its link. An account with no replies shows the empty
line instead.

## Still open

- The link on each reply goes to the reply's own page, not to the thread it
  sits in with the reply highlighted. Context would be more use to a curator;
  it needs a decision about whether the anchor Hive gives actually lands.
- Twenty-five is two reads, and a busy account's twenty-five can be a single
  afternoon. Nothing says so on the panel yet — whether it should, or whether
  the panel should be able to fetch further back, is his call.
- Markdown is shown raw. Fine for spotting a bot; less good for reading a
  real person's reply. If he wants it rendered later, the renderer exists.
- The panel shows replies only. "Their posts" is a different pull, and the
  same shape would serve it.

## Comments

**2026-09-16, Bryan, on the button's place.** The red ellipse in his screenshot
was his own marking, not the card: he meant the hollow the reply mix arc
encloses — "that entire U space... and I want it to have a nice color that
pops and the whole button lives there and you just hover over it".

Moved there. The button is now a filled cyan pill sitting inside the arc, not
a small outlined one under it. The hollow is the largest pill that still
clears the arc's inner edge on every side; the type answers to both the
pill's height and its width, and drops to a speech bubble alone on the two
narrowest feeds, where the word cannot print at a readable size.

`CircleReadout`'s `action` became a function of the box it is given, because
only that component knows how big the drawing was actually drawn. The drawing
and its name keep their own popovers; the button carries its own, so hovering
it says what it opens.

Checked in the browser at both wide tiers: card height unchanged (136px
regular, 132px compact), the word prints whole at both, the popover appears,
the panel opens with 25 full comments. Types and lint clean on all three
files. The same button, at its own comfortable size, is what the Bot or Not
game shows beside the profile.

**Same day, second pass.** A pill inside the U was still a shape sitting in
the hollow. He wants the hollow itself: "the whole button fills the space...
all the edges". The button is now the half-disc the arc encloses — round over
the top, flat along the bottom, its radius the arc's inner edge less half a
unit. The coloured arc reads as a ring around it.

The word sits low in the dome, where the shape is nearly full width, and is
sized against that much of it. Where it cannot print at eight points the
button is the speech bubble alone; that is the two narrowest feeds.

Measured at four widths: button radius 32.7px against a 33.1px hollow at
regular, 28.4 against 28.8 at compact — flush, never over the arc — and the
card heights are still 136 / 132 / 128.

**Third pass: the rim.** "Put a border around that comments button, make it a
slightly different shade, the point is so that it pops." Added: a 1.5px rim, first in
a lifted version of the button's own cyan (#C3F8F0), so the dome's edge reads
against the coloured arc without introducing a ninth colour to the card. The
rim sits inside the button's box, so the clearance from the arc is unchanged;
the word's measurement now allows for it. Checked: 132px card and the word
still printing whole at compact, rim present.

Rim colour: neon pink (`BASECAMP_VIVID.pink`), at his order the same day — a
colour the cyan fill does not use, so the dome's edge is unmistakable.

Rim, final state: 3px neon pink, lit the way the first post ring is — a tight
bloom on the edge and a wider, fainter one past it, both in the rim's own
pink. The cyan glow it replaced was doing nothing against a cyan fill. The
button gave up its inner padding to the thicker rim, so the word still prints
whole at both wide tiers and the card heights are untouched.
