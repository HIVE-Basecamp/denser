'use client';

import { useTranslation } from '@/blog/i18n/client';
import { CLOCK_COLORS } from './lib/rings';

const HOURS_IN_DAY = 24;
const SIZE = 52;
const CENTER = SIZE / 2;
/** Where the spokes start and how far the busiest hour reaches. */
const INNER_RADIUS = 7.5;
const OUTER_RADIUS = 24;
const SPOKE_WIDTH = 2.6;

interface HourlyClockProps {
  /** Twenty-four counts, index 0 = 00:00 UTC. */
  hourlyCounts: number[];
  activeHourCount: number;
  /** False while the history read is still in flight or unavailable. */
  known: boolean;
}

/**
 * A twenty-four hour dial of when an account writes, in UTC. Midnight sits at
 * the top and the day runs clockwise, so each spoke is one hour and its length
 * is that hour's share of the busiest one.
 *
 * It is drawn because the *shape* carries the meaning at a glance: a person
 * sleeps, which leaves a contiguous quiet arc, while something running on a
 * timer fills the circle evenly. The card says only what the hours were. What
 * a gap or its absence means is left to the reader — a night-shift worker and
 * a script can look alike, and this does not adjudicate between them.
 */
const HourlyClock = ({ hourlyCounts, activeHourCount, known }: HourlyClockProps) => {
  const { t } = useTranslation('common_blog');

  const counts =
    Array.isArray(hourlyCounts) && hourlyCounts.length === HOURS_IN_DAY
      ? hourlyCounts
      : new Array<number>(HOURS_IN_DAY).fill(0);
  const busiest = Math.max(...counts, 0);
  const hasAny = known && busiest > 0;

  const label = hasAny
    ? t('basecamp.patterns.clock_summary', { hours: activeHourCount, total: HOURS_IN_DAY })
    : t('basecamp.patterns.clock_unknown');

  return (
    <div
      className="relative shrink-0"
      style={{ width: SIZE, height: SIZE }}
      title={label}
      data-testid="newcomer-hourly-clock"
      data-active-hours={hasAny ? activeHourCount : ''}
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={label}>
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
              stroke={share > 0 ? CLOCK_COLORS.active : CLOCK_COLORS.track}
              strokeWidth={SPOKE_WIDTH}
              strokeLinecap="round"
              style={{
                transition: 'all 700ms cubic-bezier(0.22, 1, 0.36, 1)',
                // A faint bloom on the filled spokes only, so the busy part of
                // the day reads before any of the numbers beside it do.
                filter: share > 0 ? 'drop-shadow(0 0 3px rgba(94, 233, 213, 0.55))' : undefined
              }}
            />
          );
        })}
      </svg>
    </div>
  );
};

export default HourlyClock;
