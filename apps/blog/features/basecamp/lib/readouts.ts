/**
 * The card's readout table: every reading shown about a person, and the shape
 * chosen for it.
 *
 * Pure, like signals.ts and patterns.ts — no React, no network, no
 * user-facing English. It takes computed signals and patterns and returns the
 * readouts in the order they are drawn, each carrying the one thing a drawing
 * needs that a bare number does not: where the value sits on its own scale.
 *
 * Five things are drawn, because in each case the shape says something the
 * number cannot; one is a row of dots; five are petals of one flower, each
 * opening as far as its own number, with the account's creator in the middle.
 * Every scale here is a product choice, not a chain limit; it decides how full
 * a shape looks, never what the number means.
 */

import type { CommentPatterns } from './patterns';
import { PROFILE_FIELD_COUNT, type SignalUnit, type SignalValue } from './signals';
import type { BasecampVividKey } from './theme';

/**
 * 'circle': one of the five drawings. 'petal': one petal of the flower, a
 * number on a coloured petal that opens with its value. 'core': the flower's
 * middle. 'pips': a row of dots that sits on the identity line.
 */
export type ReadoutDisplay = 'circle' | 'petal' | 'core' | 'pips';
export type ReadoutViz = 'clock' | 'halfmoon' | 'pie' | 'orb' | 'bubble';

/**
 * 'directional' readouts are drawn on the magnitude ramp in lib/intensity.ts:
 * bigger is warmer. Marking one directional is a claim that people watch the
 * number's direction, never a claim about the person.
 */
export type ReadoutWeight = 'plain' | 'directional';

/** One slice of a segmented ring. */
export interface ReadoutSegment {
  id: string;
  /** 0-1: how much of this slice's own slot is lit. */
  ratio: number;
  /** Share of the circle this slice takes, relative to its siblings. */
  weight: number;
  value: number | null;
  unit: SignalUnit;
  known: boolean;
  color: BasecampVividKey;
}

export interface Readout {
  id: string;
  display: ReadoutDisplay;
  viz?: ReadoutViz;
  /** Label id printed under the drawing when it is not the readout's own — the pie is named for the number in its middle. */
  captionId?: string;
  weight: ReadoutWeight;
  /**
   * A drawing that empties as its number climbs, rather than filling. A full
   * circle is the restful shape, so on the readouts people watch for
   * extraction the card is full and calm when there is little of it and drains
   * as there is more. The number beside it is unchanged; no word is added.
   */
  drain?: boolean;
  /** False when the lookup never produced an answer. Never rendered as zero. */
  known: boolean;
  value: number | null;
  unit: SignalUnit;
  /** 0-1 position on this readout's own scale, for the drawing only. */
  ratio: number;
  /** Two palette stops for the drawing. */
  colors: [BasecampVividKey, BasecampVividKey];
  /** 'clock': twenty-four hourly counts. */
  series?: number[];
  total?: number;
  /** A pair printed side by side. */
  pair?: [number, number];
  /** A username rather than a measurement. */
  text?: string | null;
  /** 'segments': the slices. */
  segments?: ReadoutSegment[];
}

/** Hive Power the account holds, lends and borrows, already converted. */
export interface StakeInput {
  kept: number | null;
  lentOut: number | null;
  lentIn: number | null;
}

/** A year is where "new user" ends, so it is where the age ring closes. */
export const AGE_SCALE_MAX_DAYS = 365;
export const KE_SCALE_MAX = 10;
export const PERCENT_MAX = 100;
export const HOURS_IN_DAY = 24;
/**
 * How far each petal opens. A count of everything ever written runs on a log
 * scale, so the first hundred actions open the petal as much as the next nine
 * hundred; the rest are straight shares.
 */
export const PETAL_SCALE_MAX = {
  total_actions: 1000,
  actions_per_day: 10,
  week_activity: 20,
  reply_targets: 30,
  gap_before_post: 30
} as const;

function clamp01(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return value > 1 ? 1 : value;
}

/** Straight share of a scale. */
export function linearRatio(value: number | null, max: number): number {
  if (value === null || !Number.isFinite(value) || max <= 0) return 0;
  return clamp01(value / max);
}

/** Share of a scale on a log curve: small counts move the shape, big ones only nudge it. */
export function logRatio(value: number | null, max: number): number {
  if (value === null || !Number.isFinite(value) || max <= 0) return 0;
  return clamp01(Math.log10(1 + Math.max(value, 0)) / Math.log10(1 + max));
}

function signalOf(signals: Record<string, SignalValue>, id: string): { known: boolean; value: number | null; unit: SignalUnit } {
  const signal: SignalValue | undefined = signals[id];
  const known = Boolean(signal?.known) && signal?.value !== null;
  return { known, value: known && signal ? signal.value : null, unit: signal?.unit ?? 'none' };
}

function percentSegment(id: string, value: number | null, known: boolean, color: BasecampVividKey): ReadoutSegment {
  const isKnown = known && value !== null && Number.isFinite(value);
  return {
    id,
    ratio: isKnown ? linearRatio(value, PERCENT_MAX) : 0,
    weight: 1,
    value: isKnown ? value : null,
    unit: 'percent',
    known: isKnown,
    color
  };
}

function stakeSegment(id: string, hp: number | null, color: BasecampVividKey): ReadoutSegment {
  const known = hp !== null && Number.isFinite(hp) && hp >= 0;
  return { id, ratio: 1, weight: known ? hp : 0, value: known ? Math.round(hp) : null, unit: 'hive_power', known, color };
}

function petal(
  id: string,
  signals: Record<string, SignalValue>,
  color: BasecampVividKey,
  ratio: (value: number) => number
): Readout {
  const { known, value, unit } = signalOf(signals, id);
  return {
    id,
    display: 'petal',
    weight: 'plain',
    known,
    value,
    unit,
    ratio: known && value !== null ? clamp01(ratio(value)) : 0,
    colors: [color, color]
  };
}

/**
 * Builds every readout on the card, in the order they are drawn. The caller
 * computes the signals and converts the stake; nothing here fetches or formats.
 */
export function buildReadouts(
  signals: Record<string, SignalValue>,
  patterns: CommentPatterns,
  createdBy: string | null,
  stake: StakeInput
): Readout[] {
  const ke = signalOf(signals, 'ke_score');
  const age = signalOf(signals, 'account_age_days');
  const profile = signalOf(signals, 'profile_completeness');
  const activeHp = signalOf(signals, 'active_hive_power');
  const profileFilled =
    profile.known && profile.value !== null ? Math.round((profile.value / PERCENT_MAX) * PROFILE_FIELD_COUNT) : 0;

  return [
    // When they write. The best drawing on the card, and drawn largest.
    {
      id: 'hours_written',
      display: 'circle',
      viz: 'clock',
      weight: 'plain',
      known: patterns.known,
      value: patterns.known ? patterns.activeHourCount : null,
      unit: 'count',
      ratio: linearRatio(patterns.activeHourCount, HOURS_IN_DAY),
      colors: ['cyan', 'violet'],
      series: patterns.hourlyCounts,
      total: HOURS_IN_DAY
    },
    // What their replies are made of: four shares of the same kind, one
    // section of a half-moon each, every section lit to its own percentage.
    {
      id: 'reply_mix',
      display: 'circle',
      viz: 'halfmoon',
      weight: 'directional',
      known: patterns.known,
      value: null,
      unit: 'none',
      ratio: 0,
      colors: ['orange', 'pink'],
      segments: [
        percentSegment('repeated_text', patterns.duplicatePercent, patterns.known, 'orange'),
        percentSegment('bot_commands', patterns.botCommandPercent, patterns.known, 'yellow'),
        percentSegment('self_replies', patterns.selfReplyPercent, patterns.known, 'pink'),
        percentSegment('self_votes', patterns.selfVotePercent, patterns.known, 'violet')
      ]
    },
    // Where their stake is: kept, lent out, lent in — parts of one whole, so a
    // real pie. The centre shows what they actually wield.
    {
      id: 'stake_mix',
      display: 'circle',
      viz: 'pie',
      captionId: 'active_hive_power',
      weight: 'plain',
      known: activeHp.known,
      value: activeHp.value,
      unit: activeHp.unit,
      ratio: 0,
      colors: ['blue', 'orange'],
      segments: [
        stakeSegment('stake_kept', stake.kept, 'blue'),
        stakeSegment('stake_out', stake.lentOut, 'orange'),
        stakeSegment('stake_in', stake.lentIn, 'pink')
      ]
    },
    // Lifetime rewards over stake. Drains as it climbs.
    {
      id: 'ke_score',
      display: 'circle',
      viz: 'orb',
      weight: 'directional',
      drain: true,
      known: ke.known,
      value: ke.value,
      unit: ke.unit,
      ratio: ke.known ? linearRatio(ke.value, KE_SCALE_MAX) : 0,
      colors: ['violet', 'orange']
    },
    // Days on Hive: a bubble that grows across the first year.
    {
      id: 'account_age_days',
      display: 'circle',
      viz: 'bubble',
      weight: 'plain',
      known: age.known,
      value: age.value,
      unit: age.unit,
      ratio: age.known ? linearRatio(age.value, AGE_SCALE_MAX_DAYS) : 0,
      colors: ['lime', 'cyan']
    },
    // Six profile fields, one dot each, lit or dark, on the identity line.
    {
      id: 'profile_completeness',
      display: 'pips',
      weight: 'plain',
      known: profile.known,
      value: profile.value,
      unit: profile.unit,
      ratio: profile.known ? linearRatio(profile.value, PERCENT_MAX) : 0,
      colors: ['lime', 'lime'],
      segments: Array.from({ length: PROFILE_FIELD_COUNT }, (_, index) => ({
        id: `profile_field_${index}`,
        ratio: index < profileFilled ? 1 : 0,
        weight: 1,
        value: null,
        unit: 'none' as const,
        known: profile.known,
        color: 'lime' as const
      }))
    },

    // The flower. Five petals, clockwise from the top, every neighbour a
    // different temperature so each reads as its own; the creator in the middle.
    petal('total_actions', signals, 'violet', (value) => logRatio(value, PETAL_SCALE_MAX.total_actions)),
    petal('actions_per_day', signals, 'lime', (value) => linearRatio(value, PETAL_SCALE_MAX.actions_per_day)),
    {
      id: 'week_activity',
      display: 'petal',
      weight: 'plain',
      known: patterns.known,
      value: patterns.known ? patterns.postCount7d : null,
      unit: 'count',
      ratio: patterns.known
        ? linearRatio(patterns.postCount7d + patterns.replyCount7d, PETAL_SCALE_MAX.week_activity)
        : 0,
      colors: ['pink', 'pink'],
      pair: [patterns.postCount7d, patterns.replyCount7d]
    },
    {
      id: 'reply_targets',
      display: 'petal',
      weight: 'plain',
      known: patterns.known,
      value: patterns.known ? patterns.distinctReplyTargets : null,
      unit: 'count',
      ratio: patterns.known ? linearRatio(patterns.distinctReplyTargets, PETAL_SCALE_MAX.reply_targets) : 0,
      colors: ['cyan', 'cyan']
    },
    petal('gap_before_post', signals, 'orange', (value) => linearRatio(value, PETAL_SCALE_MAX.gap_before_post)),
    {
      id: 'created_by',
      display: 'core',
      weight: 'plain',
      known: createdBy !== null,
      value: null,
      unit: 'none',
      ratio: 0,
      colors: ['violet', 'violet'],
      text: createdBy
    }
  ];
}
