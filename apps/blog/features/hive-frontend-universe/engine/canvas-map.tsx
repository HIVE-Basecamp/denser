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
import { GAME_MODES, formatCountdown, msToNextRound, type GameMode } from '../lib/modes';
import { WelcomeRoom } from '../card/welcome-room';
import { ModeChip } from '../card/mode-chip';
import { PlayerDashboard, type DashboardRow } from '../card/player-dashboard';
import { FLIP_LANDMARK_ID, sideFlipX, type BoardSide, type FlipState } from '../lib/board-side';
import { HFU_COPY } from '../lib/strings';
import { placeWitnesses } from '../lib/planet';
import { windowStartFor, type Board } from '../lib/board';
import {
  LANDMARKS,
  LANDMARK_ACCOUNTS,
  ARCADE_GAMES,
  DAPP_DIRECTORY,
  ROSE_WINDOW_PANES
} from '../lib/fixed-world';
import { mulberry32 } from '../lib/mesh';
import { buildRoutes, buildNewbieTrail, POST_LINE_ID, DAPPS_LINE_ID } from '../lib/routes';
import { landmarkHref } from '../lib/targets';
import { buildWorld, type GameWorld } from './world';
import { type CritterState } from './critters';
import { type CoinState } from './coins';
import { o2Multiplier, HELMET_TOTAL, type HelmetState } from './helmets';
import { fightWrap, type HazardState } from './hazards';
import { type GemState } from './gems';
import { type BlockState } from './blocks';
import { type FootprintState } from './footprints';
import { type RaceState } from './dhf-race';
import { KEEP_LANDMARK_ID, GUARDIANS_NEEDED, type KeepState } from './keep';
import { fetchVault, VAULT_ACCOUNT, type Vault } from '../data/fetch-vault';
import { gridCellName } from './render';
import { playerFire, type ProjectileState } from './projectiles';
import { MAX_HITS, type CombatState } from './combat';
import { buildGround } from './ground';
import { requestAvatar } from './avatars';
import { getUserAvatarUrl } from '@ui/lib/avatar-utils';
import { createPlayer, jump, placeAt, MOVE, type PlayerState, type Vec2 } from './movement';
import {
  PALETTE,
  type Camera,
  type CommunityVisual,
  type HouseVisual,
  type LandmarkVisual,
  type RouteLayer,
  type TrafficMarker,
  type WitnessVisual
} from './render';
import { placeFactories, placeCubes, placeFormations } from './scenery';
import { flowConfig, type FlowState } from './particles';
import { Controls } from './controls';
import { HouseCard } from '../card/house-card';
import { LandmarkPanel } from '../card/landmark-panel';
import type { TopCommunity } from '../data/fetch-communities';

import { useFrameLoop } from './canvas-map/frame-loop';
import { CATEGORY_ACCENT, HF24_POST } from './canvas-map/constants';
import type { HoverInfo, RideState, WitnessCard } from './canvas-map/types';

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
  const [hover, setHover] = useState<HoverInfo>(null);
  /** A clicked or beam-visited witness citadel, which has no world node. */
  const [clickedWitness, setClickedWitness] = useState<WitnessCard>(null);

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
  const rideRef = useRef<RideState>(null);
  /** Re-armed by leaving the wheel, so one visit grants one ride. */
  const wheelArmedRef = useRef(true);
  /** Seconds before another beam can catch the bug, so visits stay chosen. */
  const beamCooldownRef = useRef(0);
  /** The nuisance hazards: goo, wrap, the sock trip. */
  const hazardsRef = useRef<HazardState | null>(null);
  /** Blocks on the lines this round; scenery that stops a rail bug. */
  const blocksRef = useRef<BlockState | null>(null);
  /** Who voted or replied this round, as tracks in the world. */
  const footprintsRef = useRef<FootprintState | null>(null);
  /** Colorful collectible gems, reseeded every board. */
  const gemsRef = useRef<GemState | null>(null);
  /** The DHF race (adventure mode); rebuilt with every round. */
  const raceRef = useRef<RaceState | null>(null);
  /** The keep's ending; the hoard re-forms with every round (engine/keep.ts). */
  const keepRef = useRef<KeepState | null>(null);
  /** The real vault behind the ending, fetched when the bug reaches the keep. */
  const [vault, setVault] = useState<Vault | null>(null);
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
      label: t(`${k}.keep`),
      value: t(`${k}.${keepRef.current?.everReleased ? 'keep_done' : 'keep_not'}`),
      accent: '#ffd24a'
    });
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

  useFrameLoop({
    world,
    board,
    routes,
    factories,
    cubes,
    formations,
    flowCfg,
    ground,
    buzz,
    newbieNodes,
    houseVisuals,
    landmarkVisuals,
    routeLayers,
    roseLabels,
    communityVisualsRef,
    witnessVisualsRef,
    wrapRef,
    canvasRef,
    t,
    steer,
    viewFlipX,
    firePlayerShot,
    hopWithO2,
    toggleDashboard,
    witnessStats,
    playerRef,
    camRef,
    inputRef,
    stickRef,
    keysRef,
    trafficRef,
    flowsRef,
    crittersRef,
    coinsRef,
    helmetsRef,
    hazardsRef,
    blocksRef,
    footprintsRef,
    gemsRef,
    raceRef,
    keepRef,
    projectilesRef,
    combatRef,
    rideRef,
    flipRef,
    playerHandleRef,
    modeRef,
    sideRef,
    mapHeldRef,
    fullMapRef,
    gridRef,
    hoverGridRef,
    warpFxRef,
    wheelArmedRef,
    beamCooldownRef,
    witnessCardOpenRef,
    wheelTrophiesRef,
    visitedRef,
    visitedNewbsRef,
    visitedCommunitiesRef,
    newbAwardedRef,
    atNodeTick,
    inCommunityTick,
    mKeyDownAt,
    setAtNode,
    setClickedNode,
    setInCommunity,
    setFullMap,
    setSide,
    setHover,
    setClickedWitness
  });

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
    if (id === KEEP_LANDMARK_ID) {
      const key = keepRef.current?.released ? 'released' : 'motto';
      return t(`hive_frontend_universe.keep.${key}`);
    }
    if (buzz && id === buzz.landmarkId) return t('hive_frontend_universe.panel.buzzing');
    return undefined;
  };

  // THE KEEP'S PANEL: the guardians with you, and the real vault the hoard
  // went into, fetched on arrival. Facts only; the reader decides.
  const atKeep = atLandmark?.id === KEEP_LANDMARK_ID;
  useEffect(() => {
    if (!atKeep || vault) return;
    let live = true;
    fetchVault()
      .then((v) => {
        if (live) setVault(v);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [atKeep, vault]);
  const keepStats = (): { label: string; value: string }[] => {
    const k = 'hive_frontend_universe.keep';
    const helmets = helmetsRef.current?.count ?? 0;
    const released = keepRef.current?.released ?? false;
    const rows = [
      { label: t(`${k}.guardians`), value: `${helmets} / ${GUARDIANS_NEEDED}` },
      { label: t(`${k}.hoard`), value: t(`${k}.${released ? 'hoard_everyones' : 'hoard_his'}`) }
    ];
    if (vault) {
      rows.push({ label: t(`${k}.vault_hive`), value: Math.round(vault.hive).toLocaleString() });
      rows.push({ label: t(`${k}.vault_hbd`), value: Math.round(vault.hbd).toLocaleString() });
      rows.push({ label: t(`${k}.keys`), value: t(`${k}.${vault.keyless ? 'keys_none' : 'keys_some'}`) });
    }
    return rows;
  };
  const keepLinks = (): { label: string; href: string }[] => {
    const k = 'hive_frontend_universe.keep';
    return [
      { label: t(`${k}.link_vault`), href: landmarkHref('explorer', `/@${VAULT_ACCOUNT}`) ?? '' },
      { label: t(`${k}.link_proposals`), href: landmarkHref('wallet', '/proposals') ?? '' },
      { label: t(`${k}.link_hf24`), href: HF24_POST }
    ].filter((l) => l.href !== '');
  };

  // The extra real destinations a place offers, and the heading over them.
  const landmarkLinks = (id: string): { label: string; href: string }[] | undefined => {
    if (id === 'arcade') return ARCADE_GAMES.map((g) => ({ label: g.name, href: g.url }));
    if (id === 'our_dapps') return DAPP_DIRECTORY.map((d) => ({ label: d.name, href: d.url }));
    if (id === 'rose_window') {
      return ROSE_WINDOW_PANES.map((pane) => ({
        label: t(pane.labelKey),
        href: landmarkHref(pane.kind, pane.path) ?? ''
      })).filter((l) => l.href !== '');
    }
    if (id === KEEP_LANDMARK_ID) return keepLinks();
    return undefined;
  };
  const landmarkLinksLabel = (id: string): string => {
    if (id === 'arcade') return t('hive_frontend_universe.panel.real_games');
    if (id === 'rose_window') return t('hive_frontend_universe.panel.rose_window');
    if (id === KEEP_LANDMARK_ID) return t('hive_frontend_universe.keep.record');
    return t('hive_frontend_universe.panel.dapps');
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
          links={landmarkLinks(atLandmark.id)}
          linksLabel={landmarkLinksLabel(atLandmark.id)}
          stats={atKeep ? keepStats() : undefined}
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
