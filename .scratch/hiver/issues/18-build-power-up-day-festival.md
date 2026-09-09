# Build the Power Up Day festival

Type: task
Status: open
Blocked by: none

## Question

On the 1st of each month the world looks and feels different: Hive Power Up Day, a real ritual since 2019 (ticket 12). What changes, and how it points at the real thing.

## Note, 2026-09-08

Parked on Bryan's call before any building: "i think this entire ticket is a bit of a distraction. let not do it for now." Left open, not resolved. Nothing was built.

What was found first, so it is not redone:
- The day is free. The 1st is a fact about the date, the same for every player, no backend — the same trick the Buzzing Station already uses on the UTC day number.
- The stake is already loaded. Every house carries its author's real Hive Power, and the tiers and the fish are built from it. A festival about powering up needs no new fetch.
- A live "power-ups happening now" number is NOT cheap. The hafbe `operation-type-counts` path counts by op type id, not by name, and the name-to-id lookup (`/hafbe-api/operation-types/...`) returns `{}` on api.hive.blog. Getting the number means either hardcoding an op type id — a hard line — or reading raw blocks, about 9MB a round. Out, unless that changes.

Worth keeping regardless of this ticket: **the game already has powering up in it, unnamed.** Carried tokens are at risk from thieves; banked tokens are safe forever (`engine/coins.ts`). That is liquid HIVE versus staked HIVE, in the game's own grammar, and nobody wrote it down. The README's known gaps say banking has no reward beyond the counter. If the match table (ticket 33) gets drafted, this is a cell: "safety you choose" over "powering up locks it away".
