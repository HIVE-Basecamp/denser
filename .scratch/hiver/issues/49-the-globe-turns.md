# The globe turns, and the ocean looks like an ocean

Type: task
Status: resolved
Blocked by: none

## Question

Bryan, 2026-09-16, two things in one message.

On the water: "Basically I don't think in the map form it's clear that it's
ocean and waves. But it's maybe fine in gameplay. Perhaps you could do a
little more thought into what to make the map look a little bit more like
waves. I do like that there's a line, I can see that there's a line that's
moving, it's supposed to represent waves, but it doesn't really do that. So I
don't know if you can find other graphics and how they represented oceans at
a distance. Maybe model after something that you can find. Doesn't really
look like it quite yet."

On the map: "The other piece that I really want to do is, wherever the position
of the hiver bug is, when you hit map, you're always centred. And the map
rotates. Currently the map only ever shows you sort of the two-D shot, and then
you have it so that it flips over when you're gonna go see Steem ruins. Let's
stop this flipping thing. And actually move around this globe with the bug. So
like, if you're over on the keep of JSON then you should be able to see the
edges of Steem, and the citadels would move around. Maybe when you're over on
the keep maybe you don't see all the citadels. So you always have a starting
position where everything basically is seen how it is now, but as soon as you
start moving, when you clip out into map, that map should rotate around the
globe."

## Answer

Built 2026-09-16. Not committed.

### Over the land, the map does not move (Bryan's correction, same day)

First pass turned the globe wherever the bug stood, and his verdict on seeing
it was: "If the bug is anywhere on the Hive logo the view stays the same as
always on the map. Everything looks wrong and stretched, which we don't want.
So only when the bug moves off to the right or left of the Hive logo landmass
should the map view change."

So the turn is not the bug's longitude. It is how far PAST the land the bug has
gone. The landmass runs from -5885 to 5920 in world px, which is about three
quarters of the ball's width; anywhere in that span — which is all of the
walkable board — the globe holds dead still and the map is the one he already
knows. Step off either end into the open sea and it begins to turn from
nothing, growing as you go. Out at the western limb that comes to about 43
degrees, at the eastern limb about 75.

### The world is a ball now

The flat board we have always drawn IS the ball seen face on. A point at world
(x, y) sits at latitude `sin(lat) = y / PLANET.ry` and longitude
`sin(lon) = x / halfWidth(y)`, which is the ordinary orthographic projection.
That choice is what makes Bryan's "everything is seen how it is now" condition
hold exactly: at rest the sum is the identity, so the resting map is pixel for
pixel the map he already has. Turn the globe and screen x becomes
`halfWidth(y) * sin(lon - turn)`; y never moves.

- Pull out to the map and the globe turns until the bug's longitude is facing
  you. Move and it follows, eased, never snapping.
- The citadels lean past the limb, so they are pins above the ball rather than
  paint on it: `x' = x * cos(turn)`. The ring closes toward the middle as the
  world turns, the near half passes in FRONT of the ball and the far half is
  cut off at the limb and swallowed. That is his "maybe you don't see all the
  citadels".
- The old chain is no longer a separate card. It is the far hemisphere, at
  longitude PI. Turn far enough and its coast comes round the limb on its own.

### The flip is gone

Parking at the Steem Ruins used to mirror the whole board like a turning card.
It now pulls the camera out to the map, rolls the world half a turn over about
two seconds, and drops the camera back in on the far coast. Because you turn to
face that side rather than looking at the back of it, nothing is mirrored any
more: the old chain reads the right way round, and the steering there is no
longer inverted (that inversion existed only to match the mirror).

### How it is painted, and what it costs

The turn never moves anything vertically, so the warp is axis-aligned. Each
board is painted flat onto its own off-screen sheet exactly as before and then
copied onto the screen in horizontal rows, each row cut into columns that
narrow toward the limb: no clipping, no shearing, no per-pixel work, no 3D
engine. At rest nothing is copied at all — the board goes straight to the
screen and the cost is unchanged.

The cursor is rolled back through the same sum before the hit test runs, so
hovering and travelling on a turned map hit what they look like they hit.

### The ocean

The old swell was CONTINUOUS lines running the width of the world, and that is
precisely why it read as a contour rather than as water: an unbroken line on a
map is information, a route. What every chart and illustrated sea does instead:

- Crests are short DASHES in staggered rows, never a line across, each drawn
  twice — a dark trough under a bright crest.
- Under them, wide soft bands of lighter water following the wave fronts. At a
  distance this is the thing that reads as ocean first.
- Dashes are long at play zoom and short on the map; rows are 92 screen px
  apart up close and 25 from orbit. A wave has a real size.
- The sea is now opaque on the map. Stars glittering through the water was
  most of what made the ball read as a glow.
- On the map the night falls OVER the board instead of under it, so the
  terminator darkens the land with the water it sits in. Play zoom untouched.

## What was checked

- Ten new headless checks on the globe maths (`checks/globe.ts`), including
  the two conditions Bryan set: at rest the projection is the identity for
  every spot and every tower, and turning to a spot's own longitude puts it
  dead centre. 53 of 53 checks pass.
- Two more checks on the hold: a thousand sampled spots on the real terrain
  plus every one of the terrain cells, and not one of them moves the world;
  and past either end the turn grows from zero, the right way, all the way to
  the limb.
- In the browser: bug on the land at (-3563, -1810), turn exactly 0, the map
  identical to the one we had. Bug at the Steem Ruins just off the west coast,
  turn -4.8 degrees, barely a nudge. Before this correction the same spot on
  the land was turning the world 28.7 degrees.
- The crossing, watched frame by frame: -34 degrees to 57 to 144 to 180, the
  side changing at the half-way point, the camera out and back on its own.
- The cursor on the turned map: the Steem Ruins named themselves exactly where
  the forward projection predicted, on both sides of the world.
- Frame cost, measured: 0.9ms at play zoom (was 0.36) and 2.3ms on the map
  (was 1.44), against the 12ms budget. Both boards are painted every map
  frame; the far one is skipped when its sliver is under three pixels.
- Typecheck clean. Lint: the only errors in the feature are the two
  pre-existing `no-img-element` rule-not-found ones.

## Judgement calls, for Bryan

1. **The old chain's map never turns.** Its land (the busted Steem mark) is
   wider than the ball, so by the rule above the far side always holds still.
   That reads as consistent, but it does mean the bug is not centred over
   there. Say if you want the old chain to turn anyway.
2. **The globe turns left and right, not up and down.** "Always centred" is
   true horizontally. Tilting for latitude as well would swing the poles into
   view and would cost several times as much to paint, so the world rolls
   about its upright axis only and the bug sits on the centre line rather than
   on the exact centre. Say the word if you want the tilt too.
3. **The whole world is one hemisphere.** The living chain fills the face and
   the old chain fills the back, which is why turning a little shows a sliver
   of Steem at the limb. If more landmasses arrive they will have to share
   those two halves, or the ball gets bigger.
4. **The depth patches in the water are gone from the map** (they still play
   up close). They were wide enough to straddle the seam where the two
   hemispheres meet and drew a hard edge down the ocean. The body's own
   gradient does the large-scale shading from there.
5. **The towers fade out as they foreshorten** and are gone by the time the
   world is edge on to them. Left in, they would smear a mirrored ring of
   witness faces across the middle of the ball.
6. **The far side still shows nothing of the living side** and its rusted
   streets are still drawn. If the far hemisphere should stay quieter now that
   it is visible from the near side, that is a one-line change.
