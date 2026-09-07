# The planet pass

Type: task
Status: resolved
Blocked by: none

## Question

Bryan, 2026-09-06, after the board lean (ticket 36) fell flat: what he had pictured was "the hive was a planet and had multiple sides", felt in the map view. "Pull all that stuff out and do the real planet pass, like, how I originally intended."

Constraints: keep the hand-tuned spacing of the map view; nothing moves; no 3D engine; no image assets; `movement.ts` frozen; nothing written to the chain. Try it, look at it, pull back what does not work.

## Answer

Built 2026-09-06, tried in the in-app browser. Not committed.

What is there now:
- The planet has a body. A shaded disc sits under the mark, inside the witness ring: a blue sea over the stars, lit from the upper left, falling into night at the lower-right rim, a thin atmosphere along the edge, a glassy sheen. Faint while playing so the void keeps its stars; full on the pulled-out map. Numbers in `lib/planet.ts`, paint in `engine/planet.ts`.
- The 21 citadels lean outward from the planet's centre as the camera pulls out, like pins in a globe: straight up at play zoom, fully radial on the map. The witness's face stays upright however its tower leans. Clicking a tower still hits its head.
- The flip at the ruins turns a sphere now, not a card. The sky and the body are drawn before the flip and do not turn; only the face slides across. The mid-turn darkening and the drained Steem side now cover the planet's face, not the sky. The card's shear on the turn is 0 (`FLIP_SKEW`, `lib/board-side.ts`); 0.22 puts it back.
- Nothing moved. Every place, tower and cluster stands where it did.

Left alone, on purpose: the land's colour (bright red is the identity), the fish, the big places (they stand on the face, so they face the viewer). The land does not darken into the night side.

Judgement calls for Bryan: how blue and how bright the sea is; how strong the night side; whether the bottom towers hanging downward on the map look right (honest for a globe, but new).

How it was tried: dev server already running from another session, in-app browser, signed in. Seen on the travel map: the sea inside the ring against the black outside, the limb, the towers leaning outward with faces upright, every landmark in its old place; the towers swinging outward as the camera pulls out; hovering two leaning heads named their witnesses (16. abit, 7. roelandp); no console errors from the module. Play zoom: unchanged apart from the faint sea. Not tried: the flip at the ruins with the sphere (the ruins could not be clicked from the travel map in the harness; the nearby tower's hit circle covers them), a beam ride, a full round by hand.

Files: `lib/planet.ts` (new), `engine/planet.ts` (new), `engine/render.ts`, `engine/icons.ts`, `engine/canvas-map.tsx`, `lib/board-side.ts`, `README.md`.

## Comments

Bryan, 2026-09-06: "i really like it. but some of the witness citadels are off screen or being blocked. can you find a place for each citadel to have its own space without getting cut off or blocked".

Measured first (a script over the real top 21 at map zoom): gtg's crown ran under the map hint at the top edge, howo's too; themarkymark's hanging tip touched the bottom edge; therealwolf (J-22) hung straight into the rose window, ausbitbank (T-21) into the dApp ship, stoodkev brushed Mount Socko.

Done the same day, `lib/planet.ts`:
- Every tower is placed with its lean in mind, `placeWitnesses`. Bryan's named spots go first and keep their cell unless a leaning tower there crosses a big place or the land; then the nearest clear grid step is taken. The ring towers are walked outward along their own ray until clear of the land, the big places (`BIG_FOOTPRINT`, measured by eye) and every tower already standing. Rank-agnostic.
- The pulled-out map fits the ring with its towers leaning fully outward, with a band under the hint at the top and breathing room at the bottom (`MAP_FIT`). The camera centre sits a little above the origin so the north tower clears the hint. The map is about a tenth smaller than before as a result.

Moves today, for Bryan to veto: ausbitbank T-21 to one cell up (T-20); therealwolf J-22 to one cell left (I-22); stoodkev, steempeak, good-karma and threespeak walked outward a few hundred px. Everyone else stands where they did.

Tried 2026-09-06 on a fresh dev server (the other session's had gone), in-app browser, signed in. The pulled-out map, settled: the north tower's crown sits under the hint, not behind it; the hanging towers at the bottom end above the edge; the rose window and the dApp ship stand clear of their neighbours; the tower between Mount Socko and the keep has a gap on both sides. A script over the live top 21 reports no tower off the canvas, over a big place, or across another. Not tried: other screen sizes by hand (the fit is per canvas, the placement is not).
