'use client';

import type { RingSegment } from './segment-ring';

const BOX_W = 100;
const BOX_H = 58;
const CENTER_X = BOX_W / 2;
const CENTER_Y = 50;
const HALF_TURN = 180;
/** Height over width of the drawing, so a caller can size it by width alone. */
export const HALF_MOON_ASPECT = BOX_H / BOX_W;

interface HalfMoonProps {
  segments: RingSegment[];
  /** Rendered width in px; the height follows HALF_MOON_ASPECT. */
  width: number;
  known: boolean;
  stroke?: number;
  /** Degrees of empty arc between sections. */
  gap?: number;
}

/** 0° at twelve o'clock, clockwise, like every other dial on the card. */
function polar(radius: number, degrees: number): [number, number] {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return [CENTER_X + radius * Math.cos(radians), CENTER_Y + radius * Math.sin(radians)];
}

function arcPath(radius: number, from: number, to: number): string {
  const [x0, y0] = polar(radius, from);
  const [x1, y1] = polar(radius, to);
  return `M ${x0} ${y0} A ${radius} ${radius} 0 0 1 ${x1} ${y1}`;
}

/**
 * A half-moon cut into sections, running from nine o'clock over the top to
 * three. Each section is one measurement of the same kind and lights up to its
 * own share, so four percentages sit side by side and are compared in a
 * glance: one hot section, or all of them warm, is a shape before it is a
 * number. Every section keeps its faint track, so an empty one reads as empty
 * rather than missing.
 */
const HalfMoon = ({ segments, width, known, stroke = 13, gap = 5 }: HalfMoonProps) => {
  const radius = CENTER_Y - stroke / 2 - 1;
  const usable = HALF_TURN - gap * Math.max(segments.length - 1, 0);
  const totalWeight = segments.reduce((sum, segment) => sum + segment.weight, 0);

  let cursor = -HALF_TURN / 2;
  const sections = segments.map((segment, index) => {
    const sweep = totalWeight > 0 ? (segment.weight / totalWeight) * usable : 0;
    const from = cursor;
    const to = from + sweep;
    cursor = to + gap;
    const lit = known ? Math.min(Math.max(segment.ratio, 0), 1) * sweep : 0;
    return { key: index, from, to, lit: Math.min(lit, sweep - 0.01), color: segment.color };
  });

  return (
    <svg
      width={width}
      height={Math.round(width * HALF_MOON_ASPECT)}
      viewBox={`0 0 ${BOX_W} ${BOX_H}`}
      aria-hidden="true"
    >
      {sections.map((section) => (
        <g key={section.key}>
          {section.to - section.from > 0.5 ? (
            <path
              d={arcPath(radius, section.from, section.to)}
              fill="none"
              stroke={`${section.color}4D`}
              strokeWidth={stroke}
              strokeLinecap="round"
            />
          ) : null}
          {section.lit > 0.5 ? (
            <path
              d={arcPath(radius, section.from, section.from + section.lit)}
              fill="none"
              stroke={section.color}
              strokeWidth={stroke}
              strokeLinecap="round"
              style={{
                transition: 'd 700ms cubic-bezier(0.22, 1, 0.36, 1), stroke 400ms linear',
                filter: `drop-shadow(0 0 4px ${section.color}99)`
              }}
            />
          ) : null}
        </g>
      ))}
    </svg>
  );
};

export default HalfMoon;
