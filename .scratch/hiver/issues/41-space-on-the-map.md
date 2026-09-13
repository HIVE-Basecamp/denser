# Space on the map

Type: task
Status: resolved
Blocked by: none

## Question

Bryan, 2026-09-12: "SPACE ON THE MAP. Things need their own space. Several
citadels stand behind or crowd other things. The keep and Mount Socko are too
close, visually confusing. Move Mount Socko to E-9. Then move the keep over
into the room Socko leaves in the north-east. Socko's isle is a trail cluster:
it must reach the diamond's coast. The keep's approach rail must still end two
helmets short. Citadels are placed by placeWitnesses using BIG_FOOTPRINT;
widen footprints or add the chips/communities to what a tower must clear so no
tower stands behind a big place."

## Answer

Built 2026-09-12. Not committed.

Looked at the full map before the change, in the browser. It was exactly as
described: Mount Socko at U-7 and the keep a box and a half to its south-east,
both hugging the same north-east corner and reading as one busy shape; a
citadel at W-7 standing directly behind the hydra, its light beam disappearing
behind the hydra's body; another citadel's beam ending on the roof of the
five-spire castle at Q-5.

**The sock went west.** Mount Socko's isle now sits at E-9, off the diamond's
north-west coast (hub -5950, -3150; the mountain itself 300 px north of it,
still inside E-9). It is still a trail cluster and its trail still reaches the
diamond — the world reports no dropped spokes, which is the measurement that
would fail if it did not.

**The keep took the room the sock left.** It stands alone in the north-east
void at U-7 (5250, -4550), with the whole corner to itself. Its approach rail
now hangs due west rather than south-west and is longer (168 degrees, 940 px
instead of 138 degrees, 670 px), which puts the gap to the living world's
lines at 1039 px, 1.17x a bare hop — the same number it had before, so the
crossing still costs exactly two helmets and never one. Measured, not assumed:
`world.stats.gaps`, and `checks/planet.ts` holds the ratio between 1.13 and
1.23. The troll hole at the keep moved with it.

One consequence worth naming: the crossing used to launch from Mount Socko's
isle, and now it launches from the rail-head on the northern coast. Getting
socked no longer drops you at the Emperor's gateway — it drops you on the far
side of the world, which makes the sock trip a much longer toll. README updated
to say so.

**Room for every tower.** A tower only ever had to clear the land and the big
places. It now also has to clear the floating island chips, the community
bubbles and the offshore cluster hubs — none of which it knew about, which is
how citadels came to stand over them — plus 230 px of breathing room, so a
tower stops beside a place instead of the moment it stops overlapping it.
Bryan's own named citadel placements do not pay the breathing room: they only
move when they genuinely overlap, so his boxes hold.

Also fixed a real fragility found while checking this: a tower that cannot get
clear by walking outward along its own ray (the south-eastern ray runs
alongside the shipyard rather than past it) now steps sideways in grid boxes
instead of giving up and standing where it is. Without that, the ring was only
clean for the vote order it happened to have on the day.

Four citadels moved outward as a result; nothing else on the ring moved. 34
headless checks pass, including a new one: no tower stands over a place that
needs its own room.

Judgement calls for Bryan:

- E-9 sits at 0.86 of the way out to the rim, not on it. Mount Socko still
  leans outward like a pin on the pulled-out map, but it is on the globe
  rather than at its edge the way the keep and the citadels are. Say if you
  want it pushed further out to the rim.
- The keep is now genuinely on its own out there and nothing else is near it.
  That is what you asked for, and it does make it feel further away.
- One of your own named citadels, therealwolf at I-22, clears the Rose Window
  by about 109 px — close, but it is your placement and the code leaves your
  placements alone unless they actually overlap. Say if you would rather they
  got the same breathing room as the rest.
- The sock trip being a much longer ride home is a real gameplay change, not
  just a visual one.

## Comments

Bryan, 2026-09-12, same session: "the rose window center should move to I-26
and the center of the hive dapps space ship should move to s-26."

Done. Both now land exactly on their boxes: the Rose Window's centre at
(-3150, 8750), the Hive dApps ship's centre at (3850, 8750). Each stands 300 px
south of its mooring hub, so the hubs went to (-3150, 8450) and (3850, 8450).

- Both moorings are still rail trails and both still reach the coast: the world
  reports no dropped spokes, no crossings, 35.7 degrees at the tightest
  junction. The keep's gap is untouched at 1.17x a hop.
- Both places are now OUT PAST THE RIM: the Rose Window at 1.27 and the ship at
  1.30 of the way out, where the planet's disc ends at 1.00 and the citadel
  ring stands at about 1.05. They are off the globe, in the deep south, below
  the ring.
- The pulled-out map had to be told to fit them. It was sized from the ring and
  the towers alone, because the ring used to be the outermost thing in the
  world; the ship's bottom would simply have been cut off. It now also fits any
  big place that stands further out than the ring does, so the whole map zooms
  out about six per cent. That happens on its own from now on.
- A happy side effect: with the Rose Window and the ship out of the way, BOTH of
  your named citadels sit exactly on the boxes you gave them again — ausbitbank
  back on T-21 and therealwolf back on J-22. They had each been nudged a box
  because a big place was in the way, therealwolf since before this ticket.

34 headless checks pass. Type-check clean. Not yet looked at on screen.
