# Art direction

Produced by a five-brief design critique cycle (2026-08-21): Bryan fed
board-game-store reference photos and map screenshots to a design agent, the
agent synthesized direction, and pass seventeen implemented the first slice.
This file is the durable record: the direction, the rules every new visual
must obey, the backlog, and the questions still open for Bryan.

## The material story (five sentences)

The Hive world is a thick slab of living red comb-rock, a strange-shaped
planet floating in a deep violet universe that glitters but never shouts.
The planet sheds magic fragments of itself: drifting island chips, floating
stations in its canyon straits, and two great wheels (ferris and rose) that
fill with earned light as players act. Warm light means civic and alive
(gold windows, stained glass, a beating tent-heart); cold light means dead
or dangerous (blue-grey ruins, dim lairs in the wilds). Detail obeys
distance: identity from afar, elaboration up close; get close and find
more. Nothing in the sky, the chrome, or the void may ever outshine the
land, the routes, or the landmarks.

## Hierarchy guardrails (check every new element against these)

- Alpha ceilings: star peaks 0.70 (anchors only), star field average 0.45
  or less, constellation lines 0.15, geometry accents 0.10, streaks 0.10;
  nothing in the void ever reaches alpha 1.0.
- Size ceilings: void elements smaller than the smallest land node (~8px at
  map zoom); anchor stars 4px plus halo, maximum.
- Motion: no ambient period under 2s; one-shot celebrations 1.5s or less;
  ambient drift 3px/s or less; ambient rotation 90s per revolution or more.
- Luminance: void mean under ~8 percent. Squint test: first read is the red
  silhouette, then gold routes, then landmarks. Cut density before color.
- Reserved hues: land red, saturated route gold, saturated lane cyan appear
  nowhere else. Red leaves the planet only as the 5 percent dusty-rose
  stars and (future) coastal chip tops.
- Quiet margins: a star-free band along every coast; a wider fear-fade
  planned around lairs.
- The channels (the logo's negative-space cuts) are CONTENT space, not
  void: one-third star density, small stars only, no constellations or
  streaks there.
- LOD everywhere: every element ships with a far form (shape and color
  only) and a near form (the elaboration). Below ~6px drawn, identity only.
- Text lives in the HUD only, never in the world.
- Performance: pre-render and blit wherever possible; the 12ms map-zoom
  frame budget is the law.

## Shipped in pass seventeen (the S-tier slice)

Colorful screen-space starfield with clumps and twinkle, visible at every
zoom; diagonal light streaks aligned with the logo's slant; five
sacred-geometry constellations tracing Hive iconography (hex, upvote
chevron, key, bee, puppet tower), fixed forever so they double as unlabeled
navigation landmarks; the land's drop shadow (thick slab, light from
upper-left) and a gentle rim-only curvature dim; honeycomb interior texture
at play zoom (the planet IS a comb); line-weight rebalance per Bryan's
ruling (gold 1.3x cyan, cyan unchanged, streets 0.5x cyan with a 2px map
floor, gold bloom halved); the oxygen helmet became a WORN glass dome on
the bug's head, bee-astronaut style; the Basecamp tent's doorway light now
beats like a heart (quick rise, slow fall, 1.2s); witness towers gained lit
windows with a blinking few; the warp effect became a three-arm color
spiral (the bike-wheel brief); Copypasta got big adorable eyes with
catchlights; MAP and HOP buttons shrank ~30 percent (hit targets kept).

## Backlog (designed, parameterized, not yet built)

Medium effort: collectible gems (faceted stickers, eye candy, no economy
yet, per Bryan); floating island chips (coastal red-top and deep-void
crystal-top variants, one structure each, gentle hover); the icon grammar
plus sprite atlas (plate shape = type, plate color = family, glyph =
identity, two-tier LOD); the ferris trophy wheel (8 gondola sockets, bring
an item, ride one rotation, it mounts for the board; first item: a
helmet); channel ports, tethers, ferries and periscope events; the striped
celebration card and arcade interior (UI layer only).

Large effort: channel stations (self-lit modular link platforms); the Rose
Window link cathedral (the wider channel's bridge-base, panes light as the
player actually uses Hive, twin-wheel composition with the ferris);
monster lairs and the elaborated near-scene Steem Ruins (small on the map,
big in the frame).

Deliberately deferred: cliff-band coast strokes (needs coast geometry
work), harbor silhouettes at ports (needs ports first), expansion seeds
(edge-fading road, wrap-around orbiter), control-button chrome redesign.

## Pass eighteen addendum (Bryan's playtest verdicts, same day)

Bryan answered YES TO ALL TEN questions below and gave four playtest fixes
plus one direction correction. Shipped in pass eighteen: rail speed one
third faster (the one sanctioned edit to frozen movement.ts); the helmet
dome grown and brightened after "couldn't see it"; the witness beam now
HOLDS at the crown until the player chooses Skip, then rides home; the
ferris wheel boards by PROXIMITY in any mode (the park-at-the-node rule
never fired in real play) and a jump hops out early; the trophy wheel's
first mount (carry a helmet, ride a full rotation, it rides the wheel for
the rest of the board); FLOATING ISLAND CHIPS occupying twelve of the
circled void pockets (ember, teal, lilac, pink and gold tops, huts with lit
windows and pulsing spires, verified off-land and clear of neighbours);
collectible GEMS in six bold cuts along rails and around chips with a HUD
counter; communities now dim-until-visited; nebulae doubled to four and
everything in the sky turned up ("be more brave and bold with color").

Direction correction recorded: "use the real estate" means OCCUPY the void
with content, not only sprinkle stars. Chips and gems are the first
occupants; stations, the Rose Window, and lairs are the backlog's next.

## Open questions for Bryan (designer recommendation in parentheses)

ALL TEN ANSWERED YES by Bryan on 2026-08-21; kept for the record.

1. Rose Window inner-six pane inventory? (Write Post, Wallet, Sign Up,
   Communities, Notifications, Profile)
2. Streets: recolor warm rose, or keep the neutral pale at the new width?
   (keep neutral, re-judge now that the rebalance shipped)
3. Streak orange in or out, given gold-ambiguity risk? (in at whisper
   alpha; first thing cut if the squint test fails)
4. Retrofit community ring badges to the dim-until-visited socket grammar?
   (yes, with a resting floor so the ring never looks broken)
5. Lair beast species? Octopus is taken by Copypasta. (a dragon or serpent;
   one silhouette per creature)
6. Amber gems next to route gold: acceptable? (yes; small faceted shapes
   with dark outlines read differently than lines)
7. Trophy slots locked at 8? (yes, fillable within one 30-minute board)
8. Helmet trophy: first helmet mounts, or require all 21? (first mounts;
   the HELMETS counter tracks the rest)
9. Control chrome redesign now or later? (later; resize shipped first)
10. Coastal chip count: 5 per coast enough magic? (yes; scarcity is the
    magic)

## The sea (2026-09-15, Bryan's order)

"Maybe make the water look more like water. Right now it is a glowing, it
just is sort of a glowing sphere. Both in the map and in the gameplay." So
the planet's disc stopped being a glow and became a surface.

Rules this adds, for anything drawn on the water later:

- The sea holds its colour while you play (alpha 0.5, was 0.2) and the star
  field glitters through it rather than being covered. This is a DELIBERATE
  exception to the void's luminance ceiling: inside the planet's limb you are
  looking at an ocean, not at space. Outside the limb the ceiling still
  stands, untouched.
- Everything on the surface is measured in SCREEN px and divided by the zoom,
  never in world px. One set of numbers then reads as water at play zoom and
  as an ocean on the pulled-out map, with no second art pass and no LOD
  switch. Swell 118px, caustic net 61px, sampled every 26px and 34px.
- The swell bows toward the limb in proportion to mapness, so the map reads
  as water wrapping a ball rather than a flat pond.
- Reserved hues are unchanged: the sea is teal through ocean blue to near
  black, the crests are near-white, the caustics are a whisper of cyan at
  alpha 0.05 to 0.10 — texture, never a line anyone could mistake for a lane.
- Measured: 0.36ms a frame at play zoom, 1.44ms at map zoom, against the 12ms
  law.

And the creatures in it (engine/sea.ts, icons/sea-life.ts): chunky sticker,
same as every other fictional thing — thick dark outline, flat fill, one pale
belly, never mirrored upside down. They are drawn UNDER the land, so the
coast crosses in front of them, and they are GONE from the pulled-out map on
Bryan's order ("they don't need to be in the map view, just in the
gameplay"). The one exception to drawing order is the creature with the bug
in its mouth, which is drawn last, over everything, so the swallow reads.

## The globe, and the ocean seen from it (2026-09-16, Bryan's order)

"In the map form it's not clear that it's ocean and waves. I can see there's a
line that's moving, it's supposed to represent waves, but it doesn't really do
that." And: "Let's stop this flipping thing. Wherever the bug is, when you hit
map you're always centred, and the map rotates."

Two rules come out of this, and neither should be undone without asking him.

**The land holds the world still.** The turn is how far past the landmass the
bug has gone, not where the bug is: anywhere between the Hive mark's west and
east ends the globe does not move at all. Bryan's words for why, and they are
the test for anything added here: "everything looks wrong and stretched, which
we don't want". The turn is for leaving the world behind, not for walking
around on it.

**The resting map is sacred.** The turn is built on the plain orthographic
projection, which is the identity at rest, so the composition everyone has
tuned by hand for eighteen passes is untouched when the globe is facing you.
Anything added to the map has to keep that true: if a new element cannot be
expressed as something standing on the ball (inside the limb) or as a pin
above it (outside the limb), it does not belong on the map.

**The light belongs to the viewer, the surface belongs to the ball.** This is
the line that decides where a new piece of paint goes:

- The body of the sea, the glitter path, the atmosphere, the night and the
  sheen are LIGHT. They are painted straight onto the screen and never turn.
  On the map the night now falls OVER the board rather than under it, so the
  terminator darkens the land with the water it sits in; that crossfade is
  held to `mapness`, so play zoom is exactly what it was.
- The swell, the crests and the glints are SURFACE. They are painted on the
  board and turn with the coasts, squeezing toward the limb.

Waves, after the rework:

- Never an unbroken line across the map. An unbroken line is a contour or a
  route; the eye files it as information, not as water. Crests are SHORT
  DASHES in staggered rows, each drawn twice — a dark trough under a bright
  crest — because that pair is what makes a mark read as a wave.
- Under them, wide soft bands of lighter water following the wave fronts. At
  a distance this is what reads as ocean before any single wave does.
- The dashes are LONG at play zoom and SHORT on the map, and the rows are 92
  screen px apart at play zoom and 25 on the map. A wave has a real size: up
  close you are among a few rollers, from orbit you see a whole sea of them.
  Everything is still measured in SCREEN px and divided by the zoom.
- The sea is OPAQUE on the map (alpha 0.99). The star field glittering
  through the water was exactly what made the ball read as a glow. The play
  zoom exception above still stands: at 0.5 the stars still show while you
  play, and that stays.
- NOTHING WIDE MAY BE PAINTED ON THE SURFACE. The two hemispheres come off
  two different sheets and meet on a seam. Fine texture is squeezed to
  nothing at that seam and crosses it invisibly; anything wide lands half on
  each side and draws a hard edge down the ocean. The depth patches were
  exactly that, so they now fade out as the map pulls back and the body's own
  gradient does the large-scale shading from there.
- Measured: 0.9ms a frame at play zoom, 2.3ms at map zoom (both boards
  painted plus the warp), against the 12ms law.
