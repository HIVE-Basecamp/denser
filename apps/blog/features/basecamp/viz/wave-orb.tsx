'use client';

import { useId } from 'react';
import { RING_TRACK_COLOR } from '../lib/rings';

const BOX = 48;
const CENTER = BOX / 2;
const RADIUS = 21;
/** How tall the crest of the wave sits above its trough. */
const WAVE_AMPLITUDE = 2.8;

interface WaveOrbProps {
  /** 0-1: the fill level. */
  ratio: number;
  /** Two stops: the surface of the liquid and its depths. */
  colors: [string, string];
  known: boolean;
  size?: number;
}

/**
 * A vessel filling with colour. A level rising inside a circle is read without
 * an axis, and a two-colour liquid under a lit rim is the most playful thing
 * on the card — which is what the wallet's headline number was missing.
 */
const WaveOrb = ({ ratio, colors, known, size = 48 }: WaveOrbProps) => {
  const clipId = useId();
  const gradientId = useId();
  const level = known ? Math.min(Math.max(ratio, 0), 1) : 0;
  const top = CENTER + RADIUS - 2 * RADIUS * level;
  const left = CENTER - RADIUS;
  const right = CENTER + RADIUS;
  const bottom = CENTER + RADIUS;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${BOX} ${BOX}`} aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <circle cx={CENTER} cy={CENTER} r={RADIUS - 1.5} />
        </clipPath>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor={colors[0]} stopOpacity="1" />
          <stop offset="100%" stopColor={colors[1]} stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="rgba(255,255,255,0.03)" stroke={RING_TRACK_COLOR} strokeWidth={2} />
      {level > 0 ? (
        <g clipPath={`url(#${clipId})`}>
          <path
            d={
              `M ${left} ${top}` +
              ` Q ${left + RADIUS * 0.5} ${top - WAVE_AMPLITUDE} ${CENTER} ${top}` +
              ` T ${right} ${top}` +
              ` L ${right} ${bottom} L ${left} ${bottom} Z`
            }
            fill={`url(#${gradientId})`}
            style={{ transition: 'd 700ms cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
          {/* A highlight on the surface, so the liquid reads as liquid. */}
          <path
            d={`M ${left} ${top + 0.6} Q ${left + RADIUS * 0.5} ${top - WAVE_AMPLITUDE + 0.6} ${CENTER} ${top + 0.6} T ${right} ${top + 0.6}`}
            fill="none"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth={1}
          />
        </g>
      ) : null}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RADIUS}
        fill="none"
        stroke={colors[0]}
        strokeWidth={1.75}
        strokeOpacity={known ? 0.9 : 0.25}
        style={{ filter: level > 0 ? `drop-shadow(0 0 6px ${colors[0]}88)` : undefined }}
      />
    </svg>
  );
};

export default WaveOrb;
