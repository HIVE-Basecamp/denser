/**
 * H.I.V.E.R. - the Steem side: what stands on the back of the planet.
 *
 * Bryan (2026-09-12): the ruins go round the back, out of sight. Turn the
 * globe and the back is the old chain's land, the way the Hive mark is the
 * front's: the real Steem mark in Steem's own blue, busted up, pieces
 * missing, rough. A banished land later. Off its coast, a Blurt island.
 *
 * Pure numbers here: where things stand and what is broken, in the mark's
 * own units. The paint is engine/steem-land.ts and engine/icons; the layer
 * is engine/render/layer-steem.ts.
 */

/**
 * The Steem mark: three flame strokes, path data verbatim from the coin
 * icon (viewBox 0 0 32 32). The icon's blue disc behind them is the planet
 * itself here.
 */
export const STEEM_MARK_PATH =
  'M9.87 8.229c.216.037-.322 1.47-.022 3.107.26 1.403 3.507 6.836 3.373 8.7-.104 1.17-2.77 3.915-3.051 3.732-.307-.085.81-1.95.396-3.504-.482-1.812-3.34-6.496-3.337-8.564 0-1.513 2.448-3.569 2.64-3.471zm6.109-2.14c.274.047-.41 1.876-.028 3.959.33 1.792 4.473 8.72 4.301 11.095-.134 1.494-3.532 4.991-3.892 4.76-.39-.107 1.034-2.486.506-4.468-.613-2.308-4.258-8.282-4.255-10.919 0-1.931 3.122-4.55 3.368-4.426zm6.305 2.14c.216.037-.321 1.47-.022 3.107.26 1.403 3.507 6.836 3.374 8.7-.103 1.17-2.77 3.915-3.052 3.732-.306-.085.81-1.95.396-3.504-.481-1.812-3.34-6.496-3.337-8.564 0-1.513 2.45-3.569 2.641-3.471z';

/** The mark's own box, in its units. */
export const STEEM_VIEW = { w: 32, h: 32 } as const;

/** The strokes' centre in the mark's units (they sit a touch left of the disc's). */
export const STEEM_MARK_CENTRE = { x: 16.4, y: 16 } as const;

/**
 * Where the Steem land stands, world px, and its scale: world px per mark
 * unit. At 500 the mark stands about as tall as the Hive land on the front.
 */
export const STEEM_LAND = { x: 0, y: 0, unit: 500 } as const;

/** The land's box in world px. */
export function steemLandBox(): { x: number; y: number; w: number; h: number } {
  const { x, y, unit } = STEEM_LAND;
  return {
    x: x - STEEM_MARK_CENTRE.x * unit,
    y: y - STEEM_MARK_CENTRE.y * unit,
    w: STEEM_VIEW.w * unit,
    h: STEEM_VIEW.h * unit
  };
}

type Poly = readonly (readonly [number, number])[];

/**
 * THE MISSING PIECES: closed polygons in the mark's units, cut out of the
 * land. Hand-placed, so they never move: the left stroke has lost its foot,
 * the right stroke its head, the middle one a chunk of its coast and a
 * hole through it. None overlap, which is what lets one even-odd fill cut
 * them all.
 */
export const STEEM_BITES: readonly Poly[] = [
  // The left stroke's foot, gone.
  [
    [8.8, 22.0],
    [12.6, 21.2],
    [13.0, 24.3],
    [9.0, 24.5]
  ],
  // A nibble out of the left stroke's inner coast.
  [
    [6.8, 12.6],
    [8.6, 12.2],
    [8.9, 14.2],
    [7.2, 14.6]
  ],
  // A hole through the left stroke.
  [
    [10.3, 17.6],
    [11.5, 17.3],
    [11.8, 18.6],
    [10.6, 18.9]
  ],
  // A chunk off the middle stroke's head.
  [
    [15.0, 6.6],
    [16.6, 6.2],
    [16.6, 7.9],
    [15.2, 8.1]
  ],
  // A hole through the middle stroke's shoulder.
  [
    [14.0, 11.0],
    [15.2, 10.6],
    [15.9, 12.2],
    [15.0, 13.4],
    [13.8, 12.6]
  ],
  // The big bite out of the middle stroke's bulge.
  [
    [18.6, 16.5],
    [20.8, 16.9],
    [21.0, 19.4],
    [19.0, 19.8],
    [18.2, 18.0]
  ],
  // The middle stroke's tail, snapped.
  [
    [15.4, 24.2],
    [17.6, 23.4],
    [18.0, 26.4],
    [14.9, 26.6]
  ],
  // The right stroke's head, gone.
  [
    [20.6, 7.4],
    [23.4, 7.2],
    [23.6, 9.8],
    [21.0, 10.4]
  ],
  // A bite out of the right stroke's inner coast.
  [
    [19.2, 14.0],
    [21.4, 14.5],
    [21.2, 16.4],
    [19.0, 16.0]
  ],
  // A nibble off the right stroke's foot.
  [
    [22.0, 22.4],
    [24.2, 21.6],
    [24.6, 23.0],
    [22.4, 23.6]
  ]
];

/** THE CRACKS: open polylines across the land, in the mark's units. */
export const STEEM_CRACKS: readonly Poly[] = [
  [
    [7.9, 15.4],
    [9.0, 15.0],
    [9.6, 15.8],
    [10.8, 15.3],
    [11.6, 15.9]
  ],
  [
    [13.4, 14.2],
    [14.6, 14.9],
    [15.1, 16.4],
    [16.6, 16.9],
    [17.4, 18.3]
  ],
  [
    [15.6, 20.4],
    [17.0, 21.0],
    [17.8, 22.6]
  ],
  [
    [22.9, 11.6],
    [23.1, 13.2],
    [22.4, 14.3],
    [22.9, 16.0],
    [23.9, 17.4],
    [23.6, 19.2]
  ]
];

/**
 * THE RUBBLE: the pieces that broke off, lying in the sea near where they
 * came from. Small polygons in the mark's units, clear of the land.
 */
export const STEEM_FRAGMENTS: readonly Poly[] = [
  // Below the left stroke's lost foot.
  [
    [9.4, 25.2],
    [10.6, 24.9],
    [10.9, 25.9],
    [9.7, 26.2]
  ],
  [
    [12.4, 24.6],
    [13.2, 24.4],
    [13.3, 25.2],
    [12.5, 25.3]
  ],
  // Above the two lost heads.
  [
    [17.4, 5.2],
    [18.2, 5.0],
    [18.4, 5.9],
    [17.6, 6.1]
  ],
  [
    [21.2, 5.6],
    [22.4, 5.3],
    [22.7, 6.4],
    [21.5, 6.7]
  ],
  // Between the middle and right strokes, under the big bite.
  [
    [21.0, 20.8],
    [21.9, 20.6],
    [22.0, 21.6],
    [21.1, 21.7]
  ],
  // Off the right stroke's outer coast.
  [
    [26.2, 14.8],
    [27.0, 14.4],
    [27.3, 15.5],
    [26.5, 15.8]
  ],
  // Below the middle stroke's snapped tail.
  [
    [15.2, 27.2],
    [16.3, 26.9],
    [16.6, 27.9],
    [15.5, 28.2]
  ]
];

/**
 * THE RUINED DISTRICT: the dead grey streets and the snapped citadel, on the
 * right stroke of the Steem land. World px; `r` is the art's size. On the
 * back the world is mirrored, so this stands to the right on screen, a
 * short ride from the door.
 */
export const STEEM_DISTRICT = { x: -3700, y: 1900, r: 460 } as const;

/**
 * THE BLURT ISLAND: the other fork, a small island off the Steem land's
 * south-western coast (screen left on the back). World px; `r` is the
 * island's radius. Scenery for now; a banished land later, like the rest.
 */
export const BLURT_ISLAND = { x: 5200, y: 3300, r: 900 } as const;
