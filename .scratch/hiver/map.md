# H.I.V.E.R. map

Effort slug: `hiver`. Charted 2026-09-05 and 2026-09-06 with Bryan. Tracker: local markdown, see `docs/agents/issue-tracker.md`. Round 2 answers in full: `round-2-open-questions.md`.

## Destination

Bryan's words: "we feel good enough about the game and code to give it to a hive dev for review and hopefully deployment."

On the road, in order:
- B: "the game is a game when it is fun to play and people want to come back to play it again (ie. percy wants to play it on his own volition, not because i asked him to play, he actually enjoys playing it)".
- C: an SDK created and tested with Snapie or a dev friend, with Bryan.
- Then the tidy-up for dev review.

## Notes

- Building on the map. Bryan: "yes to building on the map". Build tickets are `Type: task` and live here.
- Not rules. Bryan: "we are not making rules we are discovering and brainstorming". Never write "rule" or "your rule" in a ticket or to him. Say "the idea", "we are trying". Try it, look at it, pull it back.
- Attribution. Lines in `HANDOFF.md` Part B, the Sep 2 grilling archive, and `research/00` (the August brainstorm) were written by earlier sessions. Never hand them back as his words. Quote only what he said.
- Percy meter is casual. Bryan tests with Percy now and then and reports. Never a ticket.
- Read first, every session: `apps/blog/features/basecamp/ETHOS.md` and `CONTEXT.md`; the game's `README.md`. Hard lines from `HANDOFF.md` still hold: `movement.ts` frozen; the game writes nothing to the chain; no image assets; every string via t(); no join/leave; nothing that flags a real account until ticket 15 resolves; nothing depends on Hive Communities tooling; never hardcode an op type id; never call a signer directly; no new repos, forks, folders or branches unless asked.
- Skills: grilling and domain-modeling for grilling tickets; research for research tickets; prototype for prototype tickets; wait-what when Bryan asks. Plain English, extremely concise (top of CLAUDE.md).
- Idea pile: `.scratch/hiver/ideas.md`. Brainstorm fodder from Bryan, dated, never decisions. Read only when a ticket or Bryan points at it.
- Research lives in `.scratch/hiver/research/` on the working branch, not on `research/<name>` branches, because of the no-new-branches line. Files 00 to 04.
- Glossary care: code and HUD say "newcomer", "Newb", "NEWBS"; the glossary avoids those. Handle in ticket 29, not ad hoc.
- This file is the **overview chart** when we talk (Bryan, 2026-09-06). "The map" means the game world. See CONTEXT.md.
- Frontier order is by ticket number. Bryan may name any ticket instead.

## Order (Bryan's two lists, 2026-09-06)

Frontier by number still applies when nobody names a ticket. When Bryan is fresh and has 3 to 5 hours, take the foundational list in order. When he wants movement, take the fast list.

Foundational (talk, needs him fresh):
1. [The match table](issues/33-the-match-table.md): the spine; every later ticket points at its cells.
2. [What each mode holds, and the welcome at Basecamp](issues/16-what-each-mode-holds.md): unblocks 20, 24, 25, 32.
3. [The trust conversation](issues/15-the-trust-conversation.md): unblocks anything that says something about a real account.
4. [Cemented phases in adventure mode](issues/24-cemented-phases-in-adventure-mode.md): after 16.
5. [Which relay for live players, and when](issues/22-which-relay-for-live-players.md): after Meno answers (23).

Fast, actionable (build or rough, small):
1. [Build the waiting room, mode picker and round clock](issues/34-build-waiting-room-modes-and-round-clock.md): done 2026-09-06
2. [Build the DHF race, one funded per round](issues/35-build-the-dhf-race.md): after 34.
3. [Build the Power Up Day festival](issues/18-build-power-up-day-festival.md): parked 2026-09-08 on Bryan's call, a distraction for now; still open, nothing built
4. [Build the payout change on houses](issues/19-build-payout-change-on-houses.md): closed 2026-09-08 without building it; it cannot happen in a 30-minute round
5. [The Steem Ruins as a place you can reach](issues/28-the-steem-ruins-as-a-place.md): done 2026-09-06, the ruins flip the board
6. [The pop-up dashboard](issues/21-the-pop-up-dashboard.md): done 2026-09-06, rough list of facts
7. [H.I.V.E.R. in the glossary](issues/29-hiver-in-the-glossary.md): five minutes once Bryan gives the letters.
8. [Confirm 3speak space with Meno](issues/23-confirm-3speak-space-with-meno.md): Bryan's, one message.
9. [Build the board lean (2.5D)](issues/36-build-the-board-lean.md): tried and pulled out 2026-09-06 on Bryan's call.
10. [The planet pass](issues/37-the-planet-pass.md): built 2026-09-06; the map view reads as a globe.

Medium (build, half a day each): [Build obstacles on the lines](issues/17-build-obstacles-on-the-lines.md) (done 2026-09-07), [Build footprints](issues/30-build-footprints.md) (done 2026-09-07), [Which chain numbers feed the virtues](issues/26-which-chain-numbers-feed-the-virtues.md), [What happens at the keep](issues/27-what-happens-at-the-keep.md) (built 2026-09-07, not committed).

Blocked until the foundational talks land: 20, 25, 31, 32.

## Decisions so far

- [Adventure-game return loops](issues/01-adventure-game-return-loops.md): twelve return mechanisms; the game lacks a record of what you learned, a calendar past one day, and people
- [Hive history, culture, jargon](issues/02-hive-history-culture-jargon.md): dated fork timeline, ~89 jargon terms, ten places the game invents what the chain provides
- [Learning through play and live data](issues/03-learning-through-play-and-live-data.md): teach without telling; notice a chain act, never pay for one is a PROPOSAL awaiting Bryan
- [Live players without a big server](issues/04-live-players-without-a-big-server.md): a tiny relay is unavoidable and enough; chain and hive.blog server are the wrong pipes; 3speak space fits
- [The game feeds the card, the card feeds the game](issues/05-game-feeds-card-card-feeds-game.md): door open; a card space tied to game engagement is fine; details to come
- [Virtues from real chain history](issues/06-virtues-from-real-chain-history.md): yes, read from the player's own chain history
- [The ending at the keep](issues/07-the-ending-at-the-keep.md): the real ending: his hoard became everyone's
- [Four modes](issues/08-four-modes.md): open explore, curation, adventure, front end; a welcome at Basecamp
- [Live players are the goal](issues/09-live-players-are-the-goal.md): 100% wanted, live players in the world at once
- [Obstacles on the lines](issues/10-obstacles-on-the-lines.md): yes, try it
- [What found things are worth](issues/11-what-found-things-are-worth.md): value in game; skins and colours; power against enemies allowed in adventure mode; roaming without collecting still works
- [Hive's real calendar](issues/12-hives-real-calendar.md): try them all; build the Power Up Day festival and the payout change
- [The trust conversation comes early](issues/13-the-trust-conversation-comes-early.md): yes, ticket 15
- [How far a loss can go](issues/14-how-far-a-loss-can-go.md): soft outside adventure mode; adventure mode has cemented phases
- [Build the waiting room, mode picker and round clock](issues/34-build-waiting-room-modes-and-round-clock.md): built; welcome, four modes, round clock, live rollover; explore has no consequences
- [Build the DHF race, one funded per round](issues/35-build-the-dhf-race.md): built; stake-weighted votes from houses, return line, deliver at the Fun Park, votes drop on the setback
- [The Steem Ruins as a place you can reach](issues/28-the-steem-ruins-as-a-place.md): the ruins are a landmark on a rail; park there and the board flips to its back, the dead chain, mirrored and drained. Rough; what stands on the back is open.
- [The pop-up dashboard](issues/21-the-pop-up-dashboard.md): the I key or STATS opens a plain list of every fact the engine holds; which rows stay, and the design, are open.
- [Build the board lean (2.5D)](issues/36-build-the-board-lean.md): tried, pulled out; a squashed board reads as a card and breaks the spacing; what Bryan wants is a planet with sides
- [The planet pass](issues/37-the-planet-pass.md): a shaded sea under the mark inside the ring, towers leaning outward like pins in a globe as the camera pulls out, the flip turns a sphere; nothing moved
- [Build obstacles on the lines](issues/17-build-obstacles-on-the-lines.md): blocks parked on one street in six per round, seeded; a rail bug that pushes in is stopped, a hop carries it over; `movement.ts` untouched
- [Build footprints](issues/30-build-footprints.md): prints on a post's streets from the accounts that voted or replied this round, out to a marker with the face; hover names the act, click opens the account; facts only
- [What happens at the keep](issues/27-what-happens-at-the-keep.md): two helmets still cross; all 21 set the hoard loose, streaming to the park, "his hoard became everyone's"; the panel shows the real keyless vault, live; the heads untouched
- [Tidy-up for dev review](issues/38-tidy-up-for-dev-review.md): the three giant files are folders now, one thing per file, everything moved and nothing rewritten; `frame-loop.ts` stays whole on purpose; a doubled `ctx.restore()` caught on the way
- [Build the payout change on houses](issues/19-build-payout-change-on-houses.md): closed, not built. A house is a post from the last 30 minutes, so it can never reach its 7th day. Bryan caught it. The idea underneath, not agreed: a house brightening as it earns, live, inside the round
- [Build automatic checks](issues/39-build-automatic-checks.md): thirty headless checks, one command from `apps/blog`, no browser and no account; world, movement, blocks, footprints, keep, helmets, race. Nothing that draws is covered yet

## Not yet specified

- Enemies as threat vectors: each head of the emperor's fortress one threat to the Hive ecosystem; "cut off each head to destroy the fortress"; which threats.
- Grief and frustration on Hive, triggered by enemies: rug pulls, dilution, losing everything; banishment somewhere in the game and the way back.
- Games within games: trying to win money inside the game, then a rug pull or a token going to zero. Keep close to Hive lore and people's real ten years of crypto.
- "Savior of Hive": just you, one little HIVER, could be the savior. How that framing reaches the player.
- The SDK (C on the road): what it exposes, who tests it (Snapie or a dev friend). Depends on what the game becomes.
- Whether the game notices real chain acts and never pays for them (research/03 PROPOSAL). Bryan has not answered.
- 21 helmets vs the real 20 witnesses plus one rotating seat (research/02).

## Out of scope

Nothing ruled out yet. The earlier thought that a live-player server was out of scope is dead: live players are the goal (ticket 09).
