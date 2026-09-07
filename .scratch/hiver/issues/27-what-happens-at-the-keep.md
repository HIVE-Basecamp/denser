# What happens at the keep

Type: grilling
Status: resolved
Blocked by: none

## Question

The ending is the real one (ticket 07). What does the player see and do at Emperor J SON's keep? The motto. Two helmets vs all 21 for the crossing. How the fortress heads (fog) relate.

## Answer

Built 2026-09-07, rough. The idea we are trying:

- Two helmets still buy the crossing (unchanged; Bryan's order was visitable,
  not the easiest path). Anyone who crosses sees him, the hoard and the motto.
- The motto from round 2 is the panel's headline while the hoard is his:
  "He owned the stake, but he never owned us."
- Park at the keep wearing all 21 helmets, one per guardian, and the hoard is
  set loose: the pile at his feet lifts off and streams away toward the DHF
  Fun Park; the tribute march and the sky tithe stop with it; he is left on
  his rock with nothing. The headline becomes "His hoard became everyone's."
  The 21 together do what none could alone, which is the history. Kept
  forever as a fact about the player (dashboard row "The keep"); the pile
  re-forms every round.
- The panel shows the real vault, live: hive.fund's HIVE and HBD balances,
  and that the account has no keys at all (read from the chain each time,
  never asserted). Links: the vault account on the explorer, the proposals
  page, the HF24 post from October 2020. Facts only.
- The fortress heads: not touched. They belong to adventure mode (the
  threat-vector idea in the chart's not-yet-specified list). This ending does
  not depend on them; if heads are built later they can sit in front of the
  crossing or the guardians.

Code: `engine/keep.ts` (new), `data/fetch-vault.ts` (new), `engine/icons.ts`
(the boss's gold fades with `hoard`), `engine/render.ts`,
`engine/canvas-map.tsx`, nine locale files (`hive_frontend_universe.keep.*`,
`dashboard.keep*`), `README.md`.

Seen in the in-app browser, with 21 helmets seeded and, for the test only,
the travel map allowed to warp to the keep (both undone): the arrival, the
gold pulse, the coins streaming up and left toward the park, the pile
emptying over a few seconds, and the panel reading 21 / 21, everyone's,
28,383,868 HIVE, 23,207,623 HBD, keys none, three links. Headless against the
real world builder: 20 helmets do nothing, 21 set it loose once per round,
the release runs seven seconds. Not yet played by hand across the real gap.

Open for Bryan: 21 for the ending, or fewer; whether anything should happen
at the park end when the hoard arrives; what the keep should say to someone
with two helmets beyond the motto and the count; the heads.
