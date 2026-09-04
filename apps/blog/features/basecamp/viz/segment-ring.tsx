'use client';

import { RING_TRACK_COLOR } from '../lib/rings';

export interface RingSegment {
  /** 0-1: how much of this segment's own slot is lit. */
  ratio: number;
  /** Share of the circle this segment occupies, relative to the others. */
  weight: number;
  color: string;
}

interface SegmentRingProps {
  segments: RingSegment[];
  size: number;
  known: boolean;
  stroke?: number;
  /** Degrees of empty ring between segments. */
  gap?: number;
  /**
   * Draw each slice's empty track in a faint wash of its own colour instead
   * of neutral grey, so a ring whose slices are all empty still reads as four
   * named slots rather than a spinner.
   */
  tintTracks?: boolean;
}

const BOX = 100;
const CENTER = BOX / 2;
const FULL_TURN = 360;

/** 0° at twelve o'clock, running clockwise like every other dial on the card. */
function polar(radius: number, degrees: number): [number, number] {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return [CENTER + radius * Math.cos(radians), CENTER + radius * Math.sin(radians)];
}

function arcPath(radius: number, from: number, to: number): string {
  const [x0, y0] = polar(radius, from);
  const [x1, y1] = polar(radius, to);
  const large = to - from > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${radius} ${radius} 0 ${large} 1 ${x1} ${y1}`;
}

/**
 * One circle cut into slices. Three different readouts use it and it means
 * something slightly different each time — that is the point of it:
 *
 *   - equal slices, each lit to its own percentage: four measurements of the
 *     same kind, compared at a glance;
 *   - slices sized by share, all lit: parts of one whole, a pie;
 *   - equal slices, each fully lit or dark: a count out of a total.
 *
 * Every slice keeps its dim track, so an empty one is visibly empty rather
 * than missing.
 */
const SegmentRing = ({ segments, size, known, stroke = 9, gap = 7, tintTracks = false }: SegmentRingProps) => {
  const radius = CENTER - stroke / 2 - 1;
  const live = segments.filter((segment) => segment.weight > 0);
  const totalWeight = live.reduce((sum, segment) => sum + segment.weight, 0);
  const usable = FULL_TURN - gap * live.length;

  let cursor = 0;
  const slices = live.map((segment, index) => {
    const sweep = totalWeight > 0 ? (segment.weight / totalWeight) * usable : 0;
    const from = cursor;
    const to = from + sweep;
    cursor = to + gap;
    // Almost-closed arcs would draw as a dot, so cap a lit slice a hair short
    // of its full sweep.
    const lit = known ? Math.min(Math.max(segment.ratio, 0), 1) * sweep : 0;
    return { key: index, from, to, lit: Math.min(lit, sweep - 0.01), color: segment.color };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${BOX} ${BOX}`} aria-hidden="true">
      {live.length === 0 ? (
        // Nothing to slice — an account with no stake at all — still draws its
        // track, so the ring reads as empty rather than missing.
        <circle cx={CENTER} cy={CENTER} r={radius} fill="none" stroke={RING_TRACK_COLOR} strokeWidth={stroke} />
      ) : null}
      {slices.map((slice) => (
        <g key={slice.key}>
          {slice.to - slice.from > 0.5 ? (
            <path
              d={arcPath(radius, slice.from, slice.to)}
              fill="none"
              stroke={tintTracks ? `${slice.color}33` : RING_TRACK_COLOR}
              strokeWidth={stroke}
              strokeLinecap="round"
            />
          ) : null}
          {slice.lit > 0.5 ? (
            <path
              d={arcPath(radius, slice.from, slice.from + slice.lit)}
              fill="none"
              stroke={slice.color}
              strokeWidth={stroke}
              strokeLinecap="round"
              style={{
                transition: 'd 700ms cubic-bezier(0.22, 1, 0.36, 1), stroke 400ms linear',
                filter: `drop-shadow(0 0 4px ${slice.color}99)`
              }}
            />
          ) : null}
        </g>
      ))}
    </svg>
  );
};

export default SegmentRing;
