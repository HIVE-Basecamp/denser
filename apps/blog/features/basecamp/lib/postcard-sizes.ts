/**
 * How big everything on a postcard is drawn, by how wide the feed is.
 *
 * The row must never wrap — a card that folds its right half onto a second
 * line is a card with a hole in it — so the drawings step down together when
 * the feed narrows, and the post takes whatever width is left. Pure: no React.
 */

export type PostcardTierName = 'regular' | 'compact' | 'tight';

export interface PostcardTier {
  name: PostcardTierName;
  /** Diameter of each drawing; width for the half-moon. */
  drawings: Record<string, number>;
  /** The hero's diameter. Every drawing's column is this tall, so their names share one baseline. */
  hero: number;
  /** Between drawings. */
  drawingGap: number;
  /** Between the three zones: post, drawings, flower. */
  zoneGap: number;
  flower: number;
  /** The post zone is the one elastic thing on the row; this is what it asks for before growing. */
  postMinWidth: number;
}

/** Past this the post stops growing and the slack splits between the zone gaps. */
export const POST_MAX_WIDTH = 380;
/**
 * The post gives way before the row folds: if a feed is narrower than a tier
 * expects, the title loses width down to this rather than the flower dropping
 * to a second line.
 */
export const POST_FLOOR_WIDTH = 176;
export const DEFAULT_DRAWING_SIZE = 48;

/**
 * Three tiers, not a slider: hero, mid, small keep the same ratio in each, so
 * the row reads the same at every width. Hero is at least one and a half
 * times the mids; only the clock and the flower pass a hundred pixels.
 */
export const POSTCARD_TIERS: Record<PostcardTierName, PostcardTier> = {
  regular: {
    name: 'regular',
    drawings: { hours_written: 96, reply_mix: 92, stake_mix: 60, ke_score: 60, account_age_days: 48 },
    hero: 96,
    drawingGap: 16,
    zoneGap: 24,
    flower: 112,
    postMinWidth: 272
  },
  compact: {
    name: 'compact',
    drawings: { hours_written: 84, reply_mix: 80, stake_mix: 54, ke_score: 54, account_age_days: 44 },
    hero: 84,
    drawingGap: 12,
    zoneGap: 18,
    flower: 104,
    postMinWidth: 244
  },
  tight: {
    name: 'tight',
    drawings: { hours_written: 72, reply_mix: 68, stake_mix: 48, ke_score: 48, account_age_days: 40 },
    hero: 72,
    drawingGap: 10,
    zoneGap: 14,
    flower: 96,
    postMinWidth: 220
  }
};

/**
 * Feed widths under which the next tier down is used. A feed just under the
 * regular tier's comfortable width still gets it: the drawings stay full size
 * and the post gives up a little title width, which reads better than smaller
 * drawings with a wider, emptier post.
 */
const COMPACT_BELOW_WIDTH = 840;
const TIGHT_BELOW_WIDTH = 760;

/** An unmeasured feed (the server render) is drawn at full size. */
export function postcardTierFor(feedWidth: number): PostcardTier {
  if (feedWidth <= 0) return POSTCARD_TIERS.regular;
  if (feedWidth < TIGHT_BELOW_WIDTH) return POSTCARD_TIERS.tight;
  if (feedWidth < COMPACT_BELOW_WIDTH) return POSTCARD_TIERS.compact;
  return POSTCARD_TIERS.regular;
}
