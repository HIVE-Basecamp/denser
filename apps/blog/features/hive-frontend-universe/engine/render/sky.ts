import { insideBody } from '../../lib/fixed-world';
import { mulberry32 } from '../../lib/mesh';
import { hash2 } from './util';
/* ------------------------------ THE SKY ------------------------------ */
/*
 * Pass seventeen, from the design synthesis: the void stops being dead
 * black. Three layers, all deterministic and built ONCE per session:
 * a magical colorful starfield (visible at every zoom, loudest where the
 * map used to be emptiest), long diagonal light streaks aligned with the
 * logo's slant, and faint sacred-geometry constellations that trace Hive
 * iconography. Everything obeys the hierarchy guardrails: nothing in the
 * sky reaches full alpha, nothing outshines land, routes or landmarks.
 */

/** Desaturated echoes of the identity colors; the void speaks one octave down. */
const STAR_PALETTE: readonly [string, number][] = [
  ['#F4F1FF', 35],
  ['#9DB4FF', 20],
  ['#7FD9D2', 15],
  ['#FFD9A0', 15],
  ['#D9A8FF', 10],
  ['#FF9EAE', 5]
];

interface SkyStar {
  x: number;
  y: number;
  r: number;
  color: string;
  /** Base alpha for static stars; twinklers oscillate around it. */
  a: number;
  /** Twinkle phase, or -1 for a static star. */
  tw: number;
  /** Twinkle period seconds (only read when tw >= 0). */
  period: number;
  anchor: boolean;
}

let SKY_STARS: SkyStar[] | null = null;

/** True when the point sits in one of the logo's channel cuts (not on land,
 *  but between the masses): the channels are content space, so their stars
 *  stay sparse and small per the synthesis. */
function inChannelZone(x: number, y: number): boolean {
  return Math.abs(x) < 6300 && Math.abs(y) < 5300;
}

function buildSkyStars(): SkyStar[] {
  const rng = mulberry32(0x57a2);
  const stars: SkyStar[] = [];
  const pickColor = (): string => {
    let roll = rng() * 100;
    for (const [hex, w] of STAR_PALETTE) {
      roll -= w;
      if (roll <= 0) return hex;
    }
    return STAR_PALETTE[0][0];
  };
  const tryAdd = (x: number, y: number, clump: boolean) => {
    // Quiet margin: no stars on land or hugging the coast, so the red
    // silhouette stays razor-crisp against true black.
    if (insideBody(x, y)) return;
    if (insideBody(x + 70, y) || insideBody(x - 70, y) || insideBody(x, y + 70) || insideBody(x, y - 70)) {
      return;
    }
    const channel = inChannelZone(x, y);
    if (channel && rng() > 0.33) return;
    const anchor = !channel && !clump && rng() < 0.02;
    const r = anchor ? 2.4 + rng() * 0.7 : 0.5 + rng() * (channel ? 0.7 : 1.3);
    // A capped subset twinkles; per-frame sin on ~150 stars is budget dust.
    const tw = !channel && rng() < 0.16 ? rng() * 6.283 : -1;
    stars.push({
      x,
      y,
      r,
      color: pickColor(),
      a: 0.2 + rng() * 0.25,
      tw,
      period: 2 + rng() * 4,
      anchor
    });
  };
  const CELL = 1000;
  for (let cx = -9; cx < 9; cx++) {
    for (let cy = -9; cy < 9; cy++) {
      const bx = cx * CELL;
      const by = cy * CELL;
      for (let k = 0; k < 2; k++) tryAdd(bx + rng() * CELL, by + rng() * CELL, false);
      // Clumps: universe, not wallpaper.
      if (rng() < 0.3) {
        const gx = bx + rng() * CELL;
        const gy = by + rng() * CELL;
        for (let k = 0; k < 4; k++) {
          const a = rng() * 6.283;
          const d = rng() * 300;
          tryAdd(gx + Math.cos(a) * d, gy + Math.sin(a) * d, true);
        }
      }
    }
  }
  return stars;
}

/**
 * Long diagonal light streaks, aligned with the logo's own slant so the sky
 * agrees with the planet. Fixed positions in the corner pockets and the ring
 * annulus; none in the channels. Alphas are whispers on purpose.
 */
const SKY_STREAKS: readonly {
  x: number;
  y: number;
  len: number;
  w: number;
  c1: string;
  c2: string;
}[] = [
  { x: -7600, y: -5600, len: 780, w: 26, c1: '#FF6FB0', c2: '#9DB4FF' },
  { x: -6600, y: -6600, len: 520, w: 14, c1: '#7FD9D2', c2: '#F4F1FF' },
  { x: 7200, y: -6200, len: 860, w: 22, c1: '#9DB4FF', c2: '#D9A8FF' },
  { x: 8300, y: -4900, len: 460, w: 12, c1: '#FFB36B', c2: '#FF6FB0' },
  { x: -8300, y: 4400, len: 700, w: 18, c1: '#7FD9D2', c2: '#9DB4FF' },
  { x: -7000, y: 6300, len: 540, w: 24, c1: '#D9A8FF', c2: '#FF6FB0' },
  { x: 7600, y: 6600, len: 820, w: 20, c1: '#FF6FB0', c2: '#7FD9D2' },
  { x: 6300, y: 7600, len: 480, w: 12, c1: '#F4F1FF', c2: '#FFB36B' },
  { x: 300, y: -8300, len: 640, w: 16, c1: '#9DB4FF', c2: '#7FD9D2' },
  { x: -1400, y: 8200, len: 600, w: 16, c1: '#D9A8FF', c2: '#9DB4FF' }
];
/** The logo's blades slant steeply up-right; the streaks agree. */
const STREAK_DX = Math.cos(-1.15);
const STREAK_DY = Math.sin(-1.15);

/**
 * Sacred-geometry constellations tracing Hive iconography, one per major
 * void pocket. Fixed forever, so they double as navigation landmarks in a
 * world with no labels ("the bee is south-west"). Points are anchor-class
 * stars; the joining lines and the enclosing circle are barely-there.
 */
const CONSTELLATIONS: readonly {
  cx: number;
  cy: number;
  ring: number;
  pts: readonly (readonly [number, number])[];
  edges: readonly (readonly [number, number])[];
}[] = [
  {
    // The Hive hex, north-east annulus.
    cx: 4400,
    cy: -5900,
    ring: 300,
    pts: [[0, -230], [200, -115], [200, 115], [0, 230], [-200, 115], [-200, -115], [0, 0]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [6, 0], [6, 2], [6, 4]]
  },
  {
    // The upvote chevron, west of the diamond.
    cx: -7300,
    cy: -3400,
    ring: 260,
    pts: [[0, -210], [190, 0], [80, 0], [80, 190], [-80, 190], [-80, 0], [-190, 0]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0]]
  },
  {
    // The key (key_backup), east annulus.
    cx: 7300,
    cy: 2300,
    ring: 280,
    pts: [[-140, -120], [0, -200], [140, -120], [140, 20], [0, 100], [0, 210], [90, 210]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [4, 5], [5, 6]]
  },
  {
    // The bee, south-west corner.
    cx: -6900,
    cy: 6400,
    ring: 300,
    pts: [[-160, 40], [0, -40], [160, 40], [0, 120], [-90, -160], [90, -160], [0, -40]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 0], [4, 6], [5, 6]]
  },
  {
    // The puppet tower, south annulus.
    cx: 2900,
    cy: 7000,
    ring: 260,
    pts: [[0, -210], [90, -90], [-90, -90], [70, 60], [-70, 60], [0, 200]],
    edges: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5]]
  }
];

export function drawSky(
  ctx: CanvasRenderingContext2D,
  time: number,
  z: number,
  vx0: number,
  vy0: number,
  vx1: number,
  vy1: number
): void {
  // All sky sizes are SCREEN-space (divided by zoom): a star is a pixel or
  // three at every height, which is exactly why the old field vanished on
  // the pulled-out map and the void read as unfinished black.
  const iz = 1 / Math.max(z, 0.04);

  // Streaks first, deepest.
  for (const s of SKY_STREAKS) {
    const x2 = s.x + STREAK_DX * s.len;
    const y2 = s.y + STREAK_DY * s.len;
    if (Math.max(s.x, x2) < vx0 || Math.min(s.x, x2) > vx1 || Math.max(s.y, y2) < vy0 || Math.min(s.y, y2) > vy1) {
      continue;
    }
    const g = ctx.createLinearGradient(s.x, s.y, x2, y2);
    g.addColorStop(0, s.c1);
    g.addColorStop(1, s.c2);
    ctx.strokeStyle = g;
    ctx.lineCap = 'round';
    ctx.lineWidth = s.w * iz * 0.75;
    ctx.globalAlpha = 0.14;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // The starfield.
  if (!SKY_STARS) SKY_STARS = buildSkyStars();
  for (const st of SKY_STARS) {
    if (st.x < vx0 || st.x > vx1 || st.y < vy0 || st.y > vy1) continue;
    let a = st.a;
    if (st.tw >= 0) a = 0.25 + (0.225 + Math.sin((time / st.period) * 6.283 + st.tw) * 0.225);
    const r = st.r * iz;
    if (st.anchor) {
      ctx.globalAlpha = Math.min(0.35, a * 0.5);
      ctx.fillStyle = st.color;
      ctx.beginPath();
      ctx.arc(st.x, st.y, r * 2.4, 0, 6.283);
      ctx.fill();
    }
    ctx.globalAlpha = Math.min(0.58, a);
    ctx.fillStyle = st.color;
    ctx.fillRect(st.x - r, st.y - r, r * 2, r * 2);
  }
  ctx.globalAlpha = 1;

  // Constellations: dots, faint joining lines, an enclosing circle.
  for (const c of CONSTELLATIONS) {
    if (c.cx + 400 < vx0 || c.cx - 400 > vx1 || c.cy + 400 < vy0 || c.cy - 400 > vy1) continue;
    ctx.strokeStyle = '#9DB4FF';
    ctx.lineWidth = 1.4 * iz;
    ctx.globalAlpha = 0.07;
    ctx.beginPath();
    ctx.arc(c.cx, c.cy, c.ring, 0, 6.283);
    ctx.stroke();
    ctx.globalAlpha = 0.12;
    ctx.beginPath();
    for (const [a0, b0] of c.edges) {
      ctx.moveTo(c.cx + c.pts[a0][0], c.cy + c.pts[a0][1]);
      ctx.lineTo(c.cx + c.pts[b0][0], c.cy + c.pts[b0][1]);
    }
    ctx.stroke();
    for (let i = 0; i < c.pts.length; i++) {
      ctx.globalAlpha = 0.45 + Math.sin(time * 0.4 + i * 1.7 + c.cx) * 0.2;
      ctx.fillStyle = '#F4F1FF';
      ctx.beginPath();
      ctx.arc(c.cx + c.pts[i][0], c.cy + c.pts[i][1], 3.2 * iz, 0, 6.283);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

/** An irregular blob instead of a perfect circle; shape fixed per id. */
export function blobPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, id: number): void {
  const p1 = hash2(id, 1) * 6.283;
  const p2 = hash2(id, 2) * 6.283;
  ctx.beginPath();
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * 6.283;
    const rr = r * (1 + 0.14 * Math.sin(3 * a + p1) + 0.09 * Math.sin(5 * a + p2));
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** The nebulae: four vast, faint clouds in the void, under the planet. */
export function drawNebulae(
  ctx: CanvasRenderingContext2D,
  vx0: number,
  vy0: number,
  vx1: number,
  vy1: number
): void {
  // NEBULAE: two vast, faint clouds so the void reads as space instead of
  // unfinished black. Fixed world positions, one violet behind the north-east
  // citadels, one deep teal in the south-west sea. Two gradient fills, drawn
  // under the land; the darkening overlay below dims them a little, which the
  // alphas here already account for.
  // Four now, and bolder: Bryan asked for braver color in the void
  // ("a magical colorful star universe"), so the clouds stopped whispering.
  for (const [nx, ny, nr, colIn] of [
    [6200, -5200, 3400, 'rgba(88, 46, 160, 0.55)'],
    [-6300, 4400, 3800, 'rgba(18, 92, 126, 0.5)'],
    [-6900, -5400, 3000, 'rgba(210, 70, 140, 0.34)'],
    [2000, 7500, 3200, 'rgba(214, 140, 60, 0.3)']
  ] as const) {
    if (nx + nr < vx0 || nx - nr > vx1 || ny + nr < vy0 || ny - nr > vy1) continue;
    const neb = ctx.createRadialGradient(nx, ny, nr * 0.1, nx, ny, nr);
    neb.addColorStop(0, colIn);
    neb.addColorStop(1, 'rgba(10, 6, 20, 0)');
    ctx.fillStyle = neb;
    ctx.beginPath();
    ctx.arc(nx, ny, nr, 0, 6.283);
    ctx.fill();
  }
}
