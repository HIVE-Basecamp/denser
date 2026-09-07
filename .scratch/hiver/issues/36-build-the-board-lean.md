# Build the board lean (2.5D)

Type: task
Status: resolved
Blocked by: none

## Question

Bryan, 2026-09-06: "ok do the 2.5 d tilt now". The map should feel like a solid board seen at an angle, without rebuilding the game in 3D. The full 3D remodel was weighed the same day and set aside as the heaviest lift on the board: it would rewrite about half the game and the hand-drawn look would not survive it.

Constraints: `movement.ts` frozen; no image assets; nothing written to the chain; one number puts the board back flat.

## Answer

Built 2026-09-06, tried in the in-app browser. Not committed yet.

What is there now:
- The board leans back. Everything lying on it (ground, rails, hex comb, pools of light, rings around posts) is squashed top to bottom to 0.76 of its height. One number, `BOARD_TILT` in `lib/board-tilt.ts`; set it to 1 and the board is flat again, exactly as before.
- Everything that stands on the board is drawn upright at its own spot: the big places, post faces, community emblems and logos, the 21 citadels, the ruins, the island chips, the cubes, the rock formations, the JSON factories, the trophies on the wheel, the creatures, the helmets, the bug and its surfboard, the map marker. The helper is `engine/tilt.ts`.
- The land has thickness: a dark wine face shows under every south-facing coast, like a cliff (`LAND_EDGE`, 64 world px; colour `LAND_EDGE_COLOR` in `engine/ground.ts`). One extra texture per round far out, a few fills up close.
- Clicking and hovering still land on the right thing: the pointer math undoes the lean (`screenToWorld`), used by the hit test and the planning-grid hover.
- The aim sight on the bug is squashed with the board, so it points where the shot flies.

Left as it was, on purpose:
- The full-map fit. Using the lean's vertical slack clipped the witness ring's heads, so the old fit stays.
- Tokens, gems and shots lie flat on the board. The sky leans with the board.
- Nothing passes behind anything by height yet: a bug north of a citadel still draws over it. That is the next step if the lean stays.

Judgement calls for Bryan: 0.76 is the lean. 0.7 is steeper and squashes the Hive mark more; 0.85 is gentler. Cliff thickness and colour are two constants.

How it was tried: dev server already running from another session, in-app browser, signed in. Seen: the welcome room over the leaning board; play zoom with the bug, tent, formations and post faces upright and the hex comb squashed; the travel map with the whole mark leaning and the 21 citadels standing round it; the cliff under the south coasts at both zooms; the hover chip naming Basecamp under the cursor; no console errors from the module. Not tried: the flip at the Steem Ruins with the lean; a beam ride up a citadel; combat; a full round by hand.

Files: `lib/board-tilt.ts` (new), `engine/tilt.ts` (new), `engine/render.ts`, `engine/ground.ts`, `engine/critters.ts`, `engine/helmets.ts`, `engine/canvas-map.tsx`, `README.md`.

## Comments

Bryan, 2026-09-06, after seeing it: "at least in the map view, less three-dimensional than it used to be. It feels more 2D now." What he had hoped 2.5D meant: "like the hive was a planet and had multiple sides", and the place he wants it is the map view. Also: "several little things moved", the ferris wheel is no longer at the very top, things sit over other things, "blank unused space at the top and the edges", and "I definitely don't wanna push it because it doesn't look better."

Compared flat (BOARD_TILT 1) against leaning (0.76) in the map view, same session. Bryan is right:
- The squash moves every anchor toward the middle, but standing things keep full height, so the ring and the big places crowd and overlap; the spacing that was tuned by hand is lost.
- A planet seen at an angle is still round. Squashing the board turns the planet into a card: the opposite of what he pictured.
- The blank band top and bottom is the squash itself, not the fit.
- At play zoom the lean holds up (bug, tent, rocks upright; cliff on the coast).

Not committed. Next move is Bryan's: flatten the map view (or pull the pass out) and try a planet pass at map zoom instead.

Bryan, 2026-09-06: "Pull all that stuff out and do the real planet pass, like, how I originally intended." Pulled out the same day: the six files are back as they were, the two new files are gone. The planet pass is ticket 37.
