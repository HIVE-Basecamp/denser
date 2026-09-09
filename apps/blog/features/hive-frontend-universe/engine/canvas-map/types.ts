import type { TargetKind } from '../../lib/targets';

/**
 * The few shapes the frame loop and the React shell both need to name. They
 * were inline type arguments inside one component until the tidy-up for dev
 * review; the text is the same, it just has a name now.
 */

/** What the bug is DRAWN riding (null when walking). Cosmetic transport only:
 *  the player's edge-and-fraction position is never touched mid-ride. */
export type RideState =
  | { type: 'wheel'; node: number; cx: number; cy: number; startAngle: number }
  | {
      type: 'beam';
      /** Where the lane caught the bug; the ride starts and ends here. */
      gx: number;
      gy: number;
      x: number;
      baseY: number;
      topY: number;
      /** Glide (grab point to base) and climb (base to crown) lengths. */
      glide: number;
      climb: number;
      /** Seconds for the full one-way trip, scaled to its length. */
      dur: number;
      t: number;
      /** 1 riding up, -1 riding back down. */
      dir: 1 | -1;
      met: boolean;
      name: string;
      title: string;
      href: string;
    }
  | null;

/** The hover chip: what the cursor is over, and where to put the chip. */
export type HoverInfo = { title: string; kind: TargetKind; sx: number; sy: number } | null;

/** A clicked or beam-visited witness citadel, which has no world node. */
export type WitnessCard = {
  title: string;
  href: string | null;
  /** Real chain stats, shown after a beam visit reaches the crown. */
  stats?: { label: string; value: string }[];
} | null;

/** Today's double-token zone, picked from the UTC day number. */
export type BuzzZone = { x: number; y: number; r: number; landmarkId: string } | null;
