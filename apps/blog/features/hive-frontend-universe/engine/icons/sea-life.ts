/* --------------------- the stake ladder, alive --------------------- */
/**
 * H.I.V.E.R. - the creatures in the water.
 *
 * Hive already names its stake ladder after sea life and `lib/board.ts`
 * carries the rungs: plankton, redfish, dolphin, orca, whale. Now that the
 * planet has a sea, the ladder swims in it. Redfish and dolphins are
 * company. The orca and the whale are the big holders, and they eat.
 *
 * Every creature is drawn facing RIGHT at the origin and mirrored by `dir`,
 * in the chunky sticker style the fictional places use: thick dark outline,
 * flat fill, a pale belly. `gape` opens the jaw, 0 shut to 1 wide, which is
 * the whole swallow animation; only the two hunters have one.
 *
 * Sizes are given as HALF BODY LENGTH in world px, so a `size` of 240 is a
 * creature roughly 480px nose to tail.
 */

export type SeaKind = 'redfish' | 'dolphin' | 'orca' | 'whale';

const OUTLINE = '#0a0713';
/** Mouth interior, shared by both hunters. */
const GULLET = '#7c1f3a';

/** Fill then outline, the sticker recipe, at the current path. */
function sticker(ctx: CanvasRenderingContext2D, fill: string, lw: number): void {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

/** The notched tail every one of them wears, at the tail stock. */
function flukes(ctx: CanvasRenderingContext2D, s: number, stock: number, spread: number, fill: string, lw: number): void {
  ctx.beginPath();
  ctx.moveTo(-s * stock, 0);
  ctx.quadraticCurveTo(-s * (stock + 0.25), -s * spread * 0.7, -s * (stock + 0.42), -s * spread);
  ctx.quadraticCurveTo(-s * (stock + 0.2), -s * spread * 0.25, -s * (stock + 0.14), 0);
  ctx.quadraticCurveTo(-s * (stock + 0.2), s * spread * 0.25, -s * (stock + 0.42), s * spread);
  ctx.quadraticCurveTo(-s * (stock + 0.25), s * spread * 0.7, -s * stock, 0);
  ctx.closePath();
  sticker(ctx, fill, lw);
}

/** One eye: white ring, dark pupil, catchlight. */
function eye(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 6.283);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + r * 0.15, y, r * 0.58, 0, 6.283);
  ctx.fillStyle = '#0a0713';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + r * 0.42, y - r * 0.32, r * 0.22, 0, 6.283);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}

/**
 * The open jaw: a wedge hinged behind the snout that swings down with
 * `gape`. The dark gullet opens first, the lower jaw itself hangs below it
 * in the body's own colour, and the lining goes on last: teeth for the orca,
 * a curtain of baleen for the whale. Drawn over the head, so the head keeps
 * its own outline when the mouth is shut.
 */
function jaw(
  ctx: CanvasRenderingContext2D,
  s: number,
  gape: number,
  hinge: number,
  reach: number,
  teeth: number,
  lw: number,
  bodyFill: string,
  maxA: number
): void {
  if (gape <= 0.02) return;
  const a = gape * maxA;
  const L = s * reach;
  ctx.save();
  ctx.translate(s * hinge, s * 0.05);

  // The gullet: everything between the fixed upper jaw and the swung lower.
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.03);
  ctx.lineTo(L, -s * 0.05);
  ctx.quadraticCurveTo(L * 0.6, Math.sin(a) * L * 0.4, Math.cos(a) * L, Math.sin(a) * L);
  ctx.closePath();
  ctx.fillStyle = GULLET;
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // The lower jaw hanging under it, a tapered strip in the body's colour.
  ctx.save();
  ctx.rotate(a);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(L, s * 0.02);
  ctx.quadraticCurveTo(L * 0.6, s * 0.3, 0, s * 0.22);
  ctx.closePath();
  sticker(ctx, bodyFill, lw);
  ctx.restore();

  if (teeth > 0) {
    // Teeth along both jaws, pointing into the mouth.
    const th = s * 0.075;
    ctx.fillStyle = '#fdfbff';
    for (let i = 1; i <= teeth; i++) {
      const f = i / (teeth + 1);
      ctx.beginPath();
      ctx.moveTo(L * f - th * 0.5, -s * 0.045);
      ctx.lineTo(L * f + th * 0.5, -s * 0.045);
      ctx.lineTo(L * f, -s * 0.045 + th);
      ctx.closePath();
      ctx.fill();
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(L * f - th * 0.5, 0);
      ctx.lineTo(L * f + th * 0.5, 0);
      ctx.lineTo(L * f, -th);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  } else {
    // Baleen: a curtain of fine plates hanging from the upper jaw. The
    // whale does not chew, which is exactly why being swallowed by one is
    // funnier than being bitten by the orca.
    ctx.strokeStyle = 'rgba(232, 226, 214, 0.75)';
    ctx.lineWidth = Math.max(1, s * 0.016);
    for (let i = 1; i <= 14; i++) {
      const f = i / 15;
      ctx.beginPath();
      ctx.moveTo(L * f, -s * 0.04);
      ctx.lineTo(L * f, -s * 0.04 + Math.sin(f * Math.PI) * L * 0.22);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/* ------------------------------ redfish ------------------------------ */

/** The little one. No threat, just company in the water. */
export function drawRedfish(ctx: CanvasRenderingContext2D, s: number, time: number, seed: number): void {
  const lw = Math.max(1.2, s * 0.09);
  const wag = Math.sin(time * 5 + seed) * 0.22;
  ctx.beginPath();
  ctx.moveTo(s * 0.95, 0);
  ctx.quadraticCurveTo(s * 0.2, -s * 0.62, -s * 0.6, -s * 0.2);
  ctx.quadraticCurveTo(-s * 0.72, 0, -s * 0.6, s * 0.2);
  ctx.quadraticCurveTo(s * 0.2, s * 0.62, s * 0.95, 0);
  ctx.closePath();
  sticker(ctx, '#ff7a59', lw);
  // Dorsal and tail, both swinging with the wag.
  ctx.beginPath();
  ctx.moveTo(s * 0.1, -s * 0.42);
  ctx.lineTo(-s * 0.18, -s * 0.85);
  ctx.lineTo(-s * 0.4, -s * 0.24);
  ctx.closePath();
  sticker(ctx, '#e8542f', lw * 0.8);
  ctx.save();
  ctx.translate(-s * 0.6, 0);
  ctx.rotate(wag);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-s * 0.65, -s * 0.5);
  ctx.lineTo(-s * 0.5, 0);
  ctx.lineTo(-s * 0.65, s * 0.5);
  ctx.closePath();
  sticker(ctx, '#e8542f', lw * 0.8);
  ctx.restore();
  eye(ctx, s * 0.5, -s * 0.1, Math.max(1.4, s * 0.13));
}

/* ------------------------------ dolphin ------------------------------ */

/** Fast, curious, harmless. Rolls as it swims. */
export function drawDolphin(ctx: CanvasRenderingContext2D, s: number, time: number, seed: number): void {
  const lw = Math.max(1.4, s * 0.055);
  const wag = Math.sin(time * 3.4 + seed) * 0.26;
  ctx.save();
  ctx.translate(-s * 0.78, 0);
  ctx.rotate(wag);
  ctx.translate(s * 0.78, 0);
  flukes(ctx, s, 0.78, 0.42, '#3a93c7', lw);
  ctx.restore();
  // Body: long rostrum, melon brow, tapering stock.
  ctx.beginPath();
  ctx.moveTo(s * 1.0, s * 0.02);
  ctx.quadraticCurveTo(s * 0.72, -s * 0.12, s * 0.58, -s * 0.24);
  ctx.quadraticCurveTo(s * 0.1, -s * 0.44, -s * 0.34, -s * 0.28);
  ctx.quadraticCurveTo(-s * 0.66, -s * 0.16, -s * 0.8, -s * 0.06);
  ctx.lineTo(-s * 0.8, s * 0.06);
  ctx.quadraticCurveTo(-s * 0.4, s * 0.2, -s * 0.02, s * 0.36);
  ctx.quadraticCurveTo(s * 0.45, s * 0.42, s * 0.62, s * 0.16);
  ctx.quadraticCurveTo(s * 0.8, s * 0.1, s * 1.0, s * 0.02);
  ctx.closePath();
  sticker(ctx, '#4fb8f0', lw);
  // Pale belly.
  ctx.beginPath();
  ctx.moveTo(s * 0.6, s * 0.16);
  ctx.quadraticCurveTo(s * 0.1, s * 0.4, -s * 0.5, s * 0.16);
  ctx.quadraticCurveTo(s * 0.05, s * 0.24, s * 0.6, s * 0.04);
  ctx.closePath();
  ctx.fillStyle = 'rgba(226, 245, 255, 0.85)';
  ctx.fill();
  // Falcate dorsal, swept back.
  ctx.beginPath();
  ctx.moveTo(s * 0.02, -s * 0.36);
  ctx.quadraticCurveTo(-s * 0.14, -s * 0.9, -s * 0.44, -s * 0.78);
  ctx.quadraticCurveTo(-s * 0.3, -s * 0.5, -s * 0.3, -s * 0.28);
  ctx.closePath();
  sticker(ctx, '#3a93c7', lw * 0.9);
  // Pectoral.
  ctx.beginPath();
  ctx.moveTo(s * 0.3, s * 0.22);
  ctx.quadraticCurveTo(s * 0.05, s * 0.62, -s * 0.16, s * 0.5);
  ctx.quadraticCurveTo(s * 0.02, s * 0.34, s * 0.3, s * 0.22);
  ctx.closePath();
  sticker(ctx, '#3a93c7', lw * 0.9);
  // The smile, and the eye.
  ctx.beginPath();
  ctx.moveTo(s * 0.96, s * 0.03);
  ctx.quadraticCurveTo(s * 0.74, s * 0.1, s * 0.6, s * 0.1);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = lw;
  ctx.stroke();
  eye(ctx, s * 0.5, -s * 0.12, Math.max(1.6, s * 0.09));
}

/* -------------------------------- orca -------------------------------- */

/** The first hunter. Tall fin, white patches, and it will take the bug. */
export function drawOrca(ctx: CanvasRenderingContext2D, s: number, time: number, seed: number, gape: number): void {
  const lw = Math.max(1.6, s * 0.05);
  const wag = Math.sin(time * 2.6 + seed) * 0.22;
  ctx.save();
  ctx.translate(-s * 0.86, 0);
  ctx.rotate(wag);
  ctx.translate(s * 0.86, 0);
  flukes(ctx, s, 0.86, 0.5, '#15121c', lw);
  ctx.restore();
  // Body.
  ctx.beginPath();
  ctx.moveTo(s * 0.98, -s * 0.04);
  ctx.quadraticCurveTo(s * 0.7, -s * 0.36, s * 0.2, -s * 0.42);
  ctx.quadraticCurveTo(-s * 0.4, -s * 0.44, -s * 0.88, -s * 0.12);
  ctx.lineTo(-s * 0.88, s * 0.12);
  ctx.quadraticCurveTo(-s * 0.4, s * 0.46, s * 0.2, s * 0.46);
  ctx.quadraticCurveTo(s * 0.74, s * 0.42, s * 0.98, s * 0.12);
  ctx.closePath();
  sticker(ctx, '#15121c', lw);
  // White belly, from the chin to under the stock.
  ctx.beginPath();
  ctx.moveTo(s * 0.82, s * 0.2);
  ctx.quadraticCurveTo(s * 0.2, s * 0.46, -s * 0.5, s * 0.3);
  ctx.quadraticCurveTo(-s * 0.72, s * 0.22, -s * 0.84, s * 0.1);
  ctx.quadraticCurveTo(-s * 0.4, s * 0.16, s * 0.2, s * 0.06);
  ctx.quadraticCurveTo(s * 0.6, s * 0.0, s * 0.82, s * 0.2);
  ctx.closePath();
  ctx.fillStyle = '#f4f2ff';
  ctx.fill();
  // Grey saddle behind the fin.
  ctx.beginPath();
  ctx.ellipse(-s * 0.3, -s * 0.24, s * 0.3, s * 0.1, -0.12, 0, 6.283);
  ctx.fillStyle = 'rgba(150, 146, 178, 0.75)';
  ctx.fill();
  // The eye patch, then the eye on it.
  ctx.beginPath();
  ctx.ellipse(s * 0.55, -s * 0.16, s * 0.2, s * 0.1, -0.2, 0, 6.283);
  ctx.fillStyle = '#f4f2ff';
  ctx.fill();
  // Tall triangular dorsal: the silhouette that says orca from far away.
  ctx.beginPath();
  ctx.moveTo(s * 0.02, -s * 0.38);
  ctx.lineTo(-s * 0.22, -s * 1.12);
  ctx.lineTo(-s * 0.46, -s * 0.3);
  ctx.closePath();
  sticker(ctx, '#15121c', lw);
  // Pectoral paddle.
  ctx.beginPath();
  ctx.moveTo(s * 0.34, s * 0.26);
  ctx.quadraticCurveTo(s * 0.12, s * 0.78, -s * 0.16, s * 0.6);
  ctx.quadraticCurveTo(s * 0.02, s * 0.4, s * 0.34, s * 0.26);
  ctx.closePath();
  sticker(ctx, '#15121c', lw);
  jaw(ctx, s, gape, 0.3, 0.66, 5, lw, '#15121c', 0.85);
  eye(ctx, s * 0.56, -s * 0.16, Math.max(1.6, s * 0.075));
}

/* -------------------------------- whale -------------------------------- */

/** The biggest holder in the water. Slow, enormous, and it does not chew. */
export function drawWhale(ctx: CanvasRenderingContext2D, s: number, time: number, seed: number, gape: number): void {
  const lw = Math.max(1.8, s * 0.04);
  const wag = Math.sin(time * 1.6 + seed) * 0.17;
  ctx.save();
  ctx.translate(-s * 0.9, 0);
  ctx.rotate(wag);
  ctx.translate(s * 0.9, 0);
  flukes(ctx, s, 0.9, 0.56, '#4a4a86', lw);
  ctx.restore();
  // Body: blunt head, deep chest, long taper.
  ctx.beginPath();
  ctx.moveTo(s * 0.96, s * 0.06);
  ctx.quadraticCurveTo(s * 0.94, -s * 0.3, s * 0.5, -s * 0.42);
  ctx.quadraticCurveTo(-s * 0.2, -s * 0.58, -s * 0.92, -s * 0.12);
  ctx.lineTo(-s * 0.92, s * 0.12);
  ctx.quadraticCurveTo(-s * 0.2, s * 0.66, s * 0.5, s * 0.5);
  ctx.quadraticCurveTo(s * 0.92, s * 0.42, s * 0.96, s * 0.06);
  ctx.closePath();
  sticker(ctx, '#5b5b9c', lw);
  // Pleated throat, the detail that says baleen whale up close.
  ctx.strokeStyle = 'rgba(190, 196, 246, 0.5)';
  ctx.lineWidth = Math.max(1, s * 0.02);
  for (let i = 0; i < 6; i++) {
    const f = i / 5;
    ctx.beginPath();
    ctx.moveTo(s * (0.78 - f * 0.06), s * (0.2 + f * 0.05));
    ctx.quadraticCurveTo(s * (0.4 - f * 0.1), s * (0.58 + f * 0.04), s * (0.02 - f * 0.12), s * (0.36 + f * 0.02));
    ctx.stroke();
  }
  // Pale underside.
  ctx.beginPath();
  ctx.moveTo(s * 0.02, s * 0.4);
  ctx.quadraticCurveTo(-s * 0.4, s * 0.5, -s * 0.86, s * 0.1);
  ctx.quadraticCurveTo(-s * 0.4, s * 0.3, s * 0.02, s * 0.22);
  ctx.closePath();
  ctx.fillStyle = 'rgba(214, 219, 255, 0.7)';
  ctx.fill();
  // A low hump where a fin would be. Whales read by bulk, not by fin.
  ctx.beginPath();
  ctx.moveTo(-s * 0.16, -s * 0.5);
  ctx.quadraticCurveTo(-s * 0.32, -s * 0.74, -s * 0.5, -s * 0.42);
  ctx.closePath();
  sticker(ctx, '#4a4a86', lw * 0.9);
  // Long pectoral.
  ctx.beginPath();
  ctx.moveTo(s * 0.34, s * 0.34);
  ctx.quadraticCurveTo(-s * 0.04, s * 0.94, -s * 0.34, s * 0.74);
  ctx.quadraticCurveTo(-s * 0.04, s * 0.5, s * 0.34, s * 0.28);
  ctx.closePath();
  sticker(ctx, '#4a4a86', lw * 0.9);
  jaw(ctx, s, gape, 0.34, 0.6, 0, lw, '#5b5b9c', 0.6);
  eye(ctx, s * 0.66, -s * 0.18, Math.max(1.8, s * 0.05));
}

/* ------------------------------ the seam ------------------------------ */

/**
 * One creature, at a world point, swimming along world heading `angle`. The
 * body is never drawn upside down: past vertical it mirrors and the tilt is
 * reflected with it, the same never-mirror discipline the bug's Hive mark
 * follows. `alpha` sinks it into the water; `gape` is the swallow, and only
 * the hunters have one.
 */
export function drawSeaCreature(
  ctx: CanvasRenderingContext2D,
  kind: SeaKind,
  x: number,
  y: number,
  size: number,
  angle: number,
  alpha: number,
  time: number,
  seed: number,
  gape = 0
): void {
  const face = Math.cos(angle) >= 0 ? 1 : -1;
  const tilt = face === 1 ? Math.asin(Math.max(-1, Math.min(1, Math.sin(angle)))) : -Math.asin(Math.max(-1, Math.min(1, Math.sin(angle))));
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(face, 1);
  ctx.globalAlpha = alpha;
  if (kind === 'redfish') drawRedfish(ctx, size, time, seed);
  else if (kind === 'dolphin') drawDolphin(ctx, size, time, seed);
  else if (kind === 'orca') drawOrca(ctx, size, time, seed, gape);
  else drawWhale(ctx, size, time, seed, gape);
  ctx.restore();
  ctx.globalAlpha = 1;
}
