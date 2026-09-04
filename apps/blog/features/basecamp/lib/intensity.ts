/**
 * Magnitude colouring.
 *
 * Some readouts have a direction: a bigger number means more of the thing
 * people are watching for — stake lent out, replies that are only bot
 * triggers, text repeated word for word. Those are drawn on a ramp that runs
 * from the group's own colour up through amber to a hot pink-red.
 *
 * The ramp is continuous on purpose. There is no threshold anywhere in it, so
 * there is no line an account crosses and no point at which the card starts
 * saying something. 40% is warmer than 20% because it is bigger, and that is
 * the whole claim. No badge, no word, no verdict — the reader still decides.
 *
 * INTENSITY_ENABLED is the single switch. Set it to false and every readout
 * goes back to its plain group colour with nothing else to change.
 */

export const INTENSITY_ENABLED = true;

/** Ramp stops. The base colour is passed in by the caller. */
const INTENSITY_MID_COLOR = '#FFC24D';
const INTENSITY_HIGH_COLOR = '#FF5470';
/** Where the base colour has fully become the mid colour. */
const MID_STOP = 0.5;

function clamp01(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return value > 1 ? 1 : value;
}

function parseHex(hex: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const int = parseInt(match[1], 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function toHex(channels: [number, number, number]): string {
  return `#${channels.map((c) => Math.round(clamp01(c / 255) * 255).toString(16).padStart(2, '0')).join('')}`;
}

function mix(from: [number, number, number], to: [number, number, number], t: number): [number, number, number] {
  return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, from[2] + (to[2] - from[2]) * t];
}

/**
 * The colour for a directional readout sitting at `ratio` (0-1) of its own
 * scale. Returns the base colour untouched when the ramp is switched off, when
 * the ratio is unusable, or for any readout the caller has not marked
 * directional.
 */
export function intensityColor(ratio: number, baseColor: string): string {
  if (!INTENSITY_ENABLED) return baseColor;
  const base = parseHex(baseColor);
  const mid = parseHex(INTENSITY_MID_COLOR);
  const high = parseHex(INTENSITY_HIGH_COLOR);
  if (!base || !mid || !high) return baseColor;

  const t = clamp01(ratio);
  if (t <= MID_STOP) return toHex(mix(base, mid, t / MID_STOP));
  return toHex(mix(mid, high, (t - MID_STOP) / (1 - MID_STOP)));
}
