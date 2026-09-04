'use client';

import { forwardRef, useId, type SVGProps } from 'react';

/** The flower is authored in a 120-unit box; the caller sets the rendered size. */
export const FLOWER_BOX = 120;
export const FLOWER_CENTER = FLOWER_BOX / 2;
/** The card's ground: the halo behind a number and the dark disc the middle sits in. */
export const FLOWER_GROUND = '#0B0F17';
/** Radius of that disc. Petals start under it, so the two never show a seam. */
export const FLOWER_CORE_RADIUS = 17;
/** Radius of the faint haze behind the whole flower. */
export const FLOWER_HAZE_RADIUS = 58;
/** Middle of the petal's broad part, where its number sits. */
const NUMBER_RADIUS = 36;
/** How far the lit part reaches on a known zero: a cap above the middle, so every known value shows. */
const LIT_MIN_RADIUS = 23;
const LIT_MAX_RADIUS = 58;
/** Once the lit part reaches past here it sits under the number, and the number turns dark to stay readable. */
const NUMBER_COVERED_RADIUS = NUMBER_RADIUS + 6;
const HALO_WIDTH = 2.5;
/**
 * One petal pointing at twelve o'clock: base tucked under the middle at
 * radius 13, tip at 58, and a broad shoulder about thirty-four units wide
 * from radius 32 to 43 so a number sits on it with room. Mirror-symmetric on
 * purpose — five of these read as a flower, five lopsided ones as a pinwheel.
 */
const PETAL_PATH = 'M60,47 C42,37 36,18 51,5 C54,0.5 66,0.5 69,5 C84,18 78,37 60,47 Z';

function clamp01(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return value > 1 ? 1 : value;
}

/** Degrees clockwise from twelve o'clock for petal `index` of `count`. */
export function petalAngle(index: number, count: number): number {
  return count > 0 ? (360 / count) * index : 0;
}

/** How far from the middle the lit part of a petal reaches. */
export function litRadius(ratio: number): number {
  return LIT_MIN_RADIUS + (LIT_MAX_RADIUS - LIT_MIN_RADIUS) * clamp01(ratio);
}

/** Three glyphs fit at full size; a fourth or fifth costs a little. */
function fontSizeFor(text: string): number {
  if (text.length >= 5) return 9.5;
  if (text.length === 4) return 10;
  return 11;
}

export interface PetalProps extends SVGProps<SVGGElement> {
  angle: number;
  /** 0-1: how far the petal opens. */
  ratio: number;
  color: string;
  known: boolean;
  /** The number printed on the petal, already shortened to fit. */
  text: string;
  /** A blur filter defined by the flower, shared by every petal. */
  glowId: string;
}

/**
 * One petal: a faint track in the petal's full shape, the lit part rising from
 * the middle as far as the value goes, and the number at the widest point.
 * The number keeps the petal's colour on the track and turns dark once the lit
 * part reaches under it. The group takes a ref and any props, so a popover
 * can use it as its trigger.
 */
const Petal = forwardRef<SVGGElement, PetalProps>(({ angle, ratio, color, known, text, glowId, ...rest }, ref) => {
  const clipId = `petal-clip-${useId().replace(/:/g, '')}`;
  const reach = litRadius(ratio);
  const covered = known && reach >= NUMBER_COVERED_RADIUS;
  const numberY = FLOWER_CENTER - NUMBER_RADIUS;
  const numberFill = covered ? FLOWER_GROUND : known ? color : 'rgba(255, 255, 255, 0.45)';

  return (
    <g ref={ref} transform={`rotate(${angle} ${FLOWER_CENTER} ${FLOWER_CENTER})`} {...rest}>
      <clipPath id={clipId}>
        <circle cx={FLOWER_CENTER} cy={FLOWER_CENTER} r={reach} />
      </clipPath>
      <path d={PETAL_PATH} fill={color} opacity={known ? 0.3 : 0.15} pointerEvents="all" />
      {known ? (
        <g clipPath={`url(#${clipId})`} pointerEvents="none">
          <path d={PETAL_PATH} fill={color} opacity={0.55} filter={`url(#${glowId})`} />
          <path d={PETAL_PATH} fill={color} />
        </g>
      ) : null}
      <text
        x={FLOWER_CENTER}
        y={numberY}
        transform={`rotate(${-angle} ${FLOWER_CENTER} ${numberY})`}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSizeFor(text)}
        fontWeight={known ? 600 : 500}
        fill={numberFill}
        stroke={covered ? 'none' : FLOWER_GROUND}
        strokeWidth={HALO_WIDTH}
        strokeLinejoin="round"
        paintOrder="stroke"
        pointerEvents="none"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {text}
      </text>
    </g>
  );
});
Petal.displayName = 'Petal';

export default Petal;
