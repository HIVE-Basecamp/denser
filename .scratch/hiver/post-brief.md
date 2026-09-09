# Brief: the one-month devlog post

Written 2026-09-08 by the session that finished the tidy-up, for a fresh session to
write from cold. Everything needed is here or linked. You should not need the
conversation that produced this file.

## What Bryan asked for

> "i need a post of the last month of progress. i want a full readable breakdown of
> what was accomplished over the last month. it should discuss the idea, the goal, the
> set backs, hours spent and overall trajectory of progress. we had many discussions
> about philosophy and hive culture. i need a post that will discuss all this and show
> just data of work that a dev will understand... human readable but technical too.
> we are in essence sharing the story of the last months work."

Audience: the whole Hive community, not only developers. Two layers in one post — a
story anyone can follow, and enough hard data that a Hive dev takes it seriously.

The shape has a name: a **devlog** / development update. Monthly recap.

## Read these first, in this order

1. `apps/blog/features/basecamp/ETHOS.md` — what the project is for. The post's spine.
2. `apps/blog/features/basecamp/CONTEXT.md` — the agreed words, and the words we have
   agreed not to use. The post must obey it.
3. `apps/blog/features/hive-frontend-universe/README.md` — what the game is, what is
   real chain data, the invariants, the creatures and the lore.
4. `.scratch/hiver/map.md` — the overview chart: decisions so far, what is open.
5. `.scratch/hiver/issues/` — 39 tickets. The Answer section of each resolved one is
   the record of what was decided and why.
6. `docs/adr/` — the architecture decisions, including no more joining.

## Hard constraints — these are not style notes

- **Attribution.** Lines in `HANDOFF.md` Part B, the 2026-09-02 grilling archive and
  `research/00` were written by earlier sessions, not by Bryan. Never hand them back as
  his words. In a public post this matters more than anywhere: quote only what he
  actually said. His real quotes live in the ticket Answers, marked as his.
- **Never write "rule."** Bryan: "we are not making rules we are discovering and
  brainstorming." Say "the idea", "we are trying".
- **Use the glossary.** New user and OG user (never newcomer, newbie, arrival). Guide,
  never mentor or buddy. Support, never browse. Curator. Round, not window. Game map,
  not map-the-plan. Element, Hive truth, match. The code and HUD still say "newcomer"
  and "NEWBS" — that mismatch is ticket 29, unresolved. Do not paper over it; if the
  post shows a screenshot with those words, say the glossary work is unfinished.
- **Do not overclaim.** See "What is NOT true" below. The community will check.
- **Plain English first.** Bryan is not a developer. The technical layer is for the
  dev reading over his shoulder, and belongs in its own clearly-marked section.

## The data. All of it checked on 2026-09-08.

### Volume

| | |
|---|---|
| Period | 2026-08-03 to 2026-09-08 (37 days) |
| Days with commits | 21 |
| Commits | 101 |
| Net change | 250 files, +32,768 lines, -809 |
| Tickets | 39 total: 26 resolved, 13 open |

### The two modules

| Module | Files | Lines |
|---|---|---|
| `features/hive-frontend-universe` (H.I.V.E.R.) | 110 | 18,003 |
| `features/basecamp` | 56 | 5,520 |

H.I.V.E.R. by folder: `engine/` 71 files 13,477 lines; `lib/` 12 files 2,849;
`data/` 7 files 585; `card/` 5 files 419; `checks/` 8 files 487; `hooks/` 5 files 116.

### The arc, in four stretches

1. **3-12 Aug — Basecamp itself.** The onboarding page wired to real chain data, the
   nav link, real feed sourcing, the activity rings and dark redesign, the Puppet
   Patrol games, the first playable one (Bugger), the signal registry.
2. **14-24 Aug — H.I.V.E.R. built, in 35 numbered passes.** Search the git log for
   `HFU pass` — each commit message ends with a KNOWN ISSUES section saying plainly
   what was stubbed or ugly. That honesty is itself worth showing in the post.
   Highlights in order: the map and movement; the world shaped like the Hive mark; one
   connected world; the witness citadel ring; no labels, everything clickable; Emperor
   J SON, thieves and oxygen helmets; the module README; named creatures and rides;
   Mount Socko; the Steem Ruins and the Buzzing Station; the Rose Window becoming HIVE
   COMB HOME; the newb trail; your own avatar riding the bug.
3. **30 Aug - 6 Sep — the thinking pass.** The ethos and the glossary written down;
   the checklist derived from the chain; joining removed (ADR 0001); the account-age
   gate removed; a smaller CLAUDE.md; the postcard as one line; the wayfinder tracker
   and 32 tickets; Round 2 answers; then the welcome and four modes, the DHF race, the
   ruins flipping the board, the pop-up dashboard, the planet pass.
4. **7-8 Sep — finishing and hardening.** Blocks on the lines; footprints; the ending
   at the keep; then the tidy-up for dev review and the first automatic checks.

### What is real chain data, not decoration

Worth its own section in the post — it is the strongest single fact about the module.
The ~30 post markers are real posts from the current 30-minute round with the authors'
real profile photos. The citadels are the actual top 21 consensus witnesses in vote
order. The collectable tokens are minted from the round's real `custom_json` count.
The ambient flows are scaled from the round's real vote / comment / transfer counts.
Communities are the real top page. The keep's panel shows the real DHF vault, live,
including that the account holds no keys at all.

**The game writes nothing to the chain.** Read-only, everywhere. Say this plainly; it
is a trust point for the community.

### The last day, 2026-09-08, as a worked example for the dev section

Three files were too big to hand to a Hive dev. They were split, with nothing
rewritten — code moved verbatim, only imports and wrappers new.

| File | Was | Now |
|---|---|---|
| `engine/icons.ts` | 3,441 lines | `engine/icons/`, 26 files, biggest 424 |
| `engine/render.ts` | 2,515 lines | `engine/render/`, 22 files, biggest 315 |
| `engine/canvas-map.tsx` | 1,894 lines | 864 + `engine/canvas-map/`, 3 files |

How it was proved: every line of the three old files diffed against the new folders
(nothing missing but import statements); every canvas call counted and matched; every
extracted piece balancing its own save and restore. **One real bug was caught doing
this** — the emperor's final `ctx.restore()` ended up in two places, which would have
unbalanced the canvas and quietly wrecked whatever drew after him. That story is worth
telling: it is what a tidy-up is for.

Then the first automatic checks: 30 of them, one command, no browser and no account.
They cover the world's own invariants (zero crossings, no junction over four lines,
35 degrees minimum between lines, the same round building the same world), the
movement integrator, the blocks, the footprints, the keep, the 21 helmets and the DHF
race line.

## The setbacks. Do not soften these.

- **The board lean (ticket 36).** A 2.5D squash was built, looked at, and pulled out
  the same day on Bryan's call: it read as a card, not a world. What he actually wanted
  was a planet with sides — which became ticket 37, the planet pass, and worked.
- **The land-darkening art pass.** An art-direction argument said the ground was too
  bright. It was built and reverted. Bryan overruled it: the bright red IS the map's
  identity. The revert commit is in the log.
- **The payout change on houses (ticket 19).** Closed 2026-09-08 without building it.
  A house is a post from the last 30 minutes; the world is rebuilt every round; so a
  post can never reach its 7-day payout while it is on screen. Bryan caught it. A
  session had spun the ticket out of his "yes, you can try it" about Hive's clocks and
  never held it against the round. Good story: the idea was fine, reality said no.
- **The Power Up Day festival (ticket 18).** Parked the same day, before building.
  "a bit of a distraction."
- **Closure traps, twice.** A React trap made every community bubble unclickable, then
  bit again and stopped the player's own avatar loading onto the bug.
- **The witness beam was unreachable** until it was made a visible tractor lane.
- **Joining was removed entirely** (ADR 0001). There is nothing to join. Interests go
  on public record instead.
- **No automatic checks existed at all** until the last day of the month. The README
  called that the most honest criticism of the module, in its own words, for weeks.

## The philosophy and culture threads

These deserve real space; they are why the thing looks the way it does.

- **The void.** The front door was half-fixed: signing up works, knowing what to do
  does not. People post a few times, nobody answers, they leave. Meanwhile OG users
  would help but cannot find a real person among the scammers and bots. Two halves of
  one problem, holding each other still.
- **Visual indicators, not conclusions.** Basecamp shows facts about a new user. The
  reader decides what they mean. Earning and taking earnings out is not wrongdoing.
  Curators decide; the tool does not decide for them. This is load-bearing and should
  be quoted from ETHOS.md.
- **Open source, meant to be taken.** Fork it, run it on your own front end, take the
  parts you want. Iteration by others is the goal, not a tolerated side effect. The
  README has a whole "porting to another frontend" section listing the two external
  dependencies to replace.
- **The words.** A glossary was written and some words were ruled out: mentor, buddy,
  sponsor, newbie, arrival, browse. Why each was rejected is in CONTEXT.md and is
  genuinely interesting to a community that argues about this.
- **Hive history as geography.** Research turned the 2020 fork into the Steem Ruins: a
  dead grey district opposite the Emperor's keep, a rusted rail that runs toward the
  living world and stops. That break is the fork. Its one link is the real 2020 post
  announcing Hive. The Emperor is the ninja-mined stake; the chain routes around him;
  all 21 helmets, one per consensus witness, set his hoard loose and it becomes
  everyone's. History taught as terrain, with receipts.
- **Elements over mechanics.** Bryan's vocabulary: an element is one thing players
  enjoy doing or overcoming. A Hive truth is something everyone on Hive knows or feels.
  A match is one laid over the other. The match table (ticket 33) is the unbuilt spine.
- **The Percy test.** The game is a game when someone plays it because they want to,
  not because they were asked. That is the bar, and it is not passed yet.

## Gaps only Bryan can fill. Ask him before publishing.

1. **Hours.** There is no record of hours anywhere. What exists: 37 days, 21 days with
   commits, 101 commits. If he wants hours in the post he has to supply the number.
   Do not estimate it from commits — it would be a guess presented as data.
2. **What H.I.V.E.R. stands for.** The letters are still unagreed (ticket 29). His
   tagline: "A game that teaches you hive through Game Play."
3. **Screenshots.** The post needs them and there are none in the repo. No image
   assets exist by design — all art is drawn in code — so they have to be captured.
4. **Where it posts, and the tags.** His call.
5. **Whether to name the collaborators** he has been arguing this out with.

## What is NOT true. Do not let the post imply any of it.

- It is not deployed. It runs locally.
- It has not been reviewed by a Hive dev. Getting it ready for that review is the
  current destination, and that is a different thing from having had one.
- It is not proven fun. Nobody has played it voluntarily yet.
- The drawing code has no automatic checks. 30 checks cover the calculating half; the
  ~6,300 lines that draw are covered by the type checker and by eye only. A decision
  was taken on 2026-09-08 to skip building drawing checks for now.
- Live players do not exist yet. They are the goal (ticket 09), not a feature.
- The four modes are built as a welcome and a picker. What each mode actually holds is
  ticket 16, still open.
- `pnpm run lint:translations` fails on 725 missing keys that predate all of this work.
  Not ours, but do not claim a green board.

## Suggested shape

1. The void, and why this exists. (ETHOS, quoted.)
2. What got built, in the four stretches. Screenshots.
3. What is real chain data — the trust section.
4. The thinking: the words we chose, the words we threw out, Hive history as terrain.
5. What went wrong, honestly. The four setbacks above.
6. For developers: the module layout, the invariants, the tidy-up numbers, the checks,
   how to fork it.
7. Where it goes next: fun first, then an SDK, then a dev review. What is still open.
8. The ask: collaborators, and what he wants from the community.
