import type { Readout } from '../lib/readouts';

export type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

const UNKNOWN_KEY = 'basecamp.signals.value_unknown';

/**
 * Turns a readout into the short string printed under its drawing, driven only
 * by the unit token. An unknown value is a placeholder, never a zero: a card
 * whose history has not loaded must not read as an account that did nothing.
 */
export function formatReadoutValue(
  t: TranslateFn,
  readout: Pick<Readout, 'known' | 'value' | 'unit' | 'floor'>
): string {
  if (!readout.known || readout.value === null) return t(UNKNOWN_KEY);
  const value = readout.value;
  // A capped read is a floor, and says so in full rather than printing a total
  // it cannot stand behind.
  if (readout.floor) return t('basecamp.card.values.at_least', { value: value.toLocaleString() });
  switch (readout.unit) {
    case 'days':
      return t('basecamp.signals.units.days', { value });
    case 'per_day':
      return t('basecamp.signals.units.per_day', { value });
    case 'percent':
      return t('basecamp.signals.units.percent', { value });
    case 'boolean':
      return value > 0 ? t('basecamp.signals.units.boolean_true') : t('basecamp.signals.units.boolean_false');
    case 'count':
      return t('basecamp.signals.units.count', { value });
    case 'hive_power':
      return t('basecamp.signals.units.hive_power', { value: value.toLocaleString() });
    case 'hive':
      return t('basecamp.signals.units.hive', { value: formatTokenAmount(value) });
    case 'ratio':
      return t('basecamp.signals.units.ratio', { value: value.toFixed(2) });
    case 'none':
    default:
      return t('basecamp.signals.units.none', { value });
  }
}

/**
 * A number squeezed to fit inside a drawing: 1,204 becomes 1.2K. Only for the
 * figure in the middle of a circle; the popover beside it prints it in full.
 */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

/** The smallest HBD figure worth printing; under it, the amount is given as a bound. */
const HBD_SMALLEST = 0.001;

/**
 * How an HBD amount should be printed: the digits, and which of three
 * sentences they belong in.
 *
 * The bound is kept apart from the digits on purpose. A "<" folded into the
 * value would be escaped by i18next and print as `&lt;`, so the sign has to
 * live in the translation itself, where it is literal text.
 */
export interface HbdReading {
  value: string;
  /** 'plain' prints the figure; 'under' and 'over_negative' bound one too small to state. */
  kind: 'plain' | 'under' | 'over_negative';
}

/**
 * An HBD amount, with as many decimals as the size of it warrants: whole
 * numbers stay readable at a glance and a vote worth a fraction of a cent is
 * bounded rather than rounded away to nothing. The currency mark is added by
 * the caller's translation, not here.
 */
export function formatHbdAmount(value: number): HbdReading {
  if (!Number.isFinite(value)) return { value: '', kind: 'plain' };
  const size = Math.abs(value);
  if (size > 0 && size < HBD_SMALLEST) {
    return { value: HBD_SMALLEST.toFixed(3), kind: value < 0 ? 'over_negative' : 'under' };
  }
  const decimals = size >= 1000 ? 0 : size >= 1 ? 2 : 3;
  return {
    value: value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }),
    kind: 'plain'
  };
}

/**
 * The number as printed on a petal: room for three or four glyphs, so units
 * shrink to a letter and a pair loses its spaces. The popover beside it
 * prints the same reading in full.
 */
export function formatPetalValue(
  t: TranslateFn,
  readout: Pick<Readout, 'known' | 'value' | 'unit' | 'pair' | 'floor'>
): string {
  if (!readout.known) return t(UNKNOWN_KEY);
  if (readout.pair)
    return t('basecamp.card.values.pair_short', { first: readout.pair[0], second: readout.pair[1] });
  if (readout.value === null) return t(UNKNOWN_KEY);
  if (readout.floor) {
    return t('basecamp.card.values.at_least_short', { value: formatCompactNumber(readout.value) });
  }
  switch (readout.unit) {
    case 'days':
      return t('basecamp.card.values.days_short', { value: readout.value });
    case 'per_day':
      return t('basecamp.card.values.per_day_short', { value: readout.value });
    case 'count':
      return formatCompactNumber(readout.value);
    default:
      return formatReadoutValue(t, readout);
  }
}

/**
 * A plain token amount — HIVE, HBD or HP — with as many decimals as its size
 * warrants. Large sums stay readable at a glance and a small one keeps its
 * digits. The unit name is added by the caller's translation, not here.
 */
export function formatTokenAmount(value: number): string {
  if (!Number.isFinite(value)) return '';
  // Nothing at all is "0", not "0.000": trailing zeroes on an empty figure
  // read as a precise measurement of nothing.
  if (value === 0) return '0';
  const size = Math.abs(value);
  const decimals = size >= 1000 ? 0 : size >= 1 ? 2 : 3;
  return value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
