'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';

/**
 * The confetti bursts for a first-post ring. Bryan (2026-09-12): "way more
 * confetti... like always multiple exploding... it should feel like
 * fireworks are going off." So this is a firework display, not a rotation:
 * several bursts go up every second, at different spots around different
 * rings, and each ring can hold a handful at once.
 *
 * One shared scheduler drives every mounted ring (module state, not React
 * state — the point is to coordinate instances that share no parent), so the
 * rate is a property of the FEED. One ring alone still gets the full show;
 * ten rings share the same volley rate rather than multiplying it into
 * noise.
 *
 * Class names here are spliced into first-post-ring.tsx's single shared
 * <style> tag via CONFETTI_CSS below, using a literal prefix rather than an
 * import from that file so the two files don't import each other.
 */
const CONFETTI_PREFIX = 'basecamp-first-post'; // must match PREFIX in ./first-post-ring.tsx

/** How long one burst's chips take to fly out and fade. */
export const CONFETTI_BURST_DURATION_MS = 1700;

/**
 * Gap between one VOLLEY and the next. Far shorter than a burst lasts, so
 * bursts pile up on top of each other instead of taking turns — which is
 * what makes it read as fireworks rather than as one polite pop.
 */
const CONFETTI_MIN_GAP_MS = 130;
const CONFETTI_MAX_GAP_MS = 420;

/** How many bursts go up in one volley. */
const CONFETTI_MIN_PER_VOLLEY = 2;
const CONFETTI_MAX_PER_VOLLEY = 4;

/**
 * The ceiling on bursts alight at once on one ring. Reached only when the
 * feed is showing a single first-post; it keeps the DOM bounded no matter
 * how the numbers above are tuned.
 */
const CONFETTI_MAX_LIVE_PER_RING = 9;

const CONFETTI_PIECE_COUNT = 18;
const CONFETTI_MIN_DISTANCE_PX = 30;
const CONFETTI_MAX_DISTANCE_PX = 108;
const CONFETTI_MAX_PIECE_DELAY_MS = 110;

/** Same vivid set the rest of the postcard draws from. */
const CONFETTI_COLORS = ['#B79CFF', '#FF8A3D', '#5EE9D5', '#B6F36B', '#FF6FB1', '#FFD24D', '#5B9DFF', '#FF4D6D'];

export interface ConfettiBurstEvent {
  /** Where the burst originates, in percent of the ring's own box. */
  anchorX: number;
  anchorY: number;
  /** Distinct per firing, so pieces regenerate even when the same spot repeats. */
  seed: number;
}

type BurstHandler = (event: ConfettiBurstEvent) => void;

const listeners = new Map<string, BurstHandler>();
let scheduledFire: ReturnType<typeof setTimeout> | undefined;

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** How far past the ring's own edge a burst may go off, in percent. */
const CONFETTI_OVERHANG_PCT = 12;

/**
 * A random point around the post: somewhere along one of the four sides,
 * pushed a little outside the edge so the bursts ring the post rather than
 * sitting on its border.
 */
function randomAnchor(): Pick<ConfettiBurstEvent, 'anchorX' | 'anchorY'> {
  const along = randomBetween(-CONFETTI_OVERHANG_PCT, 100 + CONFETTI_OVERHANG_PCT);
  const out = randomBetween(0, CONFETTI_OVERHANG_PCT);
  switch (Math.floor(randomBetween(0, 4))) {
    case 0:
      return { anchorX: along, anchorY: -out };
    case 1:
      return { anchorX: 100 + out, anchorY: along };
    case 2:
      return { anchorX: along, anchorY: 100 + out };
    default:
      return { anchorX: -out, anchorY: along };
  }
}

/** One volley: a handful of bursts, each at its own ring and its own spot. */
function fireVolley(): void {
  const ids = Array.from(listeners.keys());
  if (ids.length > 0) {
    const shots = Math.floor(randomBetween(CONFETTI_MIN_PER_VOLLEY, CONFETTI_MAX_PER_VOLLEY + 1));
    for (let i = 0; i < shots; i++) {
      const chosenId = ids[Math.floor(Math.random() * ids.length)];
      listeners.get(chosenId)?.({ ...randomAnchor(), seed: Math.random() });
    }
  }
  scheduleNextFire();
}

function scheduleNextFire(): void {
  clearTimeout(scheduledFire);
  if (listeners.size === 0) {
    scheduledFire = undefined;
    return;
  }
  scheduledFire = setTimeout(fireVolley, randomBetween(CONFETTI_MIN_GAP_MS, CONFETTI_MAX_GAP_MS));
}

function registerBurstListener(id: string, handler: BurstHandler): void {
  const wasEmpty = listeners.size === 0;
  listeners.set(id, handler);
  if (wasEmpty) scheduleNextFire();
}

function unregisterBurstListener(id: string): void {
  listeners.delete(id);
  if (listeners.size === 0) scheduleNextFire();
}

/**
 * Registers one ring with the shared scheduler and returns every burst
 * currently alight on it — usually several. Nothing is scheduled until this
 * effect runs, so the first render (server or client) is always empty and
 * there is no hydration mismatch to have.
 *
 * Skips registering at all when the visitor asked for less motion: no
 * bursts, ever, rather than a calmer version of them.
 */
export function useConfettiBursts(instanceId: string): ConfettiBurstEvent[] {
  const [bursts, setBursts] = useState<ConfettiBurstEvent[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const timers = new Set<ReturnType<typeof setTimeout>>();
    const handler: BurstHandler = (event) => {
      setBursts((live) => [...live, event].slice(-CONFETTI_MAX_LIVE_PER_RING));
      const timer = setTimeout(() => {
        timers.delete(timer);
        setBursts((live) => live.filter((b) => b.seed !== event.seed));
      }, CONFETTI_BURST_DURATION_MS);
      timers.add(timer);
    };

    registerBurstListener(instanceId, handler);
    return () => {
      timers.forEach(clearTimeout);
      unregisterBurstListener(instanceId);
    };
  }, [instanceId]);

  return bursts;
}

/** Chip size range, world px: mixed sizes read as sparks, not as a grid. */
const CONFETTI_MIN_SIZE_PX = 4;
const CONFETTI_MAX_SIZE_PX = 9;

interface ConfettiPiece {
  dx: number;
  dy: number;
  rotate: number;
  delayMs: number;
  sizePx: number;
  color: string;
}

/** Only ever called from useMemo below, itself only reached once a burst exists — after mount, never during SSR. */
function makePieces(): ConfettiPiece[] {
  return Array.from({ length: CONFETTI_PIECE_COUNT }, () => {
    const angle = randomBetween(0, 360) * (Math.PI / 180);
    const distance = randomBetween(CONFETTI_MIN_DISTANCE_PX, CONFETTI_MAX_DISTANCE_PX);
    return {
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      rotate: randomBetween(0, 360),
      delayMs: randomBetween(0, CONFETTI_MAX_PIECE_DELAY_MS),
      sizePx: randomBetween(CONFETTI_MIN_SIZE_PX, CONFETTI_MAX_SIZE_PX),
      color: CONFETTI_COLORS[Math.floor(randomBetween(0, CONFETTI_COLORS.length))]
    };
  });
}

interface ConfettiBurstProps {
  event: ConfettiBurstEvent;
}

/** The chips themselves, positioned at the burst's anchor point on the ring. */
const ConfettiBurst = ({ event }: ConfettiBurstProps) => {
  // Regenerated only when a new burst fires (keyed by its seed) — not on every render.
  const pieces = useMemo(makePieces, [event.seed]);

  return (
    <span
      className={CONFETTI_PREFIX + '-confetti'}
      style={{ left: `${event.anchorX}%`, top: `${event.anchorY}%` }}
      aria-hidden="true"
    >
      {pieces.map((piece, index) => {
        const pieceStyle: CSSProperties & Record<`--${string}`, string> = {
          '--dx': `${piece.dx}px`,
          '--dy': `${piece.dy}px`,
          '--rot': `${piece.rotate}deg`,
          '--pd': `${piece.delayMs}ms`,
          '--sz': `${piece.sizePx}px`,
          backgroundColor: piece.color
        };
        return <span key={index} className={CONFETTI_PREFIX + '-piece'} style={pieceStyle} />;
      })}
    </span>
  );
};

export default ConfettiBurst;

/** Spliced into first-post-ring.tsx's shared <style> tag — one copy per feed, not one per card. */
export const CONFETTI_CSS = `
.${CONFETTI_PREFIX}-confetti{position:absolute;width:0;height:0}
.${CONFETTI_PREFIX}-piece{position:absolute;left:0;top:0;width:var(--sz,6px);height:var(--sz,6px);border-radius:1px;transform:translate(-50%,-50%);animation:${CONFETTI_PREFIX}-pop ${CONFETTI_BURST_DURATION_MS}ms ease-out forwards;animation-delay:var(--pd,0ms)}
@keyframes ${CONFETTI_PREFIX}-pop{0%{transform:translate(-50%,-50%) rotate(0deg);opacity:1}100%{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) rotate(var(--rot));opacity:0}}
@media (prefers-reduced-motion:reduce){.${CONFETTI_PREFIX}-confetti{display:none}}
`;
