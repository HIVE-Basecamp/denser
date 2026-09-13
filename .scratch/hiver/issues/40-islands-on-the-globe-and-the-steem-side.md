# Islands on the globe, and the Steem side

Type: task
Status: resolved
Blocked by: none

## Question

Bryan, 2026-09-12, looking at the planet pass: "i like the new look how the game map shows like a globe. the way the citadels sit on that globe look right. but mount socko and emperor j son should do the same thing. they should both look like islands off on the globe. and i also think the steem ruins can be on the back side out of site on globe. but if you go to the other side, just like hive logo being a topology. there should be a busted up steem logo. missing pieces and looking rough...like ruins. use the steem color and real logo taking up the back side of the globe. that will be a banished land later. there will also be a blurt island. do that"

## Answer

Built 2026-09-12. Not committed.

- Mount Socko and the keep sit on the planet like the citadels: at the rim, leaning outward as the camera pulls out (`layer-landmarks.ts`, the same `towerLean`). The sock got an isle under it, a chunk of cold rock with a snowy top (`icons/sock-mount.ts`). The keep moved from W-4, off the disc in open space, to the east rim at W-8 (`lib/fixed-world.ts`); its approach rail still ends two helmets short, measured: gap 1039 px, 1.17x a bare hop, and `checks/planet.ts` holds it between one helmet and two. One citadel walked outward to clear it.
- The back of the planet is the old chain's land: the real Steem mark (path data from the coin icon) in Steem blue, ten pieces missing, four cracks to the sea, chipped coasts, the rubble lying where it fell (`lib/steem-side.ts` for the numbers, `engine/steem-land.ts` for the paint, `render/layer-steem.ts` for the layer). Drawn the right way round on the mirrored back, the way the Hive mark is never mirrored. The dead grey district stands on the right stroke; a Blurt island (the orange ball, the band, the eyes, the wordmark) lies off the south-west coast. Both are named on hover, neither is a destination. The rusted tracks of the streets are drawn faintly so a bug on the back still sees where it can ride; nothing else of the living side shows, and nothing of it answers to the cursor there either (the posts, places, communities, citadels and footprints of the front are neither named nor clickable on the back; only the door still is). The old drained mirror of the whole board is gone. The land's edges and cracks are weighted by zoom, so they are lines on the map and not bands up close.
- The door stays where the ruins stood, in the western void: the rubble that came round, in Steem blue (`icons/steem-rubble.ts`). Park there and the planet turns, both ways, as before.
- One new string, `landmarks.blurt_island`, in all nine locales.

Checked in the in-app browser (a mocked sign-in, the frame loop driven by hand while the pane was hidden): the front map with the sock's isle and the keep leaning on the rim, the hover names, the warp to the rubble, the turn, the back with the busted mark, the district and the Blurt island named on hover and nothing of the front answering there, the turn back, the rubble up close. The 33 headless checks pass. Not yet played by hand.

Judgement calls for Bryan: whether the fat islands should lean the full citadel angle on the map or only part of it; whether the rusted tracks on the back should stay or the mark should stand alone; how big the Blurt island is; what the banished land does.
