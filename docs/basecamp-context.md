# Basecamp + H.I.V.E.R. — Context for a Fresh Session

Written 2026-08-24 from the actual code on `feat/basecamp-activity-rings-and-games`.
This is the state of the world, honest about what is real and what is not.
Deeper docs: `apps/blog/features/hive-frontend-universe/HANDOFF.md` (the game,
code truth + design history), `ART-DIRECTION.md` (the game's visual rules),
`apps/blog/features/basecamp/FUTURE-NOTES.md` (parked ideas), and the Basecamp
section of the root `CLAUDE.md` (the integration contract — read it first).

## What Basecamp is

A BUILT newcomer section of the blog app (not a proposal). Code in
`apps/blog/features/basecamp/`, route at `apps/blog/app/basecamp/`. The front
page has three tabs: **I'm new here**, **I'm here to help**, and **H.I.V.E.R.**
(the Hive Frontend Universe game, promoted from the games row to the front
page). Below the tabs: the newcomers feed, always visible.

## On-chain state (real, live)

Basecamp state lives on-chain as `custom_json` with id `"basecamp"` so any
frontend can read it. Wire shape `[action, { v: 1, ...fields }]`. Actions:
`join`, `leave`, `task`, `guide_offer`, `guide_pair`, `verify`. Writes go ONLY
through `transactionService.basecamp*` in `packages/transaction/index.ts`
(posting authority only — never call a signer directly). Reads go through
`features/basecamp/hooks/use-basecamp-state.ts`, which fetches the
`custom_json_operation` op_type_id LIVE from hafah-api at runtime — **never
hardcode an op_type_id**, and history ops come back as tagged objects
`op: { type, value }`, not tuples.

Honest limits:
- `verify` is broadcast-capable but currently **folds to a no-op** in state.
- Reads are **per-account only**. Cross-account discovery (browse all
  newcomers by interest, etc.) needs a backend indexer and is out of frontend
  scope. The newcomers feed works from recent-post data instead.

## The games (Puppet Patrol)

Registry-driven: `features/basecamp/games/registry.ts`. Four games remain in
the row (bugger, cut_the_strings, sock_or_not, spot_the_bot — mostly
coming-soon stubs). The fifth, Hive Frontend Universe, moved OUT of the row
and is now the H.I.V.E.R. front-page tab (`basecamp.tsx` mounts its launcher
directly). Adding a game is still: create `games/<name>-game.tsx`, add one
registry entry, add the title key to all locales.

## H.I.V.E.R. (Hive Frontend Universe) — the big one

A canvas exploration game that doubles as a gamified hive.blog front end,
~35 build passes deep. Module: `apps/blog/features/hive-frontend-universe/`
(self-contained; also has a standalone route). Key facts a fresh session
must not break:

- **Age gate**: only logged-in accounts over a year old mount the game.
  Client-side UX only; the real gate is that on-chain actions are signed.
- **The game broadcasts NOTHING.** Read-only against chain APIs.
- **The world**: three landmasses forming the Hive logo, rebuilt
  deterministically every 30-minute window from real chain data (live posts
  as houses, real custom_json counts as tokens, real top-21 witnesses as a
  citadel ring with real stats cards, real communities as bubbles). All
  hand-tunable positions live in `lib/fixed-world.ts`; the mesh is woven per
  window. A planning grid overlay (G key / # button) letters the world into
  700px boxes A-Z x 1-26; positions are directed by box ("put it at G-17").
- **The map is attractions-only** (9 landmarks). Every everyday link
  (posts, search, wallet, sign up, FAQ, chat, welcome, healthchecker, block
  explorer, communities, write post, docs) lives as a clickable cell of the
  HIVE COMB HOME honeycomb landmark. Its pane geometry is exported from
  `engine/icons.ts` and shared by drawing, labels and hit test — move all
  three together or none.
- **The player**: a red diamond bug wearing the black Hive mark, with the
  signed-in user's real avatar RIDING it (oversized on purpose). The rider
  handle flows through a ref into the render loop — this file has a
  documented stale-closure trap; always read late-arriving values through
  refs inside the frame loop.
- **Quests/collectibles**: helmets (O2 for void hops), gems, tokens
  (steal/bank economy vs critters), the ferris wheel trophy ride, PLACES
  completion, and THE NEWB TRAIL — a pink route strung through the current
  window's real newcomer posts (board `isNewcomer` = account under a year);
  visit all to earn a gem. Visited state is per-board, quest resets with the
  window.
- **Critters**: Socko (a walking Mount Socko; envelops you and posts you to
  the mountain), Blahgart (the orange blurt-ball parody that jets green
  puke; the slime slow), Copypasta (pasta octopus wrap; jump to escape),
  Sly Grin and Drainiac (token thieves feeding Emperor J SON's troll holes).
- **The villain**: Emperor J SON, a three-headed hydra on a floating rock in
  the NE corner, caricature faces, green fire, tribute march of stolen
  tokens. Reaching his keep costs two helmets by design (measured, not
  assumed). Pure parody lore.
- **Keyboard ownership**: while the game is mounted it claims its keys
  (arrows/WASD/space/M/G/X/Z) in the CAPTURE phase and steals focus on
  mount, so the Basecamp tab bar and page scroll never react during play.
  Typing targets (inputs) are exempt. Do not "simplify" this away — it fixes
  a real playtest bug where arrows drove the tab bar.
- **movement.ts is frozen** except one sanctioned SPEED change (documented
  in-code). The bright red land color is a settled decision; do not darken.

## Verification culture (how changes get proven here)

- Headless scripts (world invariants, reachability, hazards, beam rules)
  run via ts-node against the real modules; landmark moves are verified
  across all six seed windows before commit.
- A browser harness (tsc AMD bundle + tiny static server with a /snap
  endpoint) renders the real engine for screenshots; visual claims are
  proven with images, not described.
- Frame budget ~12ms at map zoom; suspicious costs are A/B measured
  (min-of-many-trials — single timings swing wildly with machine load).
- Every commit states KNOWN ISSUES honestly.

## Rough edges a new session should know

- The cross-locale checker reports ~725 missing keys across the 9 locales —
  long-standing drift that predates this work, unchanged by it. The usage
  checker (keys referenced in code exist) passes clean.
- `features/basecamp/suggested-newcomers.tsx` has a pre-existing type error
  (`Newcomer.account` missing) that surfaces in a full `tsc --noEmit`.
- Witness data caches hourly in localStorage (key versioned `hfu-witnesses-v3`);
  bump the version when the shape changes or stale data hides new fields.
- The comb panel lists 15 link chips in one stack — acceptable, but tall.
- Trophy mounts on the ferris wheel are session-only; Rose-pane earned-light
  and several M/L design ideas are parked in ART-DIRECTION.md's backlog.
- Local-only files that are never committed: `.claude/launch.json` and a
  local modification to `.claude/skills/blog-smoke-tests/scripts/test-utils.mjs`.

## House rules that keep biting people

1. Broadcast only via `transactionService`; posting authority only.
2. Never hardcode a custom_json op_type_id; fetch it live.
3. All user-facing strings via `t()` (documented exception: the game's
   `lib/strings.ts`); new keys go to ALL locale files in the same commit.
4. localStorage through the TTL utilities, never raw.
5. TanStack mutations with optimistic rollback, modeled on
   `features/mute-follow/`.
6. This checkout's git remote is a GitHub fork whose default branch IS the
   feature branch; work is committed in named passes, pushed, no PRs.
