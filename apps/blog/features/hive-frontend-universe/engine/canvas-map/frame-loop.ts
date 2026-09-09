import type { Dispatch, MutableRefObject, RefObject, SetStateAction } from 'react';
import { MAX_TRAFFIC, TAP_MS } from './constants';
import type { BuzzZone, HoverInfo, RideState, WitnessCard } from './types';
import { useEffect } from 'react';
import {
  GAME_MODES,
  formatCountdown,
  modeHasConsequences,
  msToNextRound,
  type GameMode
} from '../../lib/modes';
import {
  FLIP_LANDMARK_ID,
  FLIP_SECONDS,
  flipView,
  otherSide,
  sideAt,
  sideFlipX,
  type BoardSide,
  type FlipState
} from '../../lib/board-side';
import { MAP_FIT, towerLean, towerPoint } from '../../lib/planet';
import { TIERS, type Board } from '../../lib/board';
import { LANDMARKS, LANDMARK_ACCOUNTS, TROLL_HOLES, ROSE_WINDOW_PANES } from '../../lib/fixed-world';
import { getStorageItem, setStorageItem, StorageTTL } from '@ui/lib/storage-with-ttl';
import { buildRoutes } from '../../lib/routes';
import { landmarkHref, profileHref, communityHref, postHref, type MapTarget } from '../../lib/targets';
import { type GameWorld } from '../world';
import { createCritters, updateCritters, type CritterState } from '../critters';
import { createCoins, updateCoins, type CoinState } from '../coins';
import { createHelmets, updateHelmets, o2Multiplier, HELMET_TOTAL, type HelmetState } from '../helmets';
import { createHazards, updateHazards, hazardHolds, GOO_SLOW, type HazardState } from '../hazards';
import { createGems, updateGems, type GemState } from '../gems';
import { placeBlocks, blockPlayer, type BlockState } from '../blocks';
import { createFootprints, addReplyTracks, type FootprintState } from '../footprints';
import { fetchRepliers } from '../../data/fetch-replies';
import { createRace, takeVote, deliverVotes, dropVotes, type RaceState } from '../dhf-race';
import { createKeep, releaseHoard, updateKeep, KEEP_LANDMARK_ID, type KeepState } from '../keep';
import { createProjectiles, updateProjectiles, type ProjectileState } from '../projectiles';
import { createCombat, tickCombat, type CombatState } from '../combat';
import { buildGround } from '../ground';
import { requestAvatar, avatarStats } from '../avatars';
import { FERRIS_SPIN, rosePaneCentre } from '../icons';
import { driftUpdate, placeAt, railUpdate, MOVE, type PlayerState, type Vec2 } from '../movement';
import {
  drawScene,
  type Camera,
  type CommunityVisual,
  type HouseVisual,
  type LandmarkVisual,
  type RouteLayer,
  type TrafficMarker,
  type WitnessVisual,
  BIG_SIZE
} from '../render';
import { placeFactories, placeCubes, placeFormations } from '../scenery';
import { createFlows, updateFlows, flowConfig, type FlowState } from '../particles';

interface FrameLoopArgs {
  /** The round's world and board, and everything built once from them. */
  world: GameWorld;
  board: Board;
  routes: ReturnType<typeof buildRoutes>;
  factories: ReturnType<typeof placeFactories>;
  cubes: ReturnType<typeof placeCubes>;
  formations: ReturnType<typeof placeFormations>;
  flowCfg: ReturnType<typeof flowConfig>;
  ground: ReturnType<typeof buildGround>;
  buzz: BuzzZone;
  newbieNodes: Set<number>;
  houseVisuals: (HouseVisual | undefined)[];
  landmarkVisuals: LandmarkVisual[];
  routeLayers: RouteLayer[];
  roseLabels: string[];
  communityVisualsRef: MutableRefObject<(CommunityVisual | undefined)[]>;
  witnessVisualsRef: MutableRefObject<WitnessVisual[]>;

  /** The DOM. */
  wrapRef: RefObject<HTMLDivElement>;
  canvasRef: RefObject<HTMLCanvasElement>;

  /** Translation, and the two small helpers the loop borrows. */
  t: (key: string, options?: Record<string, unknown>) => string;
  steer: () => Vec2;
  viewFlipX: () => number;
  firePlayerShot: () => void;
  hopWithO2: () => void;
  toggleDashboard: () => void;
  witnessStats: (name: string) => { label: string; value: string }[];

  /** Engine state, all in refs so the loop never re-creates it. */
  playerRef: MutableRefObject<PlayerState>;
  camRef: MutableRefObject<Camera>;
  inputRef: MutableRefObject<Vec2>;
  stickRef: MutableRefObject<Vec2>;
  keysRef: MutableRefObject<Record<string, boolean>>;
  trafficRef: MutableRefObject<TrafficMarker[]>;
  flowsRef: MutableRefObject<FlowState | null>;
  crittersRef: MutableRefObject<CritterState | null>;
  coinsRef: MutableRefObject<CoinState | null>;
  helmetsRef: MutableRefObject<HelmetState | null>;
  hazardsRef: MutableRefObject<HazardState | null>;
  blocksRef: MutableRefObject<BlockState | null>;
  footprintsRef: MutableRefObject<FootprintState | null>;
  gemsRef: MutableRefObject<GemState | null>;
  raceRef: MutableRefObject<RaceState | null>;
  keepRef: MutableRefObject<KeepState | null>;
  projectilesRef: MutableRefObject<ProjectileState | null>;
  combatRef: MutableRefObject<CombatState | null>;
  rideRef: MutableRefObject<RideState>;
  flipRef: MutableRefObject<FlipState | null>;

  /** Session and view flags the loop reads and writes. */
  playerHandleRef: MutableRefObject<string | undefined>;
  modeRef: MutableRefObject<GameMode | null>;
  sideRef: MutableRefObject<BoardSide>;
  mapHeldRef: MutableRefObject<boolean>;
  fullMapRef: MutableRefObject<boolean>;
  gridRef: MutableRefObject<boolean>;
  hoverGridRef: MutableRefObject<{ ci: number; ri: number } | null>;
  warpFxRef: MutableRefObject<number>;
  wheelArmedRef: MutableRefObject<boolean>;
  beamCooldownRef: MutableRefObject<number>;
  witnessCardOpenRef: MutableRefObject<boolean>;
  wheelTrophiesRef: MutableRefObject<string[]>;
  visitedRef: MutableRefObject<Set<string> | null>;
  visitedNewbsRef: MutableRefObject<Set<number>>;
  visitedCommunitiesRef: MutableRefObject<Set<string> | null>;
  newbAwardedRef: MutableRefObject<boolean>;
  atNodeTick: MutableRefObject<number>;
  inCommunityTick: MutableRefObject<number>;
  mKeyDownAt: MutableRefObject<number>;

  /** The React state the loop is allowed to push into. */
  setAtNode: Dispatch<SetStateAction<number>>;
  setClickedNode: Dispatch<SetStateAction<number>>;
  setInCommunity: Dispatch<SetStateAction<number>>;
  setFullMap: Dispatch<SetStateAction<boolean>>;
  setSide: Dispatch<SetStateAction<BoardSide>>;
  setHover: Dispatch<SetStateAction<HoverInfo>>;
  setClickedWitness: Dispatch<SetStateAction<WitnessCard>>;
}

/**
 * The frame loop.
 *
 * This is the one `useEffect` that used to sit in the middle of
 * `canvas-map.tsx`: it builds the round's engine state, wires the keyboard and
 * the canvas, hit-tests the map for hover and clicks, and runs the
 * requestAnimationFrame loop that steps the world and draws it. It is moved
 * here whole, in one piece, with the same dependency list, because every
 * closure in it is created together and reads the same live locals; cutting
 * inside it is how a frame loop breaks quietly.
 *
 * Everything it reads from the component is handed to it in `FrameLoopArgs`,
 * which is what the enclosing component scope used to be.
 */

export function useFrameLoop(a: FrameLoopArgs): void {
  const {
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
  } = a;

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
    blocksRef.current = placeBlocks(world, board.windowStart);
    footprintsRef.current = createFootprints(world, board.houses);
    gemsRef.current = createGems(world, board.windowStart);
    raceRef.current = createRace(board.houses.map((h) => h.tier));
    keepRef.current = createKeep(world, BIG_SIZE.jsonboss ?? 300);
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

      // Footprints: the marker at the end of a track is the account that
      // left it. Hover names it and what it did; a click opens its page.
      if (footprintsRef.current && !fullMapRef.current) {
        for (const tr of footprintsRef.current.tracks) {
          consider(
            {
              kind: 'footprint',
              node: -1,
              title: `@${tr.handle} ${t(`hive_frontend_universe.footprints.${tr.act === 'vote' ? 'voted' : 'replied'}`)}`,
              href: profileHref(tr.handle),
              account: tr.handle,
              travelable: false,
              x: tr.x,
              y: tr.y
            },
            60
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
      if (target.kind === 'witness' || target.kind === 'footprint') {
        // A clicked citadel gets the same real chain stats as a beam visit
        // (Bryan: more info on ALL the witness cards). Rose panes, the
        // ruins and footprints ride this same path: a small panel with the
        // page to open, and no stats.
        setClickedWitness({
          title: target.title,
          href: target.href,
          stats: target.kind === 'witness' && target.account ? witnessStats(target.account) : undefined
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
    // FOOTPRINTS: a house near the bug is asked, once, who replied to its
    // post; the repliers become tracks. Read only, cached for the round.
    const askReplies = (nodeId: number, ref: number) => {
      const fp = footprintsRef.current;
      const house = board.houses[ref];
      if (!fp || !house || fp.asked.has(ref)) return;
      fp.asked.add(ref);
      if (!house.post || house.post.comments <= 0) return;
      const author = house.post.author;
      fetchRepliers(author, house.post.permlink)
        .then((rs) => {
          if (footprintsRef.current !== fp) return;
          const handles = [...new Set(rs.map((r) => r.handle))].filter((h) => h !== author);
          addReplyTracks(fp, world, nodeId, ref, handles);
        })
        .catch(() => undefined);
    };
    let avatarTick = 0;
    const requestNearbyAvatars = (dt: number) => {
      avatarTick -= dt;
      if (avatarTick > 0) return;
      avatarTick = 0.35;
      for (const n of nodes) {
        if (n.kind === 'house') {
          const h = houseVisuals[n.ref];
          if (h && Math.hypot(n.x - p.x, n.y - p.y) < 2000) {
            requestAvatar(h.handle);
            askReplies(n.id, n.ref);
          }
        } else if (n.kind === 'landmark') {
          const handle = LANDMARK_ACCOUNTS[LANDMARKS[n.ref]?.id];
          if (handle && Math.hypot(n.x - p.x, n.y - p.y) < 2400) requestAvatar(handle);
        } else if (n.kind === 'community') {
          const c = communityVisualsRef.current[n.ref];
          if (c && Math.hypot(n.x - p.x, n.y - p.y) < 2800) requestAvatar(c.handle);
        }
      }
      if (footprintsRef.current) {
        for (const tr of footprintsRef.current.tracks) {
          if (Math.hypot(tr.x - p.x, tr.y - p.y) < 2000) requestAvatar(tr.handle);
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
      // BLOCKS on the line (engine/blocks.ts): a rail bug that pushed into
      // one is set back to its edge, stopped. Hop over it or take another
      // line. movement.ts untouched, like the hazards.
      if (blocksRef.current && blockPlayer(blocksRef.current, p, edges, dt)) shake = Math.max(shake, 5);
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
      if (alive && keepRef.current) updateKeep(keepRef.current, dt);
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
        // THE KEEP: park there wearing all 21 helmets and his hoard is set
        // loose (engine/keep.ts). Fewer, and you only get to look.
        if (vn?.kind === 'landmark' && LANDMARKS[vn.ref]?.id === KEEP_LANDMARK_ID && keepRef.current) {
          if (releaseHoard(keepRef.current, helmetsRef.current?.count ?? 0)) {
            warpFxRef.current = 1;
            shake = 8;
          }
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
        blocks: blocksRef.current,
        footprints: alive ? footprintsRef.current : null,
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
        keep: alive ? keepRef.current : null,
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
}
