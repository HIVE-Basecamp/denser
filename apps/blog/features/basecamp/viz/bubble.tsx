'use client';

import { useId } from 'react';
import { RING_TRACK_COLOR } from '../lib/rings';

const BOX = 100;
const CENTER = BOX / 2;
/** The dashed guide shows how big the bubble can get. */
const GUIDE_RADIUS = 47;
const RADIUS_MAX = 43;
/** Even a brand-new account is a visible dot, never nothing. */
const RADIUS_MIN = 11;

interface BubbleProps {
  /** 0-1 of the scale. */
  ratio: number;
  /** Two stops: the lit side of the sphere and its shadow side. */
  colors: [string, string];
  known: boolean;
  size: number;
}

/**
 * A disc that grows with its number. Area, not radius, follows the value, so
 * twice the number is twice the ink — the honest way to size a circle. The
 * dashed guide is the full scale, so a small bubble is visibly small rather
 * than merely a small drawing.
 */
const Bubble = ({ ratio, colors, known, size }: BubbleProps) => {
  const gradientId = useId();
  const level = known ? Math.min(Math.max(ratio, 0), 1) : 0;
  const radius = known ? Math.max(RADIUS_MIN, RADIUS_MAX * Math.sqrt(level)) : RADIUS_MIN;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${BOX} ${BOX}`} aria-hidden="true">
      <defs>
        <radialGradient id={gradientId} cx="34%" cy="30%" r="78%">
          <stop offset="0%" stopColor={colors[0]} />
          <stop offset="100%" stopColor={colors[1]} />
        </radialGradient>
      </defs>
      <circle
        cx={CENTER}
        cy={CENTER}
        r={GUIDE_RADIUS}
        fill="none"
        stroke={RING_TRACK_COLOR}
        strokeWidth={1.5}
        strokeDasharray="2.5 4"
      />
      <circle
        cx={CENTER}
        cy={CENTER}
        r={radius}
        fill={`url(#${gradientId})`}
        fillOpacity={known ? 1 : 0.25}
        style={{
          transition: 'r 700ms cubic-bezier(0.22, 1, 0.36, 1)',
          filter: known ? `drop-shadow(0 0 7px ${colors[1]}99)` : undefined
        }}
      />
      <circle
        cx={CENTER}
        cy={CENTER}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={1.2}
        style={{ transition: 'r 700ms cubic-bezier(0.22, 1, 0.36, 1)' }}
      />
    </svg>
  );
};

export default Bubble;
