'use client';

/**
 * Hive Frontend Universe — canvas rendering.
 *
 * Space and ocean mixed, since the stake tiers run plankton through whale.
 * Draws: a still starfield, transparent cubes at junctions (texture, obstacle
 * placeholders), wobbled curved lines, the operation flows painted from the
 * window's real counts, json factories, houses as bright blobs, field
 * landmarks in a per-category colour-and-shape language, the rim worlds (DHF
 * Fun Park, the witness towers) and community bubbles, the bug (kept exactly
 * as it was), a map marker so the player can always find themselves, and the
 * warp effect.
 *
 * Stake fog scales with `mapness`: weak up close so it never obscures the
 * lines, full on the pulled-out map where it reads as size.
 */

import type { GameMode } from '../lib/modes';
import type { BoardSide } from '../lib/board-side';
import type { WorldEdge, WorldNode } from './world';
import type { PlayerState, Vec2 } from './movement';
import { posAt } from './movement';
import type { Factory, Cube, Formation } from './scenery';
import type { FlowParticle } from './particles';
import type { CritterState } from './critters';
import {
  TROLL_HOLES,
  STEEM_RUINS,
  ISLAND_CHIPS,
  insideBody,
  type LandmarkCategory,
  type IconKey
} from '../lib/fixed-world';
import { mulberry32 } from '../lib/mesh';
import { drawGems, type GemState } from './gems';
import {
  drawIcon,
  drawFish,
  drawHiveMark,
  drawFormation,
  drawCommunityEmblem,
  drawWitnessCitadel,
  drawTrollHole,
  drawSteemRuins,
  drawIslandChip,
  FERRIS_SPIN
} from './icons';
import { drawCritters } from './critters';
import { drawCoins, type CoinState } from './coins';
import { drawHelmets, drawSuitBubble, type HelmetState } from './helmets';
import type { HazardState } from './hazards';
import { drawProjectiles, type ProjectileState } from './projectiles';
import { MAX_HITS, type CombatState } from './combat';
import { DAPP_WINDOWS, rosePaneCentre } from './icons';
import { DAPP_DIRECTORY } from '../lib/fixed-world';
import { avatarImage } from './avatars';
import { drawGround, GROUND_VOID, type Ground } from './ground';

export const PALETTE = {
  bg: GROUND_VOID,
  star: '#bcd2f0',
  /**
   * Ordinary lines are STREETS, NOT STARS: dim and desaturated so they sit on
   * the terrain instead of floating over it. The post line and the landmarks
   * are what the eye should catch.
   */
  // HOT LAVA ROADS (Bryan's grid order): the small streets are molten now,
  // glowing hot orange with bright flow packets travelling down them, on
  // the map view and in play. Spokes run a shade deeper so the void trails
  // read as cooling runoff.
  mesh: '#ff6a22',
  spoke: '#f0512a',
  junction: '#7fd0e8',
  newRing: '#5df0ff',
  traffic: '#9fd6e4',
  factory: '#31435a',
  factoryGlow: '#ffb84d',
  text: '#a7c2d4',
  textDim: '#5a7387',
  hive: '#E31337',
  hiveLit: '#ff7288',
  hiveBlack: '#212529',
  board: '#123',
  boardLit: '#5df0ff',
  /**
   * THE POST LINE. Pass five drew this in warm orange, which worked on black
   * but dies on the pass-six ground: the terrain is now deep warm red, so an
   * orange line sits in the same hue family as the land it crosses and stops
   * reading as a separate thing.
   *
   * Re-picked as GOLD. Every region tone is dark and desaturated, so luminance
   * is what separates the line from the ground, and gold is the brightest of
   * the warm options by a distance. Gold also leaves the cool end of the
   * palette alone, which matters: the newcomer rings, the community bubbles
   * and the bug's surfboard are all cyan already, and a cyan post line would
   * have collided with the very markers that sit on it like stations.
   */
  route: '#ffc83a',
  routeGlow: '#ffe9a8',
  /**
   * THE DAPPS LINE: cyan. The ground is now molten crimson, so cyan is its
   * direct complement and separates from the terrain harder than anything
   * else available. It also cannot be confused with the gold post line, which
   * violet (the other candidate) would have struggled with: violet sits close
   * to the crimson ground AND close to the dim slate streets, so it would have
   * read as a slightly odd street rather than as a route.
   */
  dapps: '#35e0ff',
  dappsGlow: '#a6f0ff'
} as const;

/** One named line of the transit map, drawn casing then glow then core. */
export interface RouteLayer {
  edges: Set<number>;
  casing: string;
  glow: string;
  core: string;
  /** Core stroke width in screen px at zoom 1. */
  width: number;
  /**
   * Dash pattern for a line drawn ON TOP of another. The two named lines share
   * a lot of track, and a solid line drawn second simply hides the first; a
   * dashed one lets the line underneath show through the gaps, which is how
   * transit maps have always drawn shared track.
   */
  dash?: number[];
  /**
   * ELECTRICITY: the colour of the bright charge packets that travel along
   * the line. Drawn as an animated dash overlay, faint at play zoom and vivid
   * on the pulled-out map, where the network should visibly circulate.
   */
  spark?: string;
}

export const ACCENT_HEX: Record<string, string> = {
  violet: '#B79CFF',
  cyan: '#5EE9D5',
  amber: '#FFC24D',
  emerald: '#5BE39C',
  rose: '#FF90AE'
};

/** The colour half of the category language. */
export const CATEGORY_HEX: Record<LandmarkCategory, string> = {
  tool: '#5EE9D5',
  dapp: '#FFC24D',
  governance: '#B79CFF',
  info: '#5BE39C',
  arcade: '#FF90AE',
  social: '#7fb8ff'
};

const CUBE_HEX = ['#5EE9D5', '#B79CFF', '#FFC24D', '#FF90AE', '#7fb8ff'];

/**
 * The big five: shared half-footprint on the map, world px. Everything about
 * their presence (light pool, label clearance) keys off this one number.
 */
const BIG_SPAN = 330;

/**
 * Per-icon half-size for the big five. Each icon function applies its own
 * internal scale factor, so a single shared number would render them at wildly
 * different sizes; these are tuned so all five land at roughly the same
 * footprint, about 650-670 world px across.
 *
 * That footprint is a compromise measured in the browser rather than guessed.
 * At the first try (about 950 px) they read well on the pulled-out map but
 * filled half the screen at play zoom, which was overwhelming. At this size
 * they still tower over an ordinary marker, which is roughly 160 world px
 * across at map zoom, by about four times.
 */
export const BIG_SIZE: Partial<Record<IconKey, number>> = {
  ferris: 150,
  towers: 168,
  arcadebldg: 133,
  blackhole: 119,
  // 185 with the pass-22 fortress redesign: the villain's silhouette must
  // win the north-east corner, and the old 165 read as one shard among many.
  jsonboss: 185,
  // 180 since the two dApp ships merged into this one bigger craft.
  // 360: Bryan's order, "make the space ship for our dapps double the
  // size it is now" (was 180 since the two ships merged into one craft).
  launchpad: 360,
  sockmount: 145,
  // 185 with the pass-28 honeycomb rebuild: Bryan sized the increase "the
  // outer circle of the map button", which is ~48 screen px; this adds
  // about that much at play zoom.
  rosewindow: 185,
  tent: 350
};

const FLOW_STYLE: Record<FlowParticle['type'], { col: string; size: number }> = {
  vote: { col: '#cdf6ff', size: 3 },
  customJson: { col: '#ffd75e', size: 5.5 },
  comment: { col: '#8ee87f', size: 6 },
  transfer: { col: '#ffe08a', size: 8 }
};

export interface HouseVisual {
  tier: number;
  isNewcomer: boolean;
  bubble: number;
  glow: number;
  handle: string;
}

export interface LandmarkVisual {
  label: string;
  category: LandmarkCategory;
  /** Which vector icon to draw (the icon seam lives in engine/icons.ts). */
  icon: IconKey;
  /**
   * The BIG FIVE: drawn as oversized illustrations, several times larger than
   * any other marker, so they are visible instantly at map zoom.
   */
  big?: boolean;
  /** Real Hive account whose avatar this landmark wears, if it has one. */
  handle?: string;
  /** A hive.blog page (internal route or wallet): front end mode beacons these. */
  site?: boolean;
  /** The DHF Fun Park: the race's finish line in adventure mode. */
  raceGoal?: boolean;
}

export interface CommunityVisual {
  label: string;
  radius: number;
  /** The community's own account name (its avatar is fetched with it). */
  handle: string;
}

/** One citadel on the witness ring. */
export interface WitnessVisual {
  name: string;
  /** 1 for the top-voted witness, through 21. */
  rank: number;
  x: number;
  y: number;
  /**
   * Where this citadel's TRACTOR LANE ends: a point aimed at the nearest
   * rail node, stopping one easy jump short of it. The lane from the base
   * to here is drawn pulsing, and a drifting bug anywhere along it is
   * caught and carried up. Computed by the caller from the world; absent
   * until the world is known.
   */
  laneX?: number;
  laneY?: number;
}

export interface TrafficMarker {
  edge: number;
  from: number;
  to: number;
  t: number;
  life: number;
  max: number;
  handle: string;
}

export interface Camera {
  x: number;
  y: number;
  z: number;
}

export interface RenderScene {
  ctx: CanvasRenderingContext2D;
  W: number;
  H: number;
  DPR: number;
  cam: Camera;
  mapness: number;
  nodes: WorldNode[];
  edges: WorldEdge[];
  houses: (HouseVisual | undefined)[];
  landmarks: LandmarkVisual[];
  communities: (CommunityVisual | undefined)[];
  factories: Factory[];
  cubes: Cube[];
  /** Spiky rock formations standing on the terrain. Inert scenery. */
  formations: Formation[];
  /**
   * WHICH SIDE OF THE BOARD is up. The Steem side is the back: the same
   * board seen from behind (mirrored), drained of colour, nothing alive.
   */
  side?: BoardSide;
  /** Horizontal view scale: 1 front, -1 back, passing through 0 mid-flip. */
  flipX?: number;
  /** A little vertical shear while flipping, so the turn reads as 3D. */
  flipSkew?: number;
  /**
   * The top 21 witnesses, ringing the world in rank order. Scenery: no mesh
   * node, nothing to collide with, nothing to travel to.
   */
  witnesses: WitnessVisual[];
  flows: FlowParticle[];
  traffic: TrafficMarker[];
  /**
   * The named lines, drawn in order so the flagship lands on top. Ordinary
   * mesh edges are the dim streets underneath.
   */
  routeLayers: RouteLayer[];
  /** The inert population; its whole seam lives in engine/critters.ts. */
  critters: CritterState | null;
  /** JSON tokens, what carries them and what steals them. */
  coins: CoinState | null;
  /** The 21 oxygen helmets and how many the player has compiled. */
  helmetState: HelmetState | null;
  /** The nuisance hazards on the bug (goo, wrap, sock envelop). */
  hazards: HazardState | null;
  /** In-flight enemy and player shots. */
  projectiles?: ProjectileState | null;
  /** The bug's hit count and invincibility, for the pips and the flash. */
  combat?: CombatState | null;
  /** Colorful collectible gems: eye candy with no economy yet, by design. */
  gems?: GemState | null;
  /** Community handles the player has visited; unvisited bubbles rest dim. */
  visitedCommunities?: ReadonlySet<string> | null;
  /** Trophies mounted on the ferris wheel this board, in mount order. */
  wheelTrophies?: readonly string[];
  /**
   * The Rose Window's pane labels, translated by the caller, in
   * ROSE_WINDOW_PANES order. At play zoom each pane wears its own words.
   */
  roseLabels?: readonly string[];
  /**
   * THE NEWB TRAIL quest: node ids of newcomer posts already visited this
   * board. Unvisited newcomer posts wear the quest glow; visited ones
   * settle to a steady earned ring.
   */
  newbieVisited?: ReadonlySet<number>;
  /**
   * The signed-in player's account: their avatar RIDES the bug (Bryan's
   * mount design, built ready for future multiplayer where every player's
   * icon rides their own bug).
   */
  playerHandle?: string;
  /**
   * THE PLANNING GRID: a toggleable overlay (G key) lettering the world
   * into 700px boxes, columns A-Z west to east, rows 1-26 north to south,
   * so Bryan can direct work by box ("put it at G-17"). Debug chrome, off
   * by default, deliberately exempt from the no-text-in-world rule.
   */
  debugGrid?: boolean;
  /** The grid box under the cursor; drawn highlighted with a BIG label. */
  hoverGridCell?: { ci: number; ri: number } | null;
  /**
   * While the bug rides something (the ferris wheel, a witness beam), it is
   * drawn HERE instead of at its physics position. Cosmetic only: the player's
   * edge-plus-fraction state is never touched by a ride.
   */
  rideOverlay: { x: number; y: number } | null;
  /** The filled landmasses under everything; built once per window. */
  ground: Ground | null;
  /** Slot of the community bubble the bug is standing in, or -1. Display only. */
  activeCommunity: number;
  player: PlayerState;
  time: number;
  tierColors: string[];
  shake?: number;
  /** Warp effect countdown, 1 → 0. */
  warpFx?: number;
  /**
   * The day's buzzing station zone, or null. Chosen deterministically from
   * the UTC date by the caller; tokens inside count double (coins.ts) and
   * the zone hums visibly here.
   */
  buzz?: { x: number; y: number; r: number } | null;
  /** The picked mode; null before the welcome is answered. */
  mode?: GameMode | null;
  /** The DHF race (adventure mode): which houses' votes are taken, and whether funded. */
  race?: { taken: ReadonlySet<number>; funded: boolean } | null;
  hud: {
    housesLabel: string;
    windowLabel: string;
    housesCount: number;
    windowTime: string;
    /** The round clock and the mode name, one HUD line. */
    roundLabel?: string;
    roundLeft?: string;
    modeLabel?: string;
    tokensLabel: string;
    carried: number;
    banked: number;
    helmetsLabel: string;
    helmets: number;
    helmetTotal: number;
    /** Map completion: named places visited. Optional so old scenes render. */
    placesLabel?: string;
    places?: number;
    placesTotal?: number;
    /** Gems collected this board. Eye candy counter, no economy yet. */
    gemsLabel?: string;
    gems?: number;
    /** The newb-trail quest: newcomer posts visited this board. */
    newbsLabel?: string;
    newbs?: number;
    newbsTotal?: number;
    /** The DHF race line: carried / return line, or FUNDED. Adventure mode only. */
    votesLabel?: string;
    votes?: number;
    votesLine?: number;
    fundedLabel?: string;
    funded?: boolean;
    /** Which side of the board, named only on the back. */
    sideLabel?: string;
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
function clamp(v: number, a: number, b: number): number {
  return v < a ? a : v > b ? b : v;
}
/** Small deterministic hash → [0,1), for star specks and blob shapes. */
function hash2(a: number, b: number): number {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const scratch: Vec2 = { x: 0, y: 0 };

/** Planning-grid geometry: 26 lettered columns over the full map extent. */
const GRID_CELL = 700;
const GRID_EXT = 9100;

/** The grid box a world point sits in, as its "G-17" style name. */
export function gridCellName(x: number, y: number): string {
  const ci = Math.max(0, Math.min(25, Math.floor((x + GRID_EXT) / GRID_CELL)));
  const ri = Math.max(0, Math.min(25, Math.floor((y + GRID_EXT) / GRID_CELL)));
  return `${String.fromCharCode(65 + ci)}-${ri + 1}`;
}

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

function drawSky(
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
function blobPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, id: number): void {
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

export function drawScene(scene: RenderScene): void {
  const { ctx, W, H, DPR, cam, nodes, edges, player, time, mapness } = scene;

  // NOTHING ON THIS MAP IS LETTERED. Names used to be painted beside every
  // post, place, community and tower, and at map zoom that was most of the
  // pixels: the map read as a list rather than as a world. Identity is now
  // carried by the art (profile photos, emblems, illustrated places) and the
  // NAME APPEARS ON HOVER, in the DOM layer above the canvas.

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, W, H);

  const sx = scene.shake ? (Math.random() - 0.5) * scene.shake : 0;
  const sy = scene.shake ? (Math.random() - 0.5) * scene.shake : 0;
  const z = cam.z;

  // THE FLIP: the board turns on its vertical axis. flipX runs 1 to -1
  // (cosine), so past the midpoint the world is mirrored: you are looking
  // at the back. The skew fakes perspective on the way round.
  const flipX = scene.flipX ?? 1;
  ctx.save();
  ctx.translate(W / 2 + sx, H / 2 + sy);
  ctx.transform(flipX, 0, scene.flipSkew ?? 0, 1, 0, 0);
  ctx.scale(z, z);
  ctx.translate(-cam.x, -cam.y);

  const pad = 320 / z;
  const zx = z * Math.max(Math.abs(flipX), 0.25);
  const vx0 = cam.x - W / 2 / zx - pad;
  const vx1 = cam.x + W / 2 / zx + pad;
  const vy0 = cam.y - H / 2 / z - pad;
  const vy1 = cam.y + H / 2 / z + pad;
  const vis = (x: number, y: number) => x > vx0 && x < vx1 && y > vy0 && y < vy1;
  const edgeVis = (e: WorldEdge) => {
    const m = e.pts.length;
    const minX = Math.min(e.pts[0], e.pts[m - 2]) - e.len * 0.3;
    const maxX = Math.max(e.pts[0], e.pts[m - 2]) + e.len * 0.3;
    const minY = Math.min(e.pts[1], e.pts[m - 1]) - e.len * 0.3;
    const maxY = Math.max(e.pts[1], e.pts[m - 1]) + e.len * 0.3;
    return maxX > vx0 && minX < vx1 && maxY > vy0 && minY < vy1;
  };

  // THE SKY: colorful stars, diagonal streaks, Hive constellations. Visible
  // at every zoom; loudest exactly where the map used to be dead black.
  drawSky(ctx, time, z, vx0, vy0, vx1, vy1);

  // The tier fish, out in the open water: plankton through whale, dim
  // silhouettes so the sea-in-space theme reads while playing.
  if (mapness < 0.5) {
    const FCELL = 1400;
    const FISH_SIZE = [14, 26, 48, 105, 240];
    for (let cx = Math.floor(vx0 / FCELL); cx <= Math.floor(vx1 / FCELL); cx++) {
      for (let cy = Math.floor(vy0 / FCELL); cy <= Math.floor(vy1 / FCELL); cy++) {
        const h = hash2(cx * 19, cy * 23);
        if (h > 0.72) continue;
        const tier = h < 0.28 ? 0 : h < 0.42 ? 1 : h < 0.5 ? 2 : h < 0.535 ? 3 : 4;
        const fx = cx * FCELL + hash2(cx * 29, cy * 31) * FCELL;
        const fy =
          cy * FCELL +
          hash2(cx * 37, cy * 41) * FCELL +
          Math.sin(time * 0.5 + hash2(cx, cy) * 6.28) * FISH_SIZE[tier] * 0.15;
        const dir = hash2(cx * 43, cy * 47) < 0.5 ? -1 : 1;
        drawFish(ctx, fx, fy, FISH_SIZE[tier], scene.tierColors[tier], dir, 0.17 + tier * 0.04);
      }
    }
  }

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

  // THE GROUND. Filled landmasses, drawn over the void (and over the stars and
  // fish, which belong to the open water) and under everything else. The
  // geometry was built once per window; this only fills stored paths, culled
  // to the viewport.
  if (scene.ground) {
    drawGround(ctx, scene.ground, vx0, vy0, vx1, vy1, z);
  }

  // CURVATURE: the outermost rim of the world dims a touch, implying a
  // sphere seen face-on. Rim only, and gentle: the land's brightness ruling
  // (bright red IS the identity) stands; this never touches the center.
  if (mapness > 0.15) {
    const cg = ctx.createRadialGradient(0, 0, 5400, 0, 0, 9600);
    cg.addColorStop(0, 'rgba(4, 2, 8, 0)');
    cg.addColorStop(1, `rgba(4, 2, 8, ${(0.16 * mapness).toFixed(3)})`);
    ctx.fillStyle = cg;
    ctx.fillRect(vx0, vy0, vx1 - vx0, vy1 - vy0);
  }

  // NOTE: an art-direction pass tried darkening the land toward wine at map
  // zoom here (value-hierarchy argument: the ground was the brightest large
  // surface on screen). Bryan overruled it: the bright red IS the map's
  // identity. The hierarchy is carried by the other levers instead: route
  // casing, landmark exaggeration, ground pads, street fade, vignette.

  // THE COMB: at play zoom the land's interior carries a faint hex-cell
  // grid. The planet IS a honeycomb; the bee theme lands as geometry
  // without a single new object. Clipped to the visible land cells.
  if (scene.ground && z >= 0.3) {
    const gr = scene.ground;
    const clip = new Path2D();
    let anyCell = false;
    for (let i = 0; i < gr.cellPaths.length; i++) {
      const b = gr.cellBox[i];
      if (b.x1 < vx0 || b.x0 > vx1 || b.y1 < vy0 || b.y0 > vy1) continue;
      clip.addPath(gr.cellPaths[i]);
      anyCell = true;
    }
    if (anyCell) {
      ctx.save();
      ctx.clip(clip);
      const R = 96;
      const HH = R * 0.866;
      ctx.strokeStyle = '#4a060c';
      ctx.lineWidth = 2.4;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      const q0 = Math.floor(vx0 / (R * 1.5)) - 1;
      const q1 = Math.ceil(vx1 / (R * 1.5)) + 1;
      const r0 = Math.floor(vy0 / (HH * 2)) - 1;
      const r1 = Math.ceil(vy1 / (HH * 2)) + 1;
      for (let q = q0; q <= q1; q++) {
        for (let rr = r0; rr <= r1; rr++) {
          const hx = q * R * 1.5;
          const hy = (rr * 2 + (q & 1)) * HH;
          // Right pair + top edge of each flat-top hex; neighbours supply
          // the left pair and the bottom, so no edge is drawn twice.
          ctx.moveTo(hx + R * 0.5, hy - HH);
          ctx.lineTo(hx + R, hy);
          ctx.lineTo(hx + R * 0.5, hy + HH);
          ctx.moveTo(hx - R * 0.5, hy - HH);
          ctx.lineTo(hx + R * 0.5, hy - HH);
        }
      }
      ctx.stroke();
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  // Rock formations: spiky crystal clutches standing on the terrain, under
  // everything travelable. Skipped on the pulled-out map, where 190 clutches
  // of shards would be sub-pixel noise and pure cost.
  if (mapness < 0.72) {
    for (const f of scene.formations) {
      if (!vis(f.x, f.y)) continue;
      drawFormation(ctx, f.x, f.y, f.h, f.shards, f.hue, f.phase, f.lean, time);
    }
  }

  // THE WITNESS RING: the real top 21, standing outside the world in rank
  // order and looking in. Drawn at a fixed world size so they stay legible on
  // the pulled-out map, which is where the ring reads as a ring.
  for (const wt of scene.witnesses) {
    // Bigger than pass nine: the citadels were getting lost against the map.
    const towerH = 1680 - (wt.rank - 1) * 22;
    // The cull box must cover the tractor lane too, or the landing light
    // vanishes exactly where the player stands to use it.
    const laneDist =
      wt.laneX !== undefined && wt.laneY !== undefined
        ? Math.hypot(wt.laneX - wt.x, wt.laneY - wt.y) + 220
        : 0;
    const cullR = Math.max(towerH, laneDist);
    if (wt.x + cullR < vx0 || wt.x - cullR > vx1 || wt.y + cullR < vy0 || wt.y - cullR > vy1) {
      continue;
    }
    // THE TRACTOR LANE: the citadel's light reaching down toward the land,
    // ending one jump from the nearest rail node. Jump into it while
    // drifting and it carries you up. Drawn as a soft tapering beam with
    // bright motes travelling UP it, so it reads as suction, not string.
    if (wt.laneX !== undefined && wt.laneY !== undefined && z < 0.12) {
      // Map zoom: the lanes are a hint, not a light show. One flat stroke
      // each; the full gradient-and-motes treatment for 21 lanes measured
      // 6ms of map frame, and this measures under 1ms.
      ctx.strokeStyle = 'rgba(150, 110, 235, 0.18)';
      ctx.lineCap = 'round';
      ctx.lineWidth = 90;
      ctx.beginPath();
      ctx.moveTo(wt.x, wt.y);
      ctx.lineTo(wt.laneX, wt.laneY);
      ctx.stroke();
    } else if (wt.laneX !== undefined && wt.laneY !== undefined) {
      const lx = wt.laneX;
      const ly = wt.laneY;
      const pulse2 = 0.55 + Math.sin(time * 2.2 + wt.rank) * 0.45;
      const grad = ctx.createLinearGradient(wt.x, wt.y, lx, ly);
      grad.addColorStop(0, 'rgba(170, 130, 250, 0.75)');
      grad.addColorStop(1, 'rgba(170, 130, 250, 0.16)');
      ctx.strokeStyle = grad;
      ctx.lineCap = 'round';
      ctx.lineWidth = 130;
      ctx.globalAlpha = 0.5 + pulse2 * 0.3;
      ctx.beginPath();
      ctx.moveTo(wt.x, wt.y);
      ctx.lineTo(lx, ly);
      ctx.stroke();
      // A bright core line inside the wash, so the lane reads as a BEAM.
      ctx.lineWidth = 26;
      ctx.globalAlpha = 0.3 + pulse2 * 0.25;
      ctx.strokeStyle = '#cdb4ff';
      ctx.beginPath();
      ctx.moveTo(wt.x, wt.y);
      ctx.lineTo(lx, ly);
      ctx.stroke();
      ctx.globalAlpha = 1;
      // Motes riding the lane toward the tower: the direction of the ride.
      for (let k = 0; k < 4; k++) {
        const f = 1 - ((time * 0.35 + k / 4 + wt.rank * 0.17) % 1);
        ctx.globalAlpha = 0.6 + f * 0.4;
        ctx.fillStyle = '#e6dbff';
        ctx.beginPath();
        ctx.arc(lx + (wt.x - lx) * f, ly + (wt.y - ly) * f, 22, 0, 6.283);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // The landing light at the lane's end: the "jump HERE" invitation,
      // breathing wide so it is findable from the nearest junction.
      ctx.strokeStyle = '#cdb4ff';
      ctx.lineWidth = 6 / Math.max(z, 0.08);
      ctx.globalAlpha = 0.35 + pulse2 * 0.55;
      ctx.beginPath();
      ctx.arc(lx, ly, 120 + pulse2 * 50, 0, 6.283);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    drawWitnessCitadel(
      ctx,
      wt.x,
      wt.y,
      towerH,
      wt.rank,
      wt.name,
      avatarImage(wt.name),
      time,
      wt.rank * 0.7,
      z >= 0.12
    );
    // Lit windows up the tower, a blinking few among them: 21 lonely
    // monuments become 21 inhabited outposts (population silhouette tier).
    const wr = 1.3 / Math.max(z, 0.05);
    ctx.fillStyle = '#FFD9A0';
    for (let k = 0; k < 3; k++) {
      const blinker = (wt.rank + k) % 7 === 0;
      const on = !blinker || Math.sin(time * 1.6 + wt.rank * 2 + k) > -0.2;
      if (!on) continue;
      ctx.globalAlpha = 0.75;
      ctx.fillRect(
        wt.x - wr / 2 + (k - 1) * wr * 1.6,
        wt.y - towerH * (0.3 + k * 0.13),
        wr,
        wr * 1.4
      );
    }
    ctx.globalAlpha = 1;
  }

  // Emperor J SON's troll holes, sunk into the terrain. The keep is a
  // landmark and draws itself; these are the in-land mouths of his network.
  for (const hole of TROLL_HOLES) {
    if (hole.id === 'json_keep' || !vis(hole.x, hole.y)) continue;
    drawTrollHole(ctx, hole.x, hole.y, time);
  }

  // THE STEEM RUINS: the old chain, dead and grey in the western void.
  // Scenery with a story; the hover chip and click live in canvas-map.
  if (vis(STEEM_RUINS.x, STEEM_RUINS.y)) {
    drawSteemRuins(ctx, STEEM_RUINS.x, STEEM_RUINS.y, 300, time);
  }

  // FLOATING ISLAND CHIPS: the planet's shed fragments, occupying the void
  // pockets Bryan circled. They grow with mapness like the big landmarks so
  // the pockets read as inhabited from the pulled-out map too.
  const chipScale = 1 + mapness * 2.6;
  for (let i = 0; i < ISLAND_CHIPS.length; i++) {
    const chip = ISLAND_CHIPS[i];
    if (!vis(chip.x, chip.y)) continue;
    drawIslandChip(ctx, chip.x, chip.y, chip.top, chip.kind, i, time, chipScale);
  }

  // GEMS: bold faceted eye candy along the rails and around the chips.
  if (scene.gems && mapness < 0.75) {
    drawGems(ctx, scene.gems, time, vis);
  }

  // Cubes: transparent, colourful, under the lines for depth.
  for (const c of scene.cubes) {
    if (!vis(c.x, c.y)) continue;
    drawCube(ctx, c);
  }

  // The lines: wobbled curves. Mesh in teal, spokes in violet. At far zoom
  // the wobble detail is sub-pixel, so the polylines are decimated (and the
  // joins simplified), which keeps the pulled-out map fast on weak hardware.
  const stride = z < 0.1 ? 8 : z < 0.3 ? 4 : 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = stride > 2 ? 'bevel' : 'round';
  const strokeEdge = (e: WorldEdge) => {
    ctx.beginPath();
    ctx.moveTo(e.pts[0], e.pts[1]);
    for (let i = stride; i < e.pts.length - 2; i += stride) ctx.lineTo(e.pts[i], e.pts[i + 1]);
    ctx.lineTo(e.pts[e.pts.length - 2], e.pts[e.pts.length - 1]);
    ctx.stroke();
  };
  for (const kind of ['mesh', 'spoke'] as const) {
    ctx.strokeStyle = kind === 'mesh' ? PALETTE.mesh : PALETTE.spoke;
    // ANY line you are meant to travel along has to look travelable. Pass
    // seven thinned these to 1.8px to push the named routes forward, which
    // went too far: the streets read as hairlines you would not think to ride.
    // Streets are fat where you ride them and slimmer on the pulled-out map,
    // where nobody is travelling and the extra fill was costing real frame time.
    // Thicker and brighter again, and the whole network BREATHES: a slow
    // alpha pulse offset per stroke family makes the map read as a living
    // thing rather than a printed one. One alpha per family costs nothing.
    // LAVA STREETS (Bryan's order): slightly thicker than the pass-17 spec
    // and hot; they stay visible at map zoom now (the old fade-out is mostly
    // gone) because a lava vein network IS the map texture he wants.
    const baseW = kind === 'mesh' ? 3.9 : 3.5;
    const streetW = z < 0.12 ? Math.max(baseW * 0.55, 2.8) : baseW;
    ctx.lineWidth = streetW / Math.max(z, 0.05);
    // SHIMMER, take two (Bryan: "its like you changed nothing"). The first
    // version shared one alpha per stroke FAMILY, so the entire network still
    // dimmed and brightened in unison: a pulse with extra steps. Now every
    // SEGMENT flickers on its own clock, dim-only from a steady base: the
    // network as a whole never breathes, but sparkle runs across it like
    // heat over coals. Two incommensurate sines multiplied keep each dip
    // brief and shallow; the per-edge globalAlpha write costs nothing next
    // to the stroke itself.
    const baseA = (kind === 'mesh' ? 0.86 : 0.78) * (1 - mapness * 0.25);
    for (const e of edges) {
      if (e.kind !== kind || !edgeVis(e)) continue;
      const ph = (e.id % 31) * 0.83;
      const tw =
        (0.5 + 0.5 * Math.sin(time * 8.3 + ph * 2.7)) * (0.5 + 0.5 * Math.sin(time * 13.1 + ph));
      ctx.globalAlpha = baseA - 0.16 * tw;
      strokeEdge(e);
    }
  }
  ctx.globalAlpha = 1;

  // THE MOLTEN FLOW: bright yellow-hot packets running down every street,
  // one animated dash pass over both families. This is what makes the veins
  // read as MOVING lava rather than painted orange, at both zooms.
  {
    const zz = Math.max(z, 0.05);
    ctx.setLineDash([42 / zz, 250 / zz]);
    ctx.lineDashOffset = -((time * 150) % 292) / zz;
    ctx.strokeStyle = '#ffd63a';
    ctx.lineWidth = 2.1 / zz;
    ctx.globalAlpha = 0.5 + mapness * 0.25;
    // At map zoom every street is on screen and a second stroke of all of
    // them broke the 12ms law; one edge in four still reads as a living
    // network at that height (measured, not guessed).
    const flowSkip = z < 0.12;
    for (const e of edges) {
      if (!edgeVis(e) || (flowSkip && (e.id & 3) !== 0)) continue;
      strokeEdge(e);
    }
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
    ctx.globalAlpha = 1;
  }

  // THE POST LINE: the first subway route. A labeled subset of the mesh
  // edges drawn noticeably thicker in one warm saturated colour, with a soft
  // under-glow, clearly distinct from ordinary lines at both zooms.
  //
  // Three passes, which is what guarantees the line reads against EVERY region
  // it crosses rather than just against the average one: a dark casing that
  // separates it from whatever tone is underneath, a soft glow, then the gold
  // core on top.
  // On the pulled-out map the casing and glow passes are sub-pixel decoration
  // but cost a full stroke of every route edge each. Since pass seven the post
  // line spans the whole world (roughly 110 edges rather than 45) and there are
  // two lines, so the three-pass treatment measured about 6ms of the frame at
  // map zoom. Collapsing to a single fatter core pass there is invisible and
  // pays for itself.
  const routeLod = z < 0.12;
  let layerPhase = 0;
  for (const layer of scene.routeLayers) {
    if (!layer.edges.size) continue;
    // SHIMMER on the named lines too, per SEGMENT like the streets now: the
    // whole-layer alpha of the first attempt made each line throb as one
    // piece, which is the pulsing Bryan keeps vetoing. Constant width; the
    // travelling electricity stays the big motion, this is the heat haze
    // under it.
    layerPhase += 2.1;
    // At map zoom the line keeps its CASING: a dark edge is the one signal
    // that says "designed transit route" instead of "loose wire", and it is
    // what stops the long line reading as a scribble. The always-on glow pass
    // is dimmed everywhere; the travelling electricity is the line's life
    // now, and a glow that never rests is just noise.
    const passes = routeLod
      ? [
          { col: layer.casing, w: layer.width * 1.55, a: 0.9 },
          { col: layer.core, w: layer.width * 1.15, a: 1 }
        ]
      : [
          { col: layer.casing, w: layer.width * 1.98, a: 0.85 },
          // Halo capped near half the core width: most of gold's former
          // overweight was bloom, not stroke (design synthesis, item 1).
          { col: layer.glow, w: layer.width * 1.3, a: 0.18 },
          { col: layer.core, w: layer.width, a: 1 }
        ];
    if (layer.dash) ctx.setLineDash(layer.dash.map((d) => d / Math.max(z, 0.05)));
    for (const p of passes) {
      ctx.strokeStyle = p.col;
      ctx.lineWidth = p.w / Math.max(z, 0.05);
      for (const e of edges) {
        if (!layer.edges.has(e.id) || !edgeVis(e)) continue;
        const ph = (e.id % 29) * 0.91;
        const tw =
          (0.5 + 0.5 * Math.sin(time * 7.9 + ph * 2.3)) *
          (0.5 + 0.5 * Math.sin(time * 12.3 + ph));
        ctx.globalAlpha = Math.max(0.1, p.a - 0.14 * tw);
        strokeEdge(e);
      }
    }
    ctx.globalAlpha = 1;
    if (layer.dash) ctx.setLineDash([]);
    // THE ELECTRICITY: bright charge packets running along the line, one
    // extra dashed pass with its offset animated. Subtle while riding, vivid
    // on the pulled-out map, which is where the network should visibly hum.
    // Each edge restarts the pattern at its own start, but the offsets all
    // move together, so the eye reads one continuous circulation.
    if (layer.spark) {
      const zz = Math.max(z, 0.05);
      ctx.setLineDash([34 / zz, 300 / zz]);
      ctx.lineDashOffset = -((time * 260) % 334) / zz - layerPhase * 40;
      ctx.strokeStyle = layer.spark;
      ctx.lineWidth = (layer.width * 0.62) / zz;
      ctx.globalAlpha = 0.3 + mapness * 0.7;
      for (const e of edges) {
        if (!layer.edges.has(e.id) || !edgeVis(e)) continue;
        strokeEdge(e);
      }
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
    }
  }
  ctx.globalAlpha = 1;

  // Operation flows: the real counts, moving. Each type its own shape.
  for (const p of scene.flows) {
    const e = edges[p.edge];
    if (!e) continue;
    posAt(e, p.t, scratch);
    if (!vis(scratch.x, scratch.y)) continue;
    const style = FLOW_STYLE[p.type];
    if (p.type === 'vote') {
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = style.col;
      ctx.beginPath();
      ctx.arc(scratch.x, scratch.y, style.size, 0, 6.283);
      ctx.fill();
    } else if (p.type === 'customJson') {
      ctx.save();
      ctx.translate(scratch.x, scratch.y);
      ctx.rotate(time * 3 + p.edge);
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = style.col;
      ctx.fillRect(-style.size, -style.size, style.size * 2, style.size * 2);
      ctx.restore();
    } else if (p.type === 'comment') {
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = style.col;
      ctx.beginPath();
      ctx.arc(scratch.x, scratch.y, style.size, 0, 6.283);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(scratch.x - 2, scratch.y + style.size - 1);
      ctx.lineTo(scratch.x - style.size, scratch.y + style.size + 5);
      ctx.lineTo(scratch.x + 2, scratch.y + style.size);
      ctx.closePath();
      ctx.fill();
    } else {
      // transfer: a coin with a soft glow. Rare, valuable, deliberate.
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = style.col;
      ctx.beginPath();
      ctx.arc(scratch.x, scratch.y, style.size * 2.4, 0, 6.283);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(scratch.x, scratch.y, style.size, 0, 6.283);
      ctx.fill();
      ctx.strokeStyle = '#8a6d1f';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.strokeStyle = '#fff3c9';
      ctx.beginPath();
      ctx.arc(scratch.x, scratch.y, style.size * 0.55, 0, 6.283);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  // Json factories: pulsing, spitting into the flows.
  for (const f of scene.factories) {
    if (!vis(f.x, f.y)) continue;
    const pulse = 0.5 + Math.sin(time * 2.1 + f.phase) * 0.5;
    ctx.fillStyle = PALETTE.factory;
    ctx.fillRect(f.x - 26, f.y - 18, 52, 36);
    ctx.fillStyle = PALETTE.factoryGlow;
    ctx.globalAlpha = 0.25 + pulse * 0.55;
    ctx.fillRect(f.x - 8, f.y - 30, 16, 12);
    ctx.globalAlpha = 0.5 + pulse * 0.5;
    ctx.font = `600 ${13 / Math.max(z, 0.3)}px ${MONO}`;
    ctx.textAlign = 'center';
    ctx.fillText('{ }', f.x, f.y + 5);
    ctx.globalAlpha = 1;
  }

  // Voter traffic: real handles passing along the lines. Decoration only.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const m of scene.traffic) {
    const e = edges[m.edge];
    if (!e) continue;
    posAt(e, m.t, scratch);
    if (!vis(scratch.x, scratch.y)) continue;
    const a = clamp(m.life / m.max, 0, 1);
    ctx.globalAlpha = a * 0.9;
    ctx.fillStyle = PALETTE.traffic;
    ctx.beginPath();
    ctx.arc(scratch.x, scratch.y, 3, 0, 6.283);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // The population: inert critters drifting along the lines. Skipped on the
  // pulled-out map, where they would be sub-pixel noise.
  if (scene.critters && mapness < 0.6) {
    drawCritters(ctx, scene.critters, time, vis);
  }

  // Shots in flight, over the critter that fired them, under the tokens.
  if (scene.projectiles && mapness < 0.6) {
    drawProjectiles(ctx, scene.projectiles, vis);
  }

  // JSON tokens, the trunk of whatever is stealing them, and what the bug is
  // carrying. Skipped on the pulled-out map, where a token is sub-pixel.
  if (scene.coins && mapness < 0.6) {
    drawCoins(ctx, scene.coins, scene.critters, player, time, z, vis);
  }

  // The oxygen helmets, waiting to be found. Sub-pixel on the far map.
  if (scene.helmetState && mapness < 0.6) {
    drawHelmets(ctx, scene.helmetState, time, vis);
  }

  // Stake fog.
  const fogAlpha = lerp(0.3, 1, mapness);
  const fogRadius = lerp(0.42, 1, mapness);
  for (const n of nodes) {
    if (n.kind !== 'house') continue;
    const h = scene.houses[n.ref];
    if (!h) continue;
    const r = h.bubble * fogRadius;
    if (n.x + r < vx0 || n.x - r > vx1 || n.y + r < vy0 || n.y - r > vy1) continue;
    ctx.globalAlpha = h.glow * fogAlpha;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(n.x, n.y, r, 0, 6.283);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Junctions and houses, as irregular blobs.
  for (const n of nodes) {
    if (!vis(n.x, n.y)) continue;
    if (n.kind === 'junction') {
      ctx.fillStyle = PALETTE.junction;
      ctx.globalAlpha = 0.85;
      blobPath(ctx, n.x, n.y, 6, n.id);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (n.kind === 'house') {
      const h = scene.houses[n.ref];
      if (!h) {
        ctx.fillStyle = PALETTE.junction;
        ctx.globalAlpha = 0.85;
        blobPath(ctx, n.x, n.y, 6, n.id);
        ctx.fill();
        ctx.globalAlpha = 1;
        continue;
      }
      const col = scene.tierColors[h.tier];
      const rNode = Math.min(17 / Math.max(z, 0.35), 180);
      const rHalo = rNode * (2.1 + mapness * 1.6);
      // CURATION MODE: every post breathes a faint ring, so "go engage with
      // live posts" reads off the map. Newcomers keep their louder trail
      // glow below.
      if (scene.mode === 'curation' && !h.isNewcomer) {
        const cb = 0.5 + Math.sin(time * 1.6 + n.id * 0.7) * 0.5;
        ctx.strokeStyle = '#9be8ff';
        ctx.globalAlpha = 0.18 + cb * 0.3;
        ctx.lineWidth = 2 / Math.max(z, 0.1);
        ctx.beginPath();
        ctx.arc(n.x, n.y, rNode * 2.2 + cb * 6, 0, 6.283);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      // ADVENTURE MODE, the DHF race: a house whose vote is still there
      // wears a gold ring; take it and the ring goes. Whales ring wider,
      // because their vote weighs more.
      if (scene.mode === 'adventure' && scene.race && !scene.race.taken.has(n.id) && !scene.race.funded) {
        const vb = 0.5 + Math.sin(time * 2.4 + n.id * 1.3) * 0.5;
        ctx.strokeStyle = '#ffd24a';
        ctx.globalAlpha = 0.35 + vb * 0.5;
        ctx.lineWidth = (2 + h.tier * 0.6) / Math.max(z, 0.1);
        ctx.beginPath();
        ctx.arc(n.x, n.y, rNode * (2 + h.tier * 0.25) + vb * 5, 0, 6.283);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (h.isNewcomer) {
        const beat = 0.5 + Math.sin(time * 1.9 + n.id) * 0.5;
        // THE NEWB TRAIL QUEST GLOW: an unvisited newcomer post burns in
        // the trail's pink - a soft halo plus two breathing rings, loud on
        // purpose so "go visit them all" is readable from the map. Once
        // visited it settles to one steady earned ring.
        const questDone = scene.newbieVisited?.has(n.id) ?? false;
        if (!questDone) {
          const qg = ctx.createRadialGradient(n.x, n.y, rNode * 0.4, n.x, n.y, rNode * 4.2);
          qg.addColorStop(0, `rgba(255, 95, 208, ${(0.16 + beat * 0.14).toFixed(3)})`);
          qg.addColorStop(1, 'rgba(255, 95, 208, 0)');
          ctx.fillStyle = qg;
          ctx.beginPath();
          ctx.arc(n.x, n.y, rNode * 4.2, 0, 6.283);
          ctx.fill();
          ctx.strokeStyle = '#ff5fd0';
          ctx.globalAlpha = 0.35 + beat * 0.6;
          ctx.lineWidth = 3 / Math.max(z, 0.1);
          ctx.beginPath();
          ctx.arc(n.x, n.y, rNode * 2.5 + beat * 9, 0, 6.283);
          ctx.stroke();
          ctx.globalAlpha = 0.25 + (1 - beat) * 0.45;
          ctx.beginPath();
          ctx.arc(n.x, n.y, rNode * 3.3 + (1 - beat) * 9, 0, 6.283);
          ctx.stroke();
          ctx.globalAlpha = 1;
        } else {
          ctx.strokeStyle = '#ff9ee8';
          ctx.globalAlpha = 0.8;
          ctx.lineWidth = 2.4 / Math.max(z, 0.1);
          ctx.beginPath();
          ctx.arc(n.x, n.y, rNode * 2.3, 0, 6.283);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        ctx.strokeStyle = PALETTE.newRing;
        ctx.globalAlpha = 0.2 + beat * 0.7;
        ctx.lineWidth = 2.6 / Math.max(z, 0.1);
        ctx.beginPath();
        ctx.arc(n.x, n.y, rNode * 2 + beat * 6, 0, 6.283);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.globalAlpha = 0.22 + mapness * 0.3;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(n.x, n.y, rHalo, 0, 6.283);
      ctx.fill();
      ctx.globalAlpha = 1;
      // The face: the author's real profile photo once it has lazily loaded,
      // framed by the same rings; until then (or if the load failed) a flat
      // tier-coloured disc with the account's first letter.
      const rFace = rNode * 1.18;
      const img = avatarImage(h.handle);
      if (img) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(n.x, n.y, rFace, 0, 6.283);
        ctx.clip();
        ctx.drawImage(img, n.x - rFace, n.y - rFace, rFace * 2, rFace * 2);
        ctx.restore();
      } else {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(n.x, n.y, rFace, 0, 6.283);
        ctx.fill();
        ctx.fillStyle = '#0b1016';
        ctx.font = `800 ${rFace * 1.15}px ${MONO}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(h.handle.charAt(0).toUpperCase(), n.x, n.y + rFace * 0.06);
      }
      ctx.strokeStyle = h.isNewcomer ? PALETTE.newRing : '#ffffff';
      ctx.lineWidth = 1.8 / Math.max(z, 0.2);
      ctx.beginPath();
      ctx.arc(n.x, n.y, rFace, 0, 6.283);
      ctx.stroke();

    }
  }

  // THE BUZZING STATION: today's double-token zone, humming in gold. Two
  // breathing rings and a swarm of little bee motes orbiting the boundary,
  // loud enough to read from the pulled-out map so the day's draw is visible
  // the moment the world is.
  if (scene.buzz) {
    const b = scene.buzz;
    const hum = 0.5 + Math.sin(time * 2.4) * 0.5;
    ctx.strokeStyle = '#ffd24a';
    for (const [mul, w, a] of [
      [1, 5, 0.5],
      [0.82 + hum * 0.06, 2.6, 0.35]
    ] as const) {
      ctx.globalAlpha = a + hum * 0.25;
      ctx.lineWidth = w / Math.max(z, 0.05);
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * mul, 0, 6.283);
      ctx.stroke();
    }
    for (let k = 0; k < 7; k++) {
      const a = time * (0.5 + (k % 3) * 0.14) + (k / 7) * 6.283;
      const br = b.r * (0.94 + Math.sin(time * 3 + k * 2.1) * 0.05);
      const bx = b.x + Math.cos(a) * br;
      const by = b.y + Math.sin(a) * br * 0.97;
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = k % 2 ? '#ffd24a' : '#fff3c0';
      ctx.beginPath();
      ctx.arc(bx, by, 9 / Math.max(z, 0.12), 0, 6.283);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Landmarks: every type its own vector icon; the destination worlds are
  // drawn as structures so arriving feels like arriving somewhere.
  let ferrisPos: { x: number; y: number; s: number } | null = null;
  for (const n of nodes) {
    if (n.kind !== 'landmark' || !vis(n.x, n.y)) continue;
    const lm = scene.landmarks[n.ref];
    if (!lm) continue;
    // The ruins are their own district, drawn above by drawSteemRuins.
    if (lm.icon === 'ruins') continue;
    const col = CATEGORY_HEX[lm.category];
    const minor = lm.icon === 'doc' || lm.icon === 'docq';
    // The big five are drawn at a fixed WORLD size, several times any other
    // marker, so they stay huge on the pulled-out map. Everything else is
    // sized in screen space and stays modest, which is what makes the five
    // stand out instead of competing.
    // Bigger than before: with the names gone the art has to carry identity
    // on its own, so an ordinary marker grew from 36 to 52 and the minor
    // paperwork from 24 to 34.
    // CARTOGRAPHIC EXAGGERATION: theme-park maps lie about scale. The big
    // places grow up to 1.9x as the camera pulls out, so at full map they
    // read as attractions instead of specks, and shrink back to honest size
    // as you fly in. This one factor is most of the difference between
    // "illustrated park map" and "network diagram".
    const bigScale = 1 + mapness * 0.9;
    const s = lm.big
      ? (BIG_SIZE[lm.icon] ?? 300) * bigScale
      : (minor ? 34 : 52) / Math.max(z, 0.45);
    // MODE BEACONS, sized from the art so they ring the tent as well as a
    // small marker, drawn before the pad and the icon so the art sits inside.
    // Front end: every hive.blog page, cyan. Adventure: the DHF Fun Park,
    // gold, the race's finish line.
    if (scene.mode === 'frontend' && lm.site) drawBeacon(ctx, n.x, n.y, s, z, time + n.id, '93, 240, 255', '#5df0ff');
    if (scene.mode === 'adventure' && lm.raceGoal) drawBeacon(ctx, n.x, n.y, s, z, time + n.id, '255, 210, 74', '#ffd24a');
    // GROUND PAD: a dark clearing under each big place, fading in with the
    // map. Anchors the attraction to the land (park maps sit rides in
    // plazas) and buys silhouette contrast against the busy red.
    if (lm.big) {
      const padR = s * 1.35;
      const padY = n.y + s * 0.5;
      ctx.globalAlpha = 0.1 + mapness * 0.3;
      ctx.fillStyle = '#20060c';
      ctx.beginPath();
      ctx.ellipse(n.x, padY, padR, padR * 0.42, 0, 0, 6.283);
      ctx.fill();
      ctx.globalAlpha = 0.08 + mapness * 0.18;
      ctx.strokeStyle = '#ff6a5a';
      ctx.lineWidth = 3 / Math.max(z, 0.05);
      ctx.beginPath();
      ctx.ellipse(n.x, padY, padR, padR * 0.42, 0, 0, 6.283);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // The black hole is the one big place that must NOT look welcoming, so it
    // is the one that does not get the warm pool.
    if (lm.big && lm.icon !== 'blackhole') {
      // A soft warm pool of light under each big place, so it sits ON the
      // terrain rather than floating above it. The pool uses the shared
      // footprint, not `s`, so all five are lit alike.
      const py = n.y + BIG_SPAN * 0.45;
      const pool = ctx.createRadialGradient(n.x, py, BIG_SPAN * 0.1, n.x, py, BIG_SPAN * 1.5);
      pool.addColorStop(0, 'rgba(255, 196, 120, 0.16)');
      pool.addColorStop(1, 'rgba(255, 170, 90, 0)');
      ctx.fillStyle = pool;
      ctx.beginPath();
      ctx.arc(n.x, py, BIG_SPAN * 1.5, 0, 6.283);
      ctx.fill();
    }
    // A landmark with a real Hive account wears that account's avatar once
    // it has loaded; otherwise (and meanwhile) its code-drawn icon.
    const lmImg = lm.handle ? avatarImage(lm.handle) : null;
    if (lmImg) {
      const rA = Math.max(s * 0.95, 30);
      ctx.save();
      ctx.beginPath();
      ctx.arc(n.x, n.y, rA, 0, 6.283);
      ctx.clip();
      ctx.drawImage(lmImg, n.x - rA, n.y - rA, rA * 2, rA * 2);
      ctx.restore();
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.4 / Math.max(z, 0.2);
      ctx.beginPath();
      ctx.arc(n.x, n.y, rA, 0, 6.283);
      ctx.stroke();
    } else {
      drawIcon(ctx, lm.icon, n.x, n.y, s, col, time, lm.label);
    }
    if (lm.icon === 'ferris') ferrisPos = { x: n.x, y: n.y, s };
    // THE dAPP STATION'S WINDOWS: real dApp logos looking out. The icon
    // draws the holes (DAPP_WINDOWS, same list); once each dApp account's
    // avatar loads it is clipped into its window. Until then the icon's own
    // coloured glass shows, so nothing ever looks broken.
    if (lm.icon === 'launchpad') {
      const shipR = s * 2.2;
      const slots = DAPP_WINDOWS;
      // ONE ship since the merge: every logo account rides the same craft.
      const crew = DAPP_DIRECTORY.filter((dd) => dd.account);
      for (let k = 0; k < slots.length && k < crew.length; k++) {
        const win = slots[k];
        const img = crew[k].account ? avatarImage(crew[k].account as string) : null;
        if (!img) continue;
        const wx = n.x + win.dx * shipR;
        const wy = n.y + win.dy * shipR;
        const wr = win.r * shipR * 0.92;
        ctx.save();
        ctx.beginPath();
        ctx.arc(wx, wy, wr, 0, 6.283);
        ctx.clip();
        ctx.drawImage(img, wx - wr, wy - wr, wr * 2, wr * 2);
        ctx.restore();
        ctx.strokeStyle = '#141019';
        ctx.lineWidth = Math.max(2, shipR * 0.04);
        ctx.beginPath();
        ctx.arc(wx, wy, wr, 0, 6.283);
        ctx.stroke();
      }
    }
    // THE ROSE WINDOW'S WORDS (Bryan: "some written words could be in the
    // panes when in game play"): each pane wears its own translated label,
    // shrunk to fit its glass, so the window reads as the link wheel it is
    // without hovering. Play zoom only; on the pulled-out map the words
    // would be finer than the lead lines.
    if (lm.icon === 'rosewindow' && scene.roseLabels?.length && z >= 0.3) {
      const R = s * 2.2;
      const count = scene.roseLabels.length;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const maxW = R * 0.36;
      for (let k = 0; k < count; k++) {
        const pc = rosePaneCentre(k, count, R);
        const words = scene.roseLabels[k].split(' ');
        const mid = Math.ceil(words.length / 2);
        const lines =
          words.length === 1 ? words : [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
        let fs = R * 0.082;
        ctx.font = `700 ${fs}px ${MONO}`;
        const widest = Math.max(...lines.map((ln) => ctx.measureText(ln).width));
        if (widest > maxW) {
          fs *= maxW / widest;
          ctx.font = `700 ${fs}px ${MONO}`;
        }
        for (let li = 0; li < lines.length; li++) {
          const ly = n.y + pc.y + (li - (lines.length - 1) / 2) * fs * 1.15;
          ctx.strokeStyle = '#141019';
          ctx.lineWidth = fs * 0.28;
          ctx.lineJoin = 'round';
          ctx.strokeText(lines[li], n.x + pc.x, ly);
          ctx.fillStyle = '#fdf6e6';
          ctx.fillText(lines[li], n.x + pc.x, ly);
        }
      }
    }
  }

  // TROPHY GONDOLAS: items brought to the ferris wheel and ridden one full
  // rotation mount into a gondola and ride with the wheel for the rest of
  // the 30-minute board (Bryan's Sagrada brief). Three mountables so far:
  // a helmet, a gem, a token; one new mount per completed ride.
  if (ferrisPos && scene.wheelTrophies && scene.wheelTrophies.length > 0) {
    const R = ferrisPos.s * 2.2;
    const tr = ferrisPos.s * 0.16;
    for (let k = 0; k < Math.min(8, scene.wheelTrophies.length); k++) {
      const a = time * FERRIS_SPIN + (k / 8) * 6.283;
      const tx = ferrisPos.x + Math.cos(a) * R;
      const ty = ferrisPos.y + Math.sin(a) * R;
      // Earned-light halo on the filled socket.
      ctx.globalAlpha = 0.55 + Math.sin(time * 2 + k) * 0.2;
      ctx.strokeStyle = '#FFD9A0';
      ctx.lineWidth = Math.max(2, tr * 0.35);
      ctx.beginPath();
      ctx.arc(tx, ty, tr * 1.5, 0, 6.283);
      ctx.stroke();
      ctx.globalAlpha = 1;
      const kind = scene.wheelTrophies[k];
      if (kind === 'gem') {
        ctx.beginPath();
        ctx.moveTo(-tr * 0.6 + tx, -tr * 0.4 + ty);
        ctx.lineTo(tr * 0.6 + tx, -tr * 0.4 + ty);
        ctx.lineTo(tr + tx, ty);
        ctx.lineTo(tx, tr + ty);
        ctx.lineTo(-tr + tx, ty);
        ctx.closePath();
        ctx.fillStyle = '#FF5C8A';
        ctx.fill();
        ctx.strokeStyle = '#141019';
        ctx.lineWidth = Math.max(1.6, tr * 0.22);
        ctx.stroke();
      } else if (kind === 'token') {
        ctx.beginPath();
        ctx.arc(tx, ty, tr, 0, 6.283);
        ctx.fillStyle = '#ffd24a';
        ctx.fill();
        ctx.strokeStyle = '#8a6d1f';
        ctx.lineWidth = Math.max(1.6, tr * 0.22);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(tx, ty, tr * 0.55, 0, 6.283);
        ctx.strokeStyle = '#fff3c9';
        ctx.stroke();
      } else {
        // The helmet: mini dome and collar.
        ctx.beginPath();
        ctx.arc(tx, ty - tr * 0.2, tr, Math.PI, 0);
        ctx.lineTo(tx + tr, ty + tr * 0.35);
        ctx.lineTo(tx - tr, ty + tr * 0.35);
        ctx.closePath();
        ctx.fillStyle = 'rgba(155, 232, 255, 0.5)';
        ctx.fill();
        ctx.strokeStyle = '#0e2a36';
        ctx.lineWidth = Math.max(1.6, tr * 0.22);
        ctx.stroke();
        ctx.fillStyle = '#ffd24a';
        ctx.fillRect(tx - tr * 1.15, ty + tr * 0.35, tr * 2.3, tr * 0.45);
      }
    }
  }

  // Communities: glowing translucent bubbles of varying size.
  for (const n of nodes) {
    if (n.kind !== 'community' || !vis(n.x, n.y)) continue;
    const c = scene.communities[n.ref];
    if (!c) continue;
    const beat = 0.5 + Math.sin(time * 1.3 + n.ref) * 0.5;
    // The bubble the bug is standing in brightens, so "you are here" is
    // visible on the map itself and not only in the banner.
    const here = n.ref === scene.activeCommunity;
    // Dim-until-visited (socket grammar, Bryan's yes on question 4): an
    // unvisited bubble rests quiet, with a floor so the ring of ten never
    // looks broken. Visiting lights it for good.
    const seen = here || !scene.visitedCommunities || scene.visitedCommunities.has(c.handle);
    ctx.fillStyle = here ? '#a8e8ff' : '#7fd8ff';
    ctx.globalAlpha = (here ? 0.3 + beat * 0.12 : 0.1 + beat * 0.05) * (seen ? 1 : 0.5);
    ctx.beginPath();
    ctx.arc(n.x, n.y, c.radius, 0, 6.283);
    ctx.fill();
    ctx.globalAlpha = here ? 1 : seen ? 0.5 : 0.42;
    ctx.strokeStyle = here ? '#d8f4ff' : '#7fd8ff';
    ctx.lineWidth = (here ? 4.4 : 2.4) / Math.max(z, 0.08);
    ctx.beginPath();
    ctx.arc(n.x, n.y, c.radius, 0, 6.283);
    ctx.stroke();
    ctx.globalAlpha = 1;
    // An animated emblem chosen from the community's own NAME, so each bubble
    // reads as its own place rather than as one of ten identical circles.
    // Unvisited bubbles keep only their avatar: the emblem is earned light.
    if (seen) {
      drawCommunityEmblem(ctx, c.handle, n.x, n.y, c.radius * 0.82, time);
    }

    // The community's real avatar floats at the bubble's heart once loaded;
    // a small bright dot till then. Noticeably bigger than pass seven drew it,
    // since the logo is the thing that identifies the place.
    const cImg = avatarImage(c.handle);
    if (cImg) {
      const rC = Math.min(c.radius * 0.62, 190);
      ctx.save();
      ctx.beginPath();
      ctx.arc(n.x, n.y, rC, 0, 6.283);
      ctx.clip();
      ctx.drawImage(cImg, n.x - rC, n.y - rC, rC * 2, rC * 2);
      ctx.restore();
      ctx.strokeStyle = here ? '#d8f4ff' : '#7fd8ff';
      ctx.lineWidth = (here ? 5 : 3.4) / Math.max(z, 0.2);
      ctx.beginPath();
      ctx.arc(n.x, n.y, rC, 0, 6.283);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#bfe9ff';
      ctx.beginPath();
      ctx.arc(n.x, n.y, 12 / Math.max(z, 0.3), 0, 6.283);
      ctx.fill();
    }
  }

  const bugX = scene.rideOverlay ? scene.rideOverlay.x : player.x;
  const bugY = scene.rideOverlay ? scene.rideOverlay.y : player.y;
  drawBug(
    ctx,
    player,
    time,
    bugX,
    bugY,
    scene.playerHandle ? avatarImage(scene.playerHandle) : null,
    scene.projectiles ? { x: scene.projectiles.aimX, y: scene.projectiles.aimY } : undefined
  );
  // The worn helmet resolves at play zoom only; below that the dome would
  // be sub-2px mush (LOD rule: identity survives, detail does not).
  if (scene.helmetState && z >= 0.22) {
    drawSuitBubble(ctx, bugX, bugY, scene.helmetState, time);
  }
  if (scene.hazards) {
    drawHazardsOnBug(ctx, scene.hazards, bugX, bugY, time);
  }
  if (scene.combat) {
    drawCombatOnBug(ctx, scene.combat, bugX, bugY, time);
  }

  // Warp effect: the SPIRAL, from the bike-wheel art brief. Three rotating
  // color arms unwinding outward as the effect fades: vibrant, one-shot,
  // and the only place these hues run at celebration volume in-world.
  if (scene.warpFx && scene.warpFx > 0) {
    const f = 1 - scene.warpFx;
    const ARMS = ['#FF6FB0', '#7FD9D2', '#FFD9A0'];
    ctx.lineCap = 'round';
    for (let arm = 0; arm < ARMS.length; arm++) {
      ctx.strokeStyle = ARMS[arm];
      ctx.globalAlpha = scene.warpFx * 0.85;
      ctx.lineWidth = 4.5 / Math.max(z, 0.1);
      ctx.beginPath();
      for (let s = 0; s <= 10; s++) {
        const tt = s / 10;
        const ang = arm * 2.094 + tt * 2.6 + f * 5;
        const rad = (14 + tt * (40 + f * 300)) / Math.max(z, 0.2);
        const px = player.x + Math.cos(ang) * rad;
        const py = player.y + Math.sin(ang) * rad;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // The player marker on the map: always findable.
  if (mapness > 0.3) {
    const beat = 0.5 + Math.sin(time * 5) * 0.5;
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 0.5 + beat * 0.5;
    ctx.lineWidth = 2.5 / z;
    ctx.beginPath();
    ctx.arc(player.x, player.y, (16 + beat * 6) / z, 0, 6.283);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = PALETTE.hive;
    ctx.save();
    ctx.translate(player.x, player.y);
    // 12 (was 9): grown so the black Hive stripes stay legible on it.
    const s = 12 / z;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5 / z;
    ctx.stroke();
    // The black Hive stripes on the map marker too (Bryan's order covers
    // "the red diamond that represents the players location" at BOTH
    // zooms). Sized in screen space with the diamond, never mirrored.
    drawHiveMark(ctx, 0, 0, s * 1.05, '#141019');
    ctx.restore();
  }

  // THE PLANNING GRID (G key). Lines every 700 world px across the full
  // extent, every box lettered in its corner. A directing tool, not art:
  // it draws over the whole world and under the HUD, and vanishes with one
  // keypress for demo recordings.
  if (scene.debugGrid) {
    const CELL = GRID_CELL;
    const EXT = GRID_EXT;
    ctx.strokeStyle = 'rgba(140, 220, 255, 0.3)';
    ctx.lineWidth = 1.4 / Math.max(z, 0.04);
    ctx.beginPath();
    for (let gx = -EXT; gx <= EXT; gx += CELL) {
      if (gx < vx0 - CELL || gx > vx1 + CELL) continue;
      ctx.moveTo(gx, Math.max(-EXT, vy0));
      ctx.lineTo(gx, Math.min(EXT, vy1));
    }
    for (let gy = -EXT; gy <= EXT; gy += CELL) {
      if (gy < vy0 - CELL || gy > vy1 + CELL) continue;
      ctx.moveTo(Math.max(-EXT, vx0), gy);
      ctx.lineTo(Math.min(EXT, vx1), gy);
    }
    ctx.stroke();
    const fs = Math.min(240, 11 / Math.max(z, 0.04));
    ctx.font = `700 ${fs}px ${MONO}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(140, 220, 255, 0.75)';
    const c0 = Math.max(0, Math.floor((vx0 + EXT) / CELL));
    const c1 = Math.min(25, Math.floor((vx1 + EXT) / CELL));
    const r0 = Math.max(0, Math.floor((vy0 + EXT) / CELL));
    const r1 = Math.min(25, Math.floor((vy1 + EXT) / CELL));
    // At full map, 676 labels cost real frame time; every second box still
    // names every region (read the neighbour), so the wide view thins out.
    const step = c1 - c0 > 15 ? 2 : 1;
    for (let ci = c0; ci <= c1; ci += step) {
      for (let ri = r0; ri <= r1; ri += step) {
        ctx.fillText(
          `${String.fromCharCode(65 + ci)}-${ri + 1}`,
          -EXT + ci * CELL + fs * 0.3,
          -EXT + ri * CELL + fs * 0.25
        );
      }
    }
    // THE HOVERED BOX: highlighted, with its name drawn BIG in the middle
    // (Bryan has bad eyes; the corner labels are for orientation, this is
    // for reading). Screen-constant ~40px type at any zoom.
    if (scene.hoverGridCell) {
      const { ci, ri } = scene.hoverGridCell;
      const bx = -EXT + ci * CELL;
      const by = -EXT + ri * CELL;
      ctx.fillStyle = 'rgba(140, 220, 255, 0.14)';
      ctx.fillRect(bx, by, CELL, CELL);
      ctx.strokeStyle = 'rgba(140, 220, 255, 0.9)';
      ctx.lineWidth = 3.5 / Math.max(z, 0.04);
      ctx.strokeRect(bx, by, CELL, CELL);
      const bigFs = 40 / Math.max(z, 0.04);
      ctx.font = `800 ${bigFs}px ${MONO}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const name = `${String.fromCharCode(65 + ci)}-${ri + 1}`;
      ctx.lineWidth = bigFs * 0.14;
      ctx.strokeStyle = 'rgba(4, 3, 10, 0.9)';
      ctx.strokeText(name, bx + CELL / 2, by + CELL / 2);
      ctx.fillStyle = '#d6f2ff';
      ctx.fillText(name, bx + CELL / 2, by + CELL / 2);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
  }

  // THE BACK OF THE BOARD is the dead chain: everything drained of its
  // saturation, then pulled cold. Two blend fills over the whole view; the
  // world underneath is drawn exactly as on the front.
  if (scene.side === 'steem') {
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = '#4a5560';
    ctx.fillRect(vx0, vy0, vx1 - vx0, vy1 - vy0);
    ctx.globalCompositeOperation = 'color';
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#5c7590';
    ctx.fillRect(vx0, vy0, vx1 - vx0, vy1 - vy0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  ctx.restore();

  // Mid-flip the board is edge-on: darken so the turn has weight.
  if (Math.abs(flipX) < 1) {
    ctx.globalAlpha = (1 - Math.abs(flipX)) * 0.7;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }

  // VIGNETTE, screen space, map zoom only: darkened corners pull the eye
  // into the world and hide the dead frame edges the citadel ring cannot
  // fill. One radial gradient; play zoom stays clean.
  if (mapness > 0.1) {
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vg.addColorStop(1, `rgba(0, 0, 0, ${(0.38 * mapness).toFixed(3)})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  drawHud(scene);
}

/** Transparent isometric-ish cube. */
function drawCube(ctx: CanvasRenderingContext2D, c: Cube): void {
  const s = c.size;
  const col = CUBE_HEX[c.hue];
  ctx.globalAlpha = c.alpha;
  ctx.fillStyle = col;
  // top face
  ctx.beginPath();
  ctx.moveTo(c.x, c.y - s);
  ctx.lineTo(c.x + s * 0.87, c.y - s * 0.5);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(c.x - s * 0.87, c.y - s * 0.5);
  ctx.closePath();
  ctx.fill();
  // left face, darker
  ctx.globalAlpha = c.alpha * 0.6;
  ctx.beginPath();
  ctx.moveTo(c.x - s * 0.87, c.y - s * 0.5);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(c.x, c.y + s * 0.9);
  ctx.lineTo(c.x - s * 0.87, c.y + s * 0.4);
  ctx.closePath();
  ctx.fill();
  // right face, darkest
  ctx.globalAlpha = c.alpha * 0.4;
  ctx.beginPath();
  ctx.moveTo(c.x + s * 0.87, c.y - s * 0.5);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(c.x, c.y + s * 0.9);
  ctx.lineTo(c.x + s * 0.87, c.y + s * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

/**
 * A breathing beacon around a landmark: soft radial glow plus one pulsing
 * ring, both sized from the landmark's drawn size `s`. `rgb` is the glow
 * as "r, g, b"; `hex` the ring.
 */
function drawBeacon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  z: number,
  phase: number,
  rgb: string,
  hex: string
): void {
  const fb = 0.5 + Math.sin(phase * 2.2) * 0.5;
  const br = s * 1.7;
  const bg = ctx.createRadialGradient(x, y, s * 0.6, x, y, br);
  bg.addColorStop(0, `rgba(${rgb}, ${(0.2 + fb * 0.14).toFixed(3)})`);
  bg.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(x, y, br, 0, 6.283);
  ctx.fill();
  ctx.strokeStyle = hex;
  ctx.globalAlpha = 0.35 + fb * 0.5;
  ctx.lineWidth = 3 / Math.max(z, 0.1);
  ctx.beginPath();
  ctx.arc(x, y, s * 1.25 + fb * s * 0.08, 0, 6.283);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawHud(scene: RenderScene): void {
  const { ctx, hud } = scene;
  // No scrim box any more (Bryan: "the score card stuff is bright enough
  // and doesnt need that shaded box") - it was shading whatever stood in
  // the top-left corner, the hydra's west head included. The text draws
  // straight over the world.
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = `600 13px ${MONO}`;
  ctx.fillStyle = PALETTE.newRing;
  ctx.fillText(`${hud.housesLabel} ${hud.housesCount}`, 16, 14);
  ctx.fillStyle = PALETTE.textDim;
  ctx.fillText(`${hud.windowLabel} ${hud.windowTime}`, 16, 33);
  ctx.fillStyle = '#ffd24a';
  ctx.fillText(`${hud.tokensLabel} ${hud.carried} / ${hud.banked}`, 16, 52);
  ctx.fillStyle = '#9be8ff';
  ctx.fillText(`${hud.helmetsLabel} ${hud.helmets} / ${hud.helmetTotal}`, 16, 71);
  let hudY = 90;
  if (hud.placesLabel !== undefined) {
    ctx.fillStyle = '#b8ffd2';
    ctx.fillText(`${hud.placesLabel} ${hud.places} / ${hud.placesTotal}`, 16, hudY);
    hudY += 19;
  }
  if (hud.gemsLabel !== undefined) {
    ctx.fillStyle = '#FF9EDA';
    ctx.fillText(`${hud.gemsLabel} ${hud.gems}`, 16, hudY);
    hudY += 19;
  }
  // The newb-trail quest line, only when this window actually has newcomer
  // posts to visit.
  if (hud.newbsLabel !== undefined && (hud.newbsTotal ?? 0) > 0) {
    ctx.fillStyle = '#ff5fd0';
    ctx.fillText(`${hud.newbsLabel} ${hud.newbs} / ${hud.newbsTotal}`, 16, hudY);
    hudY += 19;
  }
  // THE ROUND CLOCK and the mode: one line, so the clock is readable even
  // with the top-right chip covered by a panel.
  if (hud.roundLabel !== undefined && hud.roundLeft !== undefined) {
    ctx.fillStyle = '#ffd24a';
    const modePart = hud.modeLabel ? `  ${hud.modeLabel}` : '';
    ctx.fillText(`${hud.roundLabel} ${hud.roundLeft}${modePart}`, 16, hudY);
    hudY += 19;
  }
  // THE BACK OF THE BOARD says so, in the cold colour of the ruins.
  if (hud.sideLabel !== undefined) {
    ctx.fillStyle = '#9fb4c8';
    ctx.fillText(hud.sideLabel, 16, hudY);
    hudY += 19;
  }
  // THE DHF RACE line, adventure mode only: votes carried against the return
  // line, then FUNDED once delivered.
  if (hud.votesLabel !== undefined && hud.votes !== undefined) {
    ctx.fillStyle = '#ffd24a';
    const text = hud.funded ? `${hud.votesLabel} ${hud.fundedLabel ?? ''}` : `${hud.votesLabel} ${hud.votes} / ${hud.votesLine ?? 0}`;
    ctx.fillText(text, 16, hudY);
    hudY += 19;
  }
  // With the planning grid on, the HUD names the box the bug stands in, so
  // "where should this go" can be answered by walking there and reading it.
  if (scene.debugGrid) {
    ctx.fillStyle = '#8cdcff';
    ctx.fillText(`[${gridCellName(scene.player.x, scene.player.y)}]`, 16, hudY);
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
}

/**
 * The bug, kept exactly as before: red diamond body, antennae with googly
 * eyes, the cyan surfboard, and the drift countdown ring.
 */
/** Hit pips over the bug's head, a red flash on each hit, and a faint
 *  pulse while invincible. Graphical only: no text, no locale keys. */
function drawCombatOnBug(
  ctx: CanvasRenderingContext2D,
  combat: CombatState,
  x: number,
  y: number,
  time: number
): void {
  for (let i = 0; i < MAX_HITS; i++) {
    const px = x + (i - (MAX_HITS - 1) / 2) * 14;
    const py = y - 58;
    ctx.beginPath();
    ctx.arc(px, py, 4.5, 0, 6.283);
    ctx.fillStyle = i < combat.hits ? '#ff4d6d' : '#ffffff';
    ctx.globalAlpha = i < combat.hits ? 0.95 : 0.35;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#141019';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }
  if (combat.hitFlash > 0) {
    ctx.globalAlpha = (combat.hitFlash / 0.4) * 0.8;
    ctx.strokeStyle = '#ff4d6d';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(x, y, 48 + (0.4 - combat.hitFlash) * 120, 0, 6.283);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (combat.invincible > 0) {
    ctx.globalAlpha = 0.25 + Math.sin(time * 18) * 0.15;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, 6.283);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

/**
 * What the nuisances look like ON the bug: green slime while gooed, waving
 * pasta arms while wrapped, and the sock-envelop trip (a giant sock drops
 * over the bug, closes, and lifts). Also paints in-flight goo spits, which
 * are the only hazard visual that lives away from the bug itself.
 */
function drawHazardsOnBug(
  ctx: CanvasRenderingContext2D,
  hz: HazardState,
  x: number,
  y: number,
  time: number
): void {
  // Goo spits in flight: a fat green lob from Blahgart to where the bug
  // was, SLOWED to a full watchable second (Bryan's order) with a dribble
  // trail behind it. Visual only; the hit has always been instant.
  for (const s of hz.splats) {
    const f = Math.min(1, s.age / 0.95);
    const px = lerp(s.fromX, s.toX, f);
    const py = lerp(s.fromY, s.toY, f) - Math.sin(f * Math.PI) * 22;
    ctx.fillStyle = '#52f22e';
    // The dribble trail: three shrinking blobs behind the lob.
    for (let k = 1; k <= 3; k++) {
      const tf = Math.max(0, f - k * 0.07);
      const tx = lerp(s.fromX, s.toX, tf);
      const ty = lerp(s.fromY, s.toY, tf) - Math.sin(tf * Math.PI) * 22;
      ctx.globalAlpha = (1 - s.age / 1.3) * (0.5 - k * 0.12);
      ctx.beginPath();
      ctx.arc(tx, ty, 5 - k, 0, 6.283);
      ctx.fill();
    }
    ctx.globalAlpha = Math.max(0, 1 - s.age / 1.3);
    ctx.beginPath();
    ctx.ellipse(px, py, 10, 8, f * 2, 0, 6.283);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Slime coat: bright green blob dripping off the bug, sliding down as it
  // wears off. Loud on purpose; being slimed should feel embarrassing.
  if (hz.gooT > 0) {
    const wear = Math.min(1, hz.gooT / 3.2);
    ctx.globalAlpha = 0.5 + wear * 0.35;
    ctx.fillStyle = '#52f22e';
    ctx.beginPath();
    ctx.ellipse(x, y - 4 + (1 - wear) * 10, 30, 24 * wear + 6, 0, 0, 6.283);
    ctx.fill();
    // Drips.
    for (let k = -1; k <= 1; k++) {
      const dy = ((time * 40 + k * 23) % 26) * wear;
      ctx.beginPath();
      ctx.ellipse(x + k * 16, y + 14 + dy, 4, 6, 0, 0, 6.283);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // The pasta wrap: noodles cinched around the bug, wiggling harder with
  // every escape jump. The count is legible from the wrap thinning.
  if (hz.wrapJumps > 0) {
    const shake = hz.wrapShake > 0 ? Math.sin(time * 60) * 4 : 0;
    ctx.strokeStyle = '#f2dfa8';
    for (let k = 0; k < hz.wrapJumps * 2; k++) {
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#141019';
      ctx.beginPath();
      ctx.ellipse(x + shake, y, 34, 15 + k * 6, -0.35 + k * 0.28, 0, 6.283);
      ctx.stroke();
      ctx.lineWidth = 3.6;
      ctx.strokeStyle = '#f2dfa8';
      ctx.beginPath();
      ctx.ellipse(x + shake, y, 34, 15 + k * 6, -0.35 + k * 0.28, 0, 6.283);
      ctx.stroke();
    }
  }

  // The sock envelop, TUBE FIRST (Bryan's fix: "it should come at you with
  // the tube side... it just makes more sense to get swallowed by the open
  // side of the sock"). The sock descends opening-down like a grabbing bag:
  // dark mouth at the bottom rim, red cuff ring, the toe curling up top,
  // slanty eyes delighted with themselves. Drops over phase 0 to 0.5
  // (teleport fires at the midpoint, hidden inside), lifts away 0.5 to 1.
  if (hz.sockT !== null) {
    const t = hz.sockT;
    // Three beats: drop (0 to 0.3), HOLD covering the bug (0.3 to 0.7,
    // the part Bryan wanted to actually see), lift away (0.7 to 1).
    const drop = t < 0.3 ? t / 0.3 : 1;
    const lift = t > 0.7 ? (t - 0.7) / 0.3 : 0;
    const sy = y - 170 + drop * 170 - lift * 330;
    // A slow contented squeeze while it holds, like a sock digesting.
    const holding = t >= 0.3 && t <= 0.7;
    const squash =
      1 + (holding ? Math.sin((t - 0.3) * 15) * 0.05 : Math.sin(Math.min(drop, 1) * Math.PI) * 0.12);
    ctx.save();
    ctx.translate(x, sy);
    ctx.scale(2.6 * squash, 2.6 / squash);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#141019';
    ctx.lineWidth = 3.5;
    // The tube, hanging opening-down; the toe bends away up top.
    ctx.beginPath();
    ctx.moveTo(-11, 18); // opening rim, left
    ctx.lineTo(-11, -14); // tube left wall
    ctx.quadraticCurveTo(-11, -24, -2, -26); // shoulder
    ctx.quadraticCurveTo(10, -28, 16, -22); // toe curling right
    ctx.quadraticCurveTo(20, -17, 14, -13); // toe underside
    ctx.quadraticCurveTo(11, -11, 11, -2); // back to tube right wall
    ctx.lineTo(11, 18); // opening rim, right
    ctx.closePath();
    ctx.fillStyle = '#f2f5fb';
    ctx.fill();
    ctx.stroke();
    // THE MOUTH: the dark open end coming at you.
    ctx.beginPath();
    ctx.ellipse(0, 18, 11, 4.5, 0, 0, 6.283);
    ctx.fillStyle = '#171019';
    ctx.fill();
    ctx.stroke();
    // Red cuff ring around the opening.
    ctx.beginPath();
    ctx.ellipse(0, 15.5, 11.5, 4, 0, 0, 6.283);
    ctx.strokeStyle = '#e3123a';
    ctx.lineWidth = 3;
    ctx.stroke();
    // The slanty eyes on the tube, delighted with itself.
    ctx.strokeStyle = '#141019';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-7, -6);
    ctx.lineTo(0, -2.5);
    ctx.moveTo(9, -8);
    ctx.lineTo(1.5, -4);
    ctx.stroke();
    ctx.restore();
  }
}

function drawBug(
  ctx: CanvasRenderingContext2D,
  p: PlayerState,
  time: number,
  atX: number,
  atY: number,
  rider: HTMLImageElement | null,
  aim?: { x: number; y: number }
): void {
  const BW = 19;
  const BH = 21;
  ctx.save();
  ctx.translate(atX, atY);

  // THE BOARD IS THE GUN SIGHT (Bryan: "make it clear what direction the
  // shot will fire... built into the surf board"). It turns to the aim,
  // wears a bright nose on the leading end, and a dotted sight line runs
  // out from the nose to where the shot will go. Without an aim (no
  // combat state) it lies flat with the old idle tilt.
  const boardY = BH + 4;
  const ang = aim ? Math.atan2(aim.y, aim.x) : p.face >= 0 ? 0.18 : -0.18;
  ctx.save();
  ctx.translate(0, boardY);
  ctx.rotate(ang);
  ctx.fillStyle = PALETTE.board;
  ctx.strokeStyle = PALETTE.boardLit;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(0, 0, 27, 7.5, 0, 0, 6.283);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-24, 0);
  ctx.lineTo(24, 0);
  ctx.globalAlpha = 0.5;
  ctx.stroke();
  ctx.globalAlpha = 1;
  if (aim) {
    // The nose: a bright fin at the leading tip, pulsing so it reads.
    const pulse = 0.75 + Math.sin(time * 6) * 0.25;
    ctx.fillStyle = PALETTE.boardLit;
    ctx.globalAlpha = pulse;
    ctx.beginPath();
    ctx.moveTo(24, -6);
    ctx.lineTo(42, 0);
    ctx.lineTo(24, 6);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    // The sight line: dotted, out to where the shot will fly, arrowhead.
    ctx.strokeStyle = PALETTE.boardLit;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.setLineDash([5, 9]);
    ctx.lineDashOffset = -time * 60;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(46, 0);
    ctx.lineTo(150, 0);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(150, -7);
    ctx.lineTo(162, 0);
    ctx.lineTo(150, 7);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  // THE REINS (Bryan's mount design): the two eye tentacles grew LONGER,
  // rooted in the body, swinging wide AROUND the rider's circle and coming
  // out over the top. Stalks first; the eyeballs are drawn LAST so they
  // peek out over the rider.
  const eyeTips: [number, number][] = [];
  for (let e = -1; e <= 1; e += 2) {
    const tx = e * 12 + p.face * 3;
    const ty = -82 + Math.sin(time * 4 + e) * 2.2;
    eyeTips.push([tx, ty]);
    ctx.strokeStyle = PALETTE.hiveLit;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(e * 6, -12);
    ctx.quadraticCurveTo(e * 28, -26, e * 26, -48);
    ctx.quadraticCurveTo(e * 22, -70, tx, ty);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(0, -BH);
  ctx.lineTo(BW, 0);
  ctx.lineTo(0, BH);
  ctx.lineTo(-BW, 0);
  ctx.closePath();
  ctx.fillStyle = PALETTE.hive;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // BLACK Hive stripes on the body (Bryan's order): the real mark stamped
  // dark, so the player IS the logo at a glance. Drawn OUTSIDE any facing
  // flip: the body faces left/right via `face` coordinate offsets only,
  // never a flip transform, so the mark can never appear backwards.
  drawHiveMark(ctx, 0, 0.5, 24, '#141019');

  // THE RIDER: the signed-in player's own avatar, perched on the diamond's
  // top tip, riding the bug. Little boots dangle onto the shoulders first,
  // behind the circle.
  // BIG on purpose (Bryan: "minimum as big as the clear helmet circle...
  // it can be absurd looking... dont worry about proportions"): the face
  // is the point, so the circle matches the old helmet dome and the real
  // profile image reads at a glance.
  const rr = 28;
  const rcy = -BH - 22;
  ctx.fillStyle = '#141019';
  for (const e of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(e * 9, -17.5, 4.2, 2.8, e * 0.5, 0, 6.283);
    ctx.fill();
  }
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, rcy, rr, 0, 6.283);
  ctx.clip();
  if (rider) {
    ctx.drawImage(rider, -rr, rcy - rr, rr * 2, rr * 2);
  } else {
    // Until the avatar loads: a warm rider-shaped placeholder.
    ctx.fillStyle = '#ffd24a';
    ctx.fillRect(-rr, rcy - rr, rr * 2, rr * 2);
    ctx.fillStyle = '#8a5a00';
    ctx.beginPath();
    ctx.arc(0, rcy - 7, 9.5, 0, 6.283);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, rcy + 17, 15.5, 11, 0, Math.PI, 0);
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0, rcy, rr, 0, 6.283);
  ctx.stroke();

  // Little arms out from the rider, hands gripping the reins where the
  // stalks pass beside the circle.
  ctx.strokeStyle = '#141019';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (const e of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(e * 22, rcy - 4);
    ctx.quadraticCurveTo(e * 27, rcy - 6.5, e * 29.5, rcy - 9);
    ctx.stroke();
    ctx.fillStyle = '#141019';
    ctx.beginPath();
    ctx.arc(e * 30, rcy - 9.5, 3, 0, 6.283);
    ctx.fill();
  }

  // The EYEBALLS, bigger now and drawn over everything: peeking out over
  // the top of the rider like the bug is watching where it carries them.
  for (const [tx, ty] of eyeTips) {
    ctx.beginPath();
    ctx.arc(tx, ty, 7.5, 0, 6.283);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#5c0a16';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = PALETTE.hiveBlack;
    ctx.beginPath();
    ctx.arc(tx + p.face * 2.6, ty + 0.7, 3.2, 0, 6.283);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(tx - 2, ty - 2.3, 1.2, 0, 6.283);
    ctx.fill();
  }

  if (p.mode === 'drift') {
    const f = clamp(p.fuel / 2.4, 0, 1);
    ctx.strokeStyle = f > 0.4 ? '#ffffff' : '#ff5f7a';
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.5 + Math.sin(time * 18) * 0.3;
    ctx.beginPath();
    // 58 (was 37): rings the whole rider-and-reins rig now.
    ctx.arc(0, -14, 58, -1.57, -1.57 + 6.283 * f);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}
