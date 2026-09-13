/**
 * H.I.V.E.R. - the planet.
 *
 * Bryan (2026-09-06): "the hive was a planet and had multiple sides", and the
 * place to feel it is the map view. No 3D engine. The world keeps the same
 * top-down composition, tuned by hand, and gains a body: a sphere seen
 * face-on, a shaded disc under the mark inside the witness ring. The
 * citadels lean outward from its centre like pins in a globe as the camera
 * pulls out, and the flip at the ruins turns the sphere, not a card. Pure
 * numbers here; the paint is engine/planet.ts.
 */
import {
  CLUSTERS,
  COMMUNITY_SPOTS,
  ISLAND_CHIPS,
  LANDMARKS,
  WITNESS_OVERRIDES,
  WITNESS_RING,
  landmarkPosition,
  witnessPosts
} from './fixed-world';
import { insideBody } from './landmass';

/** The planet's disc, world px. The witness ring stands on its rim. */
export const PLANET = {
  rx: WITNESS_RING.rx + WITNESS_RING.stagger * 0.4,
  ry: WITNESS_RING.ry + WITNESS_RING.stagger * 0.4
} as const;

/**
 * How far a tower standing at (x, y) leans outward: radians, clockwise from
 * upright. Nothing at play zoom, fully radial on the pulled-out map, so up
 * close a citadel stands and from above the ring reads as a globe bristling
 * with towers.
 */
export function towerLean(x: number, y: number, mapness: number): number {
  const lean = Math.atan2(y / PLANET.ry, x / PLANET.rx) + Math.PI / 2;
  // Keep the angle in (-PI, PI] so the towers past the bottom turn the short way.
  const wrapped = lean > Math.PI ? lean - Math.PI * 2 : lean;
  return wrapped * mapness;
}

/** The point `dist` up a tower standing at (x, y) that leans by `lean`. */
export function towerPoint(x: number, y: number, dist: number, lean: number): { x: number; y: number } {
  return { x: x + Math.sin(lean) * dist, y: y - Math.cos(lean) * dist };
}

/* ------------------------- room for every tower ------------------------- */

/**
 * How much of the map each big place takes up at map zoom, world px, art
 * included. Measured by eye on the pulled-out map; generous on purpose so a
 * tower never brushes a place.
 */
export const BIG_FOOTPRINT: Readonly<Record<string, number>> = {
  basecamp: 1100,
  proposals: 650,
  witnesses: 600,
  arcade: 400,
  developer_portal: 350,
  json_keep: 1000,
  our_dapps: 1600,
  mount_socko: 750,
  rose_window: 850
};

/** A big place with no measured footprint of its own, world px. */
const BIG_FOOTPRINT_DEFAULT = 600;
/** Room a floating island chip takes at map zoom, halo included, world px. */
const CHIP_FOOTPRINT = 380;
/** Room a community bubble takes, world px. */
const COMMUNITY_FOOTPRINT = 430;
/** Room an offshore cluster's hub and its spokes take, world px. */
const CLUSTER_FOOTPRINT = 520;
/**
 * Breathing room a tower leaves around everything it must clear, world px.
 * Without it a tower stops the moment it stops overlapping, which reads as
 * standing behind the place rather than beside it (Bryan, 2026-09-12:
 * "several citadels stand behind or crowd other things"). Bryan's own named
 * placements do not pay it: they only move when they actually overlap, so
 * his boxes hold.
 */
const TOWER_CLEARANCE = 230;

export interface Obstacle {
  x: number;
  y: number;
  r: number;
}

/**
 * Everything on the map a tower must stand clear of. The big places were
 * always here; the island chips, the community bubbles and the offshore
 * cluster hubs were not, which is how towers came to lean over them.
 */
export const MAP_OBSTACLES: readonly Obstacle[] = [
  ...LANDMARKS.filter((lm) => lm.big).map((lm) => {
    const p = landmarkPosition(lm);
    return { x: p.x, y: p.y, r: BIG_FOOTPRINT[lm.id] ?? BIG_FOOTPRINT_DEFAULT };
  }),
  ...ISLAND_CHIPS.map((c) => ({ x: c.x, y: c.y, r: CHIP_FOOTPRINT })),
  ...COMMUNITY_SPOTS.map((c) => ({ x: c.x, y: c.y, r: COMMUNITY_FOOTPRINT })),
  ...CLUSTERS.map((c) => ({ x: c.x, y: c.y, r: CLUSTER_FOOTPRINT }))
];

/** The tallest tower, world px (rank 1). */
const TOWER_H_MAX = 1680;
/** The map hint sits over the top edge; the ring stays under it. */
const TOP_BAND = 1400;
/** Breathing room under the lowest hanging tower. */
const BOTTOM_BAND = 500;

/**
 * How far the big places themselves reach from the world's origin, art
 * included. The witness ring used to be the outermost thing in the world;
 * Bryan's south bay put the Hive dApps ship out past it (I-26 and S-26,
 * 2026-09-12), so the pulled-out map has to be told to fit the places too,
 * or the ship's bottom is simply cut off.
 */
function bigPlacesExtent(): { x: number; up: number; down: number } {
  let x = 0;
  let up = 0;
  let down = 0;
  for (const lm of LANDMARKS) {
    if (!lm.big) continue;
    const p = landmarkPosition(lm);
    const r = BIG_FOOTPRINT[lm.id] ?? BIG_FOOTPRINT_DEFAULT;
    x = Math.max(x, Math.abs(p.x) + r);
    up = Math.max(up, r - p.y);
    down = Math.max(down, p.y + r);
  }
  return { x, up, down };
}

const PLACES = bigPlacesExtent();
const RING_HALF_W = WITNESS_RING.rx + WITNESS_RING.stagger + TOWER_H_MAX + 300;
const RING_HALF_H = WITNESS_RING.ry + WITNESS_RING.stagger + TOWER_H_MAX + (TOP_BAND + BOTTOM_BAND) / 2;
const MAP_CENTRE_Y = -(TOP_BAND - BOTTOM_BAND) / 2;

/**
 * What the pulled-out map must fit: the ring, the towers leaning fully
 * outward, a band under the hint at the top, and any big place that stands
 * further out than all of that. The centre sits a little below the world's
 * origin so the north tower clears the hint without shrinking the whole map
 * for it.
 */
export const MAP_FIT = {
  halfW: Math.max(RING_HALF_W, PLACES.x),
  halfH: Math.max(RING_HALF_H, PLACES.down - MAP_CENTRE_Y, PLACES.up + MAP_CENTRE_Y),
  /** Camera centre on the pulled-out map: up a little, so the top has room. */
  centreY: MAP_CENTRE_Y
} as const;

function towerHeight(slot: number): number {
  return TOWER_H_MAX - slot * 22;
}

/** Distance from a point to a segment, world px. */
export function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

export interface Placed {
  x: number;
  y: number;
  tipX: number;
  tipY: number;
  w: number;
}

/** The span a tower standing at (x, y) covers on the pulled-out map. */
export function leaningTower(x: number, y: number, slot: number): Placed {
  const h = towerHeight(slot);
  const tip = towerPoint(x, y, h, towerLean(x, y, 1));
  return { x, y, tipX: tip.x, tipY: tip.y, w: h * 0.26 };
}

/**
 * Is a tower standing here, leaning fully outward, in anyone's way: on the
 * land, over anything with its own room on the map, or across another tower
 * already placed?
 */
function towerBlocked(t: Placed, placed: readonly Placed[], clearance: number): boolean {
  for (const f of [0, 0.5, 1]) {
    if (insideBody(t.x + (t.tipX - t.x) * f, t.y + (t.tipY - t.y) * f)) return true;
  }
  for (const o of MAP_OBSTACLES) {
    if (segDist(o.x, o.y, t.x, t.y, t.tipX, t.tipY) < o.r + t.w * 0.6 + clearance) return true;
  }
  for (const o of placed) {
    const gap = (t.w + o.w) * 0.7;
    if (
      segDist(o.x, o.y, t.x, t.y, t.tipX, t.tipY) < gap ||
      segDist(o.tipX, o.tipY, t.x, t.y, t.tipX, t.tipY) < gap ||
      segDist(t.x, t.y, o.x, o.y, o.tipX, o.tipY) < gap ||
      segDist(t.tipX, t.tipY, o.x, o.y, o.tipX, o.tipY) < gap
    ) {
      return true;
    }
  }
  return false;
}

/** How far, and in how many steps, a tower walks out along its own ray. */
const WALK_PX = 90;
const WALK_STEPS = 30;

/** Spots to try around a named placement, nearest first, in grid steps. */
const NUDGES: readonly [number, number][] = [
  [0, -700],
  [700, 0],
  [-700, 0],
  [0, 700],
  [700, -700],
  [-700, -700],
  [700, 700],
  [-700, 700],
  [0, -1400],
  [1400, 0],
  [-1400, 0],
  [0, 1400]
];

/**
 * Where the 21 towers stand, in rank order, each with its own space on the
 * pulled-out map. Bryan's named placements (WITNESS_OVERRIDES) go first and
 * keep their spot unless a leaning tower there would actually cross the land
 * or something on it, in which case the nearest clear grid step is taken.
 * The rest follow the ring formula and are walked outward along their own ray
 * until clear, by a whole tower's breathing room, of the land, everything
 * standing on it and every tower already placed.
 * Deterministic and rank-agnostic, so it holds however the vote order moves.
 */
export function placeWitnesses(names: readonly string[]): { x: number; y: number }[] {
  const posts = witnessPosts(names.length);
  const out: { x: number; y: number }[] = new Array(names.length);
  const placed: Placed[] = [];
  names.forEach((name, i) => {
    const o = WITNESS_OVERRIDES[name];
    if (!o) return;
    let t = leaningTower(o.x, o.y, i);
    if (towerBlocked(t, placed, 0)) {
      for (const [dx, dy] of NUDGES) {
        const c = leaningTower(o.x + dx, o.y + dy, i);
        if (!towerBlocked(c, placed, 0)) {
          t = c;
          break;
        }
      }
    }
    placed.push(t);
    out[i] = { x: t.x, y: t.y };
  });
  names.forEach((name, i) => {
    if (WITNESS_OVERRIDES[name]) return;
    const p = posts[i];
    const len = Math.hypot(p.x, p.y) || 1;
    const ux = p.x / len;
    const uy = p.y / len;
    let t = leaningTower(p.x, p.y, i);
    let guard = 0;
    while (guard++ < WALK_STEPS && towerBlocked(t, placed, TOWER_CLEARANCE)) {
      t = leaningTower(t.x + ux * WALK_PX, t.y + uy * WALK_PX, i);
    }
    // The outward ray can run a tower ALONGSIDE a big place instead of past
    // it (the south-eastern ray does exactly that to the shipyard). When the
    // walk ends still blocked, step sideways in grid boxes from where it
    // stopped, which is what makes the ring hold for any vote order.
    if (towerBlocked(t, placed, TOWER_CLEARANCE)) {
      for (const [dx, dy] of NUDGES) {
        const c = leaningTower(t.x + dx, t.y + dy, i);
        if (!towerBlocked(c, placed, TOWER_CLEARANCE)) {
          t = c;
          break;
        }
      }
    }
    placed.push(t);
    out[i] = { x: t.x, y: t.y };
  });
  return out;
}
