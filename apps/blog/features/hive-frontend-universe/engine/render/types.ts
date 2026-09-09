import type { GameMode } from '../../lib/modes';
import type { BoardSide } from '../../lib/board-side';
import type { WorldEdge, WorldNode } from '../world';
import type { PlayerState } from '../movement';
import type { Factory, Cube, Formation } from '../scenery';
import type { FlowParticle } from '../particles';
import type { CritterState } from '../critters';
import type { LandmarkCategory, IconKey } from '../../lib/fixed-world';
import type { GemState } from '../gems';
import type { CoinState } from '../coins';
import type { HelmetState } from '../helmets';
import type { KeepState } from '../keep';
import type { HazardState } from '../hazards';
import type { ProjectileState } from '../projectiles';
import type { CombatState } from '../combat';
import type { Ground } from '../ground';
import type { BlockState } from '../blocks';
import type { FootprintState } from '../footprints';

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
  /** Blocks parked on the lines: hop over or route around (engine/blocks.ts). */
  blocks?: BlockState | null;
  /** Tracks from the accounts that voted or replied this round (engine/footprints.ts). */
  footprints?: FootprintState | null;
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
  /** The keep: whether the Emperor's hoard has been set loose this round (engine/keep.ts). */
  keep?: KeepState | null;
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
