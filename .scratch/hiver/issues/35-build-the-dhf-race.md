# Build the DHF race, one funded per round

Type: task
Status: resolved
Blocked by: 34

## Question

Bryan, 2026-09-06: the first match built into adventure mode. Getting enough votes to be funded by the DHF is a race inside one round. Enough votes may exist for more than one player, but only one player per round gets funded. Start with one; add more later if needed. Solo play for now (live players are ticket 22).

Hive truth underneath: the DHF pays proposals ranked by stake-weighted votes, above the return proposal line (research/02, section 3c). The game already draws a DHF Fun Park landmark; the race can end there. Fiction only: in-game votes, no real votes, no real accounts judged. Deterministic from the round seed. Design the smallest version, build it, play it, then decide what "funded" gives you (a cemented thing? ticket 24).

## Answer

Built 2026-09-06, committed. Adventure mode only.

How it plays:
- Every house on the board holds one vote, weighted by the account's real stake tier: plankton 1, redfish 2, dolphin 3, orca 4, whale 5. Park at the house to take it. Once per round per house. Houses with a vote still there wear a gold ring; whales ring wider.
- The return line is 40 percent of all the vote weight on the board (never under 3). The HUD shows VOTES carried / line.
- Carry the votes to the DHF Fun Park, which wears a gold beacon in adventure mode. Park there: above the line, FUNDED this round; below it, the panel says how many more votes to go.
- One funded per round. Solo today, so the race is against the clock. With live players the first to deliver takes it (ticket 22).
- The setback (third hit) drops the carried votes, and the houses' votes return, so a fall costs the walk, not the round.
- Nothing persists. What "funded" gives you is ticket 24's question.

Hive truth underneath: the DHF pays proposals ranked by stake-weighted votes, above the return proposal line (research/02, section 3c). Fiction on top: in-game votes, no real votes, no real account judged.

How it was checked: the race module is DOM-free and passed a script test (totals, line, take once, deliver below and above the line, drop and re-gather, funded stops further takes, empty board). Typecheck and lint clean. The in-game wiring mirrors the existing trail code and was read, not driven: the browser pane used for checks pauses the game's frame loop while hidden, so parking at a house could not be driven from here. Bryan: pick Adventure, park at a few houses, carry to the Fun Park.

Also: the debug handle `window.__hfuWorldStats` now carries `mode`, `race` and `atNode`.

Files: `engine/dhf-race.ts` (new), `engine/canvas-map.tsx`, `engine/render.ts`, nine locale files (`hive_frontend_universe.race.*`, `panel.race_funded`, `panel.race_short`).
