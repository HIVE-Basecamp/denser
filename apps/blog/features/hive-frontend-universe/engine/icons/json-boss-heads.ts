import { STICKER_OUTLINE } from './shared';
import { HI, MID, SHADOW, TOXIC } from './json-boss-palette';

/**
 * The tapered-limb painter the hydra draws its necks and legs with. Passed in
 * from `json-boss-hydra.ts` so the heads are modeled the same way as the body.
 */
type Limb = (
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number,
  r0: number,
  r1: number,
  fill: string,
  outline?: boolean
) => void;

export function drawBossHeads(
  ctx: CanvasRenderingContext2D,
  R: number,
  time: number,
  lw: number,
  /** The tapered-limb painter from the hydra, so the necks are drawn the same way. */
  limb: Limb
): void {
  /* the three necks and heads. */
  interface Head {
    nx0: number; ny0: number; ncx: number; ncy: number; hx: number; hy: number;
    r0: number; r1: number; s: number; dir: 1 | -1; tone: string; bob: number; look: number;
  }
  const HEADS: readonly Head[] = [
    // West head, mid height, watching the world.
    { nx0: R * 0.0, ny0: -R * 0.35, ncx: -R * 0.75, ncy: -R * 0.95, hx: -R * 1.15, hy: -R * 1.6, r0: R * 0.21, r1: R * 0.12, s: 0.8, dir: -1, tone: SHADOW, bob: 2.1, look: 2 },
    // East head, lower, eyeing the tribute march below.
    { nx0: R * 0.6, ny0: -R * 0.3, ncx: R * 1.3, ncy: -R * 0.75, hx: R * 1.5, hy: -R * 1.3, r0: R * 0.21, r1: R * 0.12, s: 0.8, dir: 1, tone: HI, bob: 4.4, look: 1 },
    // Centre head, highest, the fire-breather. Drawn last, in front.
    { nx0: R * 0.28, ny0: -R * 0.5, ncx: R * 0.15, ncy: -R * 1.5, hx: -R * 0.1, hy: -R * 2.15, r0: R * 0.26, r1: R * 0.15, s: 1, dir: -1, tone: MID, bob: 0, look: 0 }
  ];
  for (const h of HEADS) {
    const bob = Math.sin(time * 0.7 + h.bob) * R * 0.05;
    const hx = h.hx;
    const hy = h.hy + bob;
    limb(h.nx0, h.ny0, h.ncx, h.ncy, hx, hy, h.r0, h.r1, h.tone);
    // Dorsal spikes along the neck's outer edge: a magenta crest.
    ctx.fillStyle = '#d62a63';
    for (let i = 2; i <= 12; i += 2) {
      const t = i / 14;
      const px = (1 - t) * (1 - t) * h.nx0 + 2 * (1 - t) * t * h.ncx + t * t * hx;
      const py = (1 - t) * (1 - t) * h.ny0 + 2 * (1 - t) * t * h.ncy + t * t * hy;
      const rr = h.r0 + (h.r1 - h.r0) * t;
      ctx.beginPath();
      ctx.moveTo(px - h.dir * rr * 0.5, py - rr * 0.85);
      ctx.lineTo(px - h.dir * rr * 0.2, py - rr * 1.75);
      ctx.lineTo(px + h.dir * rr * 0.35, py - rr * 0.8);
      ctx.closePath();
      ctx.fill();
    }
    // THE HEAD: horned skull with an open bracket-jawed maw.
    ctx.save();
    ctx.translate(hx, hy);
    ctx.scale(h.s * (h.dir >= 0 ? 1 : -1), h.s);
    // (drawn facing +x, mirrored by dir)
    // Skull and upper jaw.
    ctx.beginPath();
    ctx.moveTo(-R * 0.3, -R * 0.02);
    ctx.quadraticCurveTo(-R * 0.18, -R * 0.34, R * 0.12, -R * 0.3); // crown
    ctx.quadraticCurveTo(R * 0.42, -R * 0.26, R * 0.55, -R * 0.1); // snout top
    ctx.lineTo(R * 0.5, -R * 0.02); // hooked snout tip
    ctx.lineTo(R * 0.05, R * 0.02); // mouth line back
    ctx.quadraticCurveTo(-R * 0.2, R * 0.08, -R * 0.3, -R * 0.02);
    ctx.closePath();
    ctx.fillStyle = h.tone;
    ctx.fill();
    ctx.strokeStyle = STICKER_OUTLINE;
    ctx.lineWidth = lw * 0.8;
    ctx.stroke();
    // Lower jaw, hanging open.
    const jaw = 0.16 + Math.sin(time * 1.6 + h.bob) * 0.03;
    ctx.beginPath();
    ctx.moveTo(R * 0.02, R * 0.04);
    ctx.quadraticCurveTo(R * 0.3, R * (0.02 + jaw), R * 0.46, R * (0.1 + jaw));
    ctx.quadraticCurveTo(R * 0.28, R * (0.16 + jaw), R * 0.04, R * 0.16);
    ctx.quadraticCurveTo(-R * 0.08, R * 0.12, R * 0.02, R * 0.04);
    ctx.closePath();
    ctx.fillStyle = h.tone;
    ctx.fill();
    ctx.strokeStyle = STICKER_OUTLINE;
    ctx.lineWidth = lw * 0.8;
    ctx.stroke();
    // Green mouth glow and teeth.
    ctx.fillStyle = 'rgba(124, 255, 77, 0.5)';
    ctx.beginPath();
    ctx.moveTo(R * 0.06, R * 0.03);
    ctx.quadraticCurveTo(R * 0.28, R * 0.05, R * 0.46, R * (0.08 + jaw * 0.6));
    ctx.quadraticCurveTo(R * 0.26, R * (0.06 + jaw * 0.5), R * 0.06, R * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f2e3c2';
    for (let tt = 0; tt < 3; tt++) {
      const txx = R * (0.14 + tt * 0.12);
      ctx.beginPath();
      ctx.moveTo(txx - R * 0.03, R * 0.0 + tt * R * 0.005);
      ctx.lineTo(txx, R * 0.07);
      ctx.lineTo(txx + R * 0.03, R * 0.005 + tt * R * 0.005);
      ctx.closePath();
      ctx.fill();
    }
    // THE FACE OF EMPEROR J SUN, take two (Bryan: "more realistic like his
    // face... more a caricature of him"). A proper caricature now, not a
    // generic cartoon: round full-cheeked face with modeled skin, neat
    // side-parted black hair, tapered heavy brows, narrow lidded eyes,
    // cheek contours, and below every chin a white collar and red tie
    // coming through the scales - the businessman emperor. Three moods:
    // the fire-breather furious, the east head wearing THE trademark wide
    // grin, the west head worried.
    const glare = 0.6 + Math.sin(time * 2.1 + h.bob) * 0.4;
    const eb = ctx.createRadialGradient(R * 0.1, -R * 0.06, 0, R * 0.1, -R * 0.06, R * 0.34);
    eb.addColorStop(0, `rgba(255, 138, 42, ${(0.3 * glare).toFixed(3)})`);
    eb.addColorStop(1, 'rgba(255, 138, 42, 0)');
    ctx.fillStyle = eb;
    ctx.beginPath();
    ctx.arc(R * 0.1, -R * 0.06, R * 0.34, 0, 6.283);
    ctx.fill();
    const fcx = R * 0.1;
    const fcy = -R * 0.06;
    const frx = R * 0.23;
    const fry = R * 0.25;
    // Ears, tucked behind the face.
    ctx.fillStyle = '#eec091';
    ctx.strokeStyle = STICKER_OUTLINE;
    ctx.lineWidth = lw * 0.35;
    for (const es of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(fcx + es * frx * 1.0, fcy + fry * 0.12, frx * 0.13, fry * 0.2, 0, 0, 6.283);
      ctx.fill();
      ctx.stroke();
    }
    // The face: round crown, FULL cheeks, soft chin - his shape, pushed.
    const facePath = () => {
      ctx.beginPath();
      ctx.moveTo(fcx - frx, fcy - fry * 0.2);
      ctx.quadraticCurveTo(fcx - frx * 0.92, fcy - fry * 1.06, fcx, fcy - fry);
      ctx.quadraticCurveTo(fcx + frx * 0.92, fcy - fry * 1.06, fcx + frx, fcy - fry * 0.2);
      ctx.quadraticCurveTo(fcx + frx * 1.04, fcy + fry * 0.5, fcx + frx * 0.52, fcy + fry * 0.9);
      ctx.quadraticCurveTo(fcx + frx * 0.2, fcy + fry * 1.08, fcx, fcy + fry * 1.05);
      ctx.quadraticCurveTo(fcx - frx * 0.2, fcy + fry * 1.08, fcx - frx * 0.52, fcy + fry * 0.9);
      ctx.quadraticCurveTo(fcx - frx * 1.04, fcy + fry * 0.5, fcx - frx, fcy - fry * 0.2);
      ctx.closePath();
    };
    facePath();
    const skin = ctx.createRadialGradient(fcx, fcy - fry * 0.15, frx * 0.2, fcx, fcy + fry * 0.15, frx * 1.35);
    skin.addColorStop(0, '#f9ddb2');
    skin.addColorStop(0.7, '#f0c99a');
    skin.addColorStop(1, '#dfa877');
    ctx.fillStyle = skin;
    ctx.fill();
    ctx.strokeStyle = STICKER_OUTLINE;
    ctx.lineWidth = lw * 0.5;
    ctx.stroke();
    // Neat black hair with a SIDE PART, swept across the forehead high and
    // tight, with a shine arc. His press-photo cut, not a manga fringe.
    ctx.beginPath();
    ctx.moveTo(fcx - frx * 1.0, fcy - fry * 0.18);
    ctx.quadraticCurveTo(fcx - frx * 1.0, fcy - fry * 1.14, fcx - frx * 0.05, fcy - fry * 1.08);
    ctx.quadraticCurveTo(fcx + frx * 0.95, fcy - fry * 1.12, fcx + frx * 1.0, fcy - fry * 0.3);
    // Right temple down to the sweep's tip above the right brow...
    ctx.quadraticCurveTo(fcx + frx * 0.95, fcy - fry * 0.42, fcx + frx * 0.72, fcy - fry * 0.5);
    // ...then the swept fringe line rising back to the part, high left.
    ctx.quadraticCurveTo(fcx + frx * 0.15, fcy - fry * 0.68, fcx - frx * 0.28, fcy - fry * 0.62);
    // The part: a small step, then the short left side hugging the temple.
    ctx.lineTo(fcx - frx * 0.34, fcy - fry * 0.7);
    ctx.quadraticCurveTo(fcx - frx * 0.72, fcy - fry * 0.6, fcx - frx * 0.88, fcy - fry * 0.44);
    ctx.quadraticCurveTo(fcx - frx * 1.0, fcy - fry * 0.34, fcx - frx * 1.0, fcy - fry * 0.18);
    ctx.closePath();
    ctx.fillStyle = '#151016';
    ctx.fill();
    ctx.strokeStyle = STICKER_OUTLINE;
    ctx.lineWidth = lw * 0.3;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(150, 150, 170, 0.4)';
    ctx.lineWidth = lw * 0.25;
    ctx.beginPath();
    ctx.moveTo(fcx - frx * 0.55, fcy - fry * 0.92);
    ctx.quadraticCurveTo(fcx, fcy - fry * 1.0, fcx + frx * 0.5, fcy - fry * 0.9);
    ctx.stroke();
    // Heavy straight brows: filled tapered strokes, angled by mood.
    const eyeL = fcx - frx * 0.42;
    const eyeR = fcx + frx * 0.42;
    const eyeY = fcy - fry * 0.08;
    ctx.fillStyle = '#151016';
    const brow = (bx: number, by: number, tilt: number) => {
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(tilt);
      ctx.beginPath();
      ctx.moveTo(-frx * 0.26, 0);
      ctx.quadraticCurveTo(0, -fry * 0.09, frx * 0.26, -fry * 0.02);
      ctx.quadraticCurveTo(0, fry * 0.045, -frx * 0.26, fry * 0.045);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    if (h.look === 0) {
      brow(eyeL, eyeY - fry * 0.3, 0.38);
      brow(eyeR, eyeY - fry * 0.3, -0.38);
    } else if (h.look === 1) {
      brow(eyeL, eyeY - fry * 0.28, 0.06);
      brow(eyeR, eyeY - fry * 0.4, -0.2);
    } else {
      brow(eyeL, eyeY - fry * 0.3, -0.22);
      brow(eyeR, eyeY - fry * 0.3, 0.22);
    }
    // Narrow lidded eyes: lash line, small white, dark iris, catchlight.
    const squint = h.look === 0 ? 0.55 : h.look === 1 ? 0.75 : 1;
    for (const [ex, closed] of [
      [eyeL, h.look === 1 ? 0.7 : 1],
      [eyeR, 1]
    ] as const) {
      const eh = fry * 0.085 * squint * closed;
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, frx * 0.17, eh, 0, 0, 6.283);
      ctx.fillStyle = '#fdf6ec';
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = '#241812';
      ctx.beginPath();
      ctx.arc(ex + frx * 0.03, eyeY, frx * 0.08, 0, 6.283);
      ctx.fill();
      ctx.fillStyle = `rgba(255, 150, 60, ${(0.35 + glare * 0.35).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(ex + frx * 0.03, eyeY, frx * 0.035, 0, 6.283);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(ex + frx * 0.06, eyeY - eh * 0.35, frx * 0.02, 0, 6.283);
      ctx.fill();
      ctx.restore();
      // The upper lash line, heavier than the eye itself.
      ctx.strokeStyle = '#151016';
      ctx.lineWidth = lw * 0.32;
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, frx * 0.17, eh, 0, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
      // A faint lower lid.
      ctx.strokeStyle = 'rgba(180, 120, 80, 0.5)';
      ctx.lineWidth = lw * 0.2;
      ctx.beginPath();
      ctx.ellipse(ex, eyeY + eh * 0.4, frx * 0.15, eh * 0.6, 0, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }
    // Nose: bridge shadow, rounded tip, one nostril hooked.
    ctx.strokeStyle = 'rgba(160, 100, 60, 0.55)';
    ctx.lineWidth = lw * 0.26;
    ctx.beginPath();
    ctx.moveTo(fcx + frx * 0.03, eyeY + fry * 0.14);
    ctx.quadraticCurveTo(fcx - frx * 0.03, eyeY + fry * 0.34, fcx + frx * 0.02, eyeY + fry * 0.44);
    ctx.quadraticCurveTo(fcx + frx * 0.1, eyeY + fry * 0.5, fcx + frx * 0.12, eyeY + fry * 0.42);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(fcx - frx * 0.07, eyeY + fry * 0.45, frx * 0.025, 0, 6.283);
    ctx.fillStyle = 'rgba(120, 70, 40, 0.6)';
    ctx.fill();
    // Full-cheek contours: the caricature's roundness, drawn not implied.
    ctx.strokeStyle = 'rgba(205, 140, 90, 0.4)';
    ctx.lineWidth = lw * 0.24;
    ctx.beginPath();
    ctx.moveTo(fcx - frx * 0.62, fcy + fry * 0.28);
    ctx.quadraticCurveTo(fcx - frx * 0.5, fcy + fry * 0.52, fcx - frx * 0.26, fcy + fry * 0.6);
    ctx.moveTo(fcx + frx * 0.62, fcy + fry * 0.28);
    ctx.quadraticCurveTo(fcx + frx * 0.5, fcy + fry * 0.52, fcx + frx * 0.26, fcy + fry * 0.6);
    ctx.stroke();
    // Mouth, by mood.
    const mouthY = fcy + fry * 0.62;
    if (h.look === 1) {
      // THE GRIN: the wide press-photo smile, top teeth on display.
      ctx.beginPath();
      ctx.moveTo(fcx - frx * 0.42, mouthY - fry * 0.04);
      ctx.quadraticCurveTo(fcx, mouthY + fry * 0.34, fcx + frx * 0.42, mouthY - fry * 0.08);
      ctx.quadraticCurveTo(fcx + frx * 0.2, mouthY + fry * 0.02, fcx - frx * 0.2, mouthY + fry * 0.02);
      ctx.closePath();
      ctx.fillStyle = '#5e2020';
      ctx.fill();
      ctx.strokeStyle = STICKER_OUTLINE;
      ctx.lineWidth = lw * 0.3;
      ctx.stroke();
      // The upper teeth band, bright.
      ctx.beginPath();
      ctx.moveTo(fcx - frx * 0.36, mouthY - fry * 0.015);
      ctx.quadraticCurveTo(fcx, mouthY + fry * 0.17, fcx + frx * 0.36, mouthY - fry * 0.045);
      ctx.quadraticCurveTo(fcx, mouthY + fry * 0.04, fcx - frx * 0.36, mouthY - fry * 0.015);
      ctx.closePath();
      ctx.fillStyle = '#fdfaf2';
      ctx.fill();
      // Smile creases bracketing the grin.
      ctx.strokeStyle = 'rgba(160, 100, 60, 0.5)';
      ctx.lineWidth = lw * 0.22;
      ctx.beginPath();
      ctx.moveTo(fcx - frx * 0.5, mouthY - fry * 0.14);
      ctx.quadraticCurveTo(fcx - frx * 0.54, mouthY, fcx - frx * 0.44, mouthY + fry * 0.1);
      ctx.moveTo(fcx + frx * 0.5, mouthY - fry * 0.18);
      ctx.quadraticCurveTo(fcx + frx * 0.54, mouthY - fry * 0.04, fcx + frx * 0.44, mouthY + fry * 0.06);
      ctx.stroke();
    } else if (h.look === 0) {
      // Furious: wide gritted teeth, corners hard down.
      ctx.beginPath();
      ctx.moveTo(fcx - frx * 0.38, mouthY + fry * 0.06);
      ctx.quadraticCurveTo(fcx, mouthY - fry * 0.06, fcx + frx * 0.38, mouthY + fry * 0.06);
      ctx.quadraticCurveTo(fcx, mouthY + fry * 0.22, fcx - frx * 0.38, mouthY + fry * 0.06);
      ctx.closePath();
      ctx.fillStyle = '#fdfaf2';
      ctx.fill();
      ctx.strokeStyle = STICKER_OUTLINE;
      ctx.lineWidth = lw * 0.3;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(24, 18, 24, 0.6)';
      ctx.lineWidth = lw * 0.16;
      ctx.beginPath();
      for (const tx of [-0.22, -0.08, 0.08, 0.22]) {
        ctx.moveTo(fcx + frx * tx, mouthY - fry * 0.01);
        ctx.lineTo(fcx + frx * tx, mouthY + fry * 0.12);
      }
      ctx.stroke();
    } else {
      // Worried: a small tight frown, chin crumpled.
      ctx.strokeStyle = '#151016';
      ctx.lineWidth = lw * 0.34;
      ctx.beginPath();
      ctx.moveTo(fcx - frx * 0.24, mouthY + fry * 0.08);
      ctx.quadraticCurveTo(fcx, mouthY - fry * 0.08, fcx + frx * 0.24, mouthY + fry * 0.08);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(160, 100, 60, 0.45)';
      ctx.lineWidth = lw * 0.2;
      ctx.beginPath();
      ctx.arc(fcx, mouthY + fry * 0.26, frx * 0.1, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }
    // THE SUIT: white collar wings and a red tie coming through the scales
    // under the chin. The businessman emperor, unmistakable.
    const colY = fcy + fry * 1.08;
    ctx.fillStyle = '#f4f1ea';
    ctx.strokeStyle = STICKER_OUTLINE;
    ctx.lineWidth = lw * 0.3;
    for (const cs of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(fcx + cs * frx * 0.06, colY);
      ctx.lineTo(fcx + cs * frx * 0.44, colY + fry * 0.06);
      ctx.lineTo(fcx + cs * frx * 0.16, colY + fry * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#c8102e';
    ctx.beginPath();
    ctx.moveTo(fcx - frx * 0.09, colY + fry * 0.02);
    ctx.lineTo(fcx + frx * 0.09, colY + fry * 0.02);
    ctx.lineTo(fcx + frx * 0.12, colY + fry * 0.2);
    ctx.lineTo(fcx, colY + fry * 0.44);
    ctx.lineTo(fcx - frx * 0.12, colY + fry * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = STICKER_OUTLINE;
    ctx.lineWidth = lw * 0.28;
    ctx.stroke();
    // Two solid horns swept back off the crown, tapering to points.
    for (const [ox, len] of [
      [-R * 0.1, R * 0.5],
      [R * 0.04, R * 0.34]
    ] as const) {
      ctx.beginPath();
      ctx.moveTo(ox + R * 0.07, -R * 0.24);
      ctx.quadraticCurveTo(ox - len * 0.5, -R * 0.3 - len * 0.55, ox - len, -R * 0.2 - len * 0.75);
      ctx.quadraticCurveTo(ox - len * 0.35, -R * 0.26 - len * 0.3, ox - R * 0.09, -R * 0.16);
      ctx.closePath();
      ctx.fillStyle = '#f2e3c2';
      ctx.fill();
      ctx.strokeStyle = STICKER_OUTLINE;
      ctx.lineWidth = lw * 0.6;
      ctx.stroke();
    }

    ctx.restore();
  }

  /* THE FIRE: the centre head's green plume, flickering, with embers. */
  {
    const head = HEADS[2];
    const bob = Math.sin(time * 0.7 + head.bob) * R * 0.05;
    const fx = head.hx - R * 0.45;
    const fy = head.hy + bob + R * 0.05;
    const len = R * (0.9 + Math.sin(time * 6.7) * 0.12 + Math.sin(time * 11.3) * 0.06);
    for (const [spread, alpha, col] of [
      [0.3, 0.22, TOXIC],
      [0.2, 0.4, TOXIC],
      [0.1, 0.8, '#d8ffb0']
    ] as const) {
      ctx.fillStyle = col;
      ctx.globalAlpha = alpha;
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const px = fx - t * len;
        const py = fy - t * len * 0.55 + Math.sin(time * 9 + t * 7) * R * 0.05 * t;
        ctx.beginPath();
        ctx.arc(px, py, R * (0.05 + t * spread), 0, 6.283);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    // Embers drifting off the plume's end.
    for (let k = 0; k < 4; k++) {
      const ph = (time * 0.5 + k / 4) % 1;
      ctx.globalAlpha = (1 - ph) * 0.8;
      ctx.fillStyle = TOXIC;
      ctx.beginPath();
      ctx.arc(fx - len - ph * R * 0.5, fy - len * 0.55 - ph * R * 0.7 + Math.sin(k * 3.1) * R * 0.15, R * 0.03, 0, 6.283);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
