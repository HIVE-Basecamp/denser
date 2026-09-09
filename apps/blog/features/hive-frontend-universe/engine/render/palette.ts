import { GROUND_VOID } from '../ground';
import type { LandmarkCategory, IconKey } from '../../lib/fixed-world';
import type { FlowParticle } from '../particles';

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

export const CUBE_HEX = ['#5EE9D5', '#B79CFF', '#FFC24D', '#FF90AE', '#7fb8ff'];

/**
 * The big five: shared half-footprint on the map, world px. Everything about
 * their presence (light pool, label clearance) keys off this one number.
 */
export const BIG_SPAN = 330;

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

export const FLOW_STYLE: Record<FlowParticle['type'], { col: string; size: number }> = {
  vote: { col: '#cdf6ff', size: 3 },
  customJson: { col: '#ffd75e', size: 5.5 },
  comment: { col: '#8ee87f', size: 6 },
  transfer: { col: '#ffe08a', size: 8 }
};

export const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
