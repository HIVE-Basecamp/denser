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
import { LANDMARKS, WITNESS_OVERRIDES, WITNESS_RING, landmarkPosition, witnessPosts } from './fixed-world';
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

/** The tallest tower, world px (rank 1). */
const TOWER_H_MAX = 1680;
/** The map hint sits over the top edge; the ring stays under it. */
const TOP_BAND = 1400;
/** Breathing room under the lowest hanging tower. */
const BOTTOM_BAND = 500;

/**
 * What the pulled-out map must fit: the ring, the towers leaning fully
 * outward, and a band under the hint at the top. The centre sits a little
 * below the world's origin so the north tower clears the hint without
 * shrinking the whole map for it.
 */
export const MAP_FIT = {
  halfW: WITNESS_RING.rx + WITNESS_RING.stagger + TOWER_H_MAX + 300,
  halfH: WITNESS_RING.ry + WITNESS_RING.stagger + TOWER_H_MAX + (TOP_BAND + BOTTOM_BAND) / 2,
  /** Camera centre on the pulled-out map: up a little, so the top has room. */
  centreY: -(TOP_BAND - BOTTOM_BAND) / 2
} as const;

function towerHeight(slot: number): number {
  return TOWER_H_MAX - slot * 22;
}

function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

interface Placed {
  x: number;
  y: number;
  tipX: number;
  tipY: number;
  w: number;
}

function leaningTower(x: number, y: number, slot: number): Placed {
  const h = towerHeight(slot);
  const tip = towerPoint(x, y, h, towerLean(x, y, 1));
  return { x, y, tipX: tip.x, tipY: tip.y, w: h * 0.26 };
}

/**
 * Is a tower standing here, leaning fully outward, in anyone's way: on the
 * land, over a big place, or across another tower already placed?
 */
function towerBlocked(t: Placed, placed: readonly Placed[]): boolean {
  for (const f of [0, 0.5, 1]) {
    if (insideBody(t.x + (t.tipX - t.x) * f, t.y + (t.tipY - t.y) * f)) return true;
  }
  for (const lm of LANDMARKS) {
    if (!lm.big) continue;
    const p = landmarkPosition(lm);
    const r = BIG_FOOTPRINT[lm.id] ?? 600;
    if (segDist(p.x, p.y, t.x, t.y, t.tipX, t.tipY) < r + t.w * 0.6) return true;
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
 * keep their spot unless a leaning tower there would cross a big place or
 * the land, in which case the nearest clear grid step is taken. The rest
 * follow the ring formula and are walked outward along their own ray until
 * clear of the land, the big places and every tower already standing.
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
    if (towerBlocked(t, placed)) {
      for (const [dx, dy] of NUDGES) {
        const c = leaningTower(o.x + dx, o.y + dy, i);
        if (!towerBlocked(c, placed)) {
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
    while (guard++ < 30 && towerBlocked(t, placed)) {
      t = leaningTower(t.x + ux * 90, t.y + uy * 90, i);
    }
    placed.push(t);
    out[i] = { x: t.x, y: t.y };
  });
  return out;
}
