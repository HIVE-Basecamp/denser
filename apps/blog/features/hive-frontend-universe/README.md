# Hive Frontend Universe

A canvas game that doubles as a map of hive.blog. You are a red bug on a
surfboard, riding a transit network woven across terrain shaped like the Hive
mark. Every post, profile, community and tool on the map is real and clickable:
the game is another way to navigate the site.

It lives inside [Denser](https://gitlab.syncad.com/hive/denser) as one feature
module. Everything is in this directory; the only touchpoints outside it are
the game registry entry in `features/basecamp/games/registry.ts` and the
translation files in `apps/blog/locales/*/common_blog.json`.

## Run it

```bash
pnpm install
pnpm dev:blog
```

Two gotchas, both real:

1. The blog's `predev` script wipes `public/auth/` on every start, which
   silently breaks login. After the dev server is up, restore the auth worker:

   ```bash
   cd apps/blog && pnpm run copy:worker && pnpm run copy:assets
   ```

2. The game needs a signed-in Hive account (`hooks/use-sign-in-gate.ts`) — the
   player rides their own avatar. There is **no account-age gate**: new users
   are meant to play, with no differentiation. To develop without an account,
   see the note on the harness below.

Then open `http://localhost:3000/basecamp` and pick the **H.I.V.E.R.** tab.
There is also a standalone full-screen route at `/hive-frontend-universe`.

Controls: arrows/WASD ride the rails, Space/Z jumps into open space (drift),
M held peeks at the whole map, M tapped opens the travel map where clicking
any landmark warps you there. Click anything to see where it leads.

## What is real

More of this than you might expect is live chain data, not decoration:

- The ~30 post markers are real posts from the current 30-minute window, with
  the authors' real profile photos (via the app's own avatar proxy).
- The witness citadels ringing the world are the actual top 21 consensus
  witnesses, in vote order, fetched from `condenser_api.get_witnesses_by_vote`.
- The collectable JSON tokens are minted from the window's real `custom_json`
  operation count (one per thousand ops, floored so the map is never empty).
- The ambient particle flows on the lines are scaled from the window's real
  vote / comment / transfer / custom_json counts.
- Communities are the top page of `bridge.list_communities`, with their real
  avatars.

Everything read, nothing written: **this module never signs or broadcasts
anything**. The Hive API calls live in `data/` (one file per fetch, each cached
in localStorage with a TTL).

## Architecture

The dependency direction is `lib/` <- `engine/` <- `canvas-map.tsx`, and
`data/` + `hooks/` feed React state in from the side.

```
lib/        Pure, DOM-free. The world's shape and rules.
  landmass.ts     Generated terrain cells; silhouette = the Hive mark, eroded.
  fixed-world.ts  Every hand-tunable position: landmarks, clusters, holes.
  mesh.ts         Poisson + Gabriel planar mesh, rewoven per 30-min window.
  routes.ts       Named edge-id lists over the mesh (post line, dApps line).
  targets.ts      What every clickable thing links to. One mapping, one file.
  board.ts        Raw chain data -> the window's board (posts, tiers, counts).
  planet.ts       The planet's disc, and how the towers lean on it.
  globe.ts        The world is a ball and the map turns it: the flat board as
                  longitude and latitude, where a point lands once the globe
                  has turned, and the same sum backwards for the cursor.
  board-side.ts   The two sides, and the half turn that carries you between.
  steem-side.ts   The far side of the planet: the Steem mark's path data, what
                  is broken off it, and where the ruins and Blurt island stand.

engine/     Canvas + game state. No React except canvas-map.tsx.
  world.ts        Welds mesh + clusters + communities into one graph, then
                  MEASURES its own invariants (crossings, angles, gaps).
  movement.ts     Rail riding and drift. Position is always edge + fraction.
  coins.ts        The token economy: collect, bank, thieves, recapture.
  helmets.ts      The 21 oxygen helmets and the drift-range upgrade ladder.
  blocks.ts       Blocks parked on the lines each round: a rail bug that pushes
                  into one is stopped; hop over or route around.
  footprints.ts   Tracks from the accounts that voted on or replied to a post
                  this round, each leading to the account. Facts only.
  keep.ts         The ending: park at the keep with all 21 helmets and the
                  hoard streams away to the vault. The panel shows the real one.
  critters.ts     The population: five kinds, their look and their wander.
  sea.ts          What lives in the water between the landmasses: the stake
                  ladder made literal. Redfish and dolphins are company; the
                  orca and the whale hunt a bug adrift in the open sea.
  ground.ts       The terrain paint: base, additive glass, halo. Built once
                  per window, only blitted per frame.
  planet.ts       The LIGHT on the ball: the body of the sea, the glitter
                  path, the limb, the night and the sheen. Belongs to the
                  viewer, so it never turns with the globe.
  steem-land.ts   The far side's land: the busted Steem mark, vectors at every
                  zoom, its shadow and glow baked once.
  render/         One draw pass over the whole scene, viewport-culled.
                  `scene.ts` sets the frame up and runs the layers in order;
                  each `layer-*.ts` is one band of that pass, reading the
                  frame's numbers out of `pass.ts`. `layer-water.ts` is the
                  surface of the sea; `globe.ts` squeezes the painted board
                  onto the turning ball.
  icons/          Every code-drawn illustration (no image assets), one place
                  per file. `index.ts` is the seam everything imports from;
                  `dispatch.ts` holds the `IconKey` switch; `shared.ts` the
                  outline colour and the few helpers they all use.
  canvas-map.tsx  The React shell: state, refs, the panels and the HUD.
  canvas-map/     What the shell hands off: `frame-loop.ts` is the one effect
                  that wires input and runs the requestAnimationFrame loop,
                  plus its constants and shared types.

data/       One fetch per file, localStorage-cached.
hooks/      TanStack Query wrappers + the age gate.
card/       The DOM panels (post card, landmark panel).
checks/     The headless checks. Node only, no browser, no account.
```

## Invariants

These are the rules everything above is built on. If you extend the module,
keep them; several are load-bearing for future multiplayer.

- **The world is deterministic from the window start time.** Every player in
  the same 30-minute window sees the identical world. No `Math.random()` in
  world building; everything seeds from `windowStart` (mulberry32).
- **Position is always `edge + t`.** Two numbers locate any entity, which is
  what will make positions cheap to share later. Nothing stores world x/y as
  its source of truth.
- **The mesh is verified, not assumed**: planar (zero crossings), max degree
  4, minimum 35 degrees between edges at a junction, junction spacing tuned to
  1.5-2s of travel. `world.ts` measures all of this and reports it in
  `world.stats`; if you change generation, the stats will tell on you.
- **`movement.ts` does not change.** Abilities layer on top by reading player
  state or adjusting fuel after `jump()` runs (see `helmets.ts`), never by
  editing the movement integrator.
- **Nothing broadcasts.** Read-only chain access. When gifting/rewards arrive
  they will go through the app's `transactionService`, like every other write
  in Denser.
- **No image assets.** All art is drawn in code (`icons/`, `critters.ts`),
  except real avatars, which come through the app's own proxy.
- **Every user-facing string goes through `t()`.**

## Extending it

- **New landmark**: one line in `lib/fixed-world.ts` (position, link, icon
  key), one icon case in `engine/icons/dispatch.ts` (and a new file beside
  it if the shape is a big one), one label key per locale.
- **New route line**: add a stop list + builder in `lib/routes.ts` and a
  `RouteLayer` (colour/width/dash) where routes are assembled in
  `canvas-map.tsx`. Routes are edge-id lists; they never add geometry.
- **New critter kind**: extend the union + counts + a draw function in
  `engine/critters.ts`. Give it behaviour in `engine/coins.ts` only if it
  interacts with the token economy.
- **New collectable/system**: follow `helmets.ts`; it is the smallest complete
  example (state, create/update/draw, persistence).
- **Porting to another frontend**: `lib/` and `engine/` have two React-free
  external dependencies to replace: the avatar URL helper and the
  localStorage-with-TTL helper. Everything else is canvas + fetch. The React
  shell (`canvas-map.tsx`, `card/`, `hooks/`) is the Denser-specific part.

## The creatures and the lore

Every creature has a name, a nature and a reason to exist. The fiction is
thin on purpose: each one personifies something a real Hive user actually
meets, so the game doubles as a warning label. The thieves take TOKENS
(engine/coins.ts); the nuisances take TIME (engine/hazards.ts). None of them
can kill; a drifting bug sails over all of them, so on the land, jumping is
always the answer.

Off the land it is the opposite, which is the one place that lesson is
turned over. See **The water** below.

| Name | Kind | Count | Nature | What it does |
|------|------|-------|--------|--------------|
| Socko | sock puppet | 14 | trap | A mischievous sock with slanty eyes. Touch it and it envelops the bug and flash-posts it to Mount Socko off the north-west coast: never fatal, always a detour. |
| Blahgart | the word BLAH, walking | 16 | nuisance | Get close and it spits bright green slime; a slimed bug moves at less than half speed for a few seconds. Loud, sticky, avoidable. |
| Sly Grin | scammer | 8 | thief | Golden head, black domino mask, gaucho hat. Snatches 3 carried tokens and dashes for a troll hole. Pounce on it within its getaway to take them back. |
| Drainiac | extractor | 9 | thief | Half again bigger than anything else, four sucker snouts. Latches on and drains carried tokens at 2.4/s into a pouch of 4, then hauls the pouch home. Jump to break the latch. |
| Copypasta | pasta octopus | 11 | nuisance | An octopus made of spaghetti, the same arm pasted eight times. Brush it and the noodles wrap the bug; three quick jumps tear it free. |

All of them serve **Emperor J SON**, a three-headed JSON hydra perched on a
floating rock at the planet's east rim, where the stolen tokens visibly
spiral in. The reference is Hive's actual founding story: in 2020 a new
owner tried to take over the old chain with a ninja-mined stake, and the
community forked away and built Hive. The Emperor hoards; the chain routes
around him. His keep sits alone in the north-eastern void, deliberately
beyond a bare jump: two oxygen helmets (one per consensus witness, 21 in
all) buy the crossing from the rail-head on the northern coast, and all 21
set his hoard loose. Troll holes are his supply lines; whatever a thief
drops down one is his.

## The globe turns

Bryan, 2026-09-15: *"Let's stop this flipping thing. And actually move around
this globe with the bug. Wherever the bug is, when you hit map you're always
centred, and the map rotates. If you're over on the keep of JSON you should be
able to see the edges of Steem, and the citadels would move around."*

So the board is not a card that turns over any more. The world is a ball, and
the map turns it until wherever the bug is standing is facing you.

**Over the land, nothing moves at all.** Bryan, same day: *"If the bug is
anywhere on the Hive logo the view stays the same as always on the map.
Everything looks wrong and stretched, which we don't want. So only when the
bug moves off to the right or left of the Hive logo landmass should the map
view change."* So the turn is not the bug's longitude, it is how far PAST the
land the bug has gone (`LAND_HOLD` in lib/globe.ts). Anywhere between the
landmass's west and east ends — which is most of the board, and all of the
walkable part of it — the globe holds dead still and the map is the one
that has been tuned by hand over eighteen passes. Step off either end into
the open sea and it begins to turn, from nothing, growing as you go.

**The flat board IS the ball, seen face on.** A point at world (x, y) sits at
latitude `sin(lat) = y / PLANET.ry` and longitude `sin(lon) = x / halfWidth(y)`
— which is the plain orthographic projection every drawn globe uses. That has
one very useful consequence: **with the globe at rest the sum is the identity**,
so the resting map is pixel for pixel the map we already had, which is what
Bryan asked for. Turn it by `turn` and a point's screen x becomes
`halfWidth(y) * sin(lon - turn)`. The y never moves.

**The far side is not a second board, it is the back of this one.** The old
chain sits at longitude PI. Turn far enough and its coast comes round the limb
on its own, and crossing over at the Steem Ruins is now a HALF TURN: the camera
pulls out to the map, the world rolls round in a little over two seconds, and
the camera drops back in on the far coast. Nothing is mirrored any more, so the
old chain is read the right way round and left is left when you steer there.

**The citadels are pins, not paint.** They lean out past the limb, so they are
not on the surface; a pin always sits on the ball's silhouette, which works out
to `x' = x * cos(turn)`. The ring closes toward the middle as the world turns,
the half swinging toward you passes IN FRONT of the ball, and the half swinging
away is cut off at the limb and swallowed — which is exactly Bryan's "maybe when
you're over on the keep you don't see all the citadels".

**How it is painted.** Because the turn never moves anything vertically, the
warp is axis-aligned: each board is painted flat onto its own off-screen sheet
exactly as it always was, and copied onto the screen in horizontal rows, each
row cut into columns that narrow toward the limb. No clipping, no shearing, no
per-pixel work, no 3D engine — a few hundred plain image copies a frame. At
rest nothing is copied at all: the board goes straight onto the screen and the
cost is what it always was.

The cursor is rolled back the same way before anything can be under it, so
hovering and travelling on the turned map hit what they look like they hit, and
a spot on the face that has turned away belongs to the other board and answers
to nothing.

## The water

The planet is a sphere with a sea on it, and Hive already names its stake
ladder after sea life, so the ladder swims in it (`engine/sea.ts`,
`engine/icons/sea-life.ts`). Fifty-odd creatures are stocked from the round's
seed, so the water is fresh every 30 minutes and identical for everyone
playing that round.

| Name | Rung | Count | Nature | What it does |
|------|------|-------|--------|--------------|
| Redfish | small stake | 30 | company | Little orange fish with a fan tail. Does nothing to you. |
| Dolphin | middling stake | 12 | company | Fast, curious, harmless. Does nothing to you yet. |
| Orca | big stake | 7 | hunter | Notices a bug adrift within 1900px, chases it down at 430px/s (faster than a drifting bug), opens a mouth full of teeth and swallows it. |
| Whale | biggest stake | 4 | hunter | Notices from 2500px but only makes 215px/s, so it cannot run you down: you blunder into it. Baleen, not teeth. Enormous. |

ONLY A BUG THAT IS DRIFTING AND OFF EVERY LANDMASS IS ON THE MENU. On a
rail, anywhere over land, riding something or reading the map, nothing out
there can reach it; hopping back over a coast is how you get away. Being
swallowed is priced like every other setback in this game: explore mode
costs nothing but the trip, every other mode drops what was being carried,
and the bug is spat back onto the last shore it stood on, stunned. It is
never a death.

Nothing here touches `movement.ts`. The swallow is a phase timer; the frame
loop suspends the integrator while the jaws close and applies the setback
when the timer says so, exactly the way the sock envelop already works. The
creatures are drawn under the land (a whale passes UNDER the coast it swims
past) and are gone from the pulled-out map, where a whale would be a smudge
over the routes.

**Mount Socko** stands on its own isle off the diamond's north-west coast,
a mountain that is unmistakably a sock: a white tube, a darned heel, two
mischievous eyes, the toe for a crater. It is where enveloped bugs get
posted, visible from the full map so the displaced can see how far from
home they are — and it is far: the sock and the keep used to share the
north-east corner and read as one crowded shape, so the sock went west.
On the pulled-out map the isle and the keep lean outward from the planet's
centre like the citadels do: pins in a globe.

**The Steem Ruins** are round the far side of the planet, out of sight. Park
at the rubble off the diamond's western coast and the world rolls half a turn
to bring it up. The far side is the old chain's land: the real Steem mark, in Steem's blue, busted,
pieces missing, cracked to the sea, the rubble lying where it fell, with the
dead grey district standing on its right stroke (a citadel snapped
mid-height, houses that never light, a rusted rail that simply stops) and,
off its coast, a small Blurt island. That break is the fork. Nothing lives
there; the bug rides the rusted tracks alone. It is a banished land
for later. The ruins' one link is the real 2020 post announcing the launch
of Hive: the game's history lesson, told as geography, with a receipt.

Rides are the friendly half of the same idea. One full rotation on the DHF
ferris wheel earns a breath of **spare air** (a whole extra ring on one jump,
then spent). Drifting against a witness citadel catches the light beam: a
ROUND TRIP up to the crown, where the witness's card opens with their real
chain stats (version, last block, missed blocks), then back down, and the
drift resumes with the air topped up. Both are cosmetic transports: the
player's edge-and-fraction position is never touched mid-ride, which is the
invariant that keeps future multiplayer cheap.

## Verification

There is a small headless suite in `checks/`. It runs the real engine in a
plain Node process: no browser, no signed-in account, no test framework, and
nothing to install. From `apps/blog`:

```bash
npx -y tsx --tsconfig tsconfig.json features/hive-frontend-universe/checks/run.ts
```

It builds the world from one fixed round start and holds it to the invariants
above (zero crossings, max degree 4, 35 degrees at a junction, and the same
world twice from the same round), then checks the movement integrator, the
blocks on the lines, the footprints, the keep's ending, the 21 helmets, the
DHF race line and the planet (the isles on its rim, the keep's two-helmet
gap, the back side inside the disc). One file per area, `run.ts` runs them
all, and a failure exits
non-zero. `lib/` and the world-building code are DOM-free, which is what makes
this possible; `localStorage` is simply absent in Node and the storage helper
tolerates that.

During development the game was also driven in a browser harness that runs the
real engine against a scripted player, which is how the numbers in the commit
messages (crossings, gap widths, frame times) were measured. Nothing draws in
the checks: the canvas layers are still verified by eye and by the type
checker.

## Design notes (borrowed deliberately)

Choices in this map lean on patterns from games people love returning to,
studied rather than guessed at:

- **Weenies / landmark hierarchy** (theme parks, Zelda): one mega-silhouette
  per region: the tent, the wheel, the citadel ring, Mount Socko, the shard
  castle. You navigate by shapes, not labels.
- **Visible-but-unreachable** (Breath of the Wild's curiosity gap): the
  Emperor's keep is on the map from minute one and out of jump range until
  the helmet hunt is finished. The question "how do I get THERE" is the
  engine of the collectathon.
- **Danger is legible before it is close** (Hollow Knight's area moods): the
  keep corner has a cold aura and no warm light pool; the friendly places
  glow warm. You read safety by colour temperature.
- **Nuisance, not death** (Mario, not roguelikes): every enemy costs time or
  tokens, never progress. The sock trip is a Super Mario World warp pipe with
  a grudge.
- **Travel itself pays** (Odyssey's reward density): tokens, helmets and
  rides are scattered ON the way between places, so movement is never empty.
- **A daily draw** (live-game rotations): the BUZZING STATION. One landmark a
  day, picked deterministically from the UTC day number so every player sees
  the same pick with no backend, hums in gold and pays double tokens inside
  its ring. Tomorrow it moves; the trap and the endgame never buzz.
- **Completionism is the cheapest loop there is**: the PLACES counter in the
  HUD tracks named places visited, persisted permanently. Parking at a
  landmark marks it forever.
- **Environmental storytelling over exposition** (Hollow Knight): the Steem
  Ruins say everything about the fork without a line of dialogue, and the
  busted Steem mark on the planet's back says it from orbit.

Candidates deliberately left for later passes: visit-A-then-B destination
tickets (Ticket to Ride), an HPUD festival on the 1st of each month, chain
weather (busy windows visibly crowd the world), and badge-shaped achievements
in the HiveBuzz idiom.

## Status

Playable and in active development. The commit messages (search `HFU pass`)
are the changelog and each one ends with a KNOWN ISSUES section that says
plainly what is stubbed, unverified or ugly. Current known gaps: thieves walk
straight lines over water, banking has no reward beyond the counter, and
token gifting as post comments is designed but deliberately unbuilt (it
would broadcast).
