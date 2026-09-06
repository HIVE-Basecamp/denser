# Why people come back to adventure games, and what H.I.V.E.R. can borrow

Research note. Written 2026-09-05 against primary sources (developer talks,
developer interviews, the original papers). Secondary write-ups are used only
where they quote the primary source, and are marked as such. Nothing in this
file is a decision. Every idea for the game is marked PROPOSAL.

Word rules used here, from `apps/blog/features/basecamp/CONTEXT.md`: new user
(account under a year old), OG user (a year or older), curator (anyone judging
an account by looking at it), guide, support (an upvote or a reply on a new
user's post), patrol (spotting bots, scammers, spammers, extractors). Code
identifiers such as `isNewcomer`, `buildNewbieTrail` and the HUD label `NEWBS`
are quoted as they appear in the code; in prose the word is new user.

`HANDOFF.md` is an AI paraphrase of earlier sessions: used for orientation
only, never quoted as the owner's words.

---

## 1. Summary

1. The games people return to on their own share a small set of habits, and
   the designers say so in their own talks.
2. The strongest is a visible question: something you can see but cannot yet
   reach or understand. Zelda, Outer Wilds and Metroid all name it.
3. The second is a world that answers "what if I try this" in more than one
   way. Nintendo calls it multiplication.
4. The third is reward on the road, not at the destination. Odyssey and
   Hollow Knight hide something behind every wall.
5. The fourth is a clock shared with the real world, so the place has changed
   when you come back. Animal Crossing built its whole design on it.
6. The fifth is a world worth talking about: fixed secrets, so friends can
   trade tips. Miyamoto designed the first Zelda for exactly that.
7. The research behind all of it: people keep doing things that let them
   choose, get better, and feel connected (Self-Determination Theory), and
   curiosity is a gap between what you know and what you want to know.
8. H.I.V.E.R. already has most of the bones: a visible keep, fixed helmet
   spots, tokens on the rails, a 30-minute reweave, a daily buzz.
9. It stops short in three places: nothing records what the player has
   learned about Hive, the calendar only reaches one day, and the
   "connected" need is served only by leaving the game.
10. Every fix below is a proposal. None broadcasts, none touches
    `movement.ts`, none adds image assets, none breaks the deterministic
    30-minute world.

---

## 2. Mechanisms

Each section: the rule in one sentence, the games and sources that prove it,
what the designers said, then a PROPOSAL tied to code that exists today.

### 2.1 The visible question: show the goal before it can be reached

**Rule.** Put the far-off thing on screen from the first minute, and make the
question "how do I get there" the engine of play.

**Who proves it.**

- *Breath of the Wild.* At GDC 2017 ("Change and Constant: Breaking
  Conventions with The Legend of Zelda: Breath of the Wild", Fujibayashi,
  Dohta, Takizawa) the director described a landscape that "asks" the player
  which way to go. Session page: https://www.gdcvault.com/play/1024562/Change-and-Constant-Breaking-Conventions
  (members only). Quotes below come from the Shacknews write-up of the talk:
  https://www.shacknews.com/article/99265/how-breath-of-the-wild-challenged-conventions-in-zelda-games
- *Tears of the Kingdom.* Nintendo's own "Ask the Developer Vol. 9", Part 1:
  the team wanted players "to continue exploring the world after they've
  reached the game's ending." https://www.nintendo.com/us/whatsnew/ask-the-developer-vol-9-the-legend-of-zelda-tears-of-the-kingdom-part-1/
- *Outer Wilds.* GDC 2021 slides, "Sparking Curiosity-Driven Exploration
  Through Narrative in Outer Wilds" (Kelsey Beachum, Mobius Digital
  contractor): exploration "Starts with a question... What's there? What is
  it? What is it like up close?" (slide 14). Big events are shown, not told:
  "Large, noticeable alien ruins", "the sun literally explodes" (slide 31).
  https://media.gdcvault.com/GDC+2021/beachum_gdc_2021(1).pdf
- *Metroid.* Iwata Asks, Metroid: Other M, Sakamoto: "'It looks like I can go
  over there'" and "this place looks suspicious" are what Metroid is about.
  https://iwataasks.nintendo.com/interviews/wii/metroid-other-m/0/1/
- *The research.* Loewenstein (1994) defines curiosity as a feeling caused by
  "a gap in knowledge and understanding" (quoted in Kidd and Hayden 2015,
  Neuron: https://pmc.ncbi.nlm.nih.gov/articles/PMC4635443/ ). Golman and
  Loewenstein (2016) define an information gap as "a specific uncertainty
  that one recognizes and is aware of."
  https://www.cmu.edu/dietrich/sds/docs/golman/Information-Gap%20Theory%202016.pdf

**What they said.** Fujibayashi (via Shacknews): "so, which path are you going
to take?" Aonuma, on the "open air" idea (Nikkei Trendy, May 2017, quoted by
GoNintendo): players "find out your own 'answer'".
https://gonintendo.com/stories/279789-aonuma-on-making-zelda-breath-of-the-wild-open-air-continuing

**What H.I.V.E.R. already does.** The README's design notes name this pattern
("Visible-but-unreachable"). Emperor J SON's keep is on the map from the
start and out of jump range (`README.md`, "The creatures and the lore").
`engine/helmets.ts` places eight void helmets by hand, and its comment says
the last ones form "a deliberate breadcrumb line toward the keep: each one is
a stepping stone you can only reach with the air the previous ones gave you."
Mount Socko is placed so a displaced bug "can see how far from home they are."

**Where it stops short.** The keep is the only big visible question. Once two
helmets are held (`helmets.ts` header: "TWO helmets buy the crossing") the
question is answered, and the remaining 19 helmets are a counter, not a
question. Outer Wilds' slide 66 layers questions in three levels: surface,
mid, hidden, "Answers to mysteries are always at this level" (hidden).

**PROPOSAL.** Give the void more than one visible question, without new
systems. The twelve floating island chips (`lib/fixed-world.ts`,
`ISLAND_CHIPS`) already sit in void pockets. Make two or three of them visibly
out of drift range with a hut light on, so the map poses several "how do I get
THERE" questions at different helmet counts (the `o2Multiplier` ladder in
`helmets.ts` already defines what each count can reach). No new mechanics:
placement only, plus a check in the world stats that each chip is reachable at
some count, the way `world.ts` already measures crossings and gaps. This keeps
the deterministic world and leaves `movement.ts` alone.

### 2.2 Multiplication: one verb, many answers

**Rule.** Give the player a few actions that work everywhere, then build a
world where those actions combine, so the player finds solutions the designer
did not script.

**Who proves it.**

- *Breath of the Wild.* GDC 2017, Fujibayashi, on "multiplicative gameplay"
  (via Thumbsticks: https://www.thumbsticks.com/gdc-17-breaking-conventions-breath-of-the-wild/ ):
  "I wondered if I could use this idea of multiplication" for puzzles; the
  goal was "the active game I had envisioned." The team proved the idea in a
  2D prototype styled after the 1986 Zelda before building the 3D world
  (reported by TechSpot from the same talk:
  https://www.techspot.com/news/68369-nintendo-created-2d-prototype-breath-wild-modeled-after.html ).
- *Tears of the Kingdom.* Ask the Developer Vol. 9, Part 4, Fujibayashi: "We
  often say that we should 'create games through multiplication.'"
  https://www.nintendo.com/us/whatsnew/ask-the-developer-vol-9-the-legend-of-zelda-tears-of-the-kingdom-part-4/
  Part 5, Dohta: the team built "a game that enables players to do exactly
  what they think they can do." Fujibayashi: "We'd rather our players
  surprise us."
  https://www.nintendo.com/us/whatsnew/ask-the-developer-vol-9-the-legend-of-zelda-tears-of-the-kingdom-part-5/
- *Metroid.* Sakamoto (Iwata Asks, above): "trying out various things is
  what Metroid is all about."

**What they said.** Dohta (GDC 2017, via Shacknews): "finding roundabout
solutions and shortcuts is fun", and that is "the correct way to play."
Fujibayashi (Part 5): "Once we define how we want players to play the game,
it ends up becoming more and more linear."

**Why this matters for the growth model.** The owner's stated model is "like
Zelda, from a really simple idea, growing more elaborate." Nintendo's own
account of how that works is: pick a small set of verbs, test them in a tiny
2D version, then let the world multiply them. H.I.V.E.R. is already the tiny
2D version.

**What H.I.V.E.R. already does.** One verb, the jump into drift, is the answer
to everything: `engine/hazards.ts` ("A DRIFTING bug is immune to all
three"), `engine/coins.ts` ("nothing catches a bug mid drift"),
`engine/projectiles.ts` ("A DRIFTING bug is immune to enemy fire"). The
helmets multiply the verb by reach (`o2Multiplier`), spare air multiplies it
once (`spareAir` in `helmets.ts`). This is the multiplication pattern in
miniature, and `movement.ts` is frozen by rule, which is the right shape:
abilities read the state and adjust fuel after `jump()`.

**Where it stops short.** The verbs do not yet combine with each other or
with the world's objects. Tokens are collected, banked, stolen and spent on
shots, but they do not change how the bug moves or what it can open. Rides
are cosmetic by design (README: "the player's edge-and-fraction position is
never touched mid-ride"). There is only one "what if I try this" in the world
today: jumping.

**PROPOSAL.** Add one more verb-with-consequence and let existing objects
respond to it, rather than adding new objects. Candidates that stay inside
the invariants: (a) carrying tokens while drifting could extend the drift
ring slightly (fuel top-up after `jump()`, the sanctioned pattern), which
makes "carry more, reach further, risk more" a live decision against the
thieves in `coins.ts`; (b) the witness light beam already catches a drifting
bug (README, "Rides"); the ferris wheel already boards by proximity
(ART-DIRECTION pass eighteen). A third catch, at the json factories in
`engine/scenery.ts`, could bank tokens mid-drift. Each is a rule layered on
top of the existing integrator, never inside it. Test each one in the browser
harness the README describes before it stays.

### 2.3 Landmarks you steer by, and "gravity" toward the interesting

**Rule.** Build the world out of a few unmistakable shapes at three sizes:
big ones to steer by, medium ones to hide what is behind them, small ones to
give the road rhythm.

**Who proves it.**

- *Breath of the Wild.* The "triangle rule" was presented by Nintendo at
  CEDEC 2017 (not the GDC talk). Kotaku's write-up of the CEDEC session:
  https://kotaku.com/breath-of-the-wilds-biggest-design-secret-lots-of-tria-1819113140
  It also reports that Nintendo tracked early players' footsteps, found they
  "were sticking to certain areas of the map and never venturing into
  others", and answered by placing points of interest in the empty regions.
  This is a secondary report of a Japanese-language session; treat the
  details as reported, not verified.
- *The first Zelda.* Miyamoto, 1989 interview (translated by Shmuplations,
  reported by Game Developer): he wanted "the same feeling you get when you
  are exploring a new city for the first time."
  https://www.gamedeveloper.com/design/in-1989-miyamoto-laid-out-his-original-design-goals-for-i-zelda-i-
  Original translation: https://shmuplations.com/zelda/

**What they said.** Miyamoto (1989): "exploring a new city for the first
time."

**What H.I.V.E.R. already does.** The README's first design note is
"Weenies / landmark hierarchy": one mega-silhouette per region, "You navigate
by shapes, not labels." `ART-DIRECTION.md` adds five fixed constellations
"so they double as unlabeled navigation landmarks", plus the LOD rule
("identity from afar, elaboration up close"). Pass eighteen's "use the real
estate" correction (occupy the void with chips and gems) is the same lesson
Nintendo drew from its footstep heat map.

**Where it stops short.** There is no medium size. The world has big shapes
(tent, wheel, citadel ring, sock mountain, shard castle) and small scatter
(gems, tokens, cubes), but few things at the middle scale that hide a view
until you round them. On a flat map the "hide and reveal" job is done by
zoom, not by shape.

**PROPOSAL.** Use the planned lairs and channel stations (ART-DIRECTION
backlog) as the medium tier on purpose: place each so that it blocks the line
of sight to one small reward from the nearest rail, so rounding it is a
reveal. This is placement in `lib/fixed-world.ts` plus an icon case in
`engine/icons.ts`, the README's "New landmark" recipe, and nothing else.

### 2.4 Reward on the road: something every couple of minutes

**Rule.** Put the rewards on the way between places, densely enough that a
two-minute session pays and a two-hour session never runs dry.

**Who proves it.**

- *Super Mario Odyssey.* Director Kenta Motokura, TIME, E3 2017: "If you have
  two or three minutes and you're on the go, you can collect Power Moons
  because they're hidden everywhere."
  https://time.com/4816417/super-mario-odyssey-interview-e3/
  Same director, TIME, October 2017: "a very great density of gameplay
  elements packed into this world."
  https://time.com/4997917/super-mario-odyssey-nintendo-switch/
- *Hollow Knight.* William Pellen (Team Cherry) to Kotaku: "if they found a
  breakable wall, there could be anything behind it."
  https://kotaku.com/the-makers-of-hollow-knight-are-fine-with-players-missi-1828721254
  Ari Gibson to PC Gamer (quoted by SUPERJUMP): "all of it's built around
  this sense of discovery."
  https://www.superjumpmagazine.com/getting-lost-by-design-in-hollow-knight/

**What they said.** Motokura: "hidden everywhere." Pellen: "there could be
anything hidden."

**What H.I.V.E.R. already does.** `engine/coins.ts`: tokens "sit ON edges...
so collecting happens while you travel rather than as a detour." Its
`MIN_TOKENS = 55` floor has a reason written next to it: at 14 tokens, "900
frames of wandering met exactly none of them, which is not a game."
`engine/gems.ts` puts 22 gems on rails and 12 in the void so the empty spaces
"glitter with something worth a detour." The README names this pattern
("Travel itself pays").

**Where it stops short.** The reward is a number in the HUD. `gems.ts` says
so plainly: gems "deliberately do NOTHING else yet." The README's Status
section: "banking has no reward beyond the counter." Odyssey's moons open the
next kingdom; Hollow Knight's secrets are charms, maps, and shortcuts.
H.I.V.E.R.'s rewards do not yet open anything.

**PROPOSAL.** Let banked tokens and gems buy one thing each, chosen from what
already exists. Banked tokens (safe forever, `coins.ts`) could unlock travel
map warps to places not yet visited (see 2.9). Gems could fill the ferris
trophy sockets (ART-DIRECTION backlog: "8 gondola sockets, bring an item,
ride one rotation, it mounts") which pass eighteen started with the first
helmet mount (`wheelTrophiesRef` in `canvas-map.tsx`). Both are session or
board scoped, so neither needs a backend or a broadcast.

### 2.5 Fixed secrets, so friends can trade tips

**Rule.** Hide things in places that never move, so a player can learn a
spot, tell someone, and go back.

**Who proves it.**

- *The first Zelda.* Miyamoto, Nintendo UK's NES Classic Mini interview
  (2016): players of early RPGs were "calling each other at night to exchange
  information", and he wanted that for Zelda.
  https://www.nintendo.com/en-gb/News/2016/November/Nintendo-Classic-Mini-NES-special-interview-Volume-4-The-Legend-of-Zelda-1160048.html
- *Hollow Knight.* Pellen (Kotaku, above): "It's easy to underestimate how
  good people are at finding stuff." Gibson: a found secret "makes it more
  special for that person."
- *Animal Crossing: New Leaf.* Iwata Asks, page 6, Moro: "if you do discover
  something interesting like that in the game, you can tell other players."
  https://iwataasks.nintendo.com/interviews/3ds/animalcrossing-newleaf/0/5/
- *Tears of the Kingdom.* Ask the Developer Part 5, Dohta, on two players
  comparing notes: "each learns for the first time about what the other is
  playing."

**What they said.** Miyamoto: "calling each other at night to exchange
information."

**What H.I.V.E.R. already does.** `engine/helmets.ts` states the rule in its
header: "PLACEMENT IS FIXED FOREVER, not per window: hidden things are only
worth hiding if players can learn the spots, tell each other, and go back."
Thirteen land helmets are seeded from a constant (`PLACEMENT_SEED`), eight
void helmets are hand placed. The world itself is identical for every player
in the same 30-minute window (`README.md` Invariants; `engine/world.ts`
`buildWorld(windowStart, ...)`).

**Where it stops short.** The helmets are fixed; almost nothing else is.
Tokens, gems, factories, cubes and critters reseed every window
(`coins.ts`, `gems.ts`, `scenery.ts`). There is one class of permanent
secret. And there is no way, inside the game, to tell anyone anything. That
last part is by design (nothing broadcasts), but the ETHOS puts
"Collaboration on every level" and "connection" at the centre, so the gap is
worth naming.

**PROPOSAL.** Two small things, neither a broadcast. First, add a second
fixed-forever class: a handful of the planned gems or chips whose positions
never move, so there is more than one thing worth telling a friend about.
Second, make the "same world" fact visible: the HUD already shows `WINDOW`
(`hive_frontend_universe.hud.window`); a shareable page link that includes
the window start would let two people confirm they are looking at the same
board. `data/cache.ts` keeps the two newest windows, so a link a few minutes
old still resolves. This is read-only and needs no server. Whether a link is
enough "connection" is an open question for the owner (section 4).

### 2.6 Knowledge as the reward, and a log that shows the gap closing

**Rule.** When the reward for exploring is understanding, keep a record of
what the player has learned, phrased as questions with some answers still
blank, so the gap stays visible.

**Who proves it.**

- *Outer Wilds.* Alex Beachum (creative lead), Game Developer: "If we remove
  any other reason you could possibly want to explore... all that's left is
  you wanting to piece together what's going on." And: the loop "focuses on
  knowledge being the only real thing of value."
  https://www.gamedeveloper.com/design/live-die-repeat-how-i-outer-wilds-i-piques-curiosity-in-an-ambivalent-solar-system
  GDC 2021 slides (above): "Knowledge is the only gameplay reward" (slide
  15); the ship computer records "only what we're 100% certain the player
  knows" (slide 60); content is layered surface, mid, hidden (slide 66); "if
  players started feeling their efforts are wasted... the gameplay loop breaks
  down" (slide 72).
- *Hollow Knight.* The map is bought incomplete from Cornifer and fills in as
  you explore (SUPERJUMP, above, describing the system).
- *The research.* Kidd and Hayden (2015), summarising Loewenstein: "a small
  information dose acts as a priming stimulus", and curiosity is highest at
  intermediate confidence, low when you know nothing or everything. Kang,
  Hsu, Krajbich, Loewenstein and others (2009, Psychological Science) found
  subjects "spent more scarce resources" to learn answers when curious, and
  that curiosity followed an inverted U against confidence.
  https://asu.elsevierpure.com/en/publications/the-wick-in-the-candle-of-learning-epistemic-curiosity-activates-/

**What they said.** Beachum: people cannot be curious about something
specific "unless they're already familiar with everything in their immediate
vicinity." Slides: "Don't TELL me why I care; MAKE me care!" (slide 78).

**Why this is the mechanism that fits the owner's goal.** The stated goal is
a game where "the very act of playing teaches you what Hive is." Outer Wilds
is the one commercial game whose entire reward system is learning, and its
team documented how they did it. The lesson is not "add a quiz." It is:
make the real things visible, let the player pull the information when they
want it (slide 37: "make that info available, signal its availability, and
let the player decide when to access it"), and keep a plain record of what
has been seen.

**What H.I.V.E.R. already does.** Much of the world IS information about
Hive, pulled not pushed: the witness beam ride ends at the witness card with
"their real chain stats (version, last block, missed blocks)" (README,
"Rides"); the Steem Ruins' single link is "the real 2020 post announcing the
launch of Hive" (README); communities "dim-until-visited" and light when
entered (`canvas-map.tsx`); the token count is minted from the window's real
`custom_json` operations (`coins.ts`); the PLACES counter persists forever
(`hfu-visited` in `canvas-map.tsx`). `lib/targets.ts` guarantees every
visible thing "resolve[s] to a real page."

**Where it stops short.** Nothing records what the player has learned. PLACES
records where the bug parked, not what was seen there. There is no equivalent
of the ship log: no "you have opened 3 of 21 witness cards", no "you have seen
the fork", no unanswered question left on screen. The Steem Ruins teach the
fork once; nothing asks the question before you get there, and nothing
confirms you got the answer.

**PROPOSAL.** A field log, HUD only (ART-DIRECTION: "Text lives in the HUD
only, never in the world"), stored the way `hfu-visited` is stored. Entries
are facts the game can prove the player saw, Outer Wilds style: "Rode a
witness beam (3 of 21)", "Entered a community (2 of N)", "Reached the Steem
Ruins", "Saw a thief reach a troll hole." Entries start as short questions
("What stands in the western void?") and flip to the answer when the event
fires. Three levels, like slide 66: surface (parking at a landmark), mid
(opening a witness card, entering a community), hidden (the ruins, the keep).
All the trigger points already exist in `canvas-map.tsx` (the `atNode`
branch, the beam hold, the community entry). This must stay a log of what was
seen, never a verdict about any real account: `lib/observations.ts` stores
player judgements about accounts and its own header says transport is
"intentionally UNBUILT", and the standing rule is that no trust or flagging
feature is built before the trust-model conversation. The log is visual
indicator, not conclusion (ETHOS, "Visual indicators, not conclusions").

### 2.7 A clock shared with the real world

**Rule.** Let real time move the world, so it is different when the player
returns and everyone shares the same season.

**Who proves it.**

- *Animal Crossing.* Iwata Asks, New Leaf, page 2, Moro: "a really nice
  aspect of Animal Crossing is the sense of unity that comes from time
  passing in sync with the real world." Kyogoku: 24-hour shops would defeat
  "the whole point of having time in sync with the real world", so the mayor
  gets to set shop hours instead.
  https://iwataasks.nintendo.com/interviews/3ds/animalcrossing-newleaf/0/1/
  Page 6, Takahashi: "the ground and the leaves will gradually change
  color... this is a game you can enjoy playing for a long time."
  https://iwataasks.nintendo.com/interviews/3ds/animalcrossing-newleaf/0/5/
  Katsuya Eguchi, series creator, Gamasutra 2006: the clock came from his
  family playing at different hours: "even though we're not playing at the
  same time, we're still sharing things together."
  https://www.gamedeveloper.com/design/crossing-into-the-mainstream-katsuya-eguchi-on-i-animal-crossing-i-
- *Stardew Valley.* The official description is built on days and seasons
  ("seasonal festivals such as the luau, haunted maze, and feast of the
  winter star"), each character "with their own schedules."
  https://www.stardewvalley.net/about/
- *Pokémon GO.* Niantic's John Hanke (GamesBeat, 2016): "You have to go
  outside and visit new places." "There's a lot of cool history and lore and
  unknown secrets in your own neighborhood."
  https://gamesbeat.com/the-accidental-history-of-niantics-pokemon-go-as-told-by-john-hanke/
  Niantic's GDC 2017 session, "'Pokemon GO' & Designing Interactive Games for
  the Real World" (Dennis Hwang): https://gdcvault.com/play/1024376/-Pokemon-GO-Designing-Interactive

**What they said.** Moro: "time passing in sync with the real world."
Eguchi: "we're still sharing things together."

**What H.I.V.E.R. already does.** This is the game's strongest match. The
world is "deterministic from the window start time" (`README.md`
Invariants), `lib/board.ts` fixes `WINDOW_MS = 30 * 60 * 1000`, and
`engine/world.ts` `buildWorld(windowStart, houseCount)` reweaves the mesh
every half hour from the real posts of that half hour. Token supply is the
real `custom_json` count (`coins.ts`, `OPS_PER_TOKEN = 1000`). Particle
flows scale with real vote, comment and transfer counts (README, "What is
real"). The BUZZING STATION is picked "from the UTC day number alone, no
backend" (`canvas-map.tsx`), so every player shares the same daily pick.
Real time is already the world's heartbeat, and it is a shared one, which is
Eguchi's point exactly.

**Where it stops short.** The clock has two speeds, 30 minutes and one day,
and nothing slower. Animal Crossing's return loop runs on a week (shops,
visitors), a month (fish, bugs) and a year (festivals, leaves). H.I.V.E.R.
has no reason to come back on a Tuesday rather than a Monday, and no reason
tied to the month. The README lists two deferred candidates that would fix
this: "an HPUD festival on the 1st of each month" and "chain weather (busy
windows visibly crowd the world)."

**PROPOSAL.** Add one slower hand to the clock before adding anything else:
the 1st-of-month festival the README already names, seeded from the UTC date
the way the buzz is, so it needs no backend. Keep it read-only and visual
(the tent heart beats faster, the wheel fills, a second buzzing station).
Chain weather is the next hand: the ambient counts in `data/ambient-counts.ts`
already exist, so a "busy half hour" could visibly crowd the rails with more
particles and more tokens (the `MAX_TOKENS` ceiling in `coins.ts` bounds it).
Test with Percy whether a monthly event reads as an invitation or as
homework.

### 2.8 Short sessions that end well

**Rule.** A player who has three minutes should leave with something, and
should be able to see what they got.

**Who proves it.**

- *Super Mario Odyssey.* Motokura (TIME E3 2017, above): "two or three
  minutes... you can collect Power Moons."
- *Animal Crossing.* The daily visit is short by design; the mayor sets shop
  hours to fit "your own lifestyle" (Moro, Iwata Asks New Leaf page 2).
- *Outer Wilds.* Slide 42: players reach the first alien text anywhere from
  "30 minutes to 2-3 hours" in, and "story can wait until the player is good
  and ready."

**What H.I.V.E.R. already does.** The Newb Trail is a 30-minute quest by
construction: `buildNewbieTrail` in `lib/routes.ts` orders the window's new
user posts (`board.houses[...].isNewcomer`, `lib/board.ts`,
`ageDays < YEAR_DAYS`) into a hot-pink dashed road; visiting every one before
the window turns awards one gem (`canvas-map.tsx`, `visitedNewbsRef`,
`newbAwardedRef`, reset each window). Gems are "a fresh scatter every
30-minute board" (`gems.ts`). Spare air is "Session-only on purpose: ride
again, breathe again" (`helmets.ts`).

**Where it stops short.** There is no end-of-board moment. When the window
turns, the trail resets and the gems vanish with no summary. The player who
visited four of five new users gets nothing and is not told they were one
short. Outer Wilds' slide 72 (see 2.6) is the warning.

**PROPOSAL.** A board-end card in the HUD, one line per thing that happened
this window: tokens banked, gems found, new users visited (4 of 5), rides
taken. Draw it once at the window turn, 1.5 seconds or less (ART-DIRECTION:
"one-shot celebrations 1.5s or less"), then let the new board load. All the
numbers already exist in the HUD state passed to the renderer
(`canvas-map.tsx`, the `places`, `newbs`, `gems` fields). No persistence
needed beyond what is already there.

### 2.9 Home, benches, and travel that costs something

**Rule.** Give the player a home to return to and make getting around a
skill, so the map itself becomes knowledge.

**Who proves it.**

- *Hollow Knight.* Team Cherry, Nintendo Australia interview: players "can
  always withdraw to town, gear up, and choose somewhere new to explore."
  https://www.nintendo.com/au/news-and-articles/the-metamorphosis-of-hollow-knight-with-team-cherry-aussie-developer-interview/
  The map is bought incomplete and fills in as you explore; markers only mark
  where you have been (SUPERJUMP, above).
- *Metroid.* Iwata Asks Other M, Hayashi (Team Ninja): the game is full of
  places a player might "pass by without noticing at first, but then go back."
  https://iwataasks.nintendo.com/interviews/wii/metroid-other-m/0/1/

**What H.I.V.E.R. already does.** Basecamp is home: three hits and the bug
is sent "home to Basecamp, carried tokens dropped: not a death"
(`canvas-map.tsx`, `engine/combat.ts`). Mount Socko is a forced detour
(`hazards.ts`). Communities and the PLACES list follow a "dim-until-visited
grammar" (`canvas-map.tsx`), which is Hollow Knight's fog-of-war idea (the
map shows only what you have seen) in H.I.V.E.R.'s own words.

**Where it stops short.** The travel map warps the bug to any travelable
landmark for free (README, "Controls": "clicking any landmark warps you
there"). That makes learning the rails optional. Hollow Knight and Metroid
make the route itself the thing you learn, and the fast travel you earn.

**PROPOSAL.** Limit travel-map warps to places already visited (the
`hfu-visited` set) and let banked tokens buy a warp to an unvisited one.
This turns the existing PLACES loop into a fast-travel network the player
earns, exactly the dim-until-visited grammar applied to warps. `travelable`
is already computed per node in `canvas-map.tsx`, so this is a filter, not a
new system. This one changes how the game feels for a first-time player and
should be a playtest question, not a default (section 4).

### 2.10 The three needs: choosing, getting better, belonging

**Rule.** People keep doing an activity that lets them choose (autonomy),
feel effective (competence), and feel connected (relatedness); games that
serve all three are the ones people return to.

**Who proves it.**

- Ryan, Rigby and Przybylski (2006), "The Motivational Pull of Video Games:
  A Self-Determination Theory Approach", Motivation and Emotion 30(4),
  347-363. Four studies. In-game autonomy and competence predicted enjoyment
  and well-being; in an online multiplayer community, autonomy, competence
  and relatedness "independently predict enjoyment and future game play."
  Abstract: https://pure.ewha.ac.kr/en/publications/the-motivational-pull-of-video-games-a-self-determination-theory-/
  Publisher: https://link.springer.com/article/10.1007/s11031-006-9051-8
- Przybylski, Rigby and Ryan (2010), "A Motivational Model of Video Game
  Engagement", Review of General Psychology. The model "predicts sustained
  engagement over time." Competence is "sense of efficacy", autonomy is
  "volition and personal agency", relatedness is "social connectedness."
  https://selfdeterminationtheory.org/SDT/documents/2010_PrzybylskiRigbyRyan_ROGP.pdf

Plain-English version: Self-Determination Theory (SDT) is a theory of
motivation. It says people stick with things that let them choose for
themselves, feel they are getting good at it, and feel they matter to others.
The 2006 paper measured this in games and found the same three things
predicted whether people wanted to play again.

**What H.I.V.E.R. already does.**

- *Choosing.* The two-layer intent (a way to move through hive.blog, and a
  game you can ignore) is autonomy by design. Nothing is assigned. The Newb
  Trail is optional. The README's "Click anything to see where it leads" is
  the whole loop.
- *Getting better.* The helmet ladder is a real competence curve: each helmet
  adds 0.12 rings of air (`O2_PER_HELMET`, `helmets.ts`), and the drift
  range visibly grows. The combat pass (`engine/projectiles.ts`,
  `engine/combat.ts`) adds aim and dodge.
- *Belonging.* Every post is a real person with their real avatar (README,
  "What is real"), and every new user's post is a stop on the trail.

**Where it stops short.** Belonging is served only by leaving the game. The
arrival panel offers "Open" (`hive_frontend_universe.panel.open`); the act of
support (an upvote or a reply, CONTEXT.md) happens on the post page, in the
person's own hands, which is correct and must stay so. But inside the game
nothing says that this is what a stop on the trail is for. A curator who
plays the trail sees five new users and a gem; the game never says "these
five posted this half hour and none of them has a reply yet."

**PROPOSAL.** One line of HUD text at a new user's house, drawn from data the
board already fetched: the post's reply count is in the post object
(`lib/board.ts` builds houses from real posts). "0 replies so far" is an
indicator, not a conclusion (ETHOS). It gives the trail a reason a curator can
act on, off-game, in their own hands. No broadcast. Whether to show the count
at all is the owner's call; it touches how new users are presented (section
4).

### 2.11 Failure that costs time, never knowledge

**Rule.** Let the player lose time or loot, never progress or understanding.

**Who proves it.**

- *Outer Wilds.* The loop resets everything except what the player knows
  (Beachum: "The only thing you can bring back in time with you is your
  memories", Game Developer, above).
- *Hollow Knight.* Team Cherry (Nintendo Australia): "don't hesitate to leave
  a challenge for later if it's frustrating you!"
- *Tears of the Kingdom.* Aonuma (Part 5): "It's more fun with detours."

**What H.I.V.E.R. already does.** The README rule: "None of them can kill."
`hazards.ts`: nuisances "cost TIME, which is the point." `coins.ts`: thieves
take carried tokens, banked tokens "are safe forever." Helmets and PLACES
persist permanently (`StorageTTL.PERMANENT`). The sock trip is a detour with
a view of home.

**Where it stops short.** The combat pass introduced a respawn: three hits and
the bug goes home with carried tokens dropped (`combat.ts`, `MAX_HITS = 3`).
That is still "time and loot, not progress", so it fits, but it is the first
mechanic where the world pushes back hard. Percy's read on whether it still
feels like nuisance rather than death is the test.

**PROPOSAL.** None needed beyond keeping the rule. If the field log (2.6)
exists, make sure a respawn never clears it, so the Outer Wilds property
holds: you can lose the tokens, you cannot lose what you learned.

### 2.12 The map is a real place

**Rule.** When the game's map is a real place, exploring the game teaches
the place, and the place gives the game endless free content.

**Who proves it.**

- *Pokémon GO.* Hanke (GamesBeat, above): the game makes you "visit new
  places" and find "unknown secrets in your own neighborhood."
- *Animal Crossing.* Eguchi (2006): shared life across time zones was the
  origin of the design.

**What H.I.V.E.R. already does.** This is the founding idea: "the game is
another way to navigate the site" (README, first paragraph). `lib/targets.ts`
is "the one place that mapping lives", so the hover chip, the click and the
arrival panel "can never disagree about where a thing goes." Witnesses are
"the actual top 21 consensus witnesses, in vote order." The player rides
their own avatar.

**Where it stops short.** The player's own neighbourhood is missing. A new
user's own post appears on the board only if it was written in the current
half hour, and nothing marks it as theirs. CONTEXT.md says the point of
Basecamp is "A new user changing what their card says by going and doing
things on Hive." The game does not yet show the player that their own action
changed the world.

**PROPOSAL.** When the signed-in player's own post is on the board, mark
their house (a ring, code-drawn, `engine/icons.ts`) and name it in the HUD:
"Your post is on this board." Read-only, uses data already fetched
(`board.houses[i].author` against the signed-in account from
`hooks/use-sign-in-gate.ts`). It is the smallest possible version of "you
did a thing on Hive and the world changed", which is the sentence the game
is for.

---

## 3. What H.I.V.E.R. already does that matches the sources, and where it stops short

A compact table. File paths are relative to
`apps/blog/features/hive-frontend-universe/`.

| Mechanism | Already in the game | File | Stops short |
|---|---|---|---|
| Visible question | Keep visible from minute one, out of range; breadcrumb helmets toward it | `README.md`, `engine/helmets.ts` (`VOID_HELMETS`) | One question only; answered at two helmets |
| Multiplication | One verb (drift) beats every hazard; helmets and spare air extend it | `engine/hazards.ts`, `engine/coins.ts`, `engine/projectiles.ts`, `engine/helmets.ts` | Verbs do not combine with each other or with objects |
| Landmarks and gravity | One mega-silhouette per region; fixed constellations; "use the real estate" | `README.md` design notes, `ART-DIRECTION.md`, `lib/fixed-world.ts` | No medium-scale shapes that hide and reveal |
| Reward on the road | Tokens on edges, gems on rails and in void, 55-token floor with a reason | `engine/coins.ts`, `engine/gems.ts` | Rewards are counters; gems do nothing; banking has no reward |
| Fixed secrets | Helmets fixed forever so players can tell each other | `engine/helmets.ts` | Only one fixed class; no way to tell anyone in-game |
| Knowledge as reward | Witness cards with real stats, Steem Ruins link, dim-until-visited communities, PLACES | `README.md`, `engine/canvas-map.tsx`, `lib/targets.ts` | Nothing records what was learned; no open questions on screen |
| Shared clock | 30-minute reweave from real posts; tokens from real ops; daily buzz | `lib/board.ts`, `engine/world.ts`, `engine/coins.ts`, `engine/canvas-map.tsx` | No weekly or monthly hand; no chain weather yet |
| Short sessions | Newb Trail per window; per-board gems; session-only spare air | `lib/routes.ts`, `engine/canvas-map.tsx`, `engine/gems.ts` | No end-of-board moment; partial trail earns nothing |
| Home and travel | Basecamp as respawn; Socko detour; dim-until-visited | `engine/combat.ts`, `engine/hazards.ts`, `engine/canvas-map.tsx` | Free warp anywhere makes route knowledge optional |
| Three needs | Autonomy by design; helmet competence ladder; real people | whole module | Belonging served only by leaving the game |
| Nuisance not death | No kills; time and loot only; permanent progress | `README.md`, `engine/hazards.ts`, `engine/coins.ts` | Respawn is new; needs a playtest read |
| Real place | Every thing links to a real page; real witnesses; own avatar | `lib/targets.ts`, `data/*.ts` | Player's own post is not marked |

Three things the sources praise that H.I.V.E.R. gets right and should not
lose:

1. The world is the same for everyone in a window. That is Animal Crossing's
   shared clock and Zelda's "tell your friends" in one invariant.
2. Real data is the content. Pokémon GO's whole business is that the real
   world is free content; H.I.V.E.R. has the same source in the chain.
3. Nothing is assigned. Fujibayashi's warning ("Once we define how we want
   players to play the game, it ends up becoming more and more linear") is
   already the game's stance.

Three places where it stops short, in order of how much the sources suggest
it matters:

1. No record of learning (2.6). This is the gap between "a fun map" and "the
   act of playing teaches you what Hive is."
2. No slow clock (2.7). Thirty minutes and one day are both fast; the return
   habits the sources describe live at a week and a month.
3. Rewards that open nothing (2.4, 2.9). Counters are the cheapest loop and
   the first one players stop caring about.

---

## 4. Open questions for the owner

1. Should more than one thing in the void be visibly out of reach, or is one
   keep the right amount of question for a first-time player?
2. Which single new verb-with-consequence would you test first: carry tokens
   to drift further, or bank tokens mid-drift at a factory?
3. Should banked tokens buy anything at all, or is a clean counter the point?
4. Is a field log of what the player has seen (witness cards opened, ruins
   reached) welcome, given it records only proven events and never an
   opinion about an account?
5. What should the first "question" in that log be, and should the log ever
   show a question the player has not yet found the place for?
6. Is a monthly festival on the 1st (the HPUD idea from the README) an
   invitation or homework, in Percy's hands?
7. Should chain weather (a busy half hour visibly crowds the world) come
   before or after the monthly event?
8. Do you want an end-of-board summary at the window turn, or does the
   silent reset feel right?
9. Should the travel map warp only to visited places, with banked tokens
   buying the rest, or is free warp part of "explore as you wish"?
10. Should a new user's house show its reply count, given that "0 replies"
    is an indicator that could also read as a mark against them?
11. Should the player's own post be marked when it lands on the board?
12. Which of these has Percy asked for without being prompted, and which has
    he never noticed was missing?
13. Is a shareable link to the current window enough "connection" for now,
    or is that a placeholder for something the trust-model conversation has
    to settle first?
14. Do you want any of these tested in the browser harness before Percy sees
    them, or does Percy see everything first?

---

## 5. Sources

Primary means the developer, studio or author speaking for themselves. Via
means a secondary write-up that quotes the primary source; the primary is
named.

### Zelda

- GDC 2017, "Change and Constant: Breaking Conventions with The Legend of
  Zelda: Breath of the Wild", Fujibayashi, Takizawa, Dohta (Nintendo). GDC
  Vault session page, members only:
  https://www.gdcvault.com/play/1024562/Change-and-Constant-Breaking-Conventions
- Same talk, via Thumbsticks (direct quotes from Fujibayashi on
  multiplication, active play, freedom):
  https://www.thumbsticks.com/gdc-17-breaking-conventions-breath-of-the-wild/
- Same talk, via Shacknews (direct quotes from Fujibayashi and Dohta):
  https://www.shacknews.com/article/99265/how-breath-of-the-wild-challenged-conventions-in-zelda-games
- Same talk, via TechSpot (the 2D prototype):
  https://www.techspot.com/news/68369-nintendo-created-2d-prototype-breath-wild-modeled-after.html
- CEDEC 2017 Breath of the Wild session (triangle rule, footstep heat map),
  via Kotaku, itself relying on translated Japanese coverage:
  https://kotaku.com/breath-of-the-wilds-biggest-design-secret-lots-of-tria-1819113140
- Nintendo, "Ask the Developer Vol. 9, The Legend of Zelda: Tears of the
  Kingdom", Parts 1, 4 and 5 (primary):
  https://www.nintendo.com/us/whatsnew/ask-the-developer-vol-9-the-legend-of-zelda-tears-of-the-kingdom-part-1/
  https://www.nintendo.com/us/whatsnew/ask-the-developer-vol-9-the-legend-of-zelda-tears-of-the-kingdom-part-4/
  https://www.nintendo.com/us/whatsnew/ask-the-developer-vol-9-the-legend-of-zelda-tears-of-the-kingdom-part-5/
- Nintendo UK, "The Making of The Legend of Zelda: Breath of the Wild" video
  series announcement, 14 March 2017 (primary, video interviews):
  https://www.nintendo.com/en-gb/News/2017/March/Go-behind-the-scenes-with-the-making-of-The-Legend-of-Zelda-Breath-of-the-Wild-1206592.html
  Part 2, "Open-Air Concept", on Nintendo's YouTube channel:
  https://www.youtube.com/watch?v=vLMGrmf4xaY
- Aonuma, Nikkei Trendy interview (May 2017) via GoNintendo (translation):
  https://gonintendo.com/stories/279789-aonuma-on-making-zelda-breath-of-the-wild-open-air-continuing
- Nintendo UK, "Nintendo Classic Mini: NES special interview, Volume 4: The
  Legend of Zelda" (Miyamoto, Tezuka; primary):
  https://www.nintendo.com/en-gb/News/2016/November/Nintendo-Classic-Mini-NES-special-interview-Volume-4-The-Legend-of-Zelda-1160048.html
- Miyamoto, 1989 interview, translated by Shmuplations, via Game Developer:
  https://www.gamedeveloper.com/design/in-1989-miyamoto-laid-out-his-original-design-goals-for-i-zelda-i-
- Miyamoto, 1994 "Sound and Drama" liner notes, translated by Shmuplations:
  https://shmuplations.com/zelda/

### Hollow Knight

- Kotaku, "The Makers Of Hollow Knight Are Fine With Players Missing Things"
  (direct quotes from Ari Gibson and William Pellen, Team Cherry):
  https://kotaku.com/the-makers-of-hollow-knight-are-fine-with-players-missi-1828721254
- Nintendo Australia, "The Metamorphosis of Hollow Knight, with Team Cherry"
  (primary interview):
  https://www.nintendo.com/au/news-and-articles/the-metamorphosis-of-hollow-knight-with-team-cherry-aussie-developer-interview/
- SUPERJUMP, "Getting Lost (by Design) in Hollow Knight" (quotes Gibson from
  PC Gamer's 2017 interview; describes the Cornifer map system):
  https://www.superjumpmagazine.com/getting-lost-by-design-in-hollow-knight/
- PC Gamer, "How to design a great Metroidvania map" (the interview SUPERJUMP
  quotes; page did not load in this session, listed for completeness):
  https://www.pcgamer.com/how-to-design-a-great-metroidvania-map/

### Super Mario Odyssey

- TIME, E3 2017 interview with Kenta Motokura and Yoshiaki Koizumi (primary
  quotes):
  https://time.com/4816417/super-mario-odyssey-interview-e3/
- TIME, October 2017, Motokura and Koizumi on density and capture (primary
  quotes):
  https://time.com/4997917/super-mario-odyssey-nintendo-switch/

### Outer Wilds

- Kelsey Beachum (Mobius Digital contractor), GDC 2021 slides, "Sparking
  Curiosity-Driven Exploration Through Narrative in Outer Wilds" (primary):
  https://media.gdcvault.com/GDC+2021/beachum_gdc_2021(1).pdf
- Alex Beachum and Loan Verneau, GDC 2020, "Curiosity-Driven Exploration: The
  Design of Outer Wilds" (session description via Game Developer):
  https://www.gamedeveloper.com/design/attend-gdc-and-learn-how-i-outer-wilds-i-nailed-curiosity-driven-game-design
- Game Developer, "Live, die, repeat: How Outer Wilds piques curiosity"
  (direct quotes from Alex Beachum):
  https://www.gamedeveloper.com/design/live-die-repeat-how-i-outer-wilds-i-piques-curiosity-in-an-ambivalent-solar-system
- Game Developer, "Road to the IGF: Alex Beachum's Outer Wilds" (direct
  quotes; also names the 2012-2013 USC thesis the GDC 2021 slides quote):
  https://www.gamedeveloper.com/design/road-to-the-igf-alex-beachum-s-i-outer-wilds-i-

### Animal Crossing

- Iwata Asks, Animal Crossing: New Leaf, page 2 "Being the Mayor" (Kyogoku,
  Moro; primary):
  https://iwataasks.nintendo.com/interviews/3ds/animalcrossing-newleaf/0/1/
- Iwata Asks, Animal Crossing: New Leaf, page 6 "Playing the Whole Year Round"
  (Takahashi, Moro, Kyogoku; primary):
  https://iwataasks.nintendo.com/interviews/3ds/animalcrossing-newleaf/0/5/
- Iwata Asks, Animal Crossing: City Folk, page 1 (Nogami on connecting with
  others changing motivation; primary):
  https://iwataasks.nintendo.com/interviews/wii/accf/0/0/
- Gamasutra (now Game Developer), "Crossing into the Mainstream: Katsuya
  Eguchi on Animal Crossing", Brandon Sheffield, 8 May 2006 (primary
  interview):
  https://www.gamedeveloper.com/design/crossing-into-the-mainstream-katsuya-eguchi-on-i-animal-crossing-i-

### Metroid

- Iwata Asks, Metroid: Other M, Volume 1 page 2 (Sakamoto, Hayashi; primary):
  https://iwataasks.nintendo.com/interviews/wii/metroid-other-m/0/1/

### Stardew Valley

- Stardew Valley official site, "About" (primary):
  https://www.stardewvalley.net/about/
- Game Developer, "Road to the IGF: ConcernedApe's Stardew Valley" (primary
  quotes on the Harvest Moon formula):
  https://www.gamedeveloper.com/design/road-to-the-igf-concernedape-s-i-stardew-valley-i-

### Pokémon GO

- GDC 2017, "'Pokemon GO' & Designing Interactive Games for the Real World",
  Dennis Hwang (Niantic), session page:
  https://gdcvault.com/play/1024376/-Pokemon-GO-Designing-Interactive
- GamesBeat / VentureBeat, "The accidental history of Niantic's Pokémon Go,
  as told by John Hanke" (primary quotes from the CEO):
  https://gamesbeat.com/the-accidental-history-of-niantics-pokemon-go-as-told-by-john-hanke/
- Niantic's own blog posts on its exploration, exercise and social mission
  were not reachable in this session (the nianticlabs.com pages redirect and
  return 404 as of 2026-09-05). The three-pillar claim is therefore taken from
  Hanke's quotes above only.

### Motivation research

- Ryan, R. M., Rigby, C. S., and Przybylski, A. (2006). "The Motivational
  Pull of Video Games: A Self-Determination Theory Approach." Motivation and
  Emotion, 30(4), 347-363. DOI 10.1007/s11031-006-9051-8.
  https://link.springer.com/article/10.1007/s11031-006-9051-8
  Abstract mirror: https://pure.ewha.ac.kr/en/publications/the-motivational-pull-of-video-games-a-self-determination-theory-/
- Przybylski, A. K., Rigby, C. S., and Ryan, R. M. (2010). "A Motivational
  Model of Video Game Engagement." Review of General Psychology. Author PDF:
  https://selfdeterminationtheory.org/SDT/documents/2010_PrzybylskiRigbyRyan_ROGP.pdf
- Loewenstein, G. (1994). "The Psychology of Curiosity: A Review and
  Reinterpretation." Psychological Bulletin, 116(1), 75-98. The CMU copy is
  a scanned PDF and could not be text-extracted here; the definition quoted
  above is taken from Kidd and Hayden (2015), which cites it.
  https://www.cmu.edu/dietrich/sds/docs/loewenstein/PsychofCuriosity.pdf
- Kidd, C., and Hayden, B. Y. (2015). "The Psychology and Neuroscience of
  Curiosity." Neuron. Open access:
  https://pmc.ncbi.nlm.nih.gov/articles/PMC4635443/
- Golman, R., and Loewenstein, G. (2016 working paper; published 2018 in
  Decision 5(3), 143-164). "An Information-Gap Theory of Feelings About
  Uncertainty." CMU PDF (primary, text-extractable):
  https://www.cmu.edu/dietrich/sds/docs/golman/Information-Gap%20Theory%202016.pdf
- Kang, M. J., Hsu, M., Krajbich, I. M., Loewenstein, G., McClure, S. M.,
  Wang, J. T., and Camerer, C. F. (2009). "The Wick in the Candle of
  Learning: Epistemic Curiosity Activates Reward Circuitry and Enhances
  Memory." Psychological Science, 20(8), 963-973. Abstract:
  https://asu.elsevierpure.com/en/publications/the-wick-in-the-candle-of-learning-epistemic-curiosity-activates-/

### The game itself

- `apps/blog/features/hive-frontend-universe/README.md`
- `apps/blog/features/hive-frontend-universe/ART-DIRECTION.md`
- `apps/blog/features/hive-frontend-universe/HANDOFF.md` (AI paraphrase; not
  quoted as the owner's words)
- `apps/blog/features/basecamp/ETHOS.md`
- `apps/blog/features/basecamp/CONTEXT.md`
- Code read for this note: `engine/` (helmets, coins, gems, hazards, combat,
  projectiles, scenery, critters, world, canvas-map, controls), `lib/`
  (board, routes, fixed-world, targets, observations), `data/cache.ts`, and
  the `hive_frontend_universe` block of `apps/blog/locales/en/common_blog.json`.

### Not reached in this session

Pages that returned 403, 404 or a certificate error and are not relied on:
Nintendo Life's GDC 2017 write-up, PC Gamer's Metroidvania map article and
its Barone interviews, Massively OP's Niantic coverage, Team Cherry's
Kickstarter page, the APA record for Loewenstein 1994, all nianticlabs.com
pages. Claims resting on any of these are marked as such or omitted.
