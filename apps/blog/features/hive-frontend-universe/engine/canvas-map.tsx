'use client';

/**
 * Hive Frontend Universe — the stage.
 *
 * Loads the board (cache-first, untouched), builds the world (mesh woven
 * around the permanent field landmarks, rim worlds on the edge), then runs
 * the frame loop: input, movement along the wobbled lines, operation flows
 * painted from the window's real counts, scenery, camera, draw.
 *
 * MAP is one button, two gestures: HOLD to peek at the whole world and snap
 * back on release; TAP to open the full travel map, which stays open — pick
 * a fixed landmark and the bug warps there (position stays edge + t, so the
 * map and the world can never disagree about where the bug is). Posts cannot
 * be travelled to this way, only fixed places.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@/blog/i18n/client';
import { useUserClient } from '@smart-signer/lib/auth/use-user-client';
import { useBoard } from '../hooks/use-board';
import { useCommunities } from '../hooks/use-communities';
import { useWitnesses } from '../hooks/use-witnesses';
import { GAME_MODES, formatCountdown, modeHasConsequences, msToNextRound, type GameMode } from '../lib/modes';
import { WelcomeRoom } from '../card/welcome-room';
import { ModeChip } from '../card/mode-chip';
import { PlayerDashboard, type DashboardRow } from '../card/player-dashboard';
import {
  FLIP_LANDMARK_ID,
  FLIP_SECONDS,
  flipView,
  otherSide,
  sideAt,
  sideFlipX,
  type BoardSide,
  type FlipState
} from '../lib/board-side';
import { HFU_COPY } from '../lib/strings';
import { MAP_FIT, placeWitnesses, towerLean, towerPoint } from '../lib/planet';
import { TIERS, windowStartFor, type Board } from '../lib/board';
import {
  LANDMARKS,
  LANDMARK_ACCOUNTS,
  TROLL_HOLES,
  ARCADE_GAMES,
  DAPP_DIRECTORY,
  ROSE_WINDOW_PANES
} from '../lib/fixed-world';
import { mulberry32 } from '../lib/mesh';
import { getStorageItem, setStorageItem, StorageTTL } from '@ui/lib/storage-with-ttl';
import { buildRoutes, buildNewbieTrail, POST_LINE_ID, DAPPS_LINE_ID } from '../lib/routes';
import {
  landmarkHref,
  profileHref,
  communityHref,
  postHref,
  type MapTarget,
  type TargetKind
} from '../lib/targets';
import { buildWorld, type GameWorld } from './world';
import { createCritters, updateCritters, type CritterState } from './critters';
import { createCoins, updateCoins, type CoinState } from './coins';
import { createHelmets, updateHelmets, o2Multiplier, HELMET_TOTAL, type HelmetState } from './helmets';
import {
  createHazards,
  updateHazards,
  hazardHolds,
  fightWrap,
  GOO_SLOW,
  type HazardState
} from './hazards';
import { createGems, updateGems, type GemState } from './gems';
import { createRace, takeVote, deliverVotes, dropVotes, type RaceState } from './dhf-race';
import { gridCellName } from './render';
import { createProjectiles, updateProjectiles, playerFire, type ProjectileState } from './projectiles';
import { createCombat, tickCombat, MAX_HITS, type CombatState } from './combat';
import { buildGround } from './ground';
import { requestAvatar, avatarStats } from './avatars';
import { getUserAvatarUrl } from '@ui/lib/avatar-utils';
import { FERRIS_SPIN, rosePaneCentre } from './icons';
import {
  createPlayer,
  driftUpdate,
  jump,
  placeAt,
  railUpdate,
  MOVE,
  type PlayerState,
  type Vec2
} from './movement';
import {
  drawScene,
  PALETTE,
  type Camera,
  type CommunityVisual,
  type HouseVisual,
  type LandmarkVisual,
  type RouteLayer,
  type TrafficMarker,
  type WitnessVisual,
  BIG_SIZE
} from './render';
import { placeFactories, placeCubes, placeFormations } from './scenery';
import { createFlows, updateFlows, flowConfig, type FlowState } from './particles';
import { Controls } from './controls';
import { HouseCard } from '../card/house-card';
import { LandmarkPanel } from '../card/landmark-panel';
import type { TopCommunity } from '../data/fetch-communities';

const MAX_TRAFFIC = 30;
/** Presses shorter than this are taps (keyboard M mirror of the button). */
const TAP_MS = 250;

/** Panel accent per landmark category, matching the map's colour language. */
const CATEGORY_ACCENT: Record<string, string> = {
  tool: 'cyan',
  dapp: 'amber',
  governance: 'violet',
  info: 'emerald',
  arcade: 'rose',
  social: 'cyan'
};

const CanvasMap = () => {
  // THE ROUND CLOCK. The board is keyed by the round (window) start, which
  // used to be computed only at render time, so a bug parked across a round
  // change kept the old world. This once-a-second check re-renders exactly
  // when the round rolls over: the next board loads and the Stage below
  // remounts (keyed by round) with the welcome up again.
  const [roundStart, setRoundStart] = useState(() => windowStartFor(Date.now()));
  useEffect(() => {
    const id = window.setInterval(() => {
      const ws = windowStartFor(Date.now());
      setRoundStart((prev) => (prev === ws ? prev : ws));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);
  const { data: board, isLoading, isError } = useBoard(roundStart);

  if (isLoading) return <Centered>{HFU_COPY.loadingBoard}</Centered>;
  if (isError || !board) return <Centered>{HFU_COPY.loadError}</Centered>;
  return <Stage key={board.windowStart} board={board} />;
};

const Centered = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-full w-full items-center justify-center bg-[#04030a] p-6 text-center text-sm text-[#8fa6b4]">
    {children}
  </div>
);

const Stage = ({ board }: { board: Board }) => {
  const { t } = useTranslation('common_blog');
  const { data: communities } = useCommunities();
  const { data: witnesses } = useWitnesses();
  // The signed-in player's avatar RIDES the bug (Bryan's mount design):
  // any signed-in account is detected here and its own profile image rides.
  // Read through a REF inside the frame loop, never the hook state: the
  // loop's closure is created before the auth state finishes hydrating, so
  // a direct capture stays undefined forever and the rider never gets a
  // face (the same trap that once made every community bubble unclickable,
  // and it bit again in Bryan's first rider playtest).
  const { user } = useUserClient();
  const playerHandle = user?.isLoggedIn ? user.username : undefined;
  const playerHandleRef = useRef(playerHandle);
  playerHandleRef.current = playerHandle;
  useEffect(() => {
    if (playerHandle) requestAvatar(playerHandle);
  }, [playerHandle]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [atNode, setAtNode] = useState(-1);
  // THE MODE (Bryan, 2026-09-06): null until the player answers the welcome.
  // The frame loop reads the ref. Explore has no consequences; the others
  // keep the setback. What each mode holds grows in later tickets.
  const [mode, setMode] = useState<GameMode | null>(null);
  /** Which side of the board is up. The ref drives the frame loop, the
   *  state drives the panels. */
  const sideRef = useRef<BoardSide>('hive');
  const [side, setSide] = useState<BoardSide>('hive');
  /** The turn in progress, or null when the board is at rest. */
  const flipRef = useRef<FlipState | null>(null);
  /** The pop-up dashboard's rows while it is open; null when closed. */
  const [dashRows, setDashRows] = useState<DashboardRow[] | null>(null);
  const dashOpenRef = useRef(false);
  const modeRef = useRef<GameMode | null>(null);
  modeRef.current = mode;
  const pickMode = (m: GameMode) => {
    setMode(m);
    wrapRef.current?.focus();
  };
  const reopenWelcome = () => setMode(null);
  /** A house opened by clicking/tapping its marker (bigger than the marker). */
  const [clickedNode, setClickedNode] = useState(-1);
  const [fullMap, setFullMap] = useState(false);
  /** Slot of the community bubble the bug is standing in, or -1 for none. */
  const [inCommunity, setInCommunity] = useState(-1);
  /** The thing under the cursor, named in a chip since nothing is lettered. */
  const [hover, setHover] = useState<{ title: string; kind: TargetKind; sx: number; sy: number } | null>(null);
  /** A clicked or beam-visited witness citadel, which has no world node. */
  const [clickedWitness, setClickedWitness] = useState<{
    title: string;
    href: string | null;
    /** Real chain stats, shown after a beam visit reaches the crown. */
    stats?: { label: string; value: string }[];
  } | null>(null);

  const world: GameWorld = useMemo(
    () => buildWorld(board.windowStart, board.houses.length),
    [board]
  );
  // The routes seam: named edge-id lists riding ON the mesh, no new geometry.
  const routes = useMemo(() => buildRoutes(world), [world]);
  /**
   * THE NEWB TRAIL QUEST (Bryan's order): the REAL posts in this window
   * written by newcomers, found by the board's own isNewcomer flag. Visit
   * every one before the window turns and a gem lands in your pocket, to
   * carry to the DHF ferris wheel like any other gem.
   */
  const newbieNodes = useMemo(() => {
    const s = new Set<number>();
    for (const n of world.nodes) {
      if (n.kind === 'house' && board.houses[n.ref]?.isNewcomer) s.add(n.id);
    }
    return s;
  }, [world, board]);
  const newbieTrail = useMemo(
    () => buildNewbieTrail(world, Array.from(newbieNodes)),
    [world, newbieNodes]
  );
  // The transit map: the flagship post line laid first and solid, then the
  // dApps line dashed on top so shared track reads as two services rather
  // than as one line hiding the other.
  const routeLayers: RouteLayer[] = useMemo(() => {
    const byId = (id: string) => new Set(routes.find((r) => r.id === id)?.edgeIds ?? []);
    return [
      {
        edges: byId(POST_LINE_ID),
        casing: '#1a0d05',
        glow: PALETTE.routeGlow,
        core: PALETTE.route,
        // 1.3x the cyan line, per Bryan's proportion ruling: first place
        // by a step, not a shout (was 9.2, which read close to 1.75x).
        width: 8.1,
        spark: '#fff3c0'
      },
      {
        edges: byId(DAPPS_LINE_ID),
        casing: '#04141c',
        glow: PALETTE.dappsGlow,
        core: PALETTE.dapps,
        width: 6.2,
        dash: [30, 22],
        spark: '#e6fcff'
      },
      // THE NEWB TRAIL: hot pink, dashed, on top of everything, so the
      // quest road reads instantly as "this one is special". Empty when
      // the window has fewer than two newcomer posts.
      {
        edges: new Set(newbieTrail.edgeIds),
        casing: '#2b0620',
        glow: '#ff9ee8',
        core: '#ff5fd0',
        width: 5.4,
        dash: [18, 15],
        spark: '#ffe4f6'
      }
    ];
  }, [routes, newbieTrail]);
  // The ground: filled landmasses, built ONCE per window and then only filled.
  const ground = useMemo(() => buildGround(board.windowStart), [board.windowStart]);

  const houseVisuals: (HouseVisual | undefined)[] = useMemo(
    () =>
      board.houses.map((h) => ({
        tier: h.tier,
        isNewcomer: h.isNewcomer,
        bubble: h.bubble,
        glow: h.glow,
        handle: h.handle
      })),
    [board]
  );
  const landmarkVisuals: LandmarkVisual[] = useMemo(
    () =>
      LANDMARKS.map((lm) => ({
        label: t(lm.labelKey),
        category: lm.category,
        icon: lm.icon,
        big: lm.big,
        handle: LANDMARK_ACCOUNTS[lm.id],
        site: lm.kind === 'internal' || lm.kind === 'wallet',
        raceGoal: lm.id === 'proposals'
      })),
    [t]
  );
  // The Rose Window's pane labels, translated once; the renderer letters
  // each pane with its own words at play zoom.
  const roseLabels = useMemo(() => ROSE_WINDOW_PANES.map((pane) => t(pane.labelKey)), [t]);
  const communityVisuals: (CommunityVisual | undefined)[] = useMemo(() => {
    const list: (CommunityVisual | undefined)[] = Array.from({ length: 10 }, () => undefined);
    if (!communities) return list;
    const maxSubs = Math.max(1, ...communities.map((c) => c.subscribers));
    communities.forEach((c, i) => {
      if (i < 10) {
        list[i] = { label: c.title, radius: 170 + Math.sqrt(c.subscribers / maxSubs) * 260, handle: c.name };
      }
    });
    return list;
  }, [communities]);
  // The citadel ring: the real top 21, placed on their fixed posts in rank
  // order. Their avatars are requested eagerly rather than by proximity,
  // because the ring is meant to read from the pulled-out map and the player
  // may never walk out to it.
  const witnessVisuals: WitnessVisual[] = useMemo(() => {
    if (!witnesses?.length) return [];
    // Every tower with its own space on the map (lib/planet.ts): Bryan's
    // named placements first, the ring formula for the rest.
    const posts = placeWitnesses(witnesses.map((w) => w.name));
    return witnesses.map((w, i) => {
      const x = posts[i].x;
      const y = posts[i].y;
      // THE TRACTOR LANE. The first beam grabbed within 260px of the base,
      // which physics proved unreachable for 14 of the 21 citadels (the ring
      // stands 1000-2200px off the coast; a bare jump dies first). The lane
      // aims from the base AT the nearest rail node and stops 300px short of
      // it, so from that node one ordinary jump into the light always
      // connects, for every citadel, with zero helmets.
      let nx = 0;
      let ny = 0;
      let bestD = Infinity;
      for (const n of world.nodes) {
        const d = Math.hypot(n.x - x, n.y - y);
        if (d < bestD) {
          bestD = d;
          nx = n.x;
          ny = n.y;
        }
      }
      const len = Math.max(400, bestD - 300);
      const laneX = x + ((nx - x) / bestD) * len;
      const laneY = y + ((ny - y) / bestD) * len;
      return { name: w.name, rank: w.rank, x, y, laneX, laneY };
    });
  }, [witnesses, world]);
  useEffect(() => {
    for (const w of witnessVisuals) requestAvatar(w.name);
    // The dApp station's window logos, eagerly: the station is a big landmark
    // meant to read from the map, so its faces load like the witnesses' do.
    for (const d of DAPP_DIRECTORY) {
      if (d.account) requestAvatar(d.account);
    }
  }, [witnessVisuals]);

  // Read through a REF inside the frame loop, never the query state: the
  // loop's closure is created before the witnesses query resolves (the same
  // trap that once made every community bubble unclickable).
  const witnessDataRef = useRef(witnesses);
  witnessDataRef.current = witnesses;

  // State-to-ref mirror so the frame loop can see whether the witness card
  // is open without touching React state mid-frame.
  useEffect(() => {
    witnessCardOpenRef.current = clickedWitness !== null;
  }, [clickedWitness]);

  /**
   * The witness stats rows for the citadel cards (beam visits AND clicks).
   * Real current numbers from the same get_witnesses_by_vote call that ranks
   * the ring, including the chain parameters this witness actually votes for
   * (Bryan: "more useful true and current info on those cards").
   */
  const witnessStats = (name: string): { label: string; value: string }[] => {
    const w = witnessDataRef.current?.find((x) => x.name === name);
    if (!w) return [];
    return [
      { label: t('hive_frontend_universe.witness.votes'), value: w.votesHp },
      { label: t('hive_frontend_universe.witness.hbd_apr'), value: w.hbdApr },
      { label: t('hive_frontend_universe.witness.price_feed'), value: w.priceFeed },
      { label: t('hive_frontend_universe.witness.creation_fee'), value: w.creationFee },
      { label: t('hive_frontend_universe.witness.block_size'), value: w.blockSize },
      { label: t('hive_frontend_universe.witness.version'), value: w.version || '?' },
      {
        label: t('hive_frontend_universe.witness.last_block'),
        value: w.lastBlock ? `#${w.lastBlock.toLocaleString()}` : '?'
      },
      { label: t('hive_frontend_universe.witness.missed'), value: String(w.missed) },
      { label: t('hive_frontend_universe.witness.since'), value: w.since }
    ];
  };

  // The frame loop lives in an effect keyed on the world; the communities and
  // witnesses queries can resolve later, so the loop reads them through refs.
  const communityVisualsRef = useRef(communityVisuals);
  communityVisualsRef.current = communityVisuals;
  const witnessVisualsRef = useRef(witnessVisuals);
  witnessVisualsRef.current = witnessVisuals;

  // Engine state in refs so the loop never re-creates it.
  const playerRef = useRef<PlayerState>(createPlayer());
  const camRef = useRef<Camera>({ x: 0, y: 0, z: 0.6 });
  const inputRef = useRef<Vec2>({ x: 0, y: 0 });
  const stickRef = useRef<Vec2>({ x: 0, y: 0 });
  /** On the back of the board the view is mirrored, so left is right: the
   *  steering is mirrored to match. Movement itself never knows. */
  const mirroredInputRef = useRef<Vec2>({ x: 0, y: 0 });
  const steer = (): Vec2 => {
    if (sideRef.current !== 'steem') return inputRef.current;
    mirroredInputRef.current.x = -inputRef.current.x;
    mirroredInputRef.current.y = inputRef.current.y;
    return mirroredInputRef.current;
  };
  /** The resting view mirror for pointer maths: 1 front, -1 back. */
  const viewFlipX = () => sideFlipX(sideRef.current);
  const keysRef = useRef<Record<string, boolean>>({});
  const mapHeldRef = useRef(false);
  const fullMapRef = useRef(false);
  const warpFxRef = useRef(0);
  const trafficRef = useRef<TrafficMarker[]>([]);
  const flowsRef = useRef<FlowState | null>(null);
  const crittersRef = useRef<CritterState | null>(null);
  const coinsRef = useRef<CoinState | null>(null);
  const helmetsRef = useRef<HelmetState | null>(null);
  /**
   * The current RIDE: cosmetic transport that never touches the player's
   * edge-plus-fraction state. 'wheel' orbits the DHF ferris (a full rotation
   * earns a breath of spare air); 'beam' lifts the bug up a witness citadel,
   * opens the witness's card at the crown, then rides it back DOWN and hands
   * back the drift with the air topped up. A round trip, never a yank home.
   */
  const rideRef = useRef<
    | { type: 'wheel'; node: number; cx: number; cy: number; startAngle: number }
    | {
        type: 'beam';
        /** Where the lane caught the bug; the ride starts and ends here. */
        gx: number;
        gy: number;
        x: number;
        baseY: number;
        topY: number;
        /** Glide (grab point to base) and climb (base to crown) lengths. */
        glide: number;
        climb: number;
        /** Seconds for the full one-way trip, scaled to its length. */
        dur: number;
        t: number;
        /** 1 riding up, -1 riding back down. */
        dir: 1 | -1;
        met: boolean;
        name: string;
        title: string;
        href: string;
      }
    | null
  >(null);
  /** Re-armed by leaving the wheel, so one visit grants one ride. */
  const wheelArmedRef = useRef(true);
  /** Seconds before another beam can catch the bug, so visits stay chosen. */
  const beamCooldownRef = useRef(0);
  /** The nuisance hazards: goo, wrap, the sock trip. */
  const hazardsRef = useRef<HazardState | null>(null);
  /** Colorful collectible gems, reseeded every board. */
  const gemsRef = useRef<GemState | null>(null);
  /** The DHF race (adventure mode); rebuilt with every round. */
  const raceRef = useRef<RaceState | null>(null);
  /** Enemy and player shots in flight. */
  const projectilesRef = useRef<ProjectileState | null>(null);
  /** The bug's hit points; three hits sends it home. */
  const combatRef = useRef<CombatState | null>(null);
  /** Mirrors the clickedWitness React state for the frame loop: while the
   *  card is open the beam HOLDS the bug at the crown; Skip sends it home. */
  const witnessCardOpenRef = useRef(false);
  /** Trophies mounted on the ferris wheel this board (session only). */
  const wheelTrophiesRef = useRef<string[]>([]);
  /** Newcomer posts visited this board (the newb trail quest). Reset each
   *  window because the posts themselves turn over with the board. */
  const visitedNewbsRef = useRef<Set<number>>(new Set());
  /** The quest's gem is awarded exactly once per board. */
  const newbAwardedRef = useRef(false);
  /** The planning grid overlay, toggled with G. ON by default while the
   *  game is in active build direction (Bryan's call); G hides it for
   *  recordings. */
  const gridRef = useRef(true);
  /** The grid box under the cursor; its label draws BIG (bad-eyes rule). */
  const hoverGridRef = useRef<{ ci: number; ri: number } | null>(null);
  /** Communities the player has stood in, persisted like PLACES. */
  const visitedCommunitiesRef = useRef<Set<string> | null>(null);
  const atNodeTick = useRef(-1);
  const inCommunityTick = useRef(-1);
  const mKeyDownAt = useRef(0);

  /**
   * THE BUZZING STATION: one landmark a day pays double tokens. Picked from
   * the UTC day number alone, no backend: every player sees the same pick,
   * and tomorrow it moves. The trap and the endgame are excluded; the buzz
   * is an invitation, not an ambush.
   */
  const buzz = useMemo(() => {
    const eligible = LANDMARKS.map((lm, i) => ({ lm, i })).filter(
      ({ lm }) => lm.id !== 'json_keep' && lm.id !== 'mount_socko'
    );
    const day = Math.floor(Date.now() / 86400000);
    const pick = eligible[Math.floor(mulberry32((day ^ 0xb22e) | 0)() * eligible.length)];
    const node = world.landmarkNodeByIndex[pick.i] ?? -1;
    if (node < 0) return null;
    const n = world.nodes[node];
    return { x: n.x, y: n.y, r: 1100, landmarkId: pick.lm.id };
  }, [world]);

  /** Named places visited, persisted forever: the map-completion loop. */
  const visitedRef = useRef<Set<string> | null>(null);

  const factories = useMemo(() => placeFactories(world, board.windowStart), [world, board.windowStart]);
  const cubes = useMemo(() => placeCubes(world, board.windowStart), [world, board.windowStart]);
  const formations = useMemo(() => placeFormations(world, board.windowStart), [world, board.windowStart]);
  const flowCfg = useMemo(() => flowConfig(board.counts), [board.counts]);

  /**
   * The oxygen suit. Applied AFTER the ordinary jump so movement.ts stays
   * untouched: the jump grants its usual one ring of fuel and the suit tops
   * it up to o2Multiplier() rings' worth.
   */
  const hopWithO2 = () => {
    const p = playerRef.current;
    // A jump mid-ride: hop OUT of a ferris basket early (no breath earned);
    // during a beam the light has you, the jump does nothing.
    const rd = rideRef.current;
    if (rd) {
      if (rd.type === 'wheel') {
        rideRef.current = null;
        placeAt(p, world.edges, world.incident, rd.node);
      }
      return;
    }
    // A jump while pasta-wrapped tears at the noodles instead of jumping.
    if (hazardsRef.current && fightWrap(hazardsRef.current)) return;
    jump(p, world.edges, steer());
    if (p.mode === 'drift') {
      const suit = helmetsRef.current;
      let rings = o2Multiplier(suit?.count ?? 0);
      // A breath of spare air (earned on the ferris wheel) is a whole extra
      // ring, spent on this one jump.
      if (suit && suit.spareAir > 0) {
        suit.spareAir--;
        rings += 1;
      }
      p.fuel = MOVE.DRIFT_TIME * rings;
    }
  };

  /** The bug fires in its travel direction, one carried token per shot. */
  const firePlayerShot = () => {
    if (!projectilesRef.current || !coinsRef.current) return;
    playerFire(projectilesRef.current, playerRef.current, coinsRef.current);
  };

  const toggleFullMap = () => {
    fullMapRef.current = !fullMapRef.current;
    setFullMap(fullMapRef.current);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const p = playerRef.current;
    const { edges, incident, nodes } = world;
    flowsRef.current = createFlows(world);
    crittersRef.current = createCritters(world, board.windowStart);
    // Tokens minted from the window's REAL custom_json count.
    coinsRef.current = createCoins(world, board.counts.customJson, board.windowStart);
    helmetsRef.current = createHelmets();
    hazardsRef.current = createHazards(crittersRef.current.critters.length);
    gemsRef.current = createGems(world, board.windowStart);
    raceRef.current = createRace(board.houses.map((h) => h.tier));
    projectilesRef.current = createProjectiles();
    combatRef.current = createCombat();
    // The newb trail resets with the board: new window, new posts, new quest.
    visitedNewbsRef.current = new Set();
    newbAwardedRef.current = false;
    if (!visitedRef.current) {
      visitedRef.current = new Set(getStorageItem<string[]>('hfu-visited') ?? []);
    }
    if (!visitedCommunitiesRef.current) {
      visitedCommunitiesRef.current = new Set(getStorageItem<string[]>('hfu-visited-communities') ?? []);
    }

    // Spawn just inside the mesh beside the Basecamp landmark.
    const basecampIdx = LANDMARKS.findIndex((lm) => lm.id === 'basecamp');
    const basecampNode = world.landmarkNodeByIndex[basecampIdx] ?? 0;
    const firstEdge = incident[basecampNode][0];
    const startNode =
      firstEdge !== undefined
        ? edges[firstEdge].a === basecampNode
          ? edges[firstEdge].b
          : edges[firstEdge].a
        : basecampNode;
    placeAt(p, edges, incident, startNode);
    p.skipped = startNode;
    camRef.current.x = p.x;
    camRef.current.y = p.y;

    let W = 0;
    let H = 0;
    let DPR = 1;
    const resize = () => {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = wrap.clientWidth;
      H = wrap.clientHeight;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // True when the key press belongs to something that legitimately wants
    // typing (the site search box, a comment field). The game never steals
    // keys from those.
    const typingTarget = (e: KeyboardEvent): boolean => {
      const el = e.target as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
    };
    const GAME_KEYS = new Set([
      'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ',
      'w', 'a', 's', 'd', 'm', 'g', 'x', 'z', 'f', 'i'
    ]);
    const onKeyDown = (e: KeyboardEvent) => {
      if (typingTarget(e)) return;
      const k = e.key.toLowerCase();
      // CLAIM the game keys outright (Bryan's son's playtest: the arrow
      // keys were ALSO driving the Basecamp tab bar, because the focused
      // H.I.V.E.R. tab treats arrows as tab navigation). These listeners
      // run in the CAPTURE phase now, so stopping propagation here means
      // the tabs, the page scroll and everything else never see them
      // while the game is mounted.
      if (GAME_KEYS.has(k) || k === 'escape') {
        e.preventDefault();
        e.stopPropagation();
      }
      if (k === 'm' && !keysRef.current[k]) {
        mKeyDownAt.current = Date.now();
        mapHeldRef.current = true; // hold to peek…
      }
      // The planning grid: a directing tool ("put it at G-17"), one key to
      // show, the same key to hide before recording a demo.
      if (k === 'g' && !keysRef.current[k]) {
        gridRef.current = !gridRef.current;
      }
      // FIRE: once per press, not on key-repeat; a held F is not a machine gun.
      if (k === 'f' && !keysRef.current[k] && !fullMapRef.current) firePlayerShot();
      // THE DASHBOARD: one key to open, the same key to close.
      if (k === 'i' && !keysRef.current[k]) toggleDashboard();
      keysRef.current[k] = true;
      if ((k === ' ' || k === 'z') && !fullMapRef.current) hopWithO2();
      if (k === 'escape' && fullMapRef.current) {
        fullMapRef.current = false;
        setFullMap(false);
        return;
      }
      if ((k === 'x' || k === 'escape') && p.atNode >= 0) {
        p.skipped = p.atNode;
        p.atNode = -1;
        p.still = 0;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (typingTarget(e)) return;
      const k = e.key.toLowerCase();
      if (GAME_KEYS.has(k)) e.stopPropagation();
      keysRef.current[k] = false;
      if (k === 'm') {
        mapHeldRef.current = false;
        // …release quickly and it was a tap: toggle the full travel map.
        if (Date.now() - mKeyDownAt.current < TAP_MS) {
          fullMapRef.current = !fullMapRef.current;
          setFullMap(fullMapRef.current);
        }
      }
    };
    // CAPTURE phase, so the game's keys are claimed before the tab bar's
    // roving-focus handler (or anything else) can act on them.
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    // Seamless start: entering the game steals focus from the H.I.V.E.R.
    // tab button immediately, so the first arrow press moves the bug, not
    // the tab selection. Clicking back into the game re-arms it too.
    wrap.focus({ preventScroll: true });
    const refocus = () => wrap.focus({ preventScroll: true });
    wrap.addEventListener('pointerdown', refocus);

    /**
     * What is under the cursor. Nothing on the map is lettered any more, so
     * this one hit test feeds BOTH the hover chip that names things and the
     * click that jumps to them. Radii are generous on purpose: these are the
     * only way to read the map now.
     */
    const targetAt = (clientX: number, clientY: number): MapTarget | null => {
      const rect = canvas.getBoundingClientRect();
      const cam = camRef.current;
      const wx = (clientX - rect.left - W / 2) / (cam.z * viewFlipX()) + cam.x;
      const wy = (clientY - rect.top - H / 2) / cam.z + cam.y;
      const z = cam.z;
      let best: MapTarget | null = null;
      let bestD = Infinity;
      const consider = (target: MapTarget, radius: number) => {
        const d = Math.hypot(target.x - wx, target.y - wy);
        if (d < radius && d < bestD) {
          bestD = d;
          best = target;
        }
      };

      // Posts: the hit target is over twice the visual marker with a floor,
      // because "half again" was still too hard to hit in real play.
      const rNode = Math.min(17 / Math.max(z, 0.35), 180);
      for (const n of nodes) {
        if (n.kind !== 'house') continue;
        const h = houseVisuals[n.ref];
        const post = board.houses[n.ref];
        if (!h || !post) continue;
        consider(
          {
            kind: 'post',
            node: n.id,
            title: `@${h.handle}`,
            href: postHref(post.post?.url, post.post?.author ?? h.handle, post.post?.permlink ?? ''),
            travelable: false,
            x: n.x,
            y: n.y
          },
          Math.max(rNode * 2.6, 90)
        );
      }

      // Places.
      for (const n of nodes) {
        if (n.kind !== 'landmark') continue;
        const lm = LANDMARKS[n.ref];
        const vis = landmarkVisuals[n.ref];
        if (!lm || !vis) continue;
        const minor = lm.icon === 'doc' || lm.icon === 'docq';
        const reach = lm.big ? 520 : Math.max(((minor ? 34 : 52) / Math.max(z, 0.45)) * 2.2, 80);
        consider(
          {
            kind: 'landmark',
            node: n.id,
            title: vis.label,
            href: landmarkHref(lm.kind, lm.path),
            travelable: world.travelReachable[n.id],
            x: n.x,
            y: n.y
          },
          reach
        );
        // THE ROSE WINDOW'S PANES: each pane is its own clickable item at
        // play zoom (Bryan's order). Pane centres come from the same
        // exported geometry the drawing uses, so hit and glass agree. A pane
        // is closer to the cursor than the window's centre whenever the
        // cursor is on its glass, so panes win there and the oculus still
        // opens the whole window's panel.
        if (lm.id === 'rose_window' && z >= 0.3) {
          const mapn = Math.max(
            0,
            Math.min(1, (playZ() - z) / Math.max(playZ() - fitZ(), 0.001))
          );
          const paneR = (BIG_SIZE.rosewindow ?? 140) * (1 + mapn * 0.9) * 2.2;
          for (let k = 0; k < ROSE_WINDOW_PANES.length; k++) {
            const pane = ROSE_WINDOW_PANES[k];
            const pc = rosePaneCentre(k, ROSE_WINDOW_PANES.length, paneR);
            consider(
              {
                kind: 'witness',
                node: -1,
                title: t(pane.labelKey),
                href: landmarkHref(pane.kind, pane.path),
                travelable: false,
                x: n.x + pc.x,
                y: n.y + pc.y
              },
              // Matches the honeycomb cell radius (0.215R), so the whole
              // comb cell is clickable, not just its heart.
              paneR * 0.2
            );
          }
        }
      }

      // Community bubbles: the whole bubble is the target, plus a margin.
      //
      // Read through the REF, never the query state: this closure is created
      // once per world, before the communities query resolves, so the state
      // variable in here is permanently undefined. That exact mistake shipped
      // in pass ten and made every community bubble unhoverable and
      // unclickable. The ref carries the community's account handle too, so
      // nothing here needs the query state at all.
      for (const n of nodes) {
        if (n.kind !== 'community') continue;
        const c = communityVisualsRef.current[n.ref];
        if (!c) continue;
        consider(
          {
            kind: 'community',
            node: n.id,
            title: c.label,
            href: communityHref(c.handle),
            travelable: world.travelReachable[n.id],
            x: n.x,
            y: n.y
          },
          c.radius * 1.15
        );
      }

      // The population: every creature answers to a name on hover. Display
      // only; a critter is not a link, so clicking it does nothing.
      if (crittersRef.current) {
        for (const cr of crittersRef.current.critters) {
          consider(
            {
              kind: 'critter',
              node: -1,
              title: t(`hive_frontend_universe.critters.${cr.kind}`),
              href: null,
              travelable: false,
              x: cr.x,
              y: cr.y
            },
            80
          );
        }
      }

      // Witness citadels: scenery, so they have no node, but they still lead
      // somewhere real. Aim at the crowned head, which is where the eye goes.
      for (const wt of witnessVisualsRef.current) {
        const towerH = 1680 - (wt.rank - 1) * 22;
        // The head moves as the tower leans on the pulled-out map.
        const head = towerPoint(wt.x, wt.y, towerH * 0.87, towerLean(wt.x, wt.y, mapnessAt(z)));
        consider(
          {
            kind: 'witness',
            node: -1,
            title: `${wt.rank}. ${wt.name}`,
            href: profileHref(wt.name),
            account: wt.name,
            travelable: false,
            x: head.x,
            y: head.y
          },
          towerH * 0.45
        );
      }

      return best;
    };

    /**
     * One click handler for the whole world, at both zooms.
     *
     * On the FULL MAP a travelable place warps the bug there and opens its
     * panel on arrival, so one click gets you there and the next gets you to
     * the page. Anything that cannot be travelled to (a witness citadel is
     * scenery) opens its page directly, because there is nothing else it could
     * usefully do.
     *
     * At PLAY zoom a click opens the thing's panel rather than navigating,
     * because a stray click while riding should never throw you out of the
     * game.
     */
    const onCanvasClick = (e: MouseEvent) => {
      const target = targetAt(e.clientX, e.clientY);
      if (!target) {
        setClickedNode(-1);
        setClickedWitness(null);
        return;
      }
      if (fullMapRef.current && target.travelable && target.node >= 0) {
        placeAt(p, edges, incident, target.node);
        warpFxRef.current = 1;
        fullMapRef.current = false;
        setFullMap(false);
        setClickedNode(target.node);
        setClickedWitness(null);
        return;
      }
      if (target.kind === 'critter') {
        return; // named on hover, but not a destination
      }
      if (target.kind === 'witness') {
        // A clicked citadel gets the same real chain stats as a beam visit
        // (Bryan: more info on ALL the witness cards). Rose panes and the
        // ruins ride this same path with no account, so no stats.
        setClickedWitness({
          title: target.title,
          href: target.href,
          stats: target.account ? witnessStats(target.account) : undefined
        });
        setClickedNode(-1);
        if (fullMapRef.current && target.href) {
          window.open(target.href, '_blank', 'noopener,noreferrer');
        }
        return;
      }
      setClickedWitness(null);
      setClickedNode(target.node);
    };
    canvas.addEventListener('click', onCanvasClick);

    // Hover names the thing under the cursor, which is the only way to read
    // the map now that nothing is lettered.
    const onCanvasMove = (e: MouseEvent) => {
      const target = targetAt(e.clientX, e.clientY);
      canvas.style.cursor = target ? 'pointer' : 'default';
      const rect = canvas.getBoundingClientRect();
      // Which grid box the cursor is over, for the big hover label.
      if (gridRef.current) {
        const cam = camRef.current;
        const gwx = (e.clientX - rect.left - W / 2) / (cam.z * viewFlipX()) + cam.x;
        const gwy = (e.clientY - rect.top - H / 2) / cam.z + cam.y;
        const ci = Math.floor((gwx + 9100) / 700);
        const ri = Math.floor((gwy + 9100) / 700);
        hoverGridRef.current = ci >= 0 && ci < 26 && ri >= 0 && ri < 26 ? { ci, ri } : null;
      } else {
        hoverGridRef.current = null;
      }
      setHover(
        target
          ? {
              title: target.title,
              kind: target.kind,
              sx: e.clientX - rect.left,
              sy: e.clientY - rect.top
            }
          : null
      );
    };
    canvas.addEventListener('mousemove', onCanvasMove);
    const onCanvasLeave = () => {
      setHover(null);
      hoverGridRef.current = null;
    };
    canvas.addEventListener('mouseleave', onCanvasLeave);

    const readInput = () => {
      const keys = keysRef.current;
      let x = 0;
      let y = 0;
      if (keys['arrowleft'] || keys['a']) x -= 1;
      if (keys['arrowright'] || keys['d']) x += 1;
      if (keys['arrowup'] || keys['w']) y -= 1;
      if (keys['arrowdown'] || keys['s']) y += 1;
      const m = Math.hypot(x, y);
      if (m > 1) {
        x /= m;
        y /= m;
      }
      const stick = stickRef.current;
      if (Math.hypot(stick.x, stick.y) > 0.05) {
        x = stick.x;
        y = stick.y;
      }
      inputRef.current.x = x;
      inputRef.current.y = y;
    };

    const spawnTraffic = () => {
      const traffic = trafficRef.current;
      if (traffic.length >= MAX_TRAFFIC) return;
      const houseNodes = nodes.filter((n) => n.kind === 'house' && houseVisuals[n.ref]);
      if (!houseNodes.length) return;
      const hn = houseNodes[Math.floor(Math.random() * houseNodes.length)];
      const voters = board.houses[hn.ref]?.voters ?? [];
      if (!voters.length || !incident[hn.id].length) return;
      const edgeId = incident[hn.id][Math.floor(Math.random() * incident[hn.id].length)];
      const to = edges[edgeId].a === hn.id ? 0 : 1;
      traffic.push({
        edge: edgeId,
        from: 1 - to,
        to,
        t: 1 - to,
        life: 1.4 + Math.random() * 0.8,
        max: 2.2,
        handle: voters[Math.floor(Math.random() * voters.length)]
      });
    };
    const updateTraffic = (dt: number) => {
      const traffic = trafficRef.current;
      for (let i = traffic.length - 1; i >= 0; i--) {
        const m = traffic[i];
        m.life -= dt;
        m.t += (m.to - m.from) * dt * 0.45;
        const done = m.to > m.from ? m.t >= m.to : m.t <= m.to;
        if (m.life <= 0 || done) traffic.splice(i, 1);
      }
      if (Math.random() < dt * 14) spawnTraffic();
    };

    const playZ = () => (W >= 900 ? 0.6 : Math.max(0.42, W / 2100));
    // The fit must hold the whole ring with its towers leaning outward, and
    // a band under the hint at the top (lib/planet.ts).
    const fitZ = () => Math.min(W / (2 * MAP_FIT.halfW), H / (2 * MAP_FIT.halfH));
    /** 0 at play zoom, 1 on the pulled-out map, for a camera zoom. */
    const mapnessAt = (zc: number) =>
      Math.max(0, Math.min(1, (playZ() - zc) / Math.max(playZ() - fitZ(), 0.001)));

    // Lazy avatar loading: request faces as the player approaches, never all
    // at once, never blocking anything. Throttled well below frame rate.
    let avatarTick = 0;
    const requestNearbyAvatars = (dt: number) => {
      avatarTick -= dt;
      if (avatarTick > 0) return;
      avatarTick = 0.35;
      for (const n of nodes) {
        if (n.kind === 'house') {
          const h = houseVisuals[n.ref];
          if (h && Math.hypot(n.x - p.x, n.y - p.y) < 2000) requestAvatar(h.handle);
        } else if (n.kind === 'landmark') {
          const handle = LANDMARK_ACCOUNTS[LANDMARKS[n.ref]?.id];
          if (handle && Math.hypot(n.x - p.x, n.y - p.y) < 2400) requestAvatar(handle);
        } else if (n.kind === 'community') {
          const c = communityVisualsRef.current[n.ref];
          if (c && Math.hypot(n.x - p.x, n.y - p.y) < 2800) requestAvatar(c.handle);
        }
      }
    };

    // Where the bug is DRAWN while riding something (null when walking).
    // The camera follows this, not the parked physics position, so a beam
    // ride visibly travels up the tower instead of staring at the base.
    let overlayPos: Vec2 | null = null;
    const camUpdate = (dt: number) => {
      const cam = camRef.current;
      const out = mapHeldRef.current || fullMapRef.current;
      const targetZ = out ? fitZ() : playZ();
      const follow = overlayPos ?? p;
      const tx = out ? 0 : follow.x;
      const ty = out ? MAP_FIT.centreY : follow.y;
      const k = Math.min(1, dt * 10); // ~90% in a quarter second, both ways
      cam.z += (targetZ - cam.z) * k;
      cam.x += (tx - cam.x) * k;
      cam.y += (ty - cam.y) * k;
    };

    let raf = 0;
    let last = 0;
    let shake = 0;
    const frame = (ts: number) => {
      const dt = last ? Math.min(0.033, (ts - last) / 1000) : 0;
      last = ts;

      readInput();
      if (p.stuck > 0) p.stuck = Math.max(0, p.stuck - dt);
      const hz = hazardsRef.current;
      // The bug parks while the full travel map is open, hands itself over
      // while ANY ride has it (beam or wheel basket), and is HELD while a
      // sock envelops it or pasta wraps it. Slime never holds, it just makes
      // everything sticky: the movement integrator runs on slowed-down time,
      // movement.ts untouched.
      const riding = rideRef.current !== null;
      const hazardHeld = hz ? hazardHolds(hz) : false;
      if (!fullMapRef.current && !riding && !hazardHeld) {
        const pdt = hz && hz.gooT > 0 ? dt * GOO_SLOW : dt;
        if (p.mode === 'rail') {
          railUpdate(p, edges, incident, steer(), pdt);
        } else {
          const res = driftUpdate(p, edges, steer(), pdt);
          if (res.signalLost) {
            placeAt(p, edges, incident, p.lastNode);
            p.stuck = 1.4;
            shake = 12;
          }
        }
      }
      if (shake > 0) shake = Math.max(0, shake - dt * 40);
      if (warpFxRef.current > 0) warpFxRef.current = Math.max(0, warpFxRef.current - dt * 1.6);
      // THE FLIP: the board turns over; at the midpoint the side changes.
      let flipX = sideFlipX(sideRef.current);
      let flipSkew = 0;
      const flip = flipRef.current;
      if (flip) {
        flip.t = Math.min(1, flip.t + dt / FLIP_SECONDS);
        const view = flipView(flip);
        flipX = view.flipX;
        flipSkew = view.flipSkew;
        const showing = sideAt(flip);
        if (showing !== sideRef.current) {
          sideRef.current = showing;
          setSide(showing);
        }
        if (flip.t >= 1) {
          flipRef.current = null;
          flipX = sideFlipX(sideRef.current);
          flipSkew = 0;
        }
      }

      updateTraffic(dt);
      if (flowsRef.current) updateFlows(flowsRef.current, world, flowCfg, p.x, p.y, dt);
      // THE BACK OF THE BOARD is dead: no critters move, no shots fly, no
      // tokens or gems change hands. The bug alone still rides.
      const alive = sideRef.current === 'hive';
      if (alive && crittersRef.current) updateCritters(crittersRef.current, world, dt);
      if (alive && hz) {
        updateHazards(hz, p, crittersRef.current, dt);
        // The sock has closed around the bug: flash-post it to Mount Socko.
        // Not a death, a DELIVERY; the toll is the walk back.
        if (hz.tripped) {
          hz.tripped = false;
          const sockIdx = LANDMARKS.findIndex((lm) => lm.id === 'mount_socko');
          const sockNode = world.landmarkNodeByIndex[sockIdx] ?? -1;
          if (sockNode >= 0) {
            placeAt(p, edges, incident, sockNode);
            warpFxRef.current = 1;
          }
        }
      }
      // COMBAT: timers first, then shots fly and hits land. The third hit
      // sends the bug home to Basecamp, carried tokens dropped: not a death,
      // a setback, priced the same way the thieves already price risk.
      if (alive && combatRef.current) tickCombat(combatRef.current, dt);
      if (alive && projectilesRef.current && combatRef.current) {
        updateProjectiles(projectilesRef.current, p, crittersRef.current, combatRef.current, dt, ts / 1000);
        if (combatRef.current.respawned) {
          combatRef.current.respawned = false;
          // EXPLORE MODE has no consequences (Bryan): the hits clear and the
          // bug stays where it is. Every other mode pays the setback.
          if (!modeHasConsequences(modeRef.current)) {
            shake = 6;
          } else {
            if (coinsRef.current) coinsRef.current.carried = 0;
            if (raceRef.current) dropVotes(raceRef.current);
            const homeIdx = LANDMARKS.findIndex((lm) => lm.id === 'basecamp');
            const homeNode = world.landmarkNodeByIndex[homeIdx] ?? -1;
            if (homeNode >= 0) {
              placeAt(p, edges, incident, homeNode);
              warpFxRef.current = 1;
              p.stuck = 1.4;
              shake = 12;
            }
          }
        }
      }
      // The HUD is painted on the canvas every frame, so the token counts
      // need no React state to stay current.
      if (alive && coinsRef.current) updateCoins(coinsRef.current, p, crittersRef.current, factories, TROLL_HOLES, dt, buzz);
      if (alive && helmetsRef.current) updateHelmets(helmetsRef.current, p.x, p.y);
      if (alive && gemsRef.current) updateGems(gemsRef.current, p.x, p.y);
      requestNearbyAvatars(dt);
      camUpdate(dt);

      if (p.atNode !== atNodeTick.current) {
        atNodeTick.current = p.atNode;
        setAtNode(p.atNode);
        // Map completion: parking at a named place marks it visited, forever.
        const vn = p.atNode >= 0 ? nodes[p.atNode] : undefined;
        // THE NEWB TRAIL: parking at a newcomer's post checks it off; check
        // them ALL off before the window turns and a gem lands in the
        // pocket, ready to carry to the ferris wheel.
        if (vn?.kind === 'house' && newbieNodes.has(p.atNode)) {
          visitedNewbsRef.current.add(p.atNode);
          if (
            !newbAwardedRef.current &&
            newbieNodes.size > 0 &&
            visitedNewbsRef.current.size >= newbieNodes.size &&
            gemsRef.current
          ) {
            newbAwardedRef.current = true;
            gemsRef.current.collected++;
          }
        }
        // THE DHF RACE (adventure mode): parking at a house takes its vote,
        // weighted by real stake; parking at the DHF Fun Park delivers.
        if (raceRef.current && modeRef.current === 'adventure') {
          if (vn?.kind === 'house') {
            takeVote(raceRef.current, p.atNode, board.houses[vn.ref]?.tier ?? 0);
          } else if (vn?.kind === 'landmark' && LANDMARKS[vn.ref]?.id === 'proposals') {
            if (deliverVotes(raceRef.current)) warpFxRef.current = 1;
          }
        }
        // THE RUINS ARE THE DOOR: park there and the board turns over, from
        // either side. Not while a turn is already under way.
        if (vn?.kind === 'landmark' && LANDMARKS[vn.ref]?.id === FLIP_LANDMARK_ID && !flipRef.current) {
          flipRef.current = { t: 0, to: otherSide(sideRef.current) };
        }
        if (vn?.kind === 'landmark' && visitedRef.current) {
          const id = LANDMARKS[vn.ref]?.id;
          if (id && !visitedRef.current.has(id)) {
            visitedRef.current.add(id);
            setStorageItem('hfu-visited', Array.from(visitedRef.current), StorageTTL.PERMANENT);
          }
        }
        // Communities light up the same way (dim-until-visited grammar).
        if (vn?.kind === 'community' && visitedCommunitiesRef.current) {
          const ch = communityVisualsRef.current[vn.ref]?.handle;
          if (ch && !visitedCommunitiesRef.current.has(ch)) {
            visitedCommunitiesRef.current.add(ch);
            setStorageItem(
              'hfu-visited-communities',
              Array.from(visitedCommunitiesRef.current),
              StorageTTL.PERMANENT
            );
          }
        }
      }

      // ---- RIDES: cosmetic transport, physics untouched. ----
      const ferrisIdx = LANDMARKS.findIndex((lm) => lm.id === 'proposals');
      const ferrisNode = world.landmarkNodeByIndex[ferrisIdx] ?? -1;
      const wheelRadius = 330; // matches drawFerris: BIG s=150 drawn at R = s * 2.2
      let ride = rideRef.current;

      // Board the wheel by PROXIMITY, in any mode: ride or jump near the
      // wheel and a basket catches you. Bryan's playtest found the old
      // park-exactly-at-the-node rule never triggered in real play. Leaving
      // the area re-arms it, so one visit still means one ride.
      if (ferrisNode >= 0) {
        const fn = nodes[ferrisNode];
        const distWheel = Math.hypot(fn.x - p.x, fn.y - p.y);
        if (!ride && wheelArmedRef.current && !hazardHeld && distWheel < 430) {
          ride = { type: 'wheel', node: ferrisNode, cx: fn.x, cy: fn.y, startAngle: (ts / 1000) * FERRIS_SPIN };
          rideRef.current = ride;
          wheelArmedRef.current = false;
        }
        if (!rideRef.current && distWheel > 580) wheelArmedRef.current = true;
      }

      if (ride?.type === 'wheel') {
        const angle = (ts / 1000) * FERRIS_SPIN;
        if (angle - ride.startAngle >= Math.PI * 2) {
          // One full rotation: a breath of spare air, and the trophy
          // ceremony. ONE new mount per completed ride, from what the bug
          // is actually carrying: a helmet, then a gem, then a token.
          if (helmetsRef.current) {
            helmetsRef.current.spareAir++;
            helmetsRef.current.spareFlash = 1.2;
          }
          const mounted = wheelTrophiesRef.current;
          if (mounted.length < 8) {
            if ((helmetsRef.current?.count ?? 0) > 0 && !mounted.includes('helmet')) {
              mounted.push('helmet');
            } else if ((gemsRef.current?.collected ?? 0) > 0 && !mounted.includes('gem')) {
              mounted.push('gem');
            } else if ((coinsRef.current?.carried ?? 0) > 0 && !mounted.includes('token')) {
              mounted.push('token');
            }
          }
          placeAt(p, edges, incident, ride.node);
          rideRef.current = null;
        }
      }

      // THE TRACTOR LANE. A drifting bug anywhere along the pulsing lane
      // (base to lane end, 220px corridor) is caught. The old rule, 260px
      // around the base point itself, was proven unreachable for 14 of 21
      // citadels: the ring stands 1000-2200px off the coast and a bare
      // jump's air dies first. Now the light comes down to where the bug
      // can actually get.
      if (beamCooldownRef.current > 0) beamCooldownRef.current -= dt;
      if (!ride && p.mode === 'drift' && beamCooldownRef.current <= 0) {
        for (const wt of witnessVisualsRef.current) {
          if (wt.laneX === undefined || wt.laneY === undefined) continue;
          // Distance from the bug to the lane segment (base to lane end).
          const ax = wt.x;
          const ay = wt.y;
          const bx = wt.laneX;
          const by = wt.laneY;
          const abx = bx - ax;
          const aby = by - ay;
          const len2 = abx * abx + aby * aby;
          const u = Math.max(0, Math.min(1, ((p.x - ax) * abx + (p.y - ay) * aby) / len2));
          const cx = ax + abx * u;
          const cy = ay + aby * u;
          if (Math.hypot(p.x - cx, p.y - cy) > 220) continue;
          const towerH = 1680 - (wt.rank - 1) * 22;
          const glide = Math.hypot(cx - ax, cy - ay);
          const climb = towerH * 0.87;
          rideRef.current = {
            type: 'beam',
            gx: cx,
            gy: cy,
            x: wt.x,
            baseY: wt.y,
            topY: wt.y - climb,
            glide,
            climb,
            // Long lanes take longer, so the carry always reads as travel:
            // roughly 700px/s with a floor.
            dur: Math.max(1.6, (glide + climb) / 700),
            t: 0,
            dir: 1,
            met: false,
            name: wt.name,
            title: `${wt.rank}. ${wt.name}`,
            href: profileHref(wt.name)
          };
          break;
        }
      }
      // The beam is a ROUND TRIP: caught in the lane, glided to the base,
      // carried up to the crown where the witness card opens with their real
      // stats, a pause, then back down to the exact grab point, and the
      // drift resumes with the air topped up. The first version yanked the
      // bug home across the map instead, which read as dying.
      if (rideRef.current?.type === 'beam') {
        const beam = rideRef.current;
        if (beam.dir === 1 && beam.t >= 1) {
          if (!beam.met) {
            beam.met = true;
            witnessCardOpenRef.current = true;
            setClickedWitness({ title: beam.title, href: beam.href, stats: witnessStats(beam.name) });
          }
          // STAY at the crown as long as the card is open. Bryan's playtest
          // fix: the visit lasts until the player chooses Skip, and only
          // then does the beam carry them home.
          if (!witnessCardOpenRef.current) beam.dir = -1;
        } else {
          beam.t = Math.max(0, Math.min(1, beam.t + (dt / beam.dur) * beam.dir));
          if (beam.dir === -1 && beam.t <= 0) {
            rideRef.current = null;
            beamCooldownRef.current = 5;
            // Fresh air for the trip home: a visit costs nothing but time.
            if (p.mode === 'drift') {
              p.fuel = MOVE.DRIFT_TIME * o2Multiplier(helmetsRef.current?.count ?? 0);
            }
          }
        }
      }
      if (helmetsRef.current && helmetsRef.current.spareFlash > 0) {
        helmetsRef.current.spareFlash = Math.max(0, helmetsRef.current.spareFlash - dt);
      }
      overlayPos = (() => {
        const rd = rideRef.current;
        if (!rd) return null;
        if (rd.type === 'wheel') {
          const a = (ts / 1000) * FERRIS_SPIN;
          return {
            x: rd.cx + Math.cos(a) * wheelRadius,
            y: rd.cy + Math.sin(a) * wheelRadius + wheelRadius * 0.17
          };
        }
        // Piecewise beam path: glide along the lane to the base, then climb
        // the tower. One eased parameter covers the whole distance.
        const ease = rd.t * rd.t * (3 - 2 * rd.t);
        const d = ease * (rd.glide + rd.climb);
        if (d < rd.glide && rd.glide > 0) {
          const u = d / rd.glide;
          return { x: rd.gx + (rd.x - rd.gx) * u, y: rd.gy + (rd.baseY - rd.gy) * u };
        }
        const u = rd.climb > 0 ? (d - rd.glide) / rd.climb : 1;
        return { x: rd.x, y: rd.baseY + (rd.topY - rd.baseY) * u };
      })();

      // YOU ARE HERE: which community bubble the bug is standing in. Bubbles
      // overlap, so the SMALLEST containing one wins, which is the innermost.
      // Display only; it drives the banner and brightens that one bubble.
      let inside = -1;
      let innermost = Infinity;
      for (const n of nodes) {
        if (n.kind !== 'community') continue;
        const c = communityVisualsRef.current[n.ref];
        if (!c) continue;
        if (Math.hypot(n.x - p.x, n.y - p.y) > c.radius) continue;
        if (c.radius < innermost) {
          innermost = c.radius;
          inside = n.ref;
        }
      }
      if (inside !== inCommunityTick.current) {
        inCommunityTick.current = inside;
        setInCommunity(inside);
      }

      const mapness = mapnessAt(camRef.current.z);

      const d = new Date(board.windowStart);
      const drawT0 = performance.now();
      drawScene({
        ctx,
        W,
        H,
        DPR,
        cam: camRef.current,
        mapness,
        nodes,
        edges,
        houses: houseVisuals,
        landmarks: landmarkVisuals,
        roseLabels,
        newbieVisited: visitedNewbsRef.current,
        playerHandle: playerHandleRef.current,
        communities: communityVisualsRef.current,
        factories,
        cubes,
        formations,
        witnesses: witnessVisualsRef.current,
        flows: alive ? flowsRef.current?.particles ?? [] : [],
        traffic: alive ? trafficRef.current : [],
        routeLayers,
        critters: alive ? crittersRef.current : null,
        coins: alive ? coinsRef.current : null,
        helmetState: alive ? helmetsRef.current : null,
        rideOverlay: overlayPos,
        hazards: alive ? hazardsRef.current : null,
        projectiles: alive ? projectilesRef.current : null,
        combat: combatRef.current,
        gems: alive ? gemsRef.current : null,
        side: sideRef.current,
        flipX,
        flipSkew,
        visitedCommunities: visitedCommunitiesRef.current,
        wheelTrophies: wheelTrophiesRef.current,
        debugGrid: gridRef.current,
        hoverGridCell: hoverGridRef.current,
        buzz,
        mode: modeRef.current,
        race: raceRef.current,
        ground,
        activeCommunity: inCommunityTick.current,
        player: p,
        time: ts / 1000,
        tierColors: TIERS.map((tier) => tier.col),
        shake,
        warpFx: warpFxRef.current,
        hud: {
          helmetsLabel: t('hive_frontend_universe.hud.helmets'),
          helmets: helmetsRef.current?.count ?? 0,
          helmetTotal: HELMET_TOTAL,
          placesLabel: t('hive_frontend_universe.hud.places'),
          places: visitedRef.current?.size ?? 0,
          placesTotal: LANDMARKS.length,
          gemsLabel: t('hive_frontend_universe.hud.gems'),
          gems: gemsRef.current?.collected ?? 0,
          newbsLabel: t('hive_frontend_universe.hud.newbs'),
          newbs: visitedNewbsRef.current.size,
          newbsTotal: newbieNodes.size,
          tokensLabel: t('hive_frontend_universe.hud.tokens'),
          carried: coinsRef.current?.carried ?? 0,
          banked: coinsRef.current?.banked ?? 0,
          housesLabel: t('hive_frontend_universe.hud.houses'),
          windowLabel: t('hive_frontend_universe.hud.window'),
          housesCount: board.houses.length,
          windowTime: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
          roundLabel: t('hive_frontend_universe.hud.round'),
          roundLeft: formatCountdown(msToNextRound(Date.now())),
          modeLabel: modeRef.current
            ? t(GAME_MODES.find((gm) => gm.id === modeRef.current)?.labelKey ?? '')
            : undefined,
          votesLabel: modeRef.current === 'adventure' ? t('hive_frontend_universe.race.votes') : undefined,
          votes: raceRef.current?.carried ?? 0,
          votesLine: raceRef.current?.line ?? 0,
          fundedLabel: t('hive_frontend_universe.race.funded'),
          funded: raceRef.current?.funded ?? false,
          sideLabel:
            sideRef.current === 'steem'
              ? `${t('hive_frontend_universe.hud.side')} ${t('hive_frontend_universe.sides.steem')}`
              : undefined
        }
      });
      // Rolling frame-time meter, exposed on the debug handle (measured).
      frameAcc += performance.now() - drawT0;
      frameN++;
      if (frameN >= 60) {
        const dbg = (window as unknown as Record<string, unknown>).__hfuWorldStats as Record<string, unknown>;
        if (dbg) {
          dbg.frameAvgMs = Math.round((frameAcc / frameN) * 100) / 100;
          dbg.mapness = Math.round(mapness * 100) / 100;
          dbg.avatars = avatarStats();
          // The mode and the race, readable from the console while directing.
          dbg.mode = modeRef.current;
          dbg.race = raceRef.current;
          dbg.atNode = p.atNode;
        dbg.side = sideRef.current;
        }
        frameAcc = 0;
        frameN = 0;
      }
      raf = requestAnimationFrame(frame);
    };
    let frameAcc = 0;
    let frameN = 0;
    raf = requestAnimationFrame(frame);

    // Debug/verification handle: real, measured numbers.
    (window as unknown as Record<string, unknown>).__hfuWorldStats = {
      ...world.stats,
      cubes: cubes.length,
      factories: factories.length,
      counts: board.counts,
      routes: routes.map((r) => ({ id: r.id, ...r.stats })),
      critters: crittersRef.current?.counts
    };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      wrap.removeEventListener('pointerdown', refocus);
      canvas.removeEventListener('click', onCanvasClick);
      canvas.removeEventListener('mousemove', onCanvasMove);
      canvas.removeEventListener('mouseleave', onCanvasLeave);
    };
    // Visual arrays are read via closure each frame; the world identity is
    // what must rebuild the loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world, board, factories, cubes, formations, flowCfg, ground]);

  /**
   * THE DASHBOARD SNAPSHOT: every fact about the player the engine holds
   * today, as plain rows. Rough on purpose; which rows belong is the
   * question this pop-up exists to settle.
   */
  const snapshotDashboard = (): DashboardRow[] => {
    const k = 'hive_frontend_universe.dashboard';
    const p = playerRef.current;
    const modeDef = GAME_MODES.find((gm) => gm.id === modeRef.current);
    const race = raceRef.current;
    const rows: DashboardRow[] = [
      { label: t(`${k}.mode`), value: modeDef ? t(modeDef.labelKey) : '', accent: modeDef?.accent },
      { label: t(`${k}.round`), value: formatCountdown(msToNextRound(Date.now())) },
      { label: t(`${k}.side`), value: t(`${k}.${sideRef.current === 'steem' ? 'back' : 'front'}`) },
      { label: t(`${k}.where`), value: gridCellName(p.x, p.y) },
      { label: t(`${k}.lives`), value: `${Math.max(0, MAX_HITS - (combatRef.current?.hits ?? 0))} / ${MAX_HITS}` },
      { label: t(`${k}.helmets`), value: `${helmetsRef.current?.count ?? 0} / ${HELMET_TOTAL}` },
      { label: t(`${k}.air`), value: String(helmetsRef.current?.spareAir ?? 0) },
      { label: t(`${k}.ammo`), value: String(coinsRef.current?.carried ?? 0) },
      { label: t(`${k}.banked`), value: String(coinsRef.current?.banked ?? 0) },
      { label: t(`${k}.stolen`), value: String(coinsRef.current?.drained ?? 0) },
      { label: t(`${k}.recovered`), value: String(coinsRef.current?.recovered ?? 0) },
      { label: t(`${k}.gems`), value: `${gemsRef.current?.collected ?? 0} / ${gemsRef.current?.gems.length ?? 0}` }
    ];
    if (modeRef.current === 'adventure' && race) {
      rows.push({ label: t(`${k}.votes`), value: `${race.carried} / ${race.line}`, accent: '#ffd24a' });
      rows.push({ label: t(`${k}.funded`), value: t(`${k}.${race.funded ? 'yes' : 'no'}`), accent: '#ffd24a' });
    }
    rows.push({
      label: t(`${k}.trophies`),
      value: wheelTrophiesRef.current.length ? wheelTrophiesRef.current.join(', ') : t(`${k}.none`)
    });
    rows.push({ label: t(`${k}.places`), value: `${visitedRef.current?.size ?? 0} / ${LANDMARKS.length}` });
    rows.push({
      label: t(`${k}.communities`),
      value: `${visitedCommunitiesRef.current?.size ?? 0} / ${communities?.length ?? 0}`
    });
    rows.push({ label: t(`${k}.newbs`), value: `${visitedNewbsRef.current.size} / ${newbieNodes.size}` });
    return rows;
  };
  const toggleDashboard = () => {
    dashOpenRef.current = !dashOpenRef.current;
    setDashRows(dashOpenRef.current ? snapshotDashboard() : null);
  };
  // While the dashboard is open its numbers keep up with the game.
  useEffect(() => {
    if (!dashRows) return;
    const id = window.setInterval(() => setDashRows(snapshotDashboard()), 500);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashRows !== null]);

  const skip = () => {
    const p = playerRef.current;
    if (p.atNode >= 0) {
      p.skipped = p.atNode;
      p.atNode = -1;
      p.still = 0;
    }
    setAtNode(-1);
    setClickedNode(-1);
    setClickedWitness(null);
  };

  // A clicked post marker wins over the parked-at node for the card.
  const shownNode = clickedNode >= 0 ? clickedNode : atNode;
  const node = shownNode >= 0 ? world.nodes[shownNode] : undefined;
  const atHouse = node?.kind === 'house' && board.houses[node.ref] ? board.houses[node.ref] : null;
  const atLandmark = node?.kind === 'landmark' ? LANDMARKS[node.ref] : null;
  const atCommunity: TopCommunity | null =
    node?.kind === 'community' && communities ? communities[node.ref] ?? null : null;
  /** The community the bug is standing in, for the "You are here" banner. */
  const insideCommunity: TopCommunity | null =
    inCommunity >= 0 && communities ? communities[inCommunity] ?? null : null;

  // One line of news on a landmark panel: the DHF race at the park in
  // adventure mode, else the day's buzzing station.
  const landmarkNote = (id: string): string | undefined => {
    const race = raceRef.current;
    if (id === FLIP_LANDMARK_ID) {
      return t(side === 'steem' ? 'hive_frontend_universe.panel.ruins_back' : 'hive_frontend_universe.panel.ruins_front');
    }
    if (id === 'proposals' && mode === 'adventure' && race) {
      if (race.funded) return t('hive_frontend_universe.panel.race_funded');
      return t('hive_frontend_universe.panel.race_short', { count: Math.max(0, race.line - race.carried) });
    }
    if (buzz && id === buzz.landmarkId) return t('hive_frontend_universe.panel.buzzing');
    return undefined;
  };

  return (
    <div
      ref={wrapRef}
      // Focusable (but not in the tab order) so mounting the game can pull
      // keyboard focus off the H.I.V.E.R. tab button and play starts
      // seamlessly. outline-none because the focus ring on the whole stage
      // read as a glitch.
      tabIndex={-1}
      className="relative h-full w-full select-none overflow-hidden bg-[#04030a] outline-none touch-none"
      data-testid="hfu-map"
    >
      <canvas ref={canvasRef} className="absolute inset-0 block" />

      {fullMap ? (
        <div className="pointer-events-none absolute inset-x-0 top-3 mx-auto w-fit rounded-full bg-black/50 px-4 py-1.5 font-mono text-xs text-[#8fd8e4]">
          {t('hive_frontend_universe.map.hint')}
        </div>
      ) : null}

      {/*
        YOU ARE HERE. When the bug is standing inside a community bubble, that
        community is named here with its real avatar. Innermost bubble wins;
        nothing shows when the bug is in none. Display only, no buttons.
      */}
      {!fullMap && insideCommunity ? (
        <div className="pointer-events-none absolute inset-x-0 top-3 mx-auto flex w-fit items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 font-mono text-xs text-[#bfe9ff]">
          {/* eslint-disable-next-line @next/next/no-img-element -- avatar via the app's own proxied avatar route */}
          <img
            src={getUserAvatarUrl(insideCommunity.name, 'small')}
            alt=""
            width={20}
            height={20}
            className="h-5 w-5 shrink-0 rounded-full bg-white/10 object-cover"
          />
          <span>{t('hive_frontend_universe.map.in_community', { name: insideCommunity.title })}</span>
        </div>
      ) : null}

      {/*
        THE HOVER CHIP. Nothing on the map is lettered any more, so this is
        how you read it: point at anything and it names itself. Display only,
        and it never eats a click.
      */}
      {hover ? (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-md border border-white/20 bg-black/85 px-2 py-1 font-mono text-xs font-semibold text-[#e9f4f8] shadow-lg"
          style={{ left: hover.sx, top: hover.sy - 12 }}
          data-testid="hfu-hover-chip"
        >
          {hover.title}
        </div>
      ) : null}

      {/*
        A clicked witness citadel. Citadels are scenery with no world node, so
        they get their own small panel rather than the landmark one.
      */}
      {clickedWitness ? (
        <LandmarkPanel
          title={clickedWitness.title}
          kind={clickedWitness.href ? 'external' : 'none'}
          path={clickedWitness.href ?? ''}
          accent="amber"
          stats={clickedWitness.stats}
          onSkip={() => setClickedWitness(null)}
        />
      ) : null}

      {!fullMap && atHouse ? <HouseCard house={atHouse} onSkip={skip} /> : null}
      {!fullMap && atLandmark ? (
        <LandmarkPanel
          title={t(atLandmark.labelKey)}
          kind={atLandmark.kind}
          path={atLandmark.path}
          accent={CATEGORY_ACCENT[atLandmark.category]}
          links={
            atLandmark.id === 'arcade'
              ? ARCADE_GAMES.map((g) => ({ label: g.name, href: g.url }))
              : atLandmark.id === 'our_dapps'
                ? DAPP_DIRECTORY.map((d) => ({ label: d.name, href: d.url }))
                : atLandmark.id === 'rose_window'
                  ? ROSE_WINDOW_PANES.map((pane) => ({
                      label: t(pane.labelKey),
                      href: landmarkHref(pane.kind, pane.path) ?? ''
                    })).filter((l) => l.href !== '')
                  : undefined
          }
          linksLabel={
            atLandmark.id === 'arcade'
              ? t('hive_frontend_universe.panel.real_games')
              : atLandmark.id === 'rose_window'
                ? t('hive_frontend_universe.panel.rose_window')
                : t('hive_frontend_universe.panel.dapps')
          }
          note={landmarkNote(atLandmark.id)}
          onSkip={skip}
        />
      ) : null}
      {!fullMap && atCommunity ? (
        <LandmarkPanel
          title={atCommunity.title}
          kind="internal"
          path={`/trending/${atCommunity.name}`}
          accent="cyan"
          onSkip={skip}
        />
      ) : null}

      {/* THE MODE CHIP, top right: mode name + round clock; tap to change. */}
      {mode ? <ModeChip mode={mode} onChange={reopenWelcome} /> : null}
      {mode ? (
        <button
          type="button"
          data-testid="hfu-dashboard-open"
          onClick={toggleDashboard}
          className="pointer-events-auto absolute right-3 top-12 z-20 rounded-full border border-[#5df0ff]/50 bg-black/60 px-3 py-1 font-mono text-[11px] font-bold text-[#5df0ff]"
        >
          {t('hive_frontend_universe.dashboard.open')}
        </button>
      ) : null}
      {dashRows ? (
        <PlayerDashboard title={t('hive_frontend_universe.dashboard.title')} rows={dashRows} onClose={toggleDashboard} />
      ) : null}

      {/* THE WELCOME AT BASECAMP: every round starts here (Bryan). */}
      {mode === null ? <WelcomeRoom onPick={pickMode} /> : null}

      <Controls
        labels={{ hop: t('hive_frontend_universe.controls.hop'), map: t('hive_frontend_universe.controls.map') }}
        onVector={(x, y) => {
          stickRef.current.x = x;
          stickRef.current.y = y;
        }}
        onHop={() => {
          if (!fullMapRef.current) hopWithO2();
        }}
        onMapHold={(held) => {
          mapHeldRef.current = held;
        }}
        onMapTap={toggleFullMap}
        onGridTap={() => {
          gridRef.current = !gridRef.current;
        }}
        onFire={firePlayerShot}
      />
    </div>
  );
};

export default CanvasMap;
