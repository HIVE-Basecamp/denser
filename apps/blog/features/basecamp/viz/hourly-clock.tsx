'use client';

import { useId } from 'react';
import { CLOCK_COLORS } from '../lib/rings';
import { BASECAMP_VIVID } from '../lib/theme';

const HOURS_IN_DAY = 24;
const BOX = 52;
const CENTER = BOX / 2;
/**
 * Where the spokes start and how far the busiest hour reaches. The clear
 * centre is left wide enough to hold the hour count.
 */
const INNER_RADIUS = 10;
const OUTER_RADIUS = 24.5;
const SPOKE_WIDTH = 2.4;

/**
 * How far today's marks can reach, and how wide they are drawn.
 *
 * They sit on the same spokes, from the same centre, but stop well short of
 * them and run narrower — so the dial reads as one shape with something marked
 * inside it rather than as two dials fighting. Today can never look like the
 * bigger number, which it is not.
 */
const TODAY_OUTER_RADIUS = 17;
const TODAY_SPOKE_WIDTH = 1.4;
const TODAY_COLOR = BASECAMP_VIVID.red;

interface HourlyClockProps {
  /** Twenty-four counts, index 0 = 00:00 UTC: the hours they are usually awake in. */
  hourlyCounts: number[];
  /** Twenty-four counts for today alone, drawn short and in red inside the spokes. */
  todayCounts?: number[];
  /** False while the history read is still in flight or unavailable. */
  known: boolean;
  size?: number;
  /** Two stops for the lit spokes, washed corner to corner across the dial. */
  colors?: [string, string];
}

/**
 * A twenty-four hour dial of when an account acts, in UTC. Midnight sits at
 * the top and the day runs clockwise, so each spoke is one hour.
 *
 * Two readings on one face. The long spokes are the hours this account is
 * usually awake in, each one's length its share of its own busiest hour. The
 * short red marks inside them are today, on their own scale, so a quiet day
 * still shows which hours it happened in.
 *
 * Each scale is its own, on purpose: they answer different questions, and one
 * ruler would leave today invisible on an account with thousands of records
 * behind it. Lengths are comparable within a colour, never across them.
 *
 * It is drawn because the *shape* carries the meaning at a glance: a person
 * sleeps, which leaves a contiguous quiet arc, while something running on a
 * timer fills the circle evenly. The card says only what the hours were. What
 * a gap or its absence means is left to the reader — a night-shift worker and
 * a script can look alike, and this does not adjudicate between them.
 */
const HourlyClock = ({
  hourlyCounts,
  todayCounts,
  known,
  size = BOX,
  colors = [CLOCK_COLORS.active, CLOCK_COLORS.active]
}: HourlyClockProps) => {
  const gradientId = useId();
  const counts =
    Array.isArray(hourlyCounts) && hourlyCounts.length === HOURS_IN_DAY
      ? hourlyCounts
      : new Array<number>(HOURS_IN_DAY).fill(0);
  const busiest = Math.max(...counts, 0);
  const hasAny = known && busiest > 0;
  const today =
    Array.isArray(todayCounts) && todayCounts.length === HOURS_IN_DAY
      ? todayCounts
      : new Array<number>(HOURS_IN_DAY).fill(0);
  const busiestToday = Math.max(...today, 0);
  const hasToday = known && busiestToday > 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${BOX} ${BOX}`} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={BOX} y2={BOX}>
          <stop offset="0%" stopColor={colors[0]} />
          <stop offset="100%" stopColor={colors[1]} />
        </linearGradient>
      </defs>
      <circle
        cx={CENTER}
        cy={CENTER}
        r={INNER_RADIUS - 1.5}
        fill="none"
        stroke={CLOCK_COLORS.track}
        strokeWidth={1}
      />
      {counts.map((count, hour) => {
        // Midnight at twelve o'clock, running clockwise like a real dial.
        const angle = (hour / HOURS_IN_DAY) * 2 * Math.PI - Math.PI / 2;
        const share = hasAny && count > 0 ? count / busiest : 0;
        // Every hour keeps a stub so the dial reads as a full circle of
        // twenty-four, and a quiet hour is visibly quiet rather than absent.
        const reach = INNER_RADIUS + (OUTER_RADIUS - INNER_RADIUS) * share;
        const outer = share > 0 ? reach : INNER_RADIUS + 1.5;
        return (
          <line
            key={hour}
            x1={CENTER + Math.cos(angle) * INNER_RADIUS}
            y1={CENTER + Math.sin(angle) * INNER_RADIUS}
            x2={CENTER + Math.cos(angle) * outer}
            y2={CENTER + Math.sin(angle) * outer}
            stroke={share > 0 ? `url(#${gradientId})` : CLOCK_COLORS.track}
            strokeWidth={SPOKE_WIDTH}
            strokeLinecap="round"
            style={{
              transition: 'all 700ms cubic-bezier(0.22, 1, 0.36, 1)',
              // A faint bloom on the filled spokes only, so the busy part of
              // the day reads before any of the numbers beside it do.
              filter: share > 0 ? `drop-shadow(0 0 3px ${colors[0]}99)` : undefined
            }}
          />
        );
      })}
      {hasToday
        ? today.map((count, hour) => {
            if (count <= 0) return null;
            const angle = (hour / HOURS_IN_DAY) * 2 * Math.PI - Math.PI / 2;
            const share = count / busiestToday;
            const reach = INNER_RADIUS + (TODAY_OUTER_RADIUS - INNER_RADIUS) * share;
            return (
              <line
                key={`today-${hour}`}
                x1={CENTER + Math.cos(angle) * INNER_RADIUS}
                y1={CENTER + Math.sin(angle) * INNER_RADIUS}
                x2={CENTER + Math.cos(angle) * reach}
                y2={CENTER + Math.sin(angle) * reach}
                stroke={TODAY_COLOR}
                strokeWidth={TODAY_SPOKE_WIDTH}
                strokeLinecap="round"
                style={{
                  transition: 'all 700ms cubic-bezier(0.22, 1, 0.36, 1)',
                  filter: `drop-shadow(0 0 3px ${TODAY_COLOR}CC)`
                }}
              />
            );
          })
        : null}
    </svg>
  );
};

export default HourlyClock;
