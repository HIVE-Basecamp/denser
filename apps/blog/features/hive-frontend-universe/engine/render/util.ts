import type { Vec2 } from '../movement';

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
export function clamp(v: number, a: number, b: number): number {
  return v < a ? a : v > b ? b : v;
}
/** Small deterministic hash → [0,1), for star specks and blob shapes. */
export function hash2(a: number, b: number): number {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export const scratch: Vec2 = { x: 0, y: 0 };

/** Planning-grid geometry: 26 lettered columns over the full map extent. */
export const GRID_CELL = 700;
export const GRID_EXT = 9100;

/** The grid box a world point sits in, as its "G-17" style name. */
export function gridCellName(x: number, y: number): string {
  const ci = Math.max(0, Math.min(25, Math.floor((x + GRID_EXT) / GRID_CELL)));
  const ri = Math.max(0, Math.min(25, Math.floor((y + GRID_EXT) / GRID_CELL)));
  return `${String.fromCharCode(65 + ci)}-${ri + 1}`;
}
