# Build automatic checks

Type: task
Status: resolved
Blocked by: none

## Question

The module has no automatic checks at all, which is the most honest criticism of it. Build a small headless suite that runs with one command from `apps/blog`, no browser and no signed-in account.

What it should cover:
- Build the world from a window start and assert its own stats: zero crossings, max degree 4, minimum angle 35 degrees.
- The movement integrator.
- Blocks: a rail bug pushing into one stops; a hop carries over.
- Footprints: at most six tracks per house.
- The keep: 20 helmets do nothing, 21 release once, the release reaches 1 in 7 seconds.
- Helmets total 21.
- The DHF race line.

Lives in `apps/blog/features/hive-frontend-universe/checks/`, one runnable command, written down in `README.md`. `@ui/...` imports resolve through tsconfig paths; there is no localStorage in Node and the storage helper already tolerates that.

## Answer

Built 2026-09-08. Not committed. Thirty checks, all passing.

One command, from `apps/blog`:

```
npx -y tsx --tsconfig tsconfig.json features/hive-frontend-universe/checks/run.ts
```

No browser, no signed-in account, no test framework and nothing to install. `localStorage` is simply absent in Node and the storage helper tolerates it; `@ui/...` resolves through the tsconfig paths. It is the real engine throughout: the world is built from one fixed round start and the same functions the game calls are called against it.

Seven files in `apps/blog/features/hive-frontend-universe/checks/`: `harness.ts` (a name, a function, and a report that exits non-zero on a failure), then one per area, with `run.ts` running them all.

What it holds:
- **World**: zero crossings, no junction with more than four lines, 35 degrees minimum between lines at a junction, a world that is not empty, and the same round start building the identical world twice.
- **Movement**: parking lands on a line end with x and y on the curve; a push moves the bug and never off its line; no push, no movement; a jump leaves at `JUMPV` with a full `DRIFT_TIME` of fuel; drifting burns the fuel and never exceeds the drift speed.
- **Blocks**: they are placed, only on ordinary streets, never on a dead end; the same round places the same ones; a rail bug pushing into one is set back to its edge and held; a hop lands the bug clear of the span; a drifting bug is never touched.
- **Footprints**: at most six tracks per house, including after repliers arrive; at most four of them votes; never the same account twice on one house; every track on one of its own house's streets and short of mid-street.
- **The keep**: 20 helmets do nothing, 21 release the hoard, a second visit in the same round does nothing, the release reaches 1 in exactly seven seconds and never runs past it, and the pile is gone from his feet at 3.5 seconds.
- **Helmets**: 21 in the code, 21 placed in the world, 21 needed at the keep, and 21 of them take one ring of air to 3.52.
- **The DHF race**: tier weights and their clamping, the line at two fifths of the board and never under three, one vote per house per round, delivering short of the line doing nothing and crossing it funding, and the setback dropping what is carried and giving the houses their votes back.

One expectation was wrong on the first run and the code was right: take-off uses `JUMPV` (400), which is above the drift speed cap (360) on purpose — the cap is for steering once you are out there, not for the leap. The check now says so.

Not covered, and worth saying plainly: nothing here draws. The canvas layers (`render/`, `icons/`) and the React shell are still verified by the type checker and by eye. Covering those needs a canvas stub or an image comparison, which is a bigger piece of work.

`README.md`'s Verification section now carries the command and what it covers, and the directory list carries `checks/`.
