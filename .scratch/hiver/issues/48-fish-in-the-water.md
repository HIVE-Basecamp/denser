# Fish in the water between the islands

Type: task
Status: resolved
Blocked by: none

## Question

Bryan, 2026-09-15, in the idea pile: "the globe gave us sea, so jump out with
the helmet on and an orca or a whale swallows you... let's really do this to
the world. Let's make that water... and let's put some fishes in this water.
Um, and let's have some of them be threatening. For me, for me, it's the
orcas. And the whales, who have higher stake and can be a threat to the
hiver bug... the redfish and dolphins won't be a threat, maybe later somehow
you can interact with them and either earn or get something from them... They
don't need to be in the map view. Just in the gameplay. And make the whale and
the orcas real threats that will swallow up this little bug. And maybe make
the water look more like water. Right now it is a glowing, it just is sort of
a glowing sphere. Both in the map and in the gameplay."

Paired with the line above it in the same entry: "Whales can hurt you. High
stake blasts your rep, low rep hides your posts, something to play with."

## Answer

Built 2026-09-15. Not committed.

**The match was already in the chain's own words.** Hive names its stake
ladder after sea life and `lib/board.ts` has carried the rungs since the
first pass: plankton, redfish, dolphin, orca, whale. So the water is stocked
with the ladder, and "high stake is a threat" needs no invented lore: the two
biggest holders in the sea are the two that eat.

**The water** (`engine/planet.ts`). The sphere was a blue glow at alpha 0.2
while playing, which is what made it read as a light rather than a surface.
It now holds its colour (0.5 at play zoom, 0.94 on the map), still letting
the star field glitter through like light under the surface, and it gained a
surface: long swell rollers, crest glints that twinkle out of step, and a
finer caustic net crossing the swell the other way. Everything on that
surface is measured in SCREEN px and divided by the zoom, so one set of
numbers reads as water up close AND as an ocean on the pulled-out map; the
swell bows toward the limb as the camera pulls out so the map reads as water
wrapping a ball. Measured cost: 0.36ms a frame at play zoom, 1.44ms at map
zoom, against a 12ms budget.

**What swims in it** (`engine/sea.ts`, `engine/icons/sea-life.ts`,
`engine/render/layer-sea.ts`). 53 creatures, seeded from the round like the
tokens and the gems, so the water is fresh every 30 minutes and identical for
everyone playing that round. 30 redfish, 12 dolphins, 7 orcas, 4 whales.
Nothing spawns on the land or outside the planet's limb; nothing beaches
itself (land ahead turns a creature away before it gets there). They are
drawn UNDER the land, so a whale passes under the coast it swims past, and
they fade out well before the pulled-out map, per Bryan's "not in the map
view". The far schools of tiny fish that were already scattered on a grid
stay as background; the giant generic ones are gone, because the big rungs
are real creatures now.

**The threat.** An orca notices a bug adrift within 1900px and runs it down
at 430px/s, which is faster than a drifting bug can go: it catches you. A
whale notices from 2500px but only makes 215px/s, so it cannot chase you
down; you blunder into it, and it is enormous. The mouth opens as it closes
in. Contact and the jaws shut over the bug, which is drawn last so you watch
it happen, then a ring of bubbles.

**Only a bug that is DRIFTING and off every landmass is on the menu.** On a
rail, over land, riding something or reading the map, nothing out there can
reach it. That deliberately turns over the one lesson the land teaches
("jumping over trouble is always the answer") without breaking it: over the
land it still holds, and hopping back over a coast is how you escape a whale.

**Priced like every other setback.** Explore mode costs nothing but the trip;
every other mode drops carried tokens and any DHF votes being carried; the
bug is spat back onto the last shore it stood on, stunned, with the warp
flash and a screen shake. Never a death.

Nothing touches `movement.ts`. The swallow is a phase timer and the frame
loop suspends the integrator while it runs, exactly the way the sock envelop
already works. No new translation strings: the whole thing is a picture.

Eight new headless checks (`checks/sea.ts`), 45 in the run, all passing: the
whole ladder is present, nothing spawns on land or off the planet, two
minutes of swimming beaches nobody, the round is the same sea for everyone
and the next round restocks it, a bug that is not adrift is never touched, a
hunter swallows an adrift bug exactly once and lets go on time, the grace
after a swallow stops a second one, and redfish and dolphins never take the
bug.

Checked in the in-app browser (mocked sign-in, the frame loop driven by hand
while the pane was hidden): the globe as an ocean at map zoom with no
creatures on it, the water surface at play zoom, an orca and a dolphin and a
redfish and a whale swimming off the sock isle, a whale and an orca lunging
with their mouths open, an orca with the bug inside its closed jaws, and the
bug spat back onto its rail afterwards. Frame times above. Not yet played by
hand.

**Judgement calls for Bryan.** Whether the whale is too big at play zoom (it
is about half the screen wide). Whether an orca should be escapable at all,
given it is faster than the bug. Whether the water should be louder or
quieter on the pulled-out map. Whether the redfish and dolphins should stay
purely decorative for now, and what "earn or get something from them" would
be. Whether "high stake blasts your rep, low rep hides your posts" should
become a second, separate thing the hunters do, rather than the swallow.
