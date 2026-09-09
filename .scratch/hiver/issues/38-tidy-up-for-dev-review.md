# Tidy-up for dev review

Type: task
Status: resolved
Blocked by: none

## Question

Three files in the module are too big to hand to a Hive dev: `engine/icons.ts` (3441 lines), `engine/render.ts` (2515), `engine/canvas-map.tsx` (1894). Split them into files of about 300 lines, one thing per file, in that order. Move the code, never rewrite it. No behaviour change at all, every comment kept. Keep the direction `lib/` <- `engine/` <- `canvas-map.tsx`, and keep the architecture list in `README.md` true.

Per file, before it counts as done: `pnpm exec tsc --noEmit` clean, `pnpm exec eslint` with no new warnings (the pre-existing ones stay: `R` parameter names, `ROSE_LEAD` unused, the no-img-element error), prettier clean on the new files only — the old big files are not prettier-clean and reformatting them would rewrite lines that have nothing to do with this.

## Answer

Done 2026-09-08. Not committed. Nothing was rewritten: every block of drawing and game code moved verbatim with its comments, and the only new lines are imports, the function wrappers the moved bands sit in, and the bag of frame numbers those bands read from.

`engine/icons.ts`, 3441 lines, is now `engine/icons/`: 26 files, one place per file, biggest 424. `index.ts` re-exports exactly what the old file exported, so `render.ts` and `canvas-map.tsx` were not touched. Emperor J SON, a single 850-line drawing, is five files along his own section comments (backdrop and rock and ruin, the hydra, the three heads, the hoard, the storm).

`engine/render.ts`, 2515 lines, is now `engine/render/`: 22 files, biggest 315. `scene.ts` sets the frame up and runs eleven `layer-*.ts` in the same order the one 1237-line `drawScene` ran them; each layer reads the frame's numbers out of `pass.ts`, which is what the enclosing scope used to be.

`engine/canvas-map.tsx`, 1894 lines, is now 864 plus `engine/canvas-map/`: the one frame-loop effect (`frame-loop.ts`), its constants and its shared types.

Two files are still well over the ~300 aim, on purpose:
- `canvas-map/frame-loop.ts`, 1252. Its inner closures (the hit test, the key and mouse handlers, the rAF body) all read `W`, `H` and `DPR`, which the resize handler reassigns. Cutting them apart means editing those reads inside the loop, which is exactly the quiet break we were avoiding. It is now one file that is one thing.
- `render/layer-landmarks.ts` 236, `render/sky.ts` 315, `icons/json-boss-heads.ts` 423, `icons/dispatch.ts` 424: each is a single function or a single switch. Splitting further means retyping drawing code.

How it was checked. `pnpm exec tsc --noEmit` clean after each file. `pnpm exec eslint` over the whole module reports exactly the pre-existing set and nothing new: 19 `R` parameter names, `ROSE_LEAD`, one `no-img-element` rule-not-found in `canvas-map.tsx` and one in `card/house-card.tsx`, one `consistent-type-assertions` in `card/`. Prettier: the new files are clean on every line I wrote; the moved lines are left exactly as they were, because the old files were never prettier-clean and reformatting them would rewrite work that has nothing to do with this. Every line of the three old files was diffed against the new folders: nothing is missing but import statements and the `const`/`export const` keywords. Canvas call counts (`save`, `restore`, `beginPath`, `fill`, `stroke`, `fillRect`, `drawImage`) match the originals exactly, and every extracted band balances its own save/restore.

One real bug was caught and fixed in the doing: the boss's final `ctx.restore()` ended up both in his storm section and in the new orchestrator. Two restores against one save would have unbalanced the canvas stack and quietly wrecked whatever drew after him.

`README.md`'s architecture list now names `icons/`, `render/` and `canvas-map/` and says what each holds. The direction `lib/` <- `engine/` <- `canvas-map.tsx` is unchanged.

Also checked live: the dev server compiles and serves `/hive-frontend-universe` (200) and the game's real fetches fire (the top 21 witnesses and the community avatars). Not seen by eye this session: the game actually being played. The browser pane crawls and the route wants a signed-in account.
