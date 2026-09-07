/**
 * How big everything on a postcard is drawn, by how wide the feed is.
 *
 * The row must never wrap on a desktop — a card that folds its right half
 * onto a second line is a card with a hole in it — and it must never overflow
 * either: a flower hanging past the card's edge is worse than a fold. So the
 * drawings step down together as the feed narrows, the post takes whatever
 * width is left, and only when the narrowest row still cannot fit does the
 * card fold on purpose, into two full lines. Pure: no React.
 */

export type PostcardTierName = 'regular' | 'compact' | 'tight' | 'narrow' | 'stacked';

export interface PostcardTier {
  name: PostcardTierName;
  /** Diameter of each drawing; width for the half-moon. */
  drawings: Record<string, number>;
  /** The hero's diameter. Every drawing's column is this tall, so their names share one baseline. */
  hero: number;
  /** Between drawings. */
  drawingGap: number;
  /** Narrowest column a drawing gets, so its name underneath has room; the small drawings sit in columns this wide. */
  column: number;
  /** Type size of the name under each drawing. A point smaller where the columns are narrow, so two long names never meet. */
  caption: number;
  /** Between the three zones: post, drawings, flower. */
  zoneGap: number;
  flower: number;
  /** The three rings on the identity line. */
  rings: number;
  /** The post zone is the one elastic thing on the row; this is what it asks for before growing. */
  postMinWidth: number;
  /** ...and what it gives way down to before the row would fold. */
  postFloor: number;
  /** Folded: the post and the flower on the first line, the five drawings spread across the second. */
  stacked: boolean;
}

/** Past this the post stops growing and the slack splits between the zone gaps. */
export const POST_MAX_WIDTH = 380;
export const DEFAULT_DRAWING_SIZE = 48;
/** The card's own horizontal padding and border, which the row's contents sit inside. Matches POSTCARD_CLASS. */
export const CARD_CHROME_WIDTH = 26;

/**
 * The post zone's floor: the picture plus a title column that can still hold
 * a word. The name line above it prints whole whatever the width; a very long
 * name on a very narrow feed runs a few pixels into the gap beside it, which
 * beats reserving that room on every card for the one name in a hundred.
 */
const POST_FLOOR = 176;
const POST_FLOOR_NARROW = 168;

/**
 * Four row sizes, not a slider: hero, mid, small keep the same ratio in each,
 * so the row reads the same at every width. Hero is at least one and a half
 * times the mids; only the clock and the flower pass a hundred pixels. The
 * stacked tier draws at the tight size but folds the row.
 */
export const POSTCARD_TIERS: Record<PostcardTierName, PostcardTier> = {
  regular: {
    name: 'regular',
    drawings: { hours_written: 96, reply_mix: 92, stake_mix: 60, ke_score: 60, account_age_days: 48 },
    hero: 96,
    drawingGap: 16,
    column: 52,
    caption: 10,
    zoneGap: 24,
    flower: 112,
    rings: 44,
    postMinWidth: 272,
    postFloor: POST_FLOOR,
    stacked: false
  },
  compact: {
    name: 'compact',
    drawings: { hours_written: 84, reply_mix: 80, stake_mix: 54, ke_score: 54, account_age_days: 44 },
    hero: 84,
    drawingGap: 12,
    column: 52,
    caption: 10,
    zoneGap: 18,
    flower: 104,
    rings: 40,
    postMinWidth: 244,
    postFloor: POST_FLOOR,
    stacked: false
  },
  tight: {
    name: 'tight',
    drawings: { hours_written: 72, reply_mix: 68, stake_mix: 48, ke_score: 48, account_age_days: 40 },
    hero: 72,
    drawingGap: 10,
    column: 52,
    caption: 10,
    zoneGap: 14,
    flower: 96,
    rings: 36,
    postMinWidth: 220,
    postFloor: POST_FLOOR,
    stacked: false
  },
  narrow: {
    name: 'narrow',
    drawings: { hours_written: 64, reply_mix: 64, stake_mix: 44, ke_score: 44, account_age_days: 36 },
    hero: 64,
    drawingGap: 8,
    column: 44,
    caption: 9,
    zoneGap: 10,
    flower: 88,
    rings: 36,
    postMinWidth: 200,
    postFloor: POST_FLOOR_NARROW,
    stacked: false
  },
  stacked: {
    name: 'stacked',
    drawings: { hours_written: 72, reply_mix: 68, stake_mix: 48, ke_score: 48, account_age_days: 40 },
    hero: 72,
    drawingGap: 10,
    column: 52,
    caption: 10,
    zoneGap: 14,
    flower: 96,
    rings: 36,
    postMinWidth: 220,
    postFloor: POST_FLOOR_NARROW,
    stacked: true
  }
};

/** The narrowest feed a tier's row fits in without folding or spilling: the post at its floor, everything else at size. */
export function minRowWidth(tier: PostcardTier): number {
  const columns = Object.values(tier.drawings).map((size) => Math.max(size, tier.column));
  const drawings = columns.reduce((sum, width) => sum + width, 0) + tier.drawingGap * Math.max(columns.length - 1, 0);
  return tier.postFloor + tier.zoneGap * 2 + drawings + tier.flower + CARD_CHROME_WIDTH;
}

/**
 * Feed widths under which the next tier down is used. A feed just under a
 * tier's comfortable width still gets it: the drawings stay at size and the
 * post gives up a little title width, which reads better than smaller
 * drawings with a wider, emptier post. Each threshold sits above the tier's
 * own minimum, so a row is never asked to fit where it cannot.
 */
const COMPACT_BELOW_WIDTH = 840;
const TIGHT_BELOW_WIDTH = 760;
const NARROW_BELOW_WIDTH = 680;
const STACK_BELOW_WIDTH = minRowWidth(POSTCARD_TIERS.narrow);

/** An unmeasured feed (the server render) is drawn at full size. */
export function postcardTierFor(feedWidth: number): PostcardTier {
  if (feedWidth <= 0) return POSTCARD_TIERS.regular;
  if (feedWidth < STACK_BELOW_WIDTH) return POSTCARD_TIERS.stacked;
  if (feedWidth < NARROW_BELOW_WIDTH) return POSTCARD_TIERS.narrow;
  if (feedWidth < TIGHT_BELOW_WIDTH) return POSTCARD_TIERS.tight;
  if (feedWidth < COMPACT_BELOW_WIDTH) return POSTCARD_TIERS.compact;
  return POSTCARD_TIERS.regular;
}
