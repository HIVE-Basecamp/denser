# Build obstacles on the lines

Type: task
Status: resolved
Blocked by: none

## Question

Put things on the lines that the bug hops over or routes around, and that block sight (ticket 10).

Constraints: `movement.ts` frozen; obstacles act on the bug the way hazards do; placement deterministic from the window seed so every player sees the same; start from the `scenery.ts` cube seam; no image assets; strings via t(). Try it, look at it, pull it back if it does not feel right.

## Answer

Built 2026-09-07, checked headlessly against the real movement code and looked at in the in-app browser. Not committed.

What is there now:
- BLOCKS on the lines: chunky crystal blocks parked mid-line, thick outline, flat bright faces from the cube palette, a shadow on the street. Opaque, so whatever passes behind one is hidden. `engine/blocks.ts`.
- Placement is from the round seed, so every player meets the same blocks. Only ordinary streets: never a spoke (it leads to one place and must stay open), never a line shorter than 320 px, never a line ending at a dead end. About one line in six. This round: 42 blocks on 311 streets, 46 to 86 px across, covering 14% to 39% of their line.
- Riding into one, the bug is set back to the block's edge and stopped, with a short bump and a wobble. Keep pushing and it stays stopped, one bump only. Turn around or take another line.
- A hop clears it. A drifting bug is never touched, and a bug that lands inside a block from a hop is carried out on the side it was heading, because a straight hop along a line lands after 0.13 s and could not clear a block on its own.
- `movement.ts` untouched: the integrator runs, then the block check sets the bug's position, the hazards' pattern. The cubes at the junctions stay as texture; the seam comment in `scenery.ts` now points here.
- No strings added, nothing on the HUD, nothing to hover. Blocks are terrain.

Left alone, on purpose: creatures, shots, tokens and traffic pass through blocks (and are hidden behind them); blocks are not drawn on the pulled-out map (sub-pixel there); the bump has no sound.

Judgement calls for Bryan: how many (one line in six), how big (46 to 86), whether they should also stand on the named lines (they do now, the post line included), whether the far map should show them.

How it was tried: a headless run of the real `movement.ts` integrator against the placed blocks (ts, no browser): pushing into a block from either side stops the bug just outside its span with one bump and no creep; a hop from just before a block lands past it on the same line; the same seed places the same blocks twice; no block sits on a spoke, a short line or a dead end. In the in-app browser, signed in: the blocks stand on the lines at play zoom with the shadow and the glint; no console errors from the module. Not tried by hand: riding into one with the keyboard (the browser pane ran the game at a crawl this session), the wobble, the shake.

Files: `engine/blocks.ts` (new), `engine/render.ts`, `engine/canvas-map.tsx`, `engine/scenery.ts`, `README.md`.
