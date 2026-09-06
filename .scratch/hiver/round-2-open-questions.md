# H.I.V.E.R. wayfinder, Round 2 (open)

Status: awaiting Bryan's answers. Written 2026-09-05. Map not yet created; these
become tickets and fog once answered.

Sources: `research/00` (Bryan's Zelda brainstorm + Lore Bible, not final),
`research/01` (return loops), `research/02` (Hive history), `research/03`
(learning through play), plus code facts gathered in session.

Settled before this round (Bryan's words):
- Destination A: "we feel good enough about the game and code to give it to a
  hive dev for review and hopefully deployment."
- On the road, in order: B, "the game is a game when it is fun to play and
  people want to come back to play it again"; C, an SDK created and tested with
  Snapie or a dev friend with Bryan; then the tidy-up for dev review.
- "yes to building on the map" (execution carried into the map).
- Percy meter is casual. Do not get stuck on it.

## Found vs new (Bryan asked)
Already found via HANDOFF/README: the Lore Bible substance, triangle rule,
moved towers, curiosity gap, shared clock.
New: Zelda-to-Hive mapping (shrines = live posts, towers = 21 witnesses, Korok
seeds = ambient chain activity, blood moon = 30-minute reweave, stables =
communities); triangle as an obstacle on a line; the Journey lesson; four spirit
rules (world offers never assigns; reward every minute; let the player annotate;
Korok discipline: capacity and cosmetics, never power).

## Questions

Q1 - The line between the two layers. Information flows between game and
Basecamp card; credit never does. Game notes may sit on a card as private notes.
Nothing done in the game fills anyone's ring.
-> Draw that line. Widens glossary word "patrol".

Q2 - Virtues become the bug's real stats. Power, Wisdom, Courage read from the
player's own chain history (post = courage, curate = wisdom, stake = power).
Keep colours and story; number underneath is the real one.
-> Yes.

Q3 - The ending at the keep. Real ending: hoarded stake became the DHF, a public
vault with no keys. "His hoard became everyone's."
-> That ending. Motto: he owned the stake, but he never owned us.

Q4 - Missions vs "the world offers, it never assigns". (a) offers only;
(b) missions found in the world, never listed in HUD, noticed after the fact;
(c) daily HUD list.
-> (b). Newb Trail is the model. Rule: game may notice a real chain act but
never pays for one.

Q5 - The Journey question. (a) meet people via posts and replies only, no server;
(b) footprints not presence: fresh chain tracks you can follow to their owner;
(c) small relay server on this road.
-> (b) on this road, (c) as first map after A ships. Bryan's call above all.

Q6 - The hop gets a job. Obstacles on lines, hop over or route around, block
view. Placeholder cubes at junctions exist in scenery.ts. movement.ts stays
frozen.
-> Yes, on this road.

Q7 - Korok discipline locked as a rule. Nothing earned changes what the bug can
do to anyone or how fast it moves. Only how far and how it looks. Tokens and
gems buy skins and range only.
-> Lock it.

Q8 - Hive's clocks as calendar. Monthly festival on the 1st (Power Up Day),
weekly beat on payout day, daily buzz pointed at a real HiveBuzz pick.
-> Yes.

Q9 - The trust conversation as an early grilling ticket. Until then all judging
stays local, private, off the road.
-> Yes.

Q10 - Ceiling of consequence. Three hits sends the bug home, tokens dropped.
No lives, no game over, no lost banked progress.
-> Yes. Mario, not roguelike.

## Collisions to surface when answering
- Bible "no task lists" vs report 03's ten missions (Q4).
- Journey/companionship needs presence vs no-server rule (Q5).
- Lore Bible 21 thrones vs report 02: 20 witnesses + rotating seat.
- Korok discipline matches helmets = capacity (Q7).

## Answers (2026-09-06)

Q1 - ANSWERED, rule REJECTED. Bryan: "The game feeds the card. The card feeds
the game." Keep that. Drop "game progress never becomes card progress"; that
line was the Sep 2 session's ADR candidate (archive Q33), never his. A space or
illustration on the card connected to the game is fine; players will be asked to
do tasks and win challenges or phases in the game, and the card may show that
engagement. Playing the patrol games may open something in the game. What each
of these looks like: to be determined. "I would like that door to remain open."
Note: docs/basecamp-context.md already says a game may award Basecamp progress
through the task action, so the code path agrees with him.

Q2 - ANSWERED: yes. Virtues read from the player's real chain history.

Q3 - ANSWERED: yes, the real-history ending ("his hoard became everyone's").
Bryan asks whether the Steem ruins exist as a visitable place in the game or
only as story. "Because that would be cool." Fact check pending.
  Fact (lib/fixed-world.ts:424-431, 506): the Steem Ruins EXIST as a drawn place.
  Dead grey district in the far western void at (-6300, 1800), opposite the keep.
  Scenery only: no node, no road, cannot be travelled to, nothing to collect.
  Hover names it; click opens the real 2020 Hive fork announcement post.
  So: visible, unreachable, story-only. Bryan: making it visitable "would be cool".

Q4 - ANSWERED, reframed by Bryan. Not (a)/(b)/(c). Process note: he does not
make rules; drop the word. "The world offers, it never assigns" (research/00
line 155) was written by the August session, meant nothing to him. He asked
what offer / assign / task / task list mean to me; shared meaning missing.
His shape, like Zelda: you run into a thing or a place and it gives you a
challenge. Land at Basecamp, some kind of "welcome to Basecamp", then pick a
mode. Four modes, his words:
  1. Open explore: roam, not trying to do anything.
  2. Curation: focus on engaging with live posts. Several kinds of missions
     offered here. This is the mode that fills the game-linked part of the card.
  3. Adventure: the fun and inner challenges of the game, less touching the real
     chain; enemies, bring one weapon, battle one of Justin's minions; the stuff
     of the game, not the blockchain.
  4. Front end: the tools linked to hive.blog stand out on the map.

## Bryan's notes, fodder not rules (2026-09-06, after Q4)
- H.I.V.E.R.: "A game that teaches you hive through Game Play." (tagline in his
  words; acronym expansion still unknown)
- Touch the grief and frustration on Hive. Enemies could trigger those feelings.
- "Savior of Hive": just you, one little HIVER, could be the savior of Hive.
- Fulfill missions, foil J Son's minions, take down the emperor's fortress. Cut
  off each head to destroy the fortress. Each head = one threat vector to the
  Hive ecosystem.
- Failure and loss as feeling: ups and downs of crypto, losing everything,
  dilution. Zelda has a philosophy around suffering many find appealing. Maybe
  banished somewhere in the game; recover from being rug pulled.
- "The more little real touches we can give, the more enjoyable the game."
- Glossary candidates raised, not agreed: "HIVER" (the player), offer, assign,
  task, task list. He asked whether such words belong in CONTEXT.md.

Q5 - ANSWERED. (a) is already there: finding posts is the game. (b) footprints
you can track: liked. But the goal, "one hundred percent", said many times:
multiple REAL players in the world at the same time, each at their own spot,
popping in mid-window, able to run into each other. Wants that in the game.
Asks: does it need a server? can hive.blog's server do it? cheapest way,
ideally something Hive already provides. Meno may give space on the 3speak
server (to confirm). Earlier "multiplayer server = out of scope" idea is DEAD.
Whether it lands before or after A: not stated yet.
Research DONE: research/04-live-players-without-a-big-server.md (579 lines, plain-English summary at top).
Process note: I used "the Journey lesson" without saying Journey is a game.

Q6 - ANSWERED: "yes try it." Obstacles on the lines, hop over or route around,
blocking sight. On this road. Seam already in code: scenery.ts cubes marked
"obstacle placeholders later"; hazards pattern (world acts on bug, movement.ts
untouched) is the model.

Q7 - ANSWERED, partly. Yes: tokens, gems, helmets, everything out there to find
should have value inside the game; buy skins, change colours. Disagrees with
"never power": in the gaming/adventure mode (beating enemies, chopping the
dragon heads) you may need to collect things that give damage or extra speed
against an enemy. Not one or the other. Roaming and ignoring the collecting
must still work. Also wants a pop-up like Zelda's: a card or dashboard showing
what the player has collected, strength, weapons, things they are paying
attention to. Games within games: it is crypto, so maybe you try to win money
inside the game, then get rug pulled or a token loses all its value (fog).
Keep it close to Hive lore and people's real ten years of crypto experience.

Q8 - ANSWERED: "Yes. You can try it." Follow Hive's real calendar. The 30-minute
rebuild and the daily Buzzing Station already exist. The only new thing is the
HPUD festival on the 1st of each month: create something for that. The payout
look-change on houses was also in the idea; he said "try them all". Process
note: "which comes first" made no sense to him; do not ask for ordering when
the answer is "try them all". My "weekly payout day" line was wrong and is
withdrawn (each post pays out on its own 7th day).

Q9 - ANSWERED: yes. The trust conversation becomes its own early grilling
ticket on the map. Until it happens, build only levels 1 and 2 (facts; private
player notes). Nothing in the game or on the card states a verdict about a
real account.

Q10 - ANSWERED: per mode. Explore mode soft, as now; likely the same for
curation and front-end modes. Adventure ("game") mode closer to hard, with
cemented phases: pass a phase and what you had is locked in; lose and you drop
back to the last cemented phase, not to zero; then collect again toward the
next lock-in. He asked me to look up real examples of this pattern.
Lookup: Dark Souls bonfires (return to last bonfire, drop carried souls, keep
levels and items); Hades and Dead Cells (a run's gains are lost, permanent
upgrades bought between runs stay); Hollow Knight benches; Mario checkpoint
flags mid-level; classic Zelda (hearts and key items are permanent, death
restarts you at the dungeon entrance with everything kept). His shape is the
roguelite "meta-progression" plus checkpoints.

## Round 2 complete 2026-09-06. Next: create map.md and tickets.

## Bryan's riff after the map (2026-09-06), fodder not decisions
- Feels the open tickets are still brainstorming. Asks what the 32 tickets
  drive at overall.
- DHF race: Hive works like a popularity contest, you need enough votes; DHF is
  money. In one 30-minute round, players hunt votes; maybe you find a very
  powerful DHF vote; you run into another player and each tries to get the
  other's vote; only two players get funded per round because there are only so
  many votes. One piece of gameplay among many. "It's money, and it has a lot
  to do with the real truth of hive."
- Downvotes: nobody wants one; everybody should fear it; something in the game
  could wipe your in-game reputation. Always within the game.
- Things cycle every round, but some things become permanent if you keep
  playing: the cemented things you work toward.
- Wants research and shared language for "elements": what happens in a game
  that is enjoyable, that people try to achieve, overcome, get through, and
  that brings them back. Many kinds of interactions: exploring, challenges,
  battles with opponents in your way, small tricks like Zelda weapons breaking
  without warning so people get careful and save the one they love.
- Method: identify elements of loved adventure games, identify Hive truths
  (downvotes, DHF, witness votes, bots, "all the things that make hive hive"),
  find the matches, overlay.
