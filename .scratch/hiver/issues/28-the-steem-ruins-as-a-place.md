# The Steem Ruins as a place you can reach

Type: prototype
Status: resolved
Blocked by: none

## Question

Today the ruins are visible, unreachable scenery in the far west (`lib/fixed-world.ts:424`). Bryan: reaching them "would be cool". Rough a version with a road or hop to them and something to see there.

## Answer

Built 2026-09-06, rough, Bryan's picture: the ruins are the door to the BACK
of the board.

- The ruins are a landmark now (`steem_ruins`, on a spoke off the anchorage
  hub, landing exactly where the art already stood). A rail reaches them, the
  full map can warp you there, they count as a place found.
- Park there and the board FLIPS: it turns on its vertical axis over about a
  second, edge-on and dark in the middle, and lands on its back.
- The back is the same board mirrored, drained of colour and pulled cold.
  Nothing lives there: no critters, tokens, gems, shots or traffic; only the
  bug rides. Steering is mirrored so left is still left on screen.
- The HUD says SIDE STEEM, the old chain. The panel at the ruins tells the
  story and links the real 2020 announcement. Park at the ruins again to flip
  back.
- Code: `lib/board-side.ts` (the turn, DOM-free), the flip transform and dead
  tint in `engine/render.ts`, the trigger and mirrored steering in
  `engine/canvas-map.tsx`.

Checked in the in-app browser by warping to the ruins from the full map:
the turn, the midpoint switch, the mirrored cold back, the HUD line and the
panel note all seen. Not yet played by hand.

Open for Bryan: what stands on the back (today it is only the dead board);
whether the mirror is right or the back should be its own map; the standing
3D look for the whole board, which is an art pass of its own.
