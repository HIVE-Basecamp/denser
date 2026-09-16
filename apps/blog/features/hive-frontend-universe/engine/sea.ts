'use client';

/**
 * Hive Frontend Universe - THE WATER AND WHAT LIVES IN IT.
 *
 * Bryan, 2026-09-15: "the globe gave us sea, so jump out with the helmet on
 * and an orca or a whale swallows you... let the redfish and dolphins not be
 * a threat, maybe later somehow you can interact with them."
 *
 * The match is already in the chain's own vocabulary: Hive names its stake
 * ladder after sea life, and `lib/board.ts` carries the rungs. So the water
 * between the landmasses is stocked with the ladder. Redfish and dolphins
 * are company and do nothing to you yet. The orca and the whale are the big
 * holders: they notice a bug out in the open water, they come for it, and
 * they swallow it.
 *
 * THE SAME LAYERING RULE AS EVERY OTHER THREAT: nothing here touches
 * movement.ts. The swallow is a phase timer; the caller suspends the
 * movement integrator while it runs and applies the setback itself when
 * `tripped` flips true, exactly the way the sock envelop already works.
 *
 * WHO IS AT RISK: only a bug that is DRIFTING and off every landmass. On a
 * rail, or anywhere over land, the sea cannot reach you. That keeps the old
 * lesson intact (hopping over land trouble is still always the answer) and
 * adds the new one: the open water belongs to whoever has the stake.
 */

import { insideBody } from '../lib/landmass';
import { mulberry32 } from '../lib/mesh';
import { PLANET } from '../lib/planet';
import type { SeaKind } from './icons/sea-life';

export type { SeaKind };

export interface SeaCreature {
  kind: SeaKind;
  x: number;
  y: number;
  /** Heading, radians. Everything swims nose-first. */
  dir: number;
  /** Cruise speed, world px per second. */
  speed: number;
  /** Half body length, world px. */
  size: number;
  /** Per-creature phase so tails do not beat in unison. */
  seed: number;
  /** Jaw opening, 0 shut to 1 wide. Hunters only. */
  gape: number;
  /** Seconds left of an active chase; 0 when cruising. */
  hunt: number;
  /** Slow wander target, radians. */
  wander: number;
  wanderT: number;
}

export interface SeaState {
  creatures: SeaCreature[];
  /**
   * The swallow in progress: which creature has the bug, and how far through
   * the animation, 0..1. Null when nothing has it.
   */
  swallow: { by: number; t: number } | null;
  /** Set true once, at the moment the jaws close. The caller consumes it. */
  tripped: boolean;
  /** Grace after a release, so you are not eaten twice on the way out. */
  mercy: number;
}

/** How many of each rung swim the sea. Scarcity is what makes them matter. */
const STOCK: readonly [SeaKind, number][] = [
  ['redfish', 30],
  ['dolphin', 12],
  ['orca', 7],
  ['whale', 4]
];

/** Half body length by rung, world px. */
const SIZE: Readonly<Record<SeaKind, number>> = {
  redfish: 34,
  dolphin: 96,
  orca: 205,
  whale: 430
};

/** Cruise speed by rung, world px per second. */
const CRUISE: Readonly<Record<SeaKind, number>> = {
  redfish: 95,
  dolphin: 190,
  orca: 245,
  whale: 115
};

/** Chase speed by rung. The orca outruns a drifting bug; the whale does not. */
const CHASE: Readonly<Record<SeaKind, number>> = {
  redfish: 95,
  dolphin: 190,
  orca: 430,
  whale: 215
};

/** How far a hunter notices a bug in the open water, world px. */
const SENSE: Readonly<Record<SeaKind, number>> = {
  redfish: 0,
  dolphin: 0,
  orca: 1900,
  whale: 2500
};

/** True for the rungs that eat. */
export function isHunter(kind: SeaKind): boolean {
  return kind === 'orca' || kind === 'whale';
}

/** Once a chase starts it holds for this long, even if the bug slips away. */
const HUNT_SECONDS = 5;
/** The jaw starts opening inside this multiple of the body. */
const GAPE_RANGE = 2.6;
/** Contact: the bug is inside the mouth. A multiple of the body. */
const BITE_RANGE = 0.62;
/** The swallow animation, seconds. Long enough to watch it happen. */
export const SWALLOW_SECONDS = 2;
/** Grace after being spat out, seconds. */
const MERCY = 2.6;
/** Turn rate while cruising and while hunting, radians per second. */
const TURN_CRUISE = 0.7;
const TURN_HUNT = 2.2;
/** Creatures stay this far inside the planet's limb, as a fraction of it. */
const LIMB = 0.94;
/** How far ahead a creature looks for land to steer around, per body length. */
const LOOK_AHEAD = 2.2;

/** Angle difference wrapped to (-PI, PI]. */
function wrapAngle(a: number): number {
  let d = a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

/** Turn `from` toward `to` by at most `rate * dt`. */
function steerTo(from: number, to: number, rate: number, dt: number): number {
  const d = wrapAngle(to - from);
  const step = rate * dt;
  return from + (Math.abs(d) <= step ? d : Math.sign(d) * step);
}

/** Is this point open water: inside the planet's limb and off every landmass? */
export function inOpenWater(x: number, y: number): boolean {
  const r = Math.hypot(x / PLANET.rx, y / PLANET.ry);
  return r <= LIMB && !insideBody(x, y);
}

/**
 * Stock the sea. Seeded from the round like the tokens and the gems, so the
 * water is freshly populated every 30 minutes but identical for everyone
 * playing the same round.
 */
export function createSea(seed: number): SeaState {
  const rng = mulberry32((seed ^ 0x5ea1) | 0);
  const creatures: SeaCreature[] = [];
  for (const [kind, count] of STOCK) {
    const size = SIZE[kind];
    for (let i = 0; i < count; i++) {
      let x = 0;
      let y = 0;
      let placed = false;
      // Rejection sampling over the disc: open water, and a whole body
      // clear of the nearest coast so nothing spawns beached.
      for (let attempt = 0; attempt < 60 && !placed; attempt++) {
        const a = rng() * Math.PI * 2;
        const r = Math.sqrt(rng()) * LIMB;
        x = Math.cos(a) * r * PLANET.rx;
        y = Math.sin(a) * r * PLANET.ry;
        placed =
          inOpenWater(x, y) &&
          !insideBody(x + size * 1.4, y) &&
          !insideBody(x - size * 1.4, y) &&
          !insideBody(x, y + size * 1.4) &&
          !insideBody(x, y - size * 1.4);
      }
      if (!placed) continue;
      const dir = rng() * Math.PI * 2;
      creatures.push({
        kind,
        x,
        y,
        dir,
        speed: CRUISE[kind] * (0.8 + rng() * 0.4),
        size: size * (0.85 + rng() * 0.3),
        seed: rng() * 6.283,
        gape: 0,
        hunt: 0,
        wander: dir,
        wanderT: rng() * 3
      });
    }
  }
  return { creatures, swallow: null, tripped: false, mercy: 0 };
}

/** True while a creature has the bug and the movement integrator must not run. */
export function seaHolds(sea: SeaState): boolean {
  return sea.swallow !== null;
}

/**
 * One tick. The player is only ever READ here; the setback is the caller's,
 * applied from `tripped` afterwards.
 *
 * `atRisk` is the caller's answer to "is the bug adrift in the open water",
 * which is the only condition under which anything in here can touch it.
 */
export function updateSea(
  sea: SeaState,
  player: { x: number; y: number },
  atRisk: boolean,
  dt: number
): void {
  if (sea.mercy > 0) sea.mercy = Math.max(0, sea.mercy - dt);

  // The swallow runs to its end whatever else is happening, and the creature
  // holding the bug hangs still over it while its jaws close.
  if (sea.swallow) {
    const before = sea.swallow.t;
    sea.swallow.t += dt / SWALLOW_SECONDS;
    if (before < 0.5 && sea.swallow.t >= 0.5) sea.tripped = true;
    const holder = sea.creatures[sea.swallow.by];
    if (holder) {
      // Open wide on the way in, shut hard at the midpoint, ease open again
      // as it turns away with nothing left to bite.
      holder.gape = sea.swallow.t < 0.5 ? 1 - sea.swallow.t * 0.4 : Math.max(0, (sea.swallow.t - 0.5) * 0.5);
    }
    if (sea.swallow.t >= 1) {
      sea.swallow = null;
      sea.mercy = MERCY;
    }
    return;
  }

  for (let i = 0; i < sea.creatures.length; i++) {
    const c = sea.creatures[i];
    const hunter = isHunter(c.kind);
    const d = Math.hypot(player.x - c.x, player.y - c.y);

    // NOTICING. A hunter only ever notices a bug that is adrift in the open
    // water; on a rail or over land it may as well not be there.
    if (hunter && atRisk && sea.mercy <= 0 && d < SENSE[c.kind]) c.hunt = HUNT_SECONDS;
    if (c.hunt > 0) c.hunt = Math.max(0, c.hunt - dt);
    const chasing = hunter && c.hunt > 0;

    // HEADING. Chasing, it points at the bug; cruising, it drifts toward a
    // slow wander target.
    let want: number;
    if (chasing) {
      want = Math.atan2(player.y - c.y, player.x - c.x);
    } else {
      c.wanderT -= dt;
      if (c.wanderT <= 0) {
        c.wanderT = 3 + (c.seed % 1) * 4;
        c.wander = c.dir + (((c.seed * 7919 + c.x) % 1) - 0.5) * 2.2;
      }
      want = c.wander;
    }

    // STEERING CLEAR. Land ahead, or the planet's limb ahead, turns it away
    // before it gets there: nothing beaches itself and nothing swims off
    // into space. This overrides the chase, which is how you escape a whale
    // by hopping back over a coast.
    const look = c.size * LOOK_AHEAD;
    const ax = c.x + Math.cos(c.dir) * look;
    const ay = c.y + Math.sin(c.dir) * look;
    if (!inOpenWater(ax, ay)) {
      want = Math.atan2(-c.y, -c.x);
      c.hunt = 0;
    }

    c.dir = steerTo(c.dir, want, chasing ? TURN_HUNT : TURN_CRUISE, dt);
    const speed = chasing ? CHASE[c.kind] : c.speed;
    const nx = c.x + Math.cos(c.dir) * speed * dt;
    const ny = c.y + Math.sin(c.dir) * speed * dt;
    // Never actually enter the land, whatever the steering did.
    if (inOpenWater(nx, ny)) {
      c.x = nx;
      c.y = ny;
    } else {
      c.dir += Math.PI * 0.6 * dt * 4;
    }

    // THE JAW. Opens as it closes in, shuts again when the bug gets away.
    if (hunter) {
      const open = chasing && d < c.size * GAPE_RANGE ? 1 : 0;
      c.gape += (open - c.gape) * Math.min(1, dt * 5);
    }

    // CONTACT. The jaws close around the bug.
    if (hunter && atRisk && sea.mercy <= 0 && d < c.size * BITE_RANGE) {
      sea.swallow = { by: i, t: 0 };
      c.hunt = 0;
      return;
    }
  }
}
