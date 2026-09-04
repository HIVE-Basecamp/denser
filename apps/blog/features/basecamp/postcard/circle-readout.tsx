'use client';

import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import Bubble from '../viz/bubble';
import HalfMoon, { HALF_MOON_ASPECT } from '../viz/half-moon';
import HourlyClock from '../viz/hourly-clock';
import SegmentRing from '../viz/segment-ring';
import WaveOrb from '../viz/wave-orb';
import { intensityColor } from '../lib/intensity';
import type { Readout, ReadoutViz } from '../lib/readouts';
import { BASECAMP_MICRO_LABEL, BASECAMP_MUTED, BASECAMP_VIVID } from '../lib/theme';
import { formatCompactNumber, formatReadoutValue } from './format-value';
import Hint, { type HintRow } from './hint';

/**
 * Type size of the number inside a drawing, as a share of the diameter. A
 * drawing not listed here prints its number underneath instead.
 */
const INSIDE_FONT_SHARE: Partial<Record<ReadoutViz, number>> = { clock: 0.125, orb: 0.22, pie: 0.19 };
/** The pie is chunkier than a ring: its slices are the drawing. */
const PIE_STROKE = 15;
const PIE_GAP = 5;
/** Narrowest column a label can still be read in. */
const MIN_COLUMN_WIDTH = 52;

interface CircleReadoutProps {
  readout: Readout;
  /** Diameter, or width for the half-moon. */
  size: number;
  /**
   * Height of the box the drawing is centred in. Every drawing on a row gets
   * the hero's, so the circles share one centreline and the captions one
   * baseline whatever their diameters.
   */
  boxHeight?: number;
}

/**
 * One drawing floating on the card: the shape, its number inside where the
 * drawing leaves room and under it where it does not, its name under that,
 * and a popover that says what it counts.
 */
const CircleReadout = ({ readout, size, boxHeight }: CircleReadoutProps) => {
  const { t } = useTranslation('common_blog');
  const viz: ReadoutViz = readout.viz ?? 'bubble';
  const label = t(`basecamp.card.labels.${readout.id}`);
  const caption = t(`basecamp.card.labels.${readout.captionId ?? readout.id}`);
  const hint = t(`basecamp.card.hints.${readout.id}`);
  const base: [string, string] = [BASECAMP_VIVID[readout.colors[0]], BASECAMP_VIVID[readout.colors[1]]];
  // Colour always follows the real number; only how full the shape looks is
  // flipped, and only where `drain` says so.
  const colors: [string, string] =
    readout.weight === 'directional' && viz !== 'halfmoon'
      ? [intensityColor(readout.ratio, base[0]), intensityColor(readout.ratio, base[1])]
      : base;
  const fill = readout.drain ? 1 - readout.ratio : readout.ratio;

  const slices = (readout.segments ?? []).map((segment) => ({
    ...segment,
    hex:
      readout.weight === 'directional'
        ? intensityColor(segment.ratio, BASECAMP_VIVID[segment.color])
        : BASECAMP_VIVID[segment.color]
  }));
  const rows: HintRow[] = slices.map((slice) => ({
    color: slice.hex,
    label: t(`basecamp.card.labels.${slice.id}`),
    value: formatReadoutValue(t, slice)
  }));

  const isHalfMoon = viz === 'halfmoon';
  const height = isHalfMoon ? Math.round(size * HALF_MOON_ASPECT) : size;
  const insideShare = INSIDE_FONT_SHARE[viz];
  const valueClass = readout.known ? 'text-[#F4F5F8]' : cn(BASECAMP_MUTED, 'opacity-50');

  const drawing = () => {
    const shapes = slices.map((slice) => ({ ratio: slice.ratio, weight: slice.weight, color: slice.hex }));
    switch (viz) {
      case 'clock':
        return <HourlyClock hourlyCounts={readout.series ?? []} known={readout.known} size={size} colors={colors} />;
      case 'halfmoon':
        return <HalfMoon segments={shapes} width={size} known={readout.known} />;
      case 'pie':
        return <SegmentRing segments={shapes} size={size} known={readout.known} stroke={PIE_STROKE} gap={PIE_GAP} />;
      case 'orb':
        return <WaveOrb ratio={fill} colors={colors} known={readout.known} size={size} />;
      case 'bubble':
      default:
        return <Bubble ratio={fill} colors={colors} known={readout.known} size={size} />;
    }
  };

  const valueText = () => {
    if (!readout.known || readout.value === null) return formatReadoutValue(t, readout);
    if (viz === 'clock') return t('basecamp.card.values.of_total', { value: readout.value, total: readout.total });
    if (viz === 'pie') return formatCompactNumber(readout.value);
    return formatReadoutValue(t, readout);
  };

  const valueRow = isHalfMoon ? (
    <div className="flex items-center justify-center gap-1.5 leading-none" data-testid={`readout-value-${readout.id}`}>
      {slices.map((slice) => (
        <span
          key={slice.id}
          className="text-[10px] font-semibold tabular-nums"
          style={{ color: slice.known ? slice.hex : undefined, opacity: slice.known ? 1 : 0.4 }}
        >
          {formatReadoutValue(t, slice)}
        </span>
      ))}
    </div>
  ) : !insideShare ? (
    <span
      className={cn('text-[12px] font-semibold leading-none tabular-nums', valueClass)}
      data-testid={`readout-value-${readout.id}`}
    >
      {valueText()}
    </span>
  ) : null;

  return (
    <Hint title={label} body={hint} value={insideShare ? valueText() : undefined} rows={rows}>
      <div
        className="flex shrink-0 cursor-default flex-col items-center gap-1"
        style={{ width: Math.max(size, MIN_COLUMN_WIDTH) }}
        data-testid={`readout-${readout.id}`}
        data-readout-known={readout.known ? 'true' : 'false'}
        data-readout-ratio={readout.ratio.toFixed(3)}
      >
        <div className="flex flex-col items-center justify-center gap-0.5" style={{ height: boxHeight ?? height }}>
          <div className="relative" style={{ width: size, height }}>
            {drawing()}
            {insideShare ? (
              <span
                className={cn(
                  'pointer-events-none absolute inset-0 flex items-center justify-center font-semibold tabular-nums',
                  valueClass
                )}
                style={{
                  fontSize: Math.round(size * insideShare),
                  // The orb's number sits on the liquid, so it carries its own shadow.
                  textShadow: viz === 'orb' ? '0 1px 6px rgba(0, 0, 0, 0.55)' : undefined
                }}
                data-testid={`readout-value-${readout.id}`}
              >
                {valueText()}
              </span>
            ) : null}
          </div>
          {valueRow}
        </div>
        <span className={cn(BASECAMP_MICRO_LABEL, 'whitespace-nowrap text-center')}>{caption}</span>
      </div>
    </Hint>
  );
};

export default CircleReadout;
