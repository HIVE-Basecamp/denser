import { ICON_MONO, STICKER_OUTLINE } from './shared';
import { CITADEL_BOX, citadelBody } from './citadel-body';

/**
 * Energy colours for the citadel ring, one per rank. Bright and varied on
 * purpose: at map zoom the towers were reading as a row of identical lamps.
 */
const WITNESS_ENERGY = [
  '#ffd24a', '#ff6b9d', '#5eead4', '#a78bfa', '#fb923c',
  '#38bdf8', '#f472b6', '#4ade80', '#facc15', '#c084fc',
  '#2dd4bf', '#fb7185', '#60a5fa', '#fbbf24', '#34d399',
  '#e879f9', '#22d3ee', '#f87171', '#a3e635', '#818cf8',
  '#fdba74'
];


/**
 * A WITNESS CITADEL: the tower one of the top 21 witnesses keeps, standing
 * outside the world and looking in over the chain it produces.
 *
 * Built bottom up: a rock plinth, a tapering buttressed shaft, a lit gallery,
 * then a crown holding the witness's own profile photo. Energy pulses UP the
 * shaft and a beam sweeps from the crown, so the whole ring reads as alive and
 * producing rather than as statues.
 *
 * `rank` is 1 for the top-voted witness. Rank drives size and how hot the
 * energy runs, so the ring reads as a ranking at a glance. `avatar` is the
 * decoded profile image, or null while it loads (a lettered disc stands in).
 * `beat` is a per-tower phase so the ring does not pulse in lockstep.
 */
export function drawWitnessCitadel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  h: number,
  rank: number,
  name: string,
  avatar: HTMLImageElement | null,
  time: number,
  beat: number,
  /** False on the pulled-out map: drops the sweep beam and the climbing motes,
   *  which are sub-pixel there but cost a clip and two gradients per tower. */
  detail: boolean,
  /** How far the caller has leaned the tower (radians); the face undoes it. */
  lean = 0
): void {
  const w = h * 0.26; // shaft half-width at the base
  const lw = Math.max(2, h * 0.016);
  // A playful spectrum around the ring rather than three sober tiers: each
  // citadel burns its own colour, so the ring reads as a carnival of keepers
  // and you can tell one tower from another at a glance.
  const hot = 1 - (rank - 1) / 21;
  const energy = WITNESS_ENERGY[(rank - 1) % WITNESS_ENERGY.length];
  const stone = '#2a1b3d';
  const stoneLit = '#402c5c';

  ctx.save();
  ctx.translate(x, y);
  ctx.lineJoin = 'round';

  // Ground pool, so the tower is standing on something.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 2.1, w * 0.62, 0, 0, 6.283);
  ctx.fill();

  // On the pulled-out map the body is a single cached blit; up close it is
  // drawn live so the stonework stays crisp.
  const cached = detail ? null : citadelBody(energy);
  if (cached) {
    ctx.drawImage(cached, CITADEL_BOX.x0 * h, CITADEL_BOX.y0 * h, CITADEL_BOX.w * h, CITADEL_BOX.h * h);
  }

  // Plinth.
  if (!cached) {
  ctx.fillStyle = stone;
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(-w * 1.6, 0);
  ctx.lineTo(-w * 1.15, -h * 0.1);
  ctx.lineTo(w * 1.15, -h * 0.1);
  ctx.lineTo(w * 1.6, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  }

  // Shaft: tapers as it rises, with two buttresses.
  const topW = w * 0.56;
  const shaftTop = -h * 0.74;
  if (!cached) {
  for (const side of [-1, 1]) {
    ctx.fillStyle = side < 0 ? stone : stoneLit;
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.1);
    ctx.lineTo(side * w, -h * 0.1);
    ctx.lineTo(side * topW, shaftTop);
    ctx.lineTo(0, shaftTop);
    ctx.closePath();
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(-w, -h * 0.1);
  ctx.lineTo(-topW, shaftTop);
  ctx.lineTo(topW, shaftTop);
  ctx.lineTo(w, -h * 0.1);
  ctx.closePath();
  ctx.stroke();
  }

  // Buttress fins.
  if (detail) for (const side of [-1, 1]) {
    ctx.fillStyle = stone;
    ctx.beginPath();
    ctx.moveTo(side * w, -h * 0.1);
    ctx.lineTo(side * w * 1.5, -h * 0.16);
    ctx.lineTo(side * w * 0.92, -h * 0.46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // ENERGY: bright motes climbing the shaft, the block production itself.
  if (detail) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-w, -h * 0.1);
  ctx.lineTo(-topW, shaftTop);
  ctx.lineTo(topW, shaftTop);
  ctx.lineTo(w, -h * 0.1);
  ctx.closePath();
  ctx.clip();
  for (let i = 0; i < 5; i++) {
    const f = ((time * (0.34 + hot * 0.3) + beat + i / 5) % 1);
    const my = -h * 0.1 - f * h * 0.64;
    const mw = topW + (w - topW) * (1 - f);
    ctx.globalAlpha = 0.22 + (1 - f) * 0.55;
    ctx.fillStyle = energy;
    ctx.beginPath();
    ctx.ellipse(0, my, mw * 0.82, h * 0.022, 0, 0, 6.283);
    ctx.fill();
  }
  ctx.restore();
  }
  ctx.globalAlpha = 1;

  // Lit gallery under the crown.
  if (!cached) {
  ctx.fillStyle = energy;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(-topW * 1.25, shaftTop - h * 0.045, topW * 2.5, h * 0.045);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.strokeRect(-topW * 1.25, shaftTop - h * 0.045, topW * 2.5, h * 0.045);
  }

  // Sweeping watch beam from the crown, pointing inward over the world.
  if (detail) {
  const sweep = Math.sin(time * 0.5 + beat) * 0.5;
  const beamR = h * 0.9;
  const bg = ctx.createLinearGradient(0, shaftTop, Math.sin(sweep) * beamR, shaftTop - beamR);
  bg.addColorStop(0, energy);
  bg.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(0, shaftTop - h * 0.1);
  ctx.lineTo(Math.sin(sweep - 0.16) * beamR, shaftTop - beamR);
  ctx.lineTo(Math.sin(sweep + 0.16) * beamR, shaftTop - beamR);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  }

  // The crown: the witness's own face, ringed and lit.
  const headR = h * 0.16;
  const headY = shaftTop - h * 0.13;
  const pulse = 0.5 + Math.sin(time * 1.6 + beat) * 0.5;
  if (detail) {
    ctx.globalAlpha = 0.3 + pulse * 0.45;
    const halo = ctx.createRadialGradient(0, headY, headR * 0.6, 0, headY, headR * 2.4);
    halo.addColorStop(0, energy);
    halo.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, headY, headR * 2.4, 0, 6.283);
    ctx.fill();
  } else {
    // Flat disc instead of a gradient. Building a radial gradient per tower
    // per frame was most of the ring's cost at map zoom (8.6ms for 21 towers);
    // at this size the falloff is a couple of pixels and nobody can tell.
    ctx.globalAlpha = 0.18 + pulse * 0.3;
    ctx.fillStyle = energy;
    ctx.beginPath();
    ctx.arc(0, headY, headR * 1.7, 0, 6.283);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // The face stays upright however the tower leans on the planet.
  ctx.save();
  ctx.translate(0, headY);
  ctx.rotate(-lean);
  ctx.translate(0, -headY);
  if (avatar) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, headY, headR, 0, 6.283);
    ctx.clip();
    ctx.drawImage(avatar, -headR, headY - headR, headR * 2, headR * 2);
    ctx.restore();
  } else {
    ctx.fillStyle = stoneLit;
    ctx.beginPath();
    ctx.arc(0, headY, headR, 0, 6.283);
    ctx.fill();
    ctx.fillStyle = energy;
    ctx.font = `800 ${headR * 1.1}px ${ICON_MONO}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.charAt(0).toUpperCase(), 0, headY + headR * 0.06);
  }
  ctx.restore();
  ctx.strokeStyle = energy;
  ctx.lineWidth = lw * 1.8;
  ctx.beginPath();
  ctx.arc(0, headY, headR, 0, 6.283);
  ctx.stroke();

  // Rank pennant, so the ring reads as an order.
  if (detail) {
  ctx.fillStyle = energy;
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(topW * 1.25, shaftTop - h * 0.022);
  ctx.lineTo(topW * 1.25 + h * 0.15, shaftTop - h * 0.055);
  ctx.lineTo(topW * 1.25, shaftTop - h * 0.088);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  }

  ctx.restore();
}
