import type { Readout } from '../lib/readouts';

export type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

const UNKNOWN_KEY = 'basecamp.signals.value_unknown';

/**
 * Turns a readout into the short string printed under its drawing, driven only
 * by the unit token. An unknown value is a placeholder, never a zero: a card
 * whose history has not loaded must not read as an account that did nothing.
 */
export function formatReadoutValue(t: TranslateFn, readout: Pick<Readout, 'known' | 'value' | 'unit'>): string {
  if (!readout.known || readout.value === null) return t(UNKNOWN_KEY);
  const value = readout.value;
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

/**
 * The number as printed on a petal: room for three or four glyphs, so units
 * shrink to a letter and a pair loses its spaces. The popover beside it
 * prints the same reading in full.
 */
export function formatPetalValue(t: TranslateFn, readout: Pick<Readout, 'known' | 'value' | 'unit' | 'pair'>): string {
  if (!readout.known) return t(UNKNOWN_KEY);
  if (readout.pair) return t('basecamp.card.values.pair_short', { first: readout.pair[0], second: readout.pair[1] });
  if (readout.value === null) return t(UNKNOWN_KEY);
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
