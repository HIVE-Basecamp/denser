# The pop-up dashboard

Type: prototype
Status: resolved
Blocked by: none

## Question

Bryan wants a Zelda-style pop-up: a card or dashboard of what the player has collected, strength, weapons, things they are paying attention to (ticket 11). Make a rough one from what exists today (helmets, tokens, gems, places visited) to react to.

## Answer

Built 2026-09-06, rough on purpose: a plain list, no layout work yet, so the
question "which facts belong here" can be answered first (Bryan: "let's just
get what information we imagine being there first").

Open with the I key or the STATS button under the mode chip. Same key or
Close to shut. Numbers refresh twice a second while open.

Rows today, every fact the engine holds about the player:

1. Mode, and time to the next round
2. Side of the board (front or back), and where (grid box)
3. Hits left, of 3
4. Helmets, of 21, and spare air
5. Tokens carried (these are the ammo), banked, stolen, won back
6. Gems, of the board's total
7. Votes carried against the return line, and funded or not (adventure only)
8. Trophies on the wheel
9. Places found, of 10 (kept forever)
10. Communities visited, of 10 (kept forever)
11. New posts visited this round

Not held anywhere yet, so not shown: enemies knocked out, shots fired,
distance ridden, time played, witnesses seen, posts read, anything cemented
across rounds. Any of these is a small counter once wanted.

Code: `card/player-dashboard.tsx` (shows rows, knows nothing), the snapshot
in `engine/canvas-map.tsx`. Checked in the in-app browser: opens, closes,
numbers right.

Open for Bryan: which rows stay, which of the missing ones to add, then the
layout and design of the card.
