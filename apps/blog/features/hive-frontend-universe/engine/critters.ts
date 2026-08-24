/**
 * Hive Frontend Universe - the population.
 *
 * Critters scattered through the world, drifting slowly along (and slightly
 * beside) the lines. This file is THE SEAM for the population: spawning,
 * movement and drawing live here. Their BEHAVIOUR lives in two other seams:
 * token theft in coins.ts (Sly Grin, Drainiac) and time-wasting nuisances in
 * hazards.ts (Socko, Blahgart, Copypasta). Every kind has a name (see the
 * locales under hive_frontend_universe.critters) and a place in the lore
 * (module README).
 *
 * Five kinds, each a distinct chunky-sticker silhouette readable at play
 * zoom: thick dark outlines, flat bright fills.
 */

import type { GameWorld } from './world';
import { posAt, tangentAt, type Vec2 } from './movement';

export type CritterKind = 'sock' | 'blah' | 'scammer' | 'extractor' | 'spammer';

/** Modest counts: inhabited, not infested. All seeded, same for everyone. */
const KIND_COUNTS: readonly [CritterKind, number][] = [
  ['sock', 14],
  ['blah', 16],
  ['scammer', 8],
  ['extractor', 9],
  ['spammer', 11]
];

interface Paper {
  x: number;
  y: number;
  age: number;
}

export interface Critter {
  kind: CritterKind;
  edge: number;
  t: number;
  dir: 1 | -1;
  /** World px per second along the line. Slow, ambient. */
  speed: number;
  /** Perpendicular sway off the line, so they ride NEAR lines, not on rails. */
  swayAmp: number;
  swayPhase: number;
  /** Per-critter deterministic rng for junction turns. */
  rngState: number;
  /** Cached draw position and facing, updated each tick. */
  x: number;
  y: number;
  face: 1 | -1;
  /** Spammer only: the fading trail of identical little papers. */
  papers: Paper[];
  dropIn: number;
}

export interface CritterState {
  critters: Critter[];
  counts: Record<CritterKind, number>;
}

function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One step of the same PRNG, inlined so each critter owns its stream. */
function stepRng(c: Critter): number {
  c.rngState = (c.rngState + 0x6d2b79f5) | 0;
  let t = Math.imul(c.rngState ^ (c.rngState >>> 15), 1 | c.rngState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const scratch: Vec2 = { x: 0, y: 0 };
const tan: Vec2 = { x: 0, y: 0 };

/** Seeded placement over the world's lines, weighted by line length. */
export function createCritters(world: GameWorld, seed: number): CritterState {
  const rng = mulberry32((seed ^ 0xc417) | 0);
  const cum: number[] = [];
  let total = 0;
  for (const e of world.edges) {
    total += e.len;
    cum.push(total);
  }
  const pickEdge = (): number => {
    const target = rng() * total;
    let lo = 0;
    let hi = cum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };

  const critters: Critter[] = [];
  const counts = { sock: 0, blah: 0, scammer: 0, extractor: 0, spammer: 0 };
  for (const [kind, n] of KIND_COUNTS) {
    for (let i = 0; i < n; i++) {
      const edge = pickEdge();
      critters.push({
        kind,
        edge,
        t: rng(),
        dir: rng() < 0.5 ? -1 : 1,
        speed: 26 + rng() * 34,
        swayAmp: 10 + rng() * 22,
        swayPhase: rng() * 6.283,
        rngState: (seed ^ (i * 7919 + kind.length * 65537)) | 0,
        x: 0,
        y: 0,
        face: 1,
        papers: [],
        dropIn: rng()
      });
      counts[kind]++;
    }
  }
  const state: CritterState = { critters, counts };
  // Settle initial positions so the first frame is already correct.
  updateCritters(state, world, 0);
  return state;
}

/** Slow drift along the lines; turns at junctions are per-critter seeded. */
export function updateCritters(state: CritterState, world: GameWorld, dt: number): void {
  const { edges, incident } = world;
  for (const c of state.critters) {
    const e = edges[c.edge];
    if (!e) continue;
    c.t += (c.dir * c.speed * dt) / e.len;
    if (c.t >= 1 || c.t <= 0) {
      const atNode = c.t >= 1 ? e.b : e.a;
      const options = incident[atNode];
      if (options.length > 1) {
        // Never immediately double back unless it is a dead end.
        const others = options.filter((ei) => ei !== c.edge);
        c.edge = others[Math.floor(stepRng(c) * others.length)];
      }
      const ne = edges[c.edge];
      c.dir = ne.a === atNode ? 1 : -1;
      c.t = ne.a === atNode ? 0.001 : 0.999;
    }
    posAt(edges[c.edge], c.t, scratch);
    tangentAt(edges[c.edge], c.t, tan);
    // Ride beside the line, swaying, not welded to it.
    const sway = Math.sin(c.swayPhase) * c.swayAmp;
    c.swayPhase += dt * 0.7;
    c.x = scratch.x - tan.y * sway;
    c.y = scratch.y + tan.x * sway;
    if (Math.abs(tan.x * c.dir) > 0.05) c.face = tan.x * c.dir > 0 ? 1 : -1;

    if (c.kind === 'spammer') {
      c.dropIn -= dt;
      if (c.dropIn <= 0) {
        c.dropIn = 0.62;
        c.papers.push({ x: c.x - c.face * 26, y: c.y + 10, age: 0 });
        if (c.papers.length > 6) c.papers.shift();
      }
      for (const p of c.papers) p.age += dt;
      while (c.papers.length && c.papers[0].age > 2.4) c.papers.shift();
    }
  }
}

/* ------------------------------ drawing ------------------------------ */

const OUTLINE = '#141019';

function sticker(ctx: CanvasRenderingContext2D, lw: number): void {
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
}

/**
 * Draws the whole population. Skipped by the caller at far map zoom (they
 * would be sub-pixel there); `vis` is the caller's viewport test.
 */
export function drawCritters(
  ctx: CanvasRenderingContext2D,
  state: CritterState,
  time: number,
  vis: (x: number, y: number) => boolean
): void {
  for (const c of state.critters) {
    if (c.kind === 'spammer') {
      // The paper trail fades even when its spammer is just off screen.
      for (const p of c.papers) {
        if (!vis(p.x, p.y)) continue;
        drawPaper(ctx, p.x, p.y, 1 - p.age / 2.4);
      }
    }
    if (!vis(c.x, c.y)) continue;
    const bob = Math.sin(time * 2 + c.swayPhase) * 2.5;
    switch (c.kind) {
      case 'sock':
        drawSock(ctx, c.x, c.y + bob, c.face, time);
        break;
      case 'blah':
        drawBlah(ctx, c.x, c.y + bob, c.face, time, c.swayPhase);
        break;
      case 'scammer':
        drawScammer(ctx, c.x, c.y + bob, c.face, time);
        break;
      case 'extractor':
        drawExtractor(ctx, c.x, c.y + bob, c.face, time);
        break;
      case 'spammer':
        drawSpammer(ctx, c.x, c.y + bob, c.face, time);
        break;
    }
  }
}

/**
 * Socko: a walking MINIATURE OF MOUNT SOCKO (Bryan: "make socko look like
 * mount socko in game play"). Same recipe as the volcano in icons.ts, small:
 * white sock standing TOE UP, red-and-blue zigzag stripes across the tube, a
 * glowing toe crater with a steam wisp, wide hooded puppet eyes with darting
 * pupils, and the crooked stitched grin. Touch it and it envelops the bug
 * and posts it to the real mountain (hazards.ts owns that).
 */
function drawSock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  face: number,
  time: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1.4 * (face >= 0 ? 1 : -1), 1.4);
  ctx.rotate(0.06);
  sticker(ctx, 3.5);
  // The sock, toe up: cuff planted at the base, tube rising, the rounded TOE
  // curling over at the summit. The same silhouette as the mountain.
  ctx.beginPath();
  ctx.moveTo(-11, 24); // cuff, left foot
  ctx.lineTo(-7, -6); // tube, left slope
  ctx.quadraticCurveTo(-6, -16, 0, -20); // shoulder toward the toe
  ctx.quadraticCurveTo(7, -22.5, 8.5, -15.5); // the TOE, rounded summit
  ctx.quadraticCurveTo(9.5, -10, 7, -5); // down the instep
  ctx.quadraticCurveTo(11.5, -1, 12, 6); // the heel bulge
  ctx.quadraticCurveTo(12.5, 15, 13.5, 24); // heel to base
  ctx.closePath();
  ctx.fillStyle = '#f2f5fb';
  ctx.fill();
  ctx.stroke();
  // Zigzag stripes across the tube, red then blue, clipped to the sock.
  ctx.save();
  ctx.clip();
  for (let s = 0; s < 2; s++) {
    const sy = 14 - s * 9;
    ctx.beginPath();
    ctx.moveTo(-14, sy);
    for (let k = 0; k <= 6; k++) {
      ctx.lineTo(-14 + k * 5, sy + (k % 2 === 0 ? 0 : -2.6));
    }
    ctx.strokeStyle = s === 0 ? '#e3123a' : '#5CA8FF';
    ctx.lineWidth = 2.6;
    ctx.stroke();
  }
  // The toe crater: dark mouth with a breathing ember.
  const glow = 0.5 + Math.sin(time * 1.7) * 0.5;
  ctx.beginPath();
  ctx.ellipse(3.5, -19, 4.4, 1.9, -0.2, 0, 6.283);
  ctx.fillStyle = '#1a0a10';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(3.5, -18.8, 2.9, 1.2, -0.2, 0, 6.283);
  ctx.fillStyle = `rgba(255, 90, 30, ${(0.45 + glow * 0.55).toFixed(3)})`;
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(3.5, -19, 4.4, 1.9, -0.2, 0, 6.283);
  ctx.stroke();
  // One steam wisp curling off the crater.
  const drift = Math.sin(time * 0.9) * 1.3;
  ctx.strokeStyle = 'rgba(220, 225, 240, 0.55)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(2.5, -21);
  ctx.quadraticCurveTo(1 + drift, -26, 3 + drift, -29.5);
  ctx.stroke();
  // Mischievous puppet eyes: wide whites, slanted lids, darting pupils.
  const dart = Math.sin(time * 0.8) * 0.8;
  for (const [ex, ey] of [
    [-3.3, -8],
    [3.5, -8.8]
  ] as const) {
    ctx.beginPath();
    ctx.arc(ex, ey, 2.2, 0, 6.283);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ex + dart, ey + 0.5, 1.1, 0, 6.283);
    ctx.fillStyle = OUTLINE;
    ctx.fill();
    // The slanted lid, hooding half the eye.
    ctx.beginPath();
    ctx.moveTo(ex - 2.6, ey - 2);
    ctx.lineTo(ex + 2.6, ey - 0.4);
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  // The crooked stitched grin.
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-2.8, -3.2);
  ctx.quadraticCurveTo(1, -1.4, 4.6, -3.8);
  ctx.stroke();
  ctx.restore();
}

/**
 * Blahgart, fourth look (Bryan: "i want the blah creature to look exactly
 * like the blurt logo. except it should say BLAH"): the round orange
 * blurt-ball itself, drawn from the real logo - glossy orange sphere, two
 * big innocent cartoon eyes with arched brows, and the white band across
 * the lower face carrying the word - walking on little scurrying legs. And
 * every few seconds it PUKES, slowly and visibly: the ball bulges, the
 * eyes squeeze shut, and a thick green stream pours out from under the
 * band into a spreading puddle. The slime hazard itself is unchanged
 * (hazards.ts); this is the look.
 */
function drawBlah(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  face: number,
  time: number,
  seed = 0
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1.85, 1.85);
  const R = 16;
  // The puke clock: an 8-second cycle, offset per critter so the flock
  // never heaves in chorus. Long idle, a wind-up, then a SLOW spill.
  const cyc = ((time + seed * 2.3) % 8) / 8;
  const bulge = cyc > 0.6 && cyc <= 0.74 ? (cyc - 0.6) / 0.14 : 0;
  const spill = cyc > 0.74 ? (cyc - 0.74) / 0.26 : 0;
  const effort = Math.max(bulge, spill);
  // Legs scurrying, under everything.
  sticker(ctx, 2.4);
  for (let i = 0; i < 4; i++) {
    const lx = (i - 1.5) * 7.5;
    const kick = Math.sin(time * 9 + i * 2.1) * 3;
    ctx.beginPath();
    ctx.moveTo(lx, R * 0.72);
    ctx.lineTo(lx + kick, R * 0.72 + 7);
    ctx.stroke();
  }
  // The puddle collecting below while it spills.
  if (spill > 0) {
    const settle = Math.min(1, spill * 1.6);
    ctx.fillStyle = '#52f22e';
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(face * 6, R + 9, 4 + settle * 15, 2.5 + settle * 3, 0, 0, 6.283);
    ctx.fill();
    // Splash droplets hopping off the puddle's rim.
    for (let k = 0; k < 3; k++) {
      const hop = ((time * 1.6 + k / 3) % 1);
      ctx.globalAlpha = 0.7 * (1 - hop);
      ctx.beginPath();
      ctx.arc(face * 6 + (k - 1) * (8 + settle * 8), R + 7 - hop * 7, 1.4, 0, 6.283);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // Squash for the wind-up, a forward heave for the spill.
  ctx.save();
  ctx.rotate(face * 0.09 * effort);
  ctx.scale(1 + bulge * 0.12, 1 - bulge * 0.1);
  const ball = () => {
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, 6.283);
  };
  // The orange ball, logo-exact colour, fat outline.
  ball();
  ctx.fillStyle = '#f45d0d';
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.6;
  ball();
  ctx.stroke();
  // The white band across the lower face, with the word. Clipped to the
  // ball exactly like the real mark.
  ctx.save();
  ball();
  ctx.clip();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-R, 4, R * 2, 9);
  ctx.fillStyle = OUTLINE;
  ctx.font = '900 8px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BLAH', 0, 8.7);
  ctx.restore();
  // The gloss streak, top left.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.72, -2.55, -1.95);
  ctx.stroke();
  // THE STREAM, pouring slowly from under the band while it heaves.
  if (spill > 0) {
    const a = Math.min(1, spill * 5) * (spill > 0.88 ? (1 - spill) / 0.12 : 1);
    const sx = face * 8;
    const sy = 12;
    const exx = face * 6;
    const eyy = R + 9;
    const wob = Math.sin(time * 10 + seed) * 1.2;
    ctx.globalAlpha = 0.9 * a;
    ctx.fillStyle = '#52f22e';
    ctx.beginPath();
    ctx.moveTo(sx - 3.4, sy);
    ctx.quadraticCurveTo(sx - 3 + wob, (sy + eyy) / 2, exx - 4.5, eyy);
    ctx.lineTo(exx + 4.5, eyy);
    ctx.quadraticCurveTo(sx + 3.6 + wob, (sy + eyy) / 2, sx + 3.8, sy);
    ctx.closePath();
    ctx.fill();
    // Chunks riding the stream down.
    for (let k = 0; k < 2; k++) {
      const t = (time * 1.1 + k / 2) % 1;
      ctx.beginPath();
      ctx.arc(sx + (exx - sx) * t + wob * t, sy + (eyy - sy) * t, 1.8, 0, 6.283);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // The eyes: big, round, innocent, exactly the logo's - squeezing shut
  // with the effort of the heave.
  const dart = Math.sin(time * 0.9) > 0 ? 1 : -1;
  for (const e of [-1, 1]) {
    const ex = e * 6 + face * 0.8;
    const ey = -5;
    const openness = 1 - effort * 0.8;
    ctx.beginPath();
    ctx.ellipse(ex, ey, 4.8, Math.max(0.9, 5.6 * openness), 0, 0, 6.283);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.7;
    ctx.stroke();
    if (openness > 0.4) {
      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.arc(ex + dart * 1.6 + face * 0.6, ey + 1.2, 2.7, 0, 6.283);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex + dart * 1.6 + face * 0.6 - 1, ey + 0.2, 1, 0, 6.283);
      ctx.fill();
    }
    // The arched comma brow riding above.
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(ex - 4, ey - 7 + effort * 2);
    ctx.quadraticCurveTo(ex, ey - 9.5 + effort * 2, ex + 4.2, ey - 7.6 + effort * 2);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}

/**
 * Scammer: a bandit HEAD in a black Zorro mask under a flat gaucho hat, with
 * a golden face (still too shiny to trust) and shifty eyes in the mask slits.
 * The glint stays: it is what makes the deal look too good.
 */
function drawScammer(ctx: CanvasRenderingContext2D, x: number, y: number, face: number, time: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(face * 0.06);
  sticker(ctx, 4);
  // Golden head.
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, 6.283);
  ctx.fillStyle = '#ffd84a';
  ctx.fill();
  ctx.stroke();
  // Sly grin below the mask.
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(face * 2 - 6, 9);
  ctx.quadraticCurveTo(face * 2 + 1, 13, face * 2 + 8, 8);
  ctx.stroke();
  // The MASK: a black domino band right across the eyes, tied at the back
  // with two little tails that flick as it moves.
  ctx.fillStyle = '#17131c';
  ctx.beginPath();
  ctx.moveTo(-17, -9);
  ctx.quadraticCurveTo(0, -14, 17, -9);
  ctx.quadraticCurveTo(18, -1, 15, 1);
  ctx.quadraticCurveTo(0, -3, -15, 1);
  ctx.quadraticCurveTo(-18, -1, -17, -9);
  ctx.closePath();
  ctx.fill();
  const flick = Math.sin(time * 5) * 3;
  ctx.strokeStyle = '#17131c';
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(-face * 15, -5);
  ctx.quadraticCurveTo(-face * 24, -8 + flick, -face * 28, -2 + flick);
  ctx.moveTo(-face * 15, -4);
  ctx.quadraticCurveTo(-face * 23, 0 - flick, -face * 27, 6 - flick);
  ctx.stroke();
  // Shifty eyes IN the mask slits.
  const dart = Math.sin(time * 0.9) > 0 ? 1 : -1;
  for (const ex of [-7, 7]) {
    ctx.beginPath();
    ctx.ellipse(ex + face, -5.5, 3.6, 2.6, 0, 0, 6.283);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.fillStyle = OUTLINE;
    ctx.beginPath();
    ctx.arc(ex + face + dart * 1.8, -5.4, 1.5, 0, 6.283);
    ctx.fill();
  }
  // The flat black gaucho hat.
  sticker(ctx, 3.4);
  ctx.fillStyle = '#17131c';
  ctx.beginPath();
  ctx.ellipse(0, -14, 21, 4.4, face * 0.06, 0, 6.283);
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(-9, -24, 18, 10);
  ctx.strokeRect(-9, -24, 18, 10);
  // Hat band, bold red.
  ctx.fillStyle = '#e3123a';
  ctx.fillRect(-9, -17.5, 18, 3.6);
  // The glint: a rotating four-point sparkle. Too shiny. Suspicious.
  const g = (time * 1.3) % 6.283;
  ctx.save();
  ctx.translate(13, -18);
  ctx.rotate(g);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(1.8, -1.8, 0, -7);
    ctx.quadraticCurveTo(-1.8, -1.8, 0, 0);
  }
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

/**
 * Extractor: a BIG fat tick with FOUR sucker snouts fanned out ahead of it,
 * each ending in a sucker cup, each with a droplet travelling the wrong way.
 * Half again the size of the other critters: this is the one to watch for.
 */
function drawExtractor(ctx: CanvasRenderingContext2D, x: number, y: number, face: number, time: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1.55, 1.55);
  sticker(ctx, 3.2);
  const gulp = 1 + Math.sin(time * 5) * 0.06;
  // FOUR snouts, fanned. Each is a dark tube with a bright inner line, a
  // sucker cup at the tip, and a droplet riding up it.
  const snouts = [
    { dx: 26, dy: -8 },
    { dx: 30, dy: 2 },
    { dx: 29, dy: 11 },
    { dx: 24, dy: 19 }
  ];
  for (let i = 0; i < snouts.length; i++) {
    const sn = snouts[i];
    const wig = Math.sin(time * 3.2 + i * 1.7) * 2.2;
    const tx = face * sn.dx;
    const ty = sn.dy + wig;
    ctx.lineWidth = 4.6;
    ctx.strokeStyle = OUTLINE;
    ctx.beginPath();
    ctx.moveTo(face * 8, 2 + i * 1.5);
    ctx.quadraticCurveTo(face * (8 + sn.dx) * 0.55, (2 + sn.dy) * 0.5 - 4, tx, ty);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#8de6ff';
    ctx.beginPath();
    ctx.moveTo(face * 8, 2 + i * 1.5);
    ctx.quadraticCurveTo(face * (8 + sn.dx) * 0.55, (2 + sn.dy) * 0.5 - 4, tx, ty);
    ctx.stroke();
    // Sucker cup.
    ctx.beginPath();
    ctx.arc(tx, ty, 3.4, 0, 6.283);
    ctx.fillStyle = '#ff8bd0';
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Droplet travelling UP this snout.
    const dropT = 1 - ((time * 1.4 + i * 0.25) % 1);
    ctx.fillStyle = '#8de6ff';
    ctx.beginPath();
    ctx.arc(face * 8 + (tx - face * 8) * dropT, 2 + i * 1.5 + (ty - 2 - i * 1.5) * dropT, 2.2, 0, 6.283);
    ctx.fill();
  }
  // Body: bulbous abdomen plus head, pulsing with the gulp.
  ctx.save();
  ctx.scale(1, gulp);
  sticker(ctx, 3.2);
  ctx.beginPath();
  ctx.ellipse(-face * 5, 0, 16, 12.5, 0, 0, 6.283);
  ctx.fillStyle = '#c05df0';
  ctx.fill();
  ctx.stroke();
  // Abdomen spots, because a villain this size earns detail.
  ctx.fillStyle = '#8f2fc4';
  for (const [sx2, sy2, sr] of [[-13, -3, 3.2], [-6, 5, 2.6], [-9, -6, 2.2]] as const) {
    ctx.beginPath();
    ctx.arc(-face * 5 + face * sx2 * -0.4 + sx2 * 0.6, sy2, sr, 0, 6.283);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(face * 9, 1, 7.5, 0, 6.283);
  ctx.fillStyle = '#d98cff';
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.restore();
  // Little legs, comically small for the body.
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = OUTLINE;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(-face * 5 + i * 7, 11);
    ctx.lineTo(-face * 5 + i * 7 - 3, 17);
    ctx.stroke();
  }
  // Two hungry eyes: it is concentrating.
  ctx.fillStyle = OUTLINE;
  ctx.beginPath();
  ctx.arc(face * 7, -2, 1.6, 0, 6.283);
  ctx.arc(face * 11.5, -2, 1.6, 0, 6.283);
  ctx.fill();
  ctx.restore();
}

/** One identical little paper of the spammer's trail. */
function drawPaper(ctx: CanvasRenderingContext2D, x: number, y: number, alpha: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = Math.max(0, alpha) * 0.9;
  ctx.fillStyle = '#f5f2e8';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2;
  ctx.fillRect(-5, -6.5, 10, 13);
  ctx.strokeRect(-5, -6.5, 10, 13);
  ctx.beginPath();
  ctx.moveTo(-3, -3);
  ctx.lineTo(3, -3);
  ctx.moveTo(-3, 0);
  ctx.lineTo(3, 0);
  ctx.moveTo(-3, 3);
  ctx.lineTo(1, 3);
  ctx.stroke();
  ctx.restore();
}

/**
 * Copypasta: an octopus made of pasta. A meatball-and-noodle head over eight
 * spaghetti arms that never stop waving; the same arm drawn eight times is
 * the whole joke. Brush against it and the arms wrap the bug, which then has
 * to jump repeatedly to tear free (hazards.ts).
 */
function drawSpammer(ctx: CanvasRenderingContext2D, x: number, y: number, face: number, time?: number): void {
  const tm = time ?? 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1.35, 1.35);
  sticker(ctx, 3);
  // Eight spaghetti arms, each the SAME curve pasted at a new angle. Cream
  // noodles with the dark outline underneath so they read on red ground.
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * 6.283 + 0.39;
    const wave = Math.sin(tm * 4 + i * 1.9) * 6;
    const ex = Math.cos(a) * 24;
    const ey = Math.abs(Math.sin(a)) * 16 + 8;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 6.4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 6, 4);
    ctx.quadraticCurveTo(ex * 0.7 + wave, ey * 0.5, ex + wave, ey);
    ctx.stroke();
    ctx.strokeStyle = '#f2dfa8';
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 6, 4);
    ctx.quadraticCurveTo(ex * 0.7 + wave, ey * 0.5, ex + wave, ey);
    ctx.stroke();
  }
  // Head: a dome of noodles over a meatball heart.
  sticker(ctx, 3);
  ctx.beginPath();
  ctx.arc(0, -5, 13.5, Math.PI, 0);
  ctx.quadraticCurveTo(14.5, 4, 10, 5.5);
  ctx.lineTo(-10, 5.5);
  ctx.quadraticCurveTo(-14.5, 4, -13.5, -5);
  ctx.closePath();
  ctx.fillStyle = '#f2dfa8';
  ctx.fill();
  ctx.stroke();
  // Noodle strands over the dome.
  ctx.lineWidth = 1.8;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 4.6, -18);
    ctx.quadraticCurveTo(i * 5.4, -8, i * 4.2, 5);
    ctx.stroke();
  }
  // The meatball, peeking out of the noodles like a bad idea.
  ctx.fillStyle = '#8a4a2c';
  ctx.beginPath();
  ctx.arc(face * 5, -14, 5.4, 0, 6.283);
  ctx.fill();
  ctx.stroke();
  // Round hungry eyes, grown BIG per the cosmic-octopus brief: the big-eyed
  // cuteness got absorbed here instead of spawning a second octopus species.
  for (const exx of [-5.5, 5.5]) {
    ctx.beginPath();
    ctx.arc(exx + face * 1.5, -3.5, 5.2, 0, 6.283);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = OUTLINE;
    ctx.beginPath();
    ctx.arc(exx + face * 2.8, -3.2, 2.4, 0, 6.283);
    ctx.fill();
    // Catchlight: the dot that makes an eye adorable instead of hungry.
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(exx + face * 2.2, -4.4, 0.9, 0, 6.283);
    ctx.fill();
  }
  ctx.restore();
}
