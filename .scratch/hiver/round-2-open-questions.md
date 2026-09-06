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
