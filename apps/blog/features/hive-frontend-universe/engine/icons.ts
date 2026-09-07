'use client';

/**
 * Hive Frontend Universe — the icon seam.
 *
 * Every landmark type gets one simple vector shape, drawn in code in the same
 * line-art style as the bug and the wobbled lines. One function per shape,
 * dispatched by `IconKey`; upgrading to real art later means replacing the
 * body of a case here and nothing else.
 *
 * Also here: the REAL Hive mark (path data copied verbatim from the app's own
 * `Icons.hive` in packages/ui/components/icons.tsx, viewBox 220x190) and the
 * ambient tier fish for the sea-in-space theme.
 */

import { ROSE_WINDOW_PANES, type IconKey } from '../lib/fixed-world';

/**
 * The Hive three-chevron mark, exactly as the site header renders it.
 * Source: packages/ui/components/icons.tsx (`hive:`), viewBox 0 0 220 190.
 */
const HIVE_MARK_PATHS = [
  'M157.272625,107.263942 C157.998992,107.263942 158.45262,108.051463 158.088736,108.68075 L111.33839,189.528945 C111.169808,189.820485 110.858795,190 110.522279,190 L81.9443812,190 C81.2180145,190 80.764386,189.212478 81.1282705,188.583191 L127.878616,107.734996 C128.047199,107.443456 128.358211,107.263942 128.694727,107.263942 L157.272625,107.263942 Z M129.477721,84.0901367 C129.141205,84.0901367 128.830192,83.9106218 128.66161,83.6190818 L81.1282705,1.41680884 C80.764386,0.787521511 81.2180145,0 81.9443812,0 L110.522279,0 C110.858795,0 111.169808,0.179514873 111.33839,0.471054898 L158.87173,82.6733278 C159.235614,83.3026152 158.781986,84.0901367 158.055619,84.0901367 L129.477721,84.0901367 Z',
  'M135.128406 1.41635199C134.76385.787064228 135.218932 0 135.947343 0L164.565951 0C164.903712 0 165.215845.179714185 165.384888.47151174L219.873006 94.5275799C220.042331 94.8198642 220.042331 95.1801358 219.873006 95.4724201L165.384888 189.528488C165.215845 189.820286 164.903712 190 164.565951 190L135.947343 190C135.218932 190 134.76385 189.212936 135.128406 188.583648L189.342845 95 135.128406 1.41635199zM111.870216 94.5240823C112.042446 94.816752 112.043313 95.1785591 111.872487 95.4720377L57.1252257 189.528106C56.7599958 190.155572 55.8478414 190.157723 55.4796094 189.531986L.129783614 95.4759177C-.0424457704 95.183248-.0433125021 94.8214409.127512727 94.5279623L54.8747743.471894257C55.2400042-.15557243 56.1521586-.157723129 56.5203906.468014185L111.870216 94.5240823z'
] as const;

const HIVE_VIEW = { w: 220, h: 190 };

let hiveMarkCache: Path2D[] | null = null;
function hiveMarkPaths(): Path2D[] {
  if (!hiveMarkCache && typeof Path2D !== 'undefined') {
    hiveMarkCache = HIVE_MARK_PATHS.map((d) => new Path2D(d));
  }
  return hiveMarkCache ?? [];
}

/**
 * The Hive mark, centred at (x, y), `size` px tall, in `color`.
 * NEVER mirror this: callers must not draw it under a flipped transform.
 */
export function drawHiveMark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
): void {
  const paths = hiveMarkPaths();
  if (!paths.length) return;
  const k = size / HIVE_VIEW.h;
  ctx.save();
  ctx.translate(x - (HIVE_VIEW.w * k) / 2, y - (HIVE_VIEW.h * k) / 2);
  ctx.scale(k, k);
  ctx.fillStyle = color;
  for (const p of paths) ctx.fill(p);
  ctx.restore();
}

/* ------------------------------------------------------------------ */

/**
 * The bug's mark, GLASSY: the same three-chevron Hive shape, but molten red
 * glass with soft gradients and an inner glow, plus a thick dark outline so
 * it reads on the red body at play zoom (the old flat white fill rendered,
 * but at ~9 screen px its chevron gaps dissolved to an illegible smudge).
 *
 * Pre-rendered ONCE to an offscreen canvas at high resolution and drawn with
 * drawImage: crisp when scaled down, and near-free per frame.
 *
 * NEVER mirror this: callers must not draw it under a flipped transform. The
 * bug itself faces left/right by coordinate offsets only, so the mark can
 * never appear backwards.
 */
const GLASS_PAD = 36;
let glassyCache: HTMLCanvasElement | null = null;

function glassyMark(): HTMLCanvasElement | null {
  if (glassyCache) return glassyCache;
  if (typeof document === 'undefined') return null;
  const paths = hiveMarkPaths();
  if (!paths.length) return null;
  const canvas = document.createElement('canvas');
  canvas.width = HIVE_VIEW.w + GLASS_PAD * 2;
  canvas.height = HIVE_VIEW.h + GLASS_PAD * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.translate(GLASS_PAD, GLASS_PAD);

  // Soft outer glow behind everything.
  ctx.save();
  ctx.shadowColor = 'rgba(255, 64, 96, 0.9)';
  ctx.shadowBlur = 26;
  ctx.fillStyle = '#e31337';
  for (const p of paths) ctx.fill(p);
  ctx.restore();

  // Thick dark outline separating the glass from the red body.
  ctx.strokeStyle = '#2b030a';
  ctx.lineWidth = 22;
  ctx.lineJoin = 'round';
  for (const p of paths) ctx.stroke(p);

  // The molten glass: deep-to-bright vertical gradient.
  const glass = ctx.createLinearGradient(0, 0, 0, HIVE_VIEW.h);
  glass.addColorStop(0, '#ff98ab');
  glass.addColorStop(0.38, '#ff2c4e');
  glass.addColorStop(0.75, '#c50d2b');
  glass.addColorStop(1, '#7c0619');
  ctx.fillStyle = glass;
  for (const p of paths) ctx.fill(p);

  // Inner glow: painted only where glass already exists (source-atop).
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  const glow = ctx.createRadialGradient(HIVE_VIEW.w / 2, HIVE_VIEW.h * 0.34, 8, HIVE_VIEW.w / 2, HIVE_VIEW.h * 0.34, HIVE_VIEW.w * 0.75);
  glow.addColorStop(0, 'rgba(255, 190, 205, 0.85)');
  glow.addColorStop(0.4, 'rgba(255, 90, 120, 0.28)');
  glow.addColorStop(1, 'rgba(255, 90, 120, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(-GLASS_PAD, -GLASS_PAD, canvas.width, canvas.height);
  // A specular streak across the upper third, like curved glass.
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(HIVE_VIEW.w * 0.46, HIVE_VIEW.h * 0.2, HIVE_VIEW.w * 0.5, HIVE_VIEW.h * 0.13, -0.12, 0, 6.283);
  ctx.fill();
  ctx.restore();

  glassyCache = canvas;
  return canvas;
}

/** The glassy mark, centred at (x, y), `size` px tall. Never under a flip. */
export function drawBugMark(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const cache = glassyMark();
  if (!cache) return;
  const k = size / HIVE_VIEW.h;
  const w = cache.width * k;
  const h = cache.height * k;
  ctx.drawImage(cache, x - w / 2, y - h / 2, w, h);
}

/* ------------------------------------------------------------------ */

/** The sticker outline colour shared by the chunky code-drawn places. */
const STICKER_OUTLINE = '#160f1d';

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

/** Monospace stack for the few glyphs drawn inside icons. */
const ICON_MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/**
 * How fast the DHF ferris wheel turns, radians per second. Exported because
 * the RIDE in canvas-map.tsx must move the bug with the drawn gondola, so the
 * drawing and the ride share this one number. 0.45 makes a full rotation (the
 * ride that earns a breath of air) take about 14 seconds.
 */
export const FERRIS_SPIN = 0.45;

/** Fairground colours for the DHF Fun Park gondolas. */
const GONDOLA_HEX = ['#ff4d6d', '#ffd75e', '#48d17a', '#3fb6ff', '#ff9d4d', '#c77dff'];

/**
 * Landmark icons. `s` is the icon's rough half-size in world px; `col` is the
 * category colour; `time` drives small idle animations (pulses, blinks).
 */
export function drawIcon(
  ctx: CanvasRenderingContext2D,
  key: IconKey,
  x: number,
  y: number,
  s: number,
  col: string,
  time: number,
  /** The landmark's own name, for the few icons that letter themselves. */
  label?: string
): void {
  ctx.save();
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = Math.max(2, s * 0.12);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  switch (key) {
    case 'ferris':
      drawFerris(ctx, x, y, s * 2.2, col, time);
      break;
    case 'towers':
      drawTowers(ctx, x, y, s * 2.2, col, time);
      break;
    case 'launchpad':
      drawLaunchpad(ctx, x, y, s * 2.2, col, time);
      break;
    case 'arcadebldg':
      drawArcade(ctx, x, y, s * 2.2, col, time);
      break;
    case 'blackhole':
      drawBlackHole(ctx, x, y, s * 1.5, time);
      break;
    case 'jsonboss':
      drawJsonBoss(ctx, x, y, s * 1.5, time);
      break;
    case 'sockmount':
      drawSockMount(ctx, x, y, s * 2.2, time);
      break;
    case 'rosewindow':
      drawRoseWindow(ctx, x, y, s * 2.2, time);
      break;
    case 'spaceship': {
      // Small rocket in flight.
      ctx.beginPath();
      ctx.moveTo(x, y - s);
      ctx.quadraticCurveTo(x + s * 0.55, y - s * 0.2, x + s * 0.35, y + s * 0.6);
      ctx.lineTo(x - s * 0.35, y + s * 0.6);
      ctx.quadraticCurveTo(x - s * 0.55, y - s * 0.2, x, y - s);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y - s * 0.15, s * 0.18, 0, 6.283);
      ctx.stroke();
      // fins + flame
      ctx.beginPath();
      ctx.moveTo(x - s * 0.35, y + s * 0.6);
      ctx.lineTo(x - s * 0.6, y + s * 0.9);
      ctx.moveTo(x + s * 0.35, y + s * 0.6);
      ctx.lineTo(x + s * 0.6, y + s * 0.9);
      ctx.stroke();
      ctx.globalAlpha = 0.5 + Math.sin(time * 9) * 0.4;
      ctx.beginPath();
      ctx.moveTo(x - s * 0.15, y + s * 0.62);
      ctx.lineTo(x, y + s * (0.95 + 0.1 * Math.sin(time * 11)));
      ctx.lineTo(x + s * 0.15, y + s * 0.62);
      ctx.stroke();
      ctx.globalAlpha = 1;
      break;
    }
    case 'magnifier':
      ctx.beginPath();
      ctx.arc(x - s * 0.2, y - s * 0.2, s * 0.55, 0, 6.283);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + s * 0.2, y + s * 0.2);
      ctx.lineTo(x + s * 0.75, y + s * 0.75);
      ctx.stroke();
      break;
    case 'quill':
      // A feather: curved spine with barbs, nib at the bottom.
      ctx.beginPath();
      ctx.moveTo(x - s * 0.6, y + s * 0.8);
      ctx.quadraticCurveTo(x + s * 0.1, y + s * 0.1, x + s * 0.7, y - s * 0.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - s * 0.1, y + s * 0.15);
      ctx.quadraticCurveTo(x + s * 0.5, y - s * 0.1, x + s * 0.7, y - s * 0.8);
      ctx.quadraticCurveTo(x + s * 0.15, y - s * 0.55, x - s * 0.1, y + s * 0.15);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - s * 0.6, y + s * 0.8);
      ctx.lineTo(x - s * 0.75, y + s * 0.95);
      ctx.stroke();
      break;
    case 'wallet': {
      // An actual wallet: a chunky billfold with a flap, a clasp, and a note
      // and a coin peeking out of the top.
      const ww = s * 0.82;
      const wh = s * 0.6;
      const lwW = Math.max(2, s * 0.09);
      // Banknote sticking out behind the body.
      ctx.fillStyle = '#8ee87f';
      ctx.strokeStyle = STICKER_OUTLINE;
      ctx.lineWidth = lwW;
      roundRect(ctx, x - ww * 0.55, y - wh - s * 0.16, ww * 1.1, s * 0.34, s * 0.05);
      ctx.fill();
      ctx.stroke();
      // Coin peeking out beside it.
      ctx.beginPath();
      ctx.arc(x + ww * 0.62, y - wh - s * 0.02, s * 0.17, 0, 6.283);
      ctx.fillStyle = '#ffd24a';
      ctx.fill();
      ctx.stroke();
      // Body.
      ctx.fillStyle = '#c4643a';
      roundRect(ctx, x - ww, y - wh, ww * 2, wh * 2, s * 0.14);
      ctx.fill();
      ctx.stroke();
      // Flap across the lower half.
      ctx.fillStyle = '#9c4a2a';
      roundRect(ctx, x - ww, y - wh * 0.05, ww * 2, wh * 1.05, s * 0.12);
      ctx.fill();
      ctx.stroke();
      // Clasp.
      ctx.fillStyle = '#ffd24a';
      roundRect(ctx, x - s * 0.14, y - wh * 0.22, s * 0.28, s * 0.24, s * 0.06);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'bubble':
      ctx.beginPath();
      ctx.moveTo(x - s * 0.7, y - s * 0.5);
      ctx.lineTo(x + s * 0.7, y - s * 0.5);
      ctx.quadraticCurveTo(x + s * 0.85, y - s * 0.5, x + s * 0.85, y - s * 0.3);
      ctx.lineTo(x + s * 0.85, y + s * 0.2);
      ctx.quadraticCurveTo(x + s * 0.85, y + s * 0.4, x + s * 0.7, y + s * 0.4);
      ctx.lineTo(x - s * 0.2, y + s * 0.4);
      ctx.lineTo(x - s * 0.5, y + s * 0.75);
      ctx.lineTo(x - s * 0.45, y + s * 0.4);
      ctx.lineTo(x - s * 0.7, y + s * 0.4);
      ctx.quadraticCurveTo(x - s * 0.85, y + s * 0.4, x - s * 0.85, y + s * 0.2);
      ctx.lineTo(x - s * 0.85, y - s * 0.3);
      ctx.quadraticCurveTo(x - s * 0.85, y - s * 0.5, x - s * 0.7, y - s * 0.5);
      ctx.stroke();
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.arc(x + i * s * 0.3, y - s * 0.05, s * 0.06, 0, 6.283);
        ctx.fill();
      }
      break;
    case 'doc':
    case 'docq': {
      // A chunky sticker paper: white fill, coloured fold, fat outline. The
      // old thin outline read as detached wireframe next to the painted world.
      const w = s * 0.95;
      const h = s * 1.2;
      const f = s * 0.32;
      ctx.beginPath();
      ctx.moveTo(x - w / 2, y - h / 2);
      ctx.lineTo(x + w / 2 - f, y - h / 2);
      ctx.lineTo(x + w / 2, y - h / 2 + f);
      ctx.lineTo(x + w / 2, y + h / 2);
      ctx.lineTo(x - w / 2, y + h / 2);
      ctx.closePath();
      ctx.fillStyle = '#f5f2e8';
      ctx.fill();
      ctx.strokeStyle = STICKER_OUTLINE;
      ctx.lineWidth = Math.max(2.5, s * 0.14);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + w / 2 - f, y - h / 2);
      ctx.lineTo(x + w / 2 - f, y - h / 2 + f);
      ctx.lineTo(x + w / 2, y - h / 2 + f);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.lineWidth = Math.max(2, s * 0.1);
      if (key === 'docq') {
        ctx.font = `700 ${s * 0.8}px ui-monospace, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', x, y + s * 0.1);
      } else {
        ctx.beginPath();
        ctx.moveTo(x - w * 0.3, y - h * 0.15);
        ctx.lineTo(x + w * 0.3, y - h * 0.15);
        ctx.moveTo(x - w * 0.3, y + h * 0.1);
        ctx.lineTo(x + w * 0.3, y + h * 0.1);
        ctx.stroke();
      }
      break;
    }
    case 'newspaper': {
      const w = s * 1.5;
      const h = s * 1.05;
      ctx.strokeRect(x - w / 2, y - h / 2, w, h);
      ctx.fillRect(x - w / 2 + s * 0.12, y - h / 2 + s * 0.12, w * 0.5, s * 0.22);
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        ctx.moveTo(x - w / 2 + s * 0.12, y - h / 2 + s * 0.5 + i * s * 0.2);
        ctx.lineTo(x + w / 2 - s * 0.12, y - h / 2 + s * 0.5 + i * s * 0.2);
      }
      ctx.stroke();
      break;
    }
    case 'tent': {
      // Basecamp: chunky sticker tent. Thick dark outline, flat bright fill,
      // dark door slit, red pennant.
      ctx.strokeStyle = STICKER_OUTLINE;
      // 0.16 was tuned for the small marker; at big-five size it produced a
      // 56px outline that swallowed the tent, so the ratio is now in line with
      // the other chunky places (about 0.075 of the half-width).
      ctx.lineWidth = Math.max(3, s * 0.075);
      ctx.beginPath();
      ctx.moveTo(x - s * 0.95, y + s * 0.62);
      ctx.lineTo(x, y - s * 0.72);
      ctx.lineTo(x + s * 0.95, y + s * 0.62);
      ctx.closePath();
      ctx.fillStyle = '#FFC24D';
      ctx.fill();
      ctx.stroke();
      // Canvas seam and the dark door slit.
      ctx.beginPath();
      ctx.moveTo(x, y - s * 0.72);
      ctx.lineTo(x, y + s * 0.62);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - s * 0.28, y + s * 0.62);
      ctx.lineTo(x, y - s * 0.08);
      ctx.lineTo(x + s * 0.28, y + s * 0.62);
      ctx.closePath();
      ctx.fillStyle = '#3b2a14';
      ctx.fill();
      // THE TENT'S HEART. Warm light spilling from the doorway with an
      // actual HEARTBEAT: a quick rise, a slow fall, ~1.2s around a resting
      // pulse. Basecamp is the newcomer's home, and homes have heartbeats
      // (pass seventeen, from the ice-temple brief). Still the only place
      // on the map visibly lit from the inside.
      ctx.save();
      ctx.clip();
      const hb = (time % 1.2) / 1.2;
      const beat = hb < 0.3 ? hb / 0.3 : 1 - (hb - 0.3) / 0.7;
      const lamp = 0.5 + beat * 0.5;
      const spill = ctx.createRadialGradient(x, y + s * 0.5, s * 0.02, x, y + s * 0.5, s * 0.62);
      spill.addColorStop(0, `rgba(255, 193, 77, ${0.85 * lamp})`);
      spill.addColorStop(0.55, `rgba(255, 140, 107, ${0.38 * lamp})`);
      spill.addColorStop(1, 'rgba(255, 140, 107, 0)');
      ctx.fillStyle = spill;
      ctx.fillRect(x - s, y - s, s * 2, s * 2);
      ctx.restore();
      // Pennant, fluttering.
      ctx.beginPath();
      ctx.moveTo(x, y - s * 0.72);
      ctx.lineTo(x, y - s * 1.12);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y - s * 1.12);
      ctx.lineTo(x + s * (0.42 + 0.05 * Math.sin(time * 3)), y - s * 0.99);
      ctx.lineTo(x, y - s * 0.86);
      ctx.closePath();
      ctx.fillStyle = '#E31337';
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'flag': {
      // A proper welcome banner: a striped, waving flag with the place's own
      // name across it, so you can read where you are from the flag itself.
      const poleX = x - s * 0.62;
      const lwF = Math.max(2, s * 0.1);
      const wave = Math.sin(time * 2.2) * s * 0.07;
      // Pole plus finial.
      ctx.strokeStyle = STICKER_OUTLINE;
      ctx.lineWidth = lwF * 1.2;
      ctx.beginPath();
      ctx.moveTo(poleX, y + s * 0.95);
      ctx.lineTo(poleX, y - s * 1.0);
      ctx.stroke();
      ctx.fillStyle = '#ffd24a';
      ctx.beginPath();
      ctx.arc(poleX, y - s * 1.05, s * 0.1, 0, 6.283);
      ctx.fill();
      ctx.stroke();

      // Banner body, four bright stripes, waving at the free edge.
      const bx = poleX;
      const by = y - s * 0.98;
      const bw = s * 1.75;
      const bh = s * 0.92;
      const STRIPES = ['#ff4d6d', '#ffa63d', '#48d17a', '#3fb6ff'];
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + bw * 0.5, by + wave, bx + bw, by - wave * 0.6);
      ctx.lineTo(bx + bw, by + bh - wave * 0.6);
      ctx.quadraticCurveTo(bx + bw * 0.5, by + bh + wave, bx, by + bh);
      ctx.closePath();
      ctx.clip();
      for (let i = 0; i < STRIPES.length; i++) {
        ctx.fillStyle = STRIPES[i];
        ctx.fillRect(bx, by + (i * bh) / STRIPES.length - s * 0.1, bw, bh / STRIPES.length + s * 0.2);
      }
      ctx.restore();
      // Outline over the stripes.
      ctx.strokeStyle = STICKER_OUTLINE;
      ctx.lineWidth = lwF;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + bw * 0.5, by + wave, bx + bw, by - wave * 0.6);
      ctx.lineTo(bx + bw, by + bh - wave * 0.6);
      ctx.quadraticCurveTo(bx + bw * 0.5, by + bh + wave, bx, by + bh);
      ctx.closePath();
      ctx.stroke();

      // The name, across the banner.
      if (label) {
        const text = label.toUpperCase();
        const fs = Math.min(bh * 0.34, (bw * 1.45) / Math.max(text.length, 1));
        ctx.font = `800 ${fs}px ${ICON_MONO}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = Math.max(1.5, fs * 0.3);
        ctx.strokeStyle = STICKER_OUTLINE;
        ctx.strokeText(text, bx + bw * 0.5, by + bh * 0.5 + wave * 0.4);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, bx + bw * 0.5, by + bh * 0.5 + wave * 0.4);
      }
      break;
    }
    case 'door': {
      // THE GATEWAY: a glowing arch portal, not a wireframe door. Sign-up is
      // the way IN to Hive, so it gets warmth: a lit archway, breathing light
      // inside, and a doormat step, chunky sticker style.
      const pulseIn = 0.55 + Math.sin(time * 1.8) * 0.45;
      ctx.lineWidth = Math.max(3, s * 0.16);
      ctx.strokeStyle = STICKER_OUTLINE;
      // Arch frame.
      ctx.fillStyle = '#3fb6ff';
      ctx.beginPath();
      ctx.moveTo(x - s * 0.75, y + s * 0.9);
      ctx.lineTo(x - s * 0.75, y - s * 0.2);
      ctx.arc(x, y - s * 0.2, s * 0.75, Math.PI, 0);
      ctx.lineTo(x + s * 0.75, y + s * 0.9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // The glow inside: somewhere worth walking into.
      const gl = ctx.createLinearGradient(x, y - s * 0.6, x, y + s * 0.9);
      gl.addColorStop(0, 'rgba(255, 244, 200, ' + (0.55 + pulseIn * 0.4).toFixed(3) + ')');
      gl.addColorStop(1, 'rgba(255, 210, 74, ' + (0.25 + pulseIn * 0.3).toFixed(3) + ')');
      ctx.fillStyle = gl;
      ctx.beginPath();
      ctx.moveTo(x - s * 0.52, y + s * 0.9);
      ctx.lineTo(x - s * 0.52, y - s * 0.15);
      ctx.arc(x, y - s * 0.15, s * 0.52, Math.PI, 0);
      ctx.lineTo(x + s * 0.52, y + s * 0.9);
      ctx.closePath();
      ctx.fill();
      // Doormat step.
      ctx.fillStyle = '#ff5f7a';
      ctx.fillRect(x - s * 0.9, y + s * 0.9, s * 1.8, s * 0.22);
      ctx.strokeRect(x - s * 0.9, y + s * 0.9, s * 1.8, s * 0.22);
      break;
    }
    case 'hivemark':
      drawHiveMark(ctx, x, y, s * 1.7, col);
      break;
    case 'blocks': {
      const b = s * 0.55;
      ctx.strokeRect(x - b - 2, y, b, b);
      ctx.strokeRect(x + 2, y, b, b);
      ctx.strokeRect(x - b / 2, y - b - 2, b, b);
      break;
    }
    case 'pulse':
      ctx.beginPath();
      ctx.moveTo(x - s, y);
      ctx.lineTo(x - s * 0.4, y);
      ctx.lineTo(x - s * 0.15, y - s * 0.7);
      ctx.lineTo(x + s * 0.15, y + s * 0.7);
      ctx.lineTo(x + s * 0.4, y);
      ctx.lineTo(x + s, y);
      ctx.stroke();
      break;
    case 'gate':
      // An arch you pass through.
      ctx.beginPath();
      ctx.moveTo(x - s * 0.7, y + s * 0.8);
      ctx.lineTo(x - s * 0.7, y - s * 0.1);
      ctx.quadraticCurveTo(x, y - s * 1.0, x + s * 0.7, y - s * 0.1);
      ctx.lineTo(x + s * 0.7, y + s * 0.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - s * 0.45, y + s * 0.8);
      ctx.lineTo(x - s * 0.45, y + s * 0.05);
      ctx.quadraticCurveTo(x, y - s * 0.6, x + s * 0.45, y + s * 0.05);
      ctx.lineTo(x + s * 0.45, y + s * 0.8);
      ctx.stroke();
      break;
  }
  ctx.restore();
}

/* --------------- the destination-world structures --------------- */

function drawFerris(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  R: number,
  col: string,
  time: number
): void {
  // Chunky sticker ferris wheel: fat dark outlines, flat bright fills.
  const lw = Math.max(4, R * 0.09);
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = lw;
  // Legs: a filled A-frame.
  ctx.beginPath();
  ctx.moveTo(x - R * 0.72, y + R * 1.18);
  ctx.lineTo(x, y + R * 0.05);
  ctx.lineTo(x + R * 0.72, y + R * 1.18);
  ctx.lineTo(x + R * 0.45, y + R * 1.18);
  ctx.lineTo(x, y + R * 0.36);
  ctx.lineTo(x - R * 0.45, y + R * 1.18);
  ctx.closePath();
  ctx.fillStyle = '#8f76d6';
  ctx.fill();
  ctx.stroke();
  // Rim: dark fat ring, then a flat violet band inside it.
  ctx.beginPath();
  ctx.arc(x, y, R, 0, 6.283);
  ctx.lineWidth = lw * 1.7;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, R, 0, 6.283);
  ctx.strokeStyle = col;
  ctx.lineWidth = lw * 0.9;
  ctx.stroke();
  // Spokes and cars.
  const rot = time * FERRIS_SPIN;
  for (let i = 0; i < 8; i++) {
    const a = rot + (i * 6.283) / 8;
    const cx = x + Math.cos(a) * R;
    const cy = y + Math.sin(a) * R;
    ctx.strokeStyle = col;
    ctx.lineWidth = lw * 0.65;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    // Gondolas: flat pods in mixed fairground colours, each with the dark
    // outline, hanging below the rim and always swinging level.
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy + R * 0.09);
    ctx.strokeStyle = STICKER_OUTLINE;
    ctx.lineWidth = lw * 0.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy + R * 0.17, R * 0.13, 0, 6.283);
    ctx.fillStyle = GONDOLA_HEX[i % GONDOLA_HEX.length];
    ctx.fill();
    ctx.strokeStyle = STICKER_OUTLINE;
    ctx.lineWidth = lw * 0.7;
    ctx.stroke();
  }
  // Hub.
  ctx.beginPath();
  ctx.arc(x, y, R * 0.16, 0, 6.283);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = lw * 0.8;
  ctx.stroke();
}

/**
 * WITTY WORLD, redesigned from Bryan's board-game photo briefs (pass 21).
 * The old three grey-violet slabs were the original placeholder; this is a
 * CARNIVAL CITADEL: a rainbow ring rising behind five candy-coloured towers
 * with striped cone roofs and waving pennants, bunting strung between them,
 * and an observatory dome with a slowly sweeping telescope on the tallest,
 * because witnesses WATCH the chain. Chunky sticker rules throughout.
 */
function drawTowers(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  R: number,
  _col: string,
  time: number
): void {
  const lw = Math.max(4, R * 0.07);
  ctx.save();
  ctx.translate(x, y);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // THE RAINBOW RING: concentric colour arcs rising behind the skyline like
  // a fairground sunrise (the Innovacion socket-ring photo). Low alpha so
  // it reads as backdrop, not subject.
  const ringCols = ['#FF5C8A', '#FFC24D', '#5BE39C', '#5CA8FF', '#B79CFF'];
  for (let k = 0; k < ringCols.length; k++) {
    ctx.strokeStyle = ringCols[k];
    ctx.globalAlpha = 0.34;
    ctx.lineWidth = R * 0.09;
    ctx.beginPath();
    ctx.arc(0, R * 0.28, R * (1.42 - k * 0.1), Math.PI * 1.06, Math.PI * 1.94);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // The five towers: center tallest, candy colours, cone roofs contrasting.
  const towers = [
    { dx: -R * 0.88, h: R * 0.82, w: R * 0.3, body: '#5EE9D5', roof: '#FF5C8A' },
    { dx: -R * 0.45, h: R * 1.14, w: R * 0.32, body: '#FFC24D', roof: '#5CA8FF' },
    { dx: 0, h: R * 1.52, w: R * 0.38, body: '#B79CFF', roof: '#FFC24D' },
    { dx: R * 0.45, h: R * 1.06, w: R * 0.32, body: '#FF90AE', roof: '#5BE39C' },
    { dx: R * 0.88, h: R * 0.9, w: R * 0.3, body: '#5BE39C', roof: '#B79CFF' }
  ];
  // BUNTING between the tower tops first, so the ropes hang behind bodies.
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = lw * 0.45;
  for (let i = 0; i + 1 < towers.length; i++) {
    const a = towers[i];
    const b = towers[i + 1];
    const ax = a.dx;
    const ay = -a.h + R * 0.06;
    const bx = b.dx;
    const by = -b.h + R * 0.06;
    const mx = (ax + bx) / 2;
    const my = Math.max(ay, by) + R * 0.16;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.quadraticCurveTo(mx, my, bx, by);
    ctx.stroke();
    // Little triangle flags riding the rope.
    for (let f = 1; f <= 3; f++) {
      const t = f / 4;
      const px = (1 - t) * (1 - t) * ax + 2 * (1 - t) * t * mx + t * t * bx;
      const py = (1 - t) * (1 - t) * ay + 2 * (1 - t) * t * my + t * t * by;
      ctx.fillStyle = ringCols[(i * 3 + f) % ringCols.length];
      ctx.beginPath();
      ctx.moveTo(px - R * 0.045, py);
      ctx.lineTo(px + R * 0.045, py);
      ctx.lineTo(px, py + R * 0.1);
      ctx.closePath();
      ctx.fill();
    }
  }
  for (let i = 0; i < towers.length; i++) {
    const tw = towers[i];
    // Body.
    ctx.strokeStyle = STICKER_OUTLINE;
    ctx.lineWidth = lw;
    ctx.fillStyle = tw.body;
    ctx.fillRect(tw.dx - tw.w / 2, -tw.h, tw.w, tw.h + R * 0.3);
    ctx.strokeRect(tw.dx - tw.w / 2, -tw.h, tw.w, tw.h + R * 0.3);
    // One white stripe band across the middle, circus-tent style.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillRect(tw.dx - tw.w / 2, -tw.h * 0.52, tw.w, R * 0.11);
    // Lit windows, a blinking few.
    const rows = i === 2 ? 4 : 3;
    for (let r = 0; r < rows; r++) {
      const blinker = (r * 5 + i) % 4 === 0;
      const on = !blinker || Math.sin(time * 2.1 + i * 1.7 + r) > -0.3;
      ctx.fillStyle = on ? '#FFEDC2' : '#3a2f5e';
      ctx.fillRect(tw.dx - tw.w * 0.17, -tw.h + R * 0.14 + r * R * 0.26, tw.w * 0.34, R * 0.13);
    }
    if (i === 2) {
      // THE OBSERVATORY: a white dome with a slit and a telescope sweeping
      // slowly over the world. The watchers' tower.
      ctx.beginPath();
      ctx.arc(tw.dx, -tw.h, tw.w * 0.72, Math.PI, 0);
      ctx.fillStyle = '#f2f5fb';
      ctx.fill();
      ctx.strokeStyle = STICKER_OUTLINE;
      ctx.lineWidth = lw;
      ctx.stroke();
      ctx.fillStyle = '#3a2f5e';
      ctx.fillRect(tw.dx - tw.w * 0.09, -tw.h - tw.w * 0.7, tw.w * 0.18, tw.w * 0.55);
      const sweep = Math.sin(time * 0.5) * 0.5 - 0.9;
      ctx.strokeStyle = STICKER_OUTLINE;
      ctx.lineWidth = lw * 0.9;
      ctx.beginPath();
      ctx.moveTo(tw.dx, -tw.h - tw.w * 0.34);
      ctx.lineTo(tw.dx + Math.cos(sweep) * R * 0.34, -tw.h - tw.w * 0.34 + Math.sin(sweep) * R * 0.34);
      ctx.stroke();
    } else {
      // Cone roof with a white swirl stripe and a waving pennant.
      const roofH = R * 0.3;
      ctx.beginPath();
      ctx.moveTo(tw.dx - tw.w * 0.62, -tw.h);
      ctx.lineTo(tw.dx + tw.w * 0.62, -tw.h);
      ctx.lineTo(tw.dx, -tw.h - roofH);
      ctx.closePath();
      ctx.fillStyle = tw.roof;
      ctx.fill();
      ctx.strokeStyle = STICKER_OUTLINE;
      ctx.lineWidth = lw;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = lw * 0.55;
      ctx.beginPath();
      ctx.moveTo(tw.dx - tw.w * 0.34, -tw.h - roofH * 0.3);
      ctx.lineTo(tw.dx + tw.w * 0.34, -tw.h - roofH * 0.44);
      ctx.stroke();
      const wave = Math.sin(time * 3 + i * 1.4) * R * 0.05;
      ctx.strokeStyle = STICKER_OUTLINE;
      ctx.lineWidth = lw * 0.5;
      ctx.beginPath();
      ctx.moveTo(tw.dx, -tw.h - roofH);
      ctx.lineTo(tw.dx, -tw.h - roofH - R * 0.16);
      ctx.stroke();
      ctx.fillStyle = tw.roof;
      ctx.beginPath();
      ctx.moveTo(tw.dx, -tw.h - roofH - R * 0.16);
      ctx.quadraticCurveTo(tw.dx + R * 0.12, -tw.h - roofH - R * 0.13 + wave, tw.dx + R * 0.17, -tw.h - roofH - R * 0.16 + wave);
      ctx.lineTo(tw.dx, -tw.h - roofH - R * 0.08);
      ctx.closePath();
      ctx.fill();
    }
  }
  // The striped plaza band grounding the whole fair.
  ctx.fillStyle = '#2a1440';
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.ellipse(0, R * 0.3, R * 1.16, R * 0.17, 0, 0, 6.283);
  ctx.fill();
  ctx.stroke();
  for (let k = -3; k <= 3; k++) {
    ctx.fillStyle = k % 2 === 0 ? '#FF5C8A' : '#FFC24D';
    ctx.globalAlpha = 0.85;
    ctx.fillRect(k * R * 0.155 - R * 0.055, R * 0.22, R * 0.11, R * 0.07);
  }
  ctx.globalAlpha = 1;
  // Confetti sparkle drifting around the skyline: eye candy, few and small.
  for (let k = 0; k < 7; k++) {
    const a = k * 0.897 + 0.4;
    const sx = Math.cos(a * 4.1) * R * (0.65 + (k % 3) * 0.24);
    const sy = -R * (0.55 + ((k * 37) % 90) / 100) + Math.sin(time * 1.1 + k) * R * 0.05;
    ctx.fillStyle = ringCols[k % ringCols.length];
    ctx.globalAlpha = 0.5 + Math.sin(time * 2.3 + k * 2.2) * 0.4;
    ctx.beginPath();
    ctx.arc(sx, sy, R * 0.035, 0, 6.283);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

/**
 * Window slots on the dApp station, in station-radius units. Exported so the
 * renderer can paint REAL dApp logos (their Hive account avatars) into the
 * same holes this function draws: one list, two consumers, never apart.
 */
export const DAPP_WINDOWS: readonly { dx: number; dy: number; r: number }[] = [
  // Six slots since the two dApp ships merged into this one bigger craft
  // (Bryan: "basically the same thing... 1 ship, bigger, hold both").
  { dx: -0.68, dy: -0.03, r: 0.19 },
  { dx: -0.36, dy: -0.16, r: 0.21 },
  { dx: 0, dy: -0.2, r: 0.22 },
  { dx: 0.36, dy: -0.16, r: 0.21 },
  { dx: 0.68, dy: -0.03, r: 0.19 },
  { dx: 0, dy: 0.03, r: 0.17 }
];

/**
 * THE dAPP STATION: a round orbital base, one of the big landmarks. A wide
 * saucer hull with a glass dome, a ring of round windows along the rim (the
 * renderer fills them with real dApp logos once their avatars load), landing
 * legs and a blinking beacon. Its landing card lists the real dApps.
 */
function drawLaunchpad(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  R: number,
  col: string,
  time: number
): void {
  const lw = Math.max(4, R * 0.06);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = lw;
  // Landing legs first, so the saucer sits over them.
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + side * R * 0.55, y + R * 0.28);
    ctx.lineTo(x + side * R * 0.8, y + R * 0.72);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x + side * R * 0.8, y + R * 0.74, R * 0.14, R * 0.06, 0, 0, 6.283);
    ctx.fillStyle = '#aab6c8';
    ctx.fill();
    ctx.stroke();
  }
  // The saucer: a fat rounded disc.
  ctx.beginPath();
  ctx.ellipse(x, y, R * 1.02, R * 0.5, 0, 0, 6.283);
  ctx.fillStyle = '#e9eef8';
  ctx.fill();
  ctx.stroke();
  // A red rim band, the station's livery.
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, R * 1.02, R * 0.5, 0, 0, 6.283);
  ctx.clip();
  ctx.fillStyle = '#e3123a';
  ctx.fillRect(x - R * 1.1, y + R * 0.22, R * 2.2, R * 0.3);
  ctx.restore();
  ctx.beginPath();
  ctx.ellipse(x, y, R * 1.02, R * 0.5, 0, 0, 6.283);
  ctx.stroke();
  // The window holes. The renderer paints real logos into these same slots
  // (DAPP_WINDOWS above); until an avatar arrives, each glows in its own
  // ecosystem colour with a slow lighthouse chase.
  const PORT = ['#5EE9D5', '#FFC24D', '#B79CFF', '#5BE39C'];
  for (let k = 0; k < DAPP_WINDOWS.length; k++) {
    const w = DAPP_WINDOWS[k];
    const lit = (Math.floor(time * 1.2) % DAPP_WINDOWS.length) === k;
    ctx.beginPath();
    ctx.arc(x + w.dx * R, y + w.dy * R, w.r * R, 0, 6.283);
    ctx.fillStyle = PORT[k % PORT.length];
    ctx.globalAlpha = lit ? 1 : 0.7;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = lw * 0.7;
    ctx.stroke();
  }
  // The glass dome up top, with a hint of the crew quarters inside.
  ctx.beginPath();
  ctx.arc(x, y - R * 0.38, R * 0.42, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = 'rgba(155, 232, 255, 0.4)';
  ctx.fill();
  ctx.lineWidth = lw;
  ctx.stroke();
  // Beacon, blinking on the dome.
  const blink = 0.5 + Math.sin(time * 5) * 0.5;
  ctx.beginPath();
  ctx.arc(x, y - R * 0.86, R * 0.07, 0, 6.283);
  ctx.fillStyle = '#ff5f7a';
  ctx.globalAlpha = 0.3 + blink * 0.7;
  ctx.fill();
  ctx.globalAlpha = 1;
  // Soft thruster glow beneath: it hovers as much as it stands.
  const f = 0.5 + Math.sin(time * 3.2) * 0.5;
  ctx.fillStyle = col;
  ctx.globalAlpha = 0.12 + f * 0.12;
  ctx.beginPath();
  ctx.ellipse(x, y + R * 0.62, R * 0.7, R * 0.16, 0, 0, 6.283);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/**
 * THE DEVELOPER PORTAL: a black hole, one of the big five.
 *
 * Dark core, two COUNTER-ROTATING glowing accretion rings around it, and faint
 * particles spiralling inward. Cool colours and deliberately a little ominous:
 * this is the one place on the map that does not look friendly.
 *
 * The rings are drawn as many short arc segments of varying alpha rather than
 * one stroked circle, which is what makes them read as moving matter instead
 * of as a drawn outline.
 */
function drawBlackHole(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  R: number,
  time: number
): void {
  ctx.save();

  // Outer halo: the light being bent around it.
  const halo = ctx.createRadialGradient(x, y, R * 0.5, x, y, R * 1.9);
  halo.addColorStop(0, 'rgba(90, 170, 255, 0.30)');
  halo.addColorStop(0.5, 'rgba(70, 110, 220, 0.13)');
  halo.addColorStop(1, 'rgba(40, 60, 150, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, R * 1.9, 0, 6.283);
  ctx.fill();

  // Infalling particles: seeded specks on inward spirals, cool and faint.
  for (let i = 0; i < 26; i++) {
    const seed = i * 2.399963;
    // Each particle runs its own inward pass, wrapping when it reaches the core.
    const phase = (time * 0.16 + i / 26) % 1;
    const rad = R * (1.85 - phase * 1.25);
    const ang = seed + phase * 5.4 + time * 0.5;
    const px = x + Math.cos(ang) * rad;
    const py = y + Math.sin(ang) * rad * 0.42;
    ctx.globalAlpha = 0.15 + (1 - phase) * 0.5;
    ctx.fillStyle = i % 3 === 0 ? '#bfe4ff' : '#6fa8ff';
    ctx.beginPath();
    ctx.arc(px, py, R * 0.028, 0, 6.283);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // The two accretion rings, counter-rotating. Drawn flattened, one tilted
  // against the other, in segments so the brightness varies around each.
  const rings = [
    { r: R * 1.28, squash: 0.34, spin: time * 0.55, tilt: -0.22, col: '#7fc4ff', w: R * 0.13 },
    { r: R * 0.98, squash: 0.46, spin: -time * 0.42, tilt: 0.3, col: '#9d8bff', w: R * 0.1 }
  ];
  for (const ring of rings) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ring.tilt);
    ctx.scale(1, ring.squash);
    ctx.lineCap = 'butt';
    const SEG = 44;
    for (let i = 0; i < SEG; i++) {
      const a0 = (i / SEG) * 6.283 + ring.spin;
      const a1 = ((i + 1.05) / SEG) * 6.283 + ring.spin;
      // Brightest on one side, like matter heated as it swings around.
      const b = 0.5 + Math.sin(a0 * 1 - ring.spin * 0.5) * 0.5;
      ctx.globalAlpha = 0.22 + b * 0.72;
      ctx.strokeStyle = ring.col;
      ctx.lineWidth = ring.w * (0.6 + b * 0.7);
      ctx.beginPath();
      ctx.arc(0, 0, ring.r, a0, a1);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  // The core: flat black with a hard rim, so it reads as a hole punched in
  // the world rather than as a dark ball.
  const core = ctx.createRadialGradient(x, y, R * 0.3, x, y, R * 0.78);
  core.addColorStop(0, '#000000');
  core.addColorStop(0.72, '#02030a');
  core.addColorStop(1, 'rgba(20, 30, 70, 0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y, R * 0.78, 0, 6.283);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(x, y, R * 0.52, 0, 6.283);
  ctx.fill();
  ctx.strokeStyle = 'rgba(150, 200, 255, 0.55)';
  ctx.lineWidth = Math.max(1.5, R * 0.03);
  ctx.stroke();

  ctx.restore();
}

/** Rounded rectangle path helper for the chunky sticker places. */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function drawArcade(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  R: number,
  col: string,
  time: number
): void {
  const lw = Math.max(4, R * 0.07);
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';

  const W = R * 1.5; // cabinet width
  const left = x - W / 2;

  // Cabinet body: one tall rounded slab in flat cabinet red.
  ctx.fillStyle = '#d8365a';
  roundRect(ctx, left, y - R * 1.18, W, R * 2.32, R * 0.16);
  ctx.fill();
  ctx.stroke();

  // Side panel highlight, so the slab reads as a three dimensional cabinet
  // without resorting to gradients.
  ctx.fillStyle = '#ef5c7c';
  roundRect(ctx, left + W * 0.06, y - R * 1.1, W * 0.16, R * 2.14, R * 0.1);
  ctx.fill();

  // Marquee header: rounded, bright, with a colour stripe across it.
  const mY = y - R * 1.1;
  const mH = R * 0.44;
  ctx.fillStyle = '#ffd75e';
  roundRect(ctx, left + W * 0.04, mY, W * 0.92, mH, R * 0.13);
  ctx.fill();
  ctx.stroke();
  const stripe = ['#ff4d6d', '#ffa63d', '#48d17a', '#3fb6ff'];
  const sw = (W * 0.84) / stripe.length;
  for (let i = 0; i < stripe.length; i++) {
    ctx.fillStyle = stripe[i];
    ctx.fillRect(left + W * 0.08 + i * sw, mY + mH * 0.58, sw, mH * 0.26);
  }
  ctx.strokeRect(left + W * 0.08, mY + mH * 0.58, W * 0.84, mH * 0.26);

  // The screen: dark bezel, then a tiny wavy landscape inside it.
  const scX = left + W * 0.11;
  const scY = y - R * 0.54;
  const scW = W * 0.78;
  const scH = R * 0.78;
  ctx.fillStyle = '#140a1c';
  roundRect(ctx, scX - lw, scY - lw, scW + lw * 2, scH + lw * 2, R * 0.08);
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  ctx.rect(scX, scY, scW, scH);
  ctx.clip();
  // Sky.
  ctx.fillStyle = '#5fd0ff';
  ctx.fillRect(scX, scY, scW, scH);
  // Two green hill bands, gently waving.
  for (let band = 0; band < 2; band++) {
    ctx.fillStyle = band === 0 ? '#43c268' : '#2c9c4c';
    ctx.beginPath();
    ctx.moveTo(scX, scY + scH);
    const baseY = scY + scH * (0.52 + band * 0.22);
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const px = scX + t * scW;
      const py = baseY + Math.sin(t * 6.283 * 1.5 + time * 0.9 + band * 2) * scH * 0.09;
      if (i === 0) ctx.lineTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.lineTo(scX + scW, scY + scH);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Control deck: an angled shelf with two joysticks and rows of buttons.
  const dY = y + R * 0.42;
  ctx.fillStyle = '#2b1730';
  roundRect(ctx, left + W * 0.02, dY, W * 0.96, R * 0.42, R * 0.08);
  ctx.fill();
  ctx.stroke();
  for (const side of [-1, 1]) {
    const jx = x + side * W * 0.3;
    // Stick.
    ctx.strokeStyle = STICKER_OUTLINE;
    ctx.lineWidth = lw * 1.1;
    ctx.beginPath();
    ctx.moveTo(jx, dY + R * 0.26);
    ctx.lineTo(jx + side * R * 0.05, dY - R * 0.1);
    ctx.stroke();
    // Red ball on top.
    ctx.beginPath();
    ctx.arc(jx + side * R * 0.05, dY - R * 0.15, R * 0.11, 0, 6.283);
    ctx.fillStyle = '#ff3b57';
    ctx.fill();
    ctx.lineWidth = lw * 0.8;
    ctx.stroke();
  }
  // Button rows: small yellow and blue.
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 3; i++) {
      const bx = x - W * 0.1 + i * R * 0.15;
      const by = dY + R * 0.12 + row * R * 0.16;
      ctx.beginPath();
      ctx.arc(bx, by, R * 0.05, 0, 6.283);
      ctx.fillStyle = row === 0 ? '#ffd75e' : '#3fb6ff';
      ctx.fill();
      ctx.lineWidth = lw * 0.5;
      ctx.stroke();
    }
  }

  // Coin slot and a dark base plinth.
  ctx.fillStyle = '#140a1c';
  ctx.fillRect(x - R * 0.06, y + R * 0.95, R * 0.12, R * 0.05);
  ctx.fillStyle = '#7d1c33';
  roundRect(ctx, left + W * 0.06, y + R * 1.06, W * 0.88, R * 0.16, R * 0.05);
  ctx.fill();
  ctx.lineWidth = lw;
  ctx.stroke();

  // Sparkles floating around the cabinet: four-point stars, gently twinkling.
  const spark = [
    [-0.72, -1.12, 0.075],
    [0.74, -0.92, 0.06],
    [-0.78, 0.3, 0.055],
    [0.8, 0.55, 0.07],
    [0.1, -1.3, 0.065]
  ];
  ctx.strokeStyle = '#fff3b0';
  for (let i = 0; i < spark.length; i++) {
    const [sxr, syr, sr] = spark[i];
    const tw = 0.45 + Math.sin(time * 2.4 + i * 1.7) * 0.55;
    const sx = x + sxr * R;
    const sy = y + syr * R;
    const rr = sr * R * (0.7 + tw * 0.5);
    ctx.globalAlpha = 0.35 + tw * 0.65;
    ctx.lineWidth = Math.max(1.5, R * 0.028);
    ctx.beginPath();
    ctx.moveTo(sx - rr, sy);
    ctx.lineTo(sx + rr, sy);
    ctx.moveTo(sx, sy - rr);
    ctx.lineTo(sx, sy + rr);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/* ----------------------- rock formations ----------------------- */

/**
 * Crystal palettes for the rock formations. Cool mineral bodies with hot lit
 * tips, so the terrain reads as a space base rather than a meadow.
 */
const CRYSTAL = [
  { body: '#2b3f7a', lit: '#7fb4ff', tip: '#cfe6ff' },
  { body: '#4a2a6b', lit: '#b98cff', tip: '#e8d6ff' },
  { body: '#0f4a52', lit: '#54dbd0', tip: '#c2fff7' },
  { body: '#5e2340', lit: '#ff86b0', tip: '#ffd4e4' },
  { body: '#5a3a12', lit: '#ffbf4d', tip: '#ffe9b8' }
];

/**
 * A clutch of spiky shards standing on the ground. Drawn chunky: thick dark
 * outline, flat body, one lit face, and a glowing tip that breathes.
 *
 * `h` is the tallest shard's height and `phase` fixes the clutch's shape, so a
 * formation looks identical every frame and every window.
 */
export function drawFormation(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  h: number,
  shards: number,
  hue: number,
  phase: number,
  lean: number,
  time: number
): void {
  const pal = CRYSTAL[hue % CRYSTAL.length];
  const lw = Math.max(1.5, h * 0.045);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.lineJoin = 'round';

  // Ground shadow pool, so the clutch sits on the terrain.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
  ctx.beginPath();
  ctx.ellipse(0, 0, h * 0.5, h * 0.15, 0, 0, 6.283);
  ctx.fill();

  for (let i = 0; i < shards; i++) {
    // Fan the shards out from the centre, tallest in the middle.
    const t = shards === 1 ? 0.5 : i / (shards - 1);
    const spread = (t - 0.5) * h * 0.62;
    const tall = h * (0.45 + 0.55 * Math.sin(Math.PI * t) + 0.16 * Math.sin(phase + i * 2.1));
    const halfW = Math.max(4, tall * (0.17 + 0.06 * Math.sin(phase + i)));
    const tipX = spread + Math.sin(phase + i * 1.7) * tall * 0.12;

    // Body.
    ctx.beginPath();
    ctx.moveTo(spread - halfW, 0);
    ctx.lineTo(tipX, -tall);
    ctx.lineTo(spread + halfW, 0);
    ctx.closePath();
    ctx.fillStyle = pal.body;
    ctx.fill();
    ctx.strokeStyle = STICKER_OUTLINE;
    ctx.lineWidth = lw;
    ctx.stroke();

    // Lit face: the right half, so the whole field is lit from one side.
    ctx.beginPath();
    ctx.moveTo(tipX, -tall);
    ctx.lineTo(spread + halfW, 0);
    ctx.lineTo(spread + halfW * 0.15, 0);
    ctx.closePath();
    ctx.fillStyle = pal.lit;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Breathing tip glow. Kept small and tinted to the crystal rather than
    // white: at a wider radius and near-white it read as fog sitting over the
    // terrain instead of as a lit point.
    const beat = 0.55 + Math.sin(time * 1.4 + phase + i) * 0.45;
    const g = ctx.createRadialGradient(tipX, -tall, 0, tipX, -tall, tall * 0.2);
    g.addColorStop(0, pal.tip);
    g.addColorStop(0.45, pal.lit);
    g.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.globalAlpha = 0.16 + beat * 0.3;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(tipX, -tall, tall * 0.3, 0, 6.283);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

/* ----------------------- witness citadels ----------------------- */

/**
 * Cached static tower bodies, keyed by energy colour.
 *
 * At map zoom the body never animates (the motes, beam, fins and pennant are
 * all detail-only), so redrawing fifteen paths per tower per frame was pure
 * waste: 21 towers measured 8.6ms of the frame. The body is rendered once in
 * NORMALISED units (height 1) and stretched to whatever height a rank needs,
 * which is why one canvas per colour serves all 21.
 */
const CITADEL_TEX_H = 200;
/** Normalised body box: x in [-0.45, 0.45], y in [-0.82, 0.06], height 1. */
const CITADEL_BOX = { x0: -0.45, y0: -0.82, w: 0.9, h: 0.88 };
const citadelBodyCache = new Map<string, HTMLCanvasElement>();

function citadelBody(energy: string): HTMLCanvasElement | null {
  const hit = citadelBodyCache.get(energy);
  if (hit) return hit;
  if (typeof document === 'undefined') return null;
  const texH = CITADEL_TEX_H;
  const texW = Math.round((CITADEL_BOX.w / CITADEL_BOX.h) * texH);
  const canvas = document.createElement('canvas');
  canvas.width = texW;
  canvas.height = texH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const k = texH / CITADEL_BOX.h;
  ctx.setTransform(k, 0, 0, k, -CITADEL_BOX.x0 * k, -CITADEL_BOX.y0 * k);

  const w = 0.26;
  const topW = w * 0.56;
  const shaftTop = -0.74;
  const stone = '#2a1b3d';
  const stoneLit = '#402c5c';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = 0.016;

  // Plinth.
  ctx.fillStyle = stone;
  ctx.beginPath();
  ctx.moveTo(-w * 1.6, 0);
  ctx.lineTo(-w * 1.15, -0.1);
  ctx.lineTo(w * 1.15, -0.1);
  ctx.lineTo(w * 1.6, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Shaft, two-tone so it reads as lit from one side.
  for (const side of [-1, 1]) {
    ctx.fillStyle = side < 0 ? stone : stoneLit;
    ctx.beginPath();
    ctx.moveTo(0, -0.1);
    ctx.lineTo(side * w, -0.1);
    ctx.lineTo(side * topW, shaftTop);
    ctx.lineTo(0, shaftTop);
    ctx.closePath();
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(-w, -0.1);
  ctx.lineTo(-topW, shaftTop);
  ctx.lineTo(topW, shaftTop);
  ctx.lineTo(w, -0.1);
  ctx.closePath();
  ctx.stroke();

  // Lit gallery.
  ctx.fillStyle = energy;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(-topW * 1.25, shaftTop - 0.045, topW * 2.5, 0.045);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.strokeRect(-topW * 1.25, shaftTop - 0.045, topW * 2.5, 0.045);

  citadelBodyCache.set(energy, canvas);
  return canvas;
}

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

/* ----------------------- the Mighty J SON ----------------------- */

/**
 * A TROLL HOLE: one mouth of the Mighty J SON's network, sunk into the
 * terrain. A dark pit ringed with cracked ground, breathing a sickly violet
 * glow, with two curly-brace fangs at the rim: the mark of J SON.
 */
export function drawTrollHole(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number
): void {
  const R = 120;
  ctx.save();
  ctx.translate(x, y);
  // Cracked ground ring.
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = 7;
  ctx.lineJoin = 'round';
  ctx.fillStyle = '#1b0f26';
  ctx.beginPath();
  for (let k = 0; k <= 12; k++) {
    const a = (k / 12) * 6.283;
    const rr = R * (1 + 0.12 * Math.sin(a * 3 + 1.3));
    const px = Math.cos(a) * rr;
    const py = Math.sin(a) * rr * 0.62;
    if (k === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // The breathing violet glow inside.
  const breath = 0.5 + Math.sin(time * 1.1 + x * 0.001) * 0.5;
  const g = ctx.createRadialGradient(0, 0, 6, 0, 0, R * 0.8);
  g.addColorStop(0, 'rgba(190, 120, 255, ' + (0.35 + breath * 0.35).toFixed(3) + ')');
  g.addColorStop(1, 'rgba(90, 40, 140, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, R * 0.8, R * 0.5, 0, 0, 6.283);
  ctx.fill();
  // The brace fangs: { } carved at the rim.
  ctx.strokeStyle = '#c98bff';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * R * 0.52, -R * 0.34);
    ctx.quadraticCurveTo(side * R * 0.28, -R * 0.3, side * R * 0.3, -R * 0.1);
    ctx.quadraticCurveTo(side * R * 0.32, R * 0.02, side * R * 0.16, R * 0.05);
    ctx.quadraticCurveTo(side * R * 0.32, R * 0.08, side * R * 0.3, R * 0.2);
    ctx.quadraticCurveTo(side * R * 0.28, R * 0.42, side * R * 0.52, R * 0.46);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * EMPEROR J SON, fourth design (pass 24). Bryan, pointing at the Cyclades
 * three-headed-dragon cover: "it should be distinct. like how the 3 headed
 * dragon photo where you see it on the rock floating. it should feel more
 * like that." So this is CREATURE-FIRST now: a three-headed JSON hydra
 * perched on the floating rock, wings half-spread, claws gripping the rock
 * edge, tail coiled around it, one head breathing green fire over the ruin
 * of the old keep, the hoard and the tribute march of stolen tokens at his
 * feet. The monster IS the landmark; the fortress is what he crushed.
 *
 * Modeling: tapered blob-chain necks (outline pass then body pass then a
 * thin belly highlight), three-tone violet forms, green membrane glow in
 * the wings, bloom behind every light. JSON identity: the glowing { } sigil
 * on the ruined tower, colon-and-quote marks on the chest, bracket-swept
 * horns.
 */
function drawJsonBoss(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  R: number,
  time: number
): void {
  const lw = Math.max(4, R * 0.05);
  ctx.save();
  ctx.translate(x, y);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const TOXIC = '#7CFF4D';
  const SHADOW = '#0c3230';
  const MID = '#15635a';
  const HI = '#2a8f7f';
  const BELLY = '#a8e06a';

  /* ---------- backdrop: aura, streaks, storm rings, far spires ---------- */
  const aura = ctx.createRadialGradient(0, -R * 0.5, R * 0.4, 0, -R * 0.5, R * 3.1);
  aura.addColorStop(0, 'rgba(24, 6, 34, 0.65)');
  aura.addColorStop(1, 'rgba(10, 4, 18, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, -R * 0.5, R * 3.1, 0, 6.283);
  ctx.fill();
  for (let k = 0; k < 5; k++) {
    const sy = -R * (2.3 - k * 0.9);
    ctx.strokeStyle = k % 2 === 0 ? 'rgba(124, 255, 77, 0.05)' : 'rgba(122, 79, 168, 0.08)';
    ctx.lineWidth = R * (0.22 - k * 0.02);
    ctx.beginPath();
    ctx.moveTo(-R * 2.6, sy + R * 0.5);
    ctx.quadraticCurveTo(0, sy - R * 0.3, R * 2.6, sy + R * 0.2);
    ctx.stroke();
  }
  for (let k = 0; k < 3; k++) {
    const rr = R * (1.6 + k * 0.36);
    const rot = time * (k % 2 === 0 ? 0.18 : -0.13) + k * 2.1;
    ctx.strokeStyle = TOXIC;
    ctx.globalAlpha = 0.12 - k * 0.03;
    ctx.lineWidth = R * (0.1 - k * 0.02);
    ctx.setLineDash([rr * 0.9, rr * 0.55]);
    ctx.lineDashOffset = -rot * rr;
    ctx.beginPath();
    ctx.ellipse(0, -R * 0.45, rr, rr * 0.6, 0, 0, 6.283);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;
  ctx.globalAlpha = 1;
  const FAR_SPIRES: readonly [number, number, number][] = [
    [-1.9, 1.1, 0.2],
    [-1.4, 1.5, 0.24],
    [1.55, 1.45, 0.24],
    [2.0, 1.0, 0.18]
  ];
  for (const [sx, h, w] of FAR_SPIRES) {
    ctx.fillStyle = '#1a1030';
    ctx.beginPath();
    ctx.moveTo(R * (sx - w), R * 0.9);
    ctx.lineTo(R * (sx - w * 0.3), R * (0.9 - h));
    ctx.lineTo(R * sx, R * (0.9 - h - 0.2));
    ctx.lineTo(R * (sx + w * 0.3), R * (0.9 - h));
    ctx.lineTo(R * (sx + w), R * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(124, 255, 77, 0.2)';
    ctx.fillRect(R * (sx - 0.025), R * (0.9 - h * 0.55), R * 0.05, R * 0.1);
  }

  /* ---------- the floating rock (kept: Bryan likes the rock) ---------- */
  ctx.beginPath();
  ctx.moveTo(-R * 1.75, R * 1.0);
  ctx.lineTo(-R * 1.1, R * 1.7);
  ctx.lineTo(-R * 0.35, R * 2.0);
  ctx.lineTo(R * 0.5, R * 1.85);
  ctx.lineTo(R * 1.25, R * 1.5);
  ctx.lineTo(R * 1.75, R * 1.0);
  ctx.closePath();
  ctx.fillStyle = '#171024';
  ctx.fill();
  ctx.strokeStyle = '#2b1d45';
  ctx.lineWidth = lw * 0.8;
  ctx.stroke();
  ctx.fillStyle = '#221737';
  ctx.beginPath();
  ctx.moveTo(-R * 1.75, R * 1.0);
  ctx.lineTo(-R * 1.1, R * 1.7);
  ctx.lineTo(-R * 0.55, R * 1.15);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(R * 1.75, R * 1.0);
  ctx.lineTo(R * 1.25, R * 1.5);
  ctx.lineTo(R * 0.7, R * 1.1);
  ctx.closePath();
  ctx.fill();
  // The rock's top plateau, lit faintly by the hoard.
  ctx.beginPath();
  ctx.moveTo(-R * 1.75, R * 1.0);
  ctx.lineTo(-R * 1.2, R * 0.82);
  ctx.lineTo(R * 1.1, R * 0.82);
  ctx.lineTo(R * 1.75, R * 1.0);
  ctx.closePath();
  ctx.fillStyle = '#2b1d45';
  ctx.fill();
  // Crystals hanging beneath, green-tipped.
  for (const [cx, cy, ch] of [
    [-R * 0.85, R * 1.8, R * 0.5],
    [-R * 0.15, R * 2.0, R * 0.62],
    [R * 0.6, R * 1.82, R * 0.44]
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(cx - R * 0.14, cy - R * 0.06);
    ctx.lineTo(cx, cy + ch);
    ctx.lineTo(cx + R * 0.14, cy - R * 0.06);
    ctx.closePath();
    ctx.fillStyle = SHADOW;
    ctx.fill();
    ctx.strokeStyle = '#4d2a6e';
    ctx.lineWidth = lw * 0.5;
    ctx.stroke();
    const tipGlow = 0.4 + Math.sin(time * 1.4 + cx) * 0.25;
    ctx.fillStyle = `rgba(124, 255, 77, ${tipGlow.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(cx, cy + ch, R * 0.045, 0, 6.283);
    ctx.fill();
  }
  // Drifting shards.
  for (const [ox, oy, os, ph] of [
    [-R * 2.15, R * 0.3, 0.16, 0],
    [R * 2.2, R * 0.05, 0.13, 2.1],
    [R * 1.95, R * 1.15, 0.1, 4.2]
  ] as const) {
    const bob = Math.sin(time * 0.7 + ph) * R * 0.06;
    ctx.beginPath();
    ctx.moveTo(ox - R * os, oy + bob);
    ctx.lineTo(ox, oy - R * os * 0.9 + bob);
    ctx.lineTo(ox + R * os, oy + bob);
    ctx.lineTo(ox, oy + R * os * 1.4 + bob);
    ctx.closePath();
    ctx.fillStyle = '#1d1332';
    ctx.fill();
    ctx.strokeStyle = '#2b1d45';
    ctx.lineWidth = lw * 0.4;
    ctx.stroke();
  }

  /* ---------- the ruined keep he crushed ---------- */
  // A cracked stub of the old tower, leaning, still carrying the glowing
  // sigil. Environmental storytelling: the fortress fell to its own boss.
  ctx.save();
  ctx.translate(-R * 1.05, R * 0.82);
  ctx.rotate(-0.09);
  ctx.beginPath();
  ctx.moveTo(-R * 0.24, 0);
  ctx.lineTo(-R * 0.2, -R * 0.85);
  ctx.lineTo(-R * 0.06, -R * 0.72);
  ctx.lineTo(R * 0.05, -R * 1.0);
  ctx.lineTo(R * 0.14, -R * 0.7);
  ctx.lineTo(R * 0.22, -R * 0.78);
  ctx.lineTo(R * 0.24, 0);
  ctx.closePath();
  ctx.fillStyle = '#100a1c';
  ctx.fill();
  ctx.strokeStyle = '#4d2a6e';
  ctx.lineWidth = lw * 0.7;
  ctx.stroke();
  // Brick courses and a crack of green light.
  ctx.strokeStyle = 'rgba(107, 77, 150, 0.18)';
  ctx.lineWidth = lw * 0.3;
  ctx.beginPath();
  for (let r = 1; r < 5; r++) {
    ctx.moveTo(-R * 0.21, -r * R * 0.17);
    ctx.lineTo(R * 0.22, -r * R * 0.17);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(124, 255, 77, 0.5)';
  ctx.lineWidth = lw * 0.35;
  ctx.beginPath();
  ctx.moveTo(-R * 0.06, -R * 0.05);
  ctx.lineTo(-R * 0.01, -R * 0.3);
  ctx.lineTo(-R * 0.1, -R * 0.5);
  ctx.stroke();
  // The sigil, still burning on the dead wall: { } as JSON prints it.
  const sig = 0.6 + Math.sin(time * 1.9) * 0.4;
  ctx.strokeStyle = `rgba(124, 255, 77, ${(0.45 + sig * 0.55).toFixed(3)})`;
  ctx.lineWidth = lw * 0.8;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * R * 0.035, -R * 0.62);
    ctx.quadraticCurveTo(side * R * 0.1, -R * 0.61, side * R * 0.09, -R * 0.545);
    ctx.quadraticCurveTo(side * R * 0.08, -R * 0.5, side * R * 0.125, -R * 0.485);
    ctx.quadraticCurveTo(side * R * 0.08, -R * 0.47, side * R * 0.09, -R * 0.425);
    ctx.quadraticCurveTo(side * R * 0.1, -R * 0.36, side * R * 0.035, -R * 0.35);
    ctx.stroke();
  }
  ctx.restore();
  // Rubble at the ruin's foot.
  for (const [rx, ry, rs] of [
    [-R * 1.38, R * 0.9, 0.09],
    [-R * 0.78, R * 0.94, 0.07],
    [-R * 1.15, R * 0.98, 0.055]
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(rx - R * rs, ry);
    ctx.lineTo(rx, ry - R * rs);
    ctx.lineTo(rx + R * rs, ry);
    ctx.closePath();
    ctx.fillStyle = '#1d1332';
    ctx.fill();
  }

  /* ---------- THE HYDRA ---------- */
  // A tapered organic limb: circles shrinking along a quadratic curve,
  // drawn as outline pass then body pass. The illustration trick that makes
  // necks read as flesh instead of pipes.
  const limb = (
    x0: number, y0: number, cx: number, cy: number, x1: number, y1: number,
    r0: number, r1: number, fill: string, outline = true
  ) => {
    for (const pass of outline ? [0, 1] : [1]) {
      ctx.fillStyle = pass === 0 ? STICKER_OUTLINE : fill;
      const grow = pass === 0 ? lw * 0.55 : 0;
      for (let i = 0; i <= 14; i++) {
        const t = i / 14;
        const px = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
        const py = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
        ctx.beginPath();
        ctx.arc(px, py, r0 + (r1 - r0) * t + grow, 0, 6.283);
        ctx.fill();
      }
    }
  };

  /* wings first, spread HIGH behind the body: the silhouette-maker. */
  const flap = Math.sin(time * 0.9) * 0.06;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(R * 0.3, -R * 0.7);
    ctx.rotate(side * (0.32 + flap));
    const wx = (v: number) => side * R * v;
    // Membrane: darker than the necks so the layers separate, with a sick
    // green rim along the scalloped trailing edge.
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(wx(0.85), -R * 1.35, wx(1.9), -R * 1.5);
    ctx.quadraticCurveTo(wx(1.72), -R * 0.95, wx(1.38), -R * 0.6);
    ctx.quadraticCurveTo(wx(1.22), -R * 0.3, wx(0.85), -R * 0.1);
    ctx.quadraticCurveTo(wx(0.5), R * 0.04, 0, R * 0.12);
    ctx.closePath();
    const wg = ctx.createLinearGradient(0, -R * 1.4, 0, R * 0.1);
    wg.addColorStop(0, '#8a1f4d');
    wg.addColorStop(1, '#54102f');
    ctx.fillStyle = wg;
    ctx.fill();
    ctx.strokeStyle = STICKER_OUTLINE;
    ctx.lineWidth = lw * 0.9;
    ctx.stroke();
    // Wing fingers.
    ctx.strokeStyle = '#ff6fa5';
    ctx.lineWidth = lw * 0.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(wx(0.9), -R * 1.1, wx(1.9), -R * 1.5);
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(wx(0.8), -R * 0.65, wx(1.38), -R * 0.6);
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(wx(0.55), -R * 0.26, wx(0.85), -R * 0.1);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 127, 174, 0.5)';
    ctx.lineWidth = lw * 0.45;
    ctx.beginPath();
    ctx.moveTo(wx(1.9), -R * 1.5);
    ctx.quadraticCurveTo(wx(1.72), -R * 0.95, wx(1.38), -R * 0.6);
    ctx.quadraticCurveTo(wx(1.22), -R * 0.3, wx(0.85), -R * 0.1);
    ctx.stroke();
    ctx.restore();
  }
  /* tail: coiling around the rock's east edge, spade tip swinging. */
  const swish = Math.sin(time * 0.8) * R * 0.08;
  limb(R * 0.75, R * 0.2, R * 1.7, R * 0.45, R * 1.55 + swish, R * 1.35, R * 0.22, R * 0.07, MID);
  // Spade tip.
  ctx.save();
  ctx.translate(R * 1.55 + swish, R * 1.42);
  ctx.rotate(0.5 + swish / (R * 0.4));
  ctx.beginPath();
  ctx.moveTo(0, -R * 0.16);
  ctx.lineTo(R * 0.14, R * 0.06);
  ctx.lineTo(0, R * 0.2);
  ctx.lineTo(-R * 0.14, R * 0.06);
  ctx.closePath();
  ctx.fillStyle = '#c22553';
  ctx.fill();
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = lw * 0.7;
  ctx.stroke();
  ctx.restore();

  /* the body: a massive chest low on the rock, three-tone modeled. */
  ctx.beginPath();
  ctx.ellipse(R * 0.3, -R * 0.05, R * 0.95, R * 0.78, -0.08, 0, 6.283);
  const bodyG = ctx.createLinearGradient(-R * 0.6, -R * 0.6, R * 1.1, R * 0.5);
  bodyG.addColorStop(0, HI);
  bodyG.addColorStop(0.5, MID);
  bodyG.addColorStop(1, SHADOW);
  ctx.fillStyle = bodyG;
  ctx.fill();
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = lw;
  ctx.stroke();
  // A soft lighter underside catching the hoard light.
  ctx.beginPath();
  ctx.ellipse(R * 0.22, R * 0.32, R * 0.6, R * 0.34, -0.06, 0, 6.283);
  ctx.fillStyle = BELLY;
  ctx.globalAlpha = 0.32;
  ctx.fill();
  ctx.globalAlpha = 1;
  // The colon-and-quote marks branded on the chest: still made of JSON.
  ctx.fillStyle = '#ffd24a';
  ctx.beginPath();
  ctx.arc(-R * 0.12, -R * 0.18, R * 0.045, 0, 6.283);
  ctx.arc(-R * 0.12, -R * 0.02, R * 0.045, 0, 6.283);
  ctx.fill();

  /* forelegs gripping the rock's front edge, talons over the lip. */
  for (const [fx0, fx1] of [
    [-R * 0.25, -R * 0.55],
    [R * 0.55, R * 0.85]
  ] as const) {
    limb(fx0 + R * 0.3, R * 0.25, fx0, R * 0.55, fx1, R * 0.86, R * 0.17, R * 0.12, MID);
    // Three solid talons hooking over the rock lip.
    for (let t = -1; t <= 1; t++) {
      const bx2 = fx1 + t * R * 0.1;
      ctx.beginPath();
      ctx.moveTo(bx2 - R * 0.045, R * 0.84);
      ctx.quadraticCurveTo(bx2 + R * 0.06, R * 0.92, bx2 + R * 0.015, R * 1.1);
      ctx.quadraticCurveTo(bx2 - R * 0.015, R * 0.96, bx2 - R * 0.075, R * 0.9);
      ctx.closePath();
      ctx.fillStyle = '#f2e3c2';
      ctx.fill();
      ctx.strokeStyle = STICKER_OUTLINE;
      ctx.lineWidth = lw * 0.5;
      ctx.stroke();
    }
  }

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

  /* ---------- the hoard and the tribute march ---------- */
  // The mound he guards, glowing.
  const mound = ctx.createRadialGradient(R * 0.1, R * 0.85, 0, R * 0.1, R * 0.85, R * 0.7);
  mound.addColorStop(0, 'rgba(255, 210, 74, 0.24)');
  mound.addColorStop(1, 'rgba(255, 210, 74, 0)');
  ctx.fillStyle = mound;
  ctx.beginPath();
  ctx.ellipse(R * 0.1, R * 0.88, R * 0.7, R * 0.3, 0, 0, 6.283);
  ctx.fill();
  for (let k = 0; k < 10; k++) {
    const hx2 = R * 0.1 + Math.sin(k * 2.7) * R * 0.45;
    const hy2 = R * (0.78 + (k % 3) * 0.08);
    ctx.beginPath();
    ctx.ellipse(hx2, hy2, R * 0.085, R * 0.048, 0, 0, 6.283);
    ctx.fillStyle = k % 2 ? '#ffd24a' : '#f0b429';
    ctx.fill();
    ctx.strokeStyle = STICKER_OUTLINE;
    ctx.lineWidth = lw * 0.5;
    ctx.stroke();
  }
  // The tribute march, still filing in from the west causeway.
  for (let k = 0; k < 6; k++) {
    const t = (time * 0.16 + k / 6) % 1;
    const px = -R * 1.9 + t * R * 1.9;
    const py = R * 1.32 - t * R * 0.45 + Math.sin(t * 12) * R * 0.02;
    ctx.globalAlpha = t > 0.92 ? (1 - t) / 0.08 : 0.9;
    ctx.beginPath();
    ctx.ellipse(px, py, R * 0.065, R * 0.05, 0.1, 0, 6.283);
    ctx.fillStyle = '#ffd24a';
    ctx.fill();
    ctx.strokeStyle = STICKER_OUTLINE;
    ctx.lineWidth = lw * 0.4;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // And the spiral suction above, thinned: the sky tithe.
  for (let k = 0; k < 7; k++) {
    const seed = k * 2.399963;
    const phase = (time * 0.24 + k / 7) % 1;
    const rad = R * (2.5 - phase * 2.2);
    const ang = seed + phase * 3.8;
    const tx2 = Math.cos(ang) * rad;
    const ty2 = Math.sin(ang) * rad * 0.42 + R * 0.5 * phase;
    ctx.globalAlpha = 0.2 + phase * 0.65;
    ctx.beginPath();
    ctx.ellipse(tx2, ty2, R * 0.05, R * 0.065, ang, 0, 6.283);
    ctx.fillStyle = '#ffd24a';
    ctx.fill();
    ctx.strokeStyle = STICKER_OUTLINE;
    ctx.lineWidth = lw * 0.4;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  /* ---------- lightning and the framing thorns ---------- */
  const burst = (time * 0.42) % 1;
  if (burst < 0.14) {
    const fade = 1 - burst / 0.14;
    const side = Math.floor(time * 0.42) % 2 === 0 ? 1 : -1;
    ctx.strokeStyle = TOXIC;
    ctx.globalAlpha = 0.85 * fade;
    ctx.lineWidth = lw * 0.7;
    ctx.beginPath();
    ctx.moveTo(side * R * 0.15, -R * 2.5);
    ctx.lineTo(side * R * 0.55, -R * 2.85);
    ctx.lineTo(side * R * 0.43, -R * 2.9);
    ctx.lineTo(side * R * 0.9, -R * 3.25);
    ctx.moveTo(side * R * 0.55, -R * 2.85);
    ctx.lineTo(side * R * 0.77, -R * 2.68);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * R * 1.9, R * 1.15);
    ctx.quadraticCurveTo(side * R * 1.75, R * 0.55, side * R * 1.45, R * 0.28);
    ctx.quadraticCurveTo(side * R * 1.68, R * 0.68, side * R * 1.52, R * 1.15);
    ctx.closePath();
    ctx.fillStyle = '#0b0614';
    ctx.fill();
    ctx.strokeStyle = 'rgba(124, 255, 77, 0.25)';
    ctx.lineWidth = lw * 0.4;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * MOUNT SOCKO, second design, to Bryan's spec: a WHITE sock volcano with
 * the TOE as the summit crater, zigzag stripes down the tube, and two
 * mischievous puppet eyes. Ominous but still laundry. It floats on its own
 * isle in the north-east void (U-7), where enveloped bugs get posted; the
 * toll is the long ride home.
 */
function drawSockMount(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  R: number,
  time: number
): void {
  const lw = Math.max(4, R * 0.05);
  ctx.save();
  ctx.translate(x, y);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // Cold mist pooling around the isle.
  const mist = ctx.createRadialGradient(0, R * 0.7, R * 0.2, 0, R * 0.7, R * 1.9);
  mist.addColorStop(0, 'rgba(150, 140, 190, 0.2)');
  mist.addColorStop(1, 'rgba(150, 140, 190, 0)');
  ctx.fillStyle = mist;
  ctx.beginPath();
  ctx.arc(0, R * 0.7, R * 1.9, 0, 6.283);
  ctx.fill();
  // THE SOCK, toe up: a wide cuff planted at the base, the tube rising and
  // leaning, the heel bulging on the right, and the rounded TOE as the
  // volcano's summit.
  ctx.beginPath();
  ctx.moveTo(-R * 0.95, R * 0.95); // cuff, left foot of the mountain
  ctx.lineTo(-R * 0.55, -R * 0.5); // tube, left slope
  ctx.quadraticCurveTo(-R * 0.45, -R * 1.15, -R * 0.05, -R * 1.42); // shoulder to toe
  ctx.quadraticCurveTo(R * 0.4, -R * 1.55, R * 0.52, -R * 1.1); // the TOE, rounded summit
  ctx.quadraticCurveTo(R * 0.58, -R * 0.7, R * 0.42, -R * 0.35); // down the instep
  ctx.quadraticCurveTo(R * 0.75, -R * 0.1, R * 0.8, R * 0.3); // the heel bulge
  ctx.quadraticCurveTo(R * 0.85, R * 0.7, R * 0.95, R * 0.95); // heel to base
  ctx.closePath();
  ctx.fillStyle = '#f2f5fb';
  ctx.fill();
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = lw;
  ctx.stroke();
  // ZIGZAG STRIPES across the tube, following the lean.
  ctx.save();
  ctx.clip();
  for (let s = 0; s < 3; s++) {
    const sy = R * (0.55 - s * 0.55);
    ctx.beginPath();
    ctx.moveTo(-R * 1.1, sy);
    for (let k = 0; k <= 8; k++) {
      const zx = -R * 1.1 + (k * R * 2.2) / 8;
      const zy = sy + (k % 2 === 0 ? 0 : -R * 0.14) - s * R * 0.05;
      ctx.lineTo(zx, zy);
    }
    ctx.strokeStyle = s % 2 === 0 ? '#e3123a' : '#5CA8FF';
    ctx.lineWidth = R * 0.11;
    ctx.stroke();
  }
  // The TOE CRATER: a dark mouth at the summit with a lava glow breathing
  // inside; it is a volcano, after all.
  const glow = 0.5 + Math.sin(time * 1.7) * 0.5;
  ctx.beginPath();
  ctx.ellipse(R * 0.22, -R * 1.32, R * 0.3, R * 0.13, -0.2, 0, 6.283);
  ctx.fillStyle = '#1a0a10';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(R * 0.22, -R * 1.3, R * 0.2, R * 0.08, -0.2, 0, 6.283);
  ctx.fillStyle = `rgba(255, 90, 30, ${(0.45 + glow * 0.55).toFixed(3)})`;
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = lw * 0.8;
  ctx.beginPath();
  ctx.ellipse(R * 0.22, -R * 1.32, R * 0.3, R * 0.13, -0.2, 0, 6.283);
  ctx.stroke();
  // Wisps of sock-steam curling off the crater.
  ctx.strokeStyle = 'rgba(220, 225, 240, 0.55)';
  ctx.lineWidth = lw * 0.6;
  for (let k = 0; k < 2; k++) {
    const drift = Math.sin(time * 0.9 + k * 2.2) * R * 0.08;
    ctx.beginPath();
    ctx.moveTo(R * (0.12 + k * 0.2), -R * 1.42);
    ctx.quadraticCurveTo(
      R * (0.05 + k * 0.25) + drift,
      -R * 1.75,
      R * (0.18 + k * 0.22) + drift,
      -R * (1.95 + k * 0.12)
    );
    ctx.stroke();
  }
  // MISCHIEVOUS PUPPET EYES on the tube: wide white eyes with slanted lids
  // and darting pupils. It is a puppet; it is watching; it is delighted.
  const dart = Math.sin(time * 0.8) * R * 0.03;
  for (const [ex, ey] of [
    [-R * 0.18, -R * 0.55],
    [R * 0.18, -R * 0.6]
  ] as const) {
    ctx.beginPath();
    ctx.arc(ex, ey, R * 0.13, 0, 6.283);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = STICKER_OUTLINE;
    ctx.lineWidth = lw * 0.7;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ex + dart, ey + R * 0.03, R * 0.055, 0, 6.283);
    ctx.fillStyle = STICKER_OUTLINE;
    ctx.fill();
    // The slanted lid: half the eye hooded, pure mischief.
    ctx.beginPath();
    ctx.moveTo(ex - R * 0.14, ey - R * 0.11);
    ctx.lineTo(ex + R * 0.14, ey - R * 0.02);
    ctx.lineWidth = lw * 0.8;
    ctx.stroke();
  }
  // A crooked stitched grin under the eyes.
  ctx.beginPath();
  ctx.moveTo(-R * 0.15, -R * 0.28);
  ctx.quadraticCurveTo(R * 0.05, -R * 0.18, R * 0.25, -R * 0.32);
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = lw * 0.7;
  ctx.stroke();
  ctx.restore();
}

/**
 * THE STEEM RUINS: the old chain as a place. A dead grey district in the
 * void: cracked towers, one citadel snapped mid-height, dark houses that
 * will never light again, and a rusted rail stub running toward the living
 * world and BREAKING off, which is the fork drawn as geography. Everything
 * here is desaturated on purpose: the one district with no red, no gold and
 * almost no animation. Only a faint ghost flicker in one window, sometimes.
 */
export function drawSteemRuins(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  R: number,
  time: number
): void {
  const lw = Math.max(3.5, R * 0.045);
  ctx.save();
  ctx.translate(x, y);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Cold grey mist, the only atmosphere the place has left.
  const mist = ctx.createRadialGradient(0, 0, R * 0.3, 0, 0, R * 2.4);
  mist.addColorStop(0, 'rgba(110, 118, 130, 0.14)');
  mist.addColorStop(1, 'rgba(110, 118, 130, 0)');
  ctx.fillStyle = mist;
  ctx.beginPath();
  ctx.arc(0, 0, R * 2.4, 0, 6.283);
  ctx.fill();

  // The rusted rail stub: it runs toward the living world (north-east) and
  // simply STOPS, three broken slats past the break. The fork, as geography.
  ctx.strokeStyle = '#6e4a33';
  ctx.lineWidth = lw * 1.4;
  ctx.setLineDash([R * 0.18, R * 0.1]);
  ctx.beginPath();
  ctx.moveTo(R * 0.2, R * 0.55);
  ctx.lineTo(R * 1.5, R * 0.05);
  ctx.stroke();
  ctx.setLineDash([]);
  for (let k = 0; k < 3; k++) {
    const fx = R * (1.65 + k * 0.22);
    const fy = R * (0 - k * 0.1);
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(0.6 + k * 0.9);
    ctx.beginPath();
    ctx.moveTo(-R * 0.09, 0);
    ctx.lineTo(R * 0.09, 0);
    ctx.stroke();
    ctx.restore();
  }

  // The broken citadel: the same silhouette the living ring wears, snapped
  // mid-height, crown gone.
  ctx.fillStyle = '#3a3d46';
  ctx.strokeStyle = '#23252c';
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(-R * 0.95, R * 0.6);
  ctx.lineTo(-R * 0.82, -R * 0.75);
  ctx.lineTo(-R * 0.62, -R * 0.45); // the snap
  ctx.lineTo(-R * 0.55, -R * 0.85);
  ctx.lineTo(-R * 0.42, R * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Its fallen crown, lying beside it.
  ctx.beginPath();
  ctx.ellipse(-R * 0.15, R * 0.52, R * 0.16, R * 0.07, 0.5, 0, 6.283);
  ctx.fill();
  ctx.stroke();

  // Dead houses: the same rounded blobs the living posts get, unlit.
  for (const [hx, hy, hr] of [
    [R * 0.35, R * 0.1, R * 0.16],
    [R * 0.72, R * 0.32, R * 0.13],
    [R * 0.1, -R * 0.35, R * 0.14],
    [-R * 0.15, R * 0.05, R * 0.11]
  ] as const) {
    ctx.beginPath();
    ctx.arc(hx, hy, hr, 0, 6.283);
    ctx.fillStyle = '#33363e';
    ctx.fill();
    ctx.strokeStyle = '#23252c';
    ctx.lineWidth = lw * 0.7;
    ctx.stroke();
  }

  // A toppled tower between the houses.
  ctx.save();
  ctx.translate(R * 0.45, -R * 0.15);
  ctx.rotate(1.25);
  ctx.fillStyle = '#3a3d46';
  ctx.fillRect(-R * 0.07, -R * 0.42, R * 0.14, R * 0.42);
  ctx.strokeStyle = '#23252c';
  ctx.lineWidth = lw * 0.7;
  ctx.strokeRect(-R * 0.07, -R * 0.42, R * 0.14, R * 0.42);
  ctx.restore();

  // The ghost flicker: once in a while one dead window remembers being on.
  const cycle = (time * 0.23) % 1;
  if (cycle > 0.92) {
    const flick = Math.sin(time * 30) > 0 ? 0.5 : 0.15;
    ctx.fillStyle = `rgba(160, 200, 220, ${flick})`;
    ctx.fillRect(-R * 0.78, -R * 0.5, R * 0.07, R * 0.1);
  }
  ctx.restore();
}

/** Chip top colors: ember is shed land; the rest are bold crystal. */
const CHIP_TOPS: Record<string, { glow: string; face: string }> = {
  ember: { glow: '#ff4030', face: '#d3231f' },
  teal: { glow: '#7FD9D2', face: '#3fb8ae' },
  lilac: { glow: '#D9A8FF', face: '#a86ee8' },
  pink: { glow: '#FF6FB0', face: '#e04a8f' },
  gold: { glow: '#FFD9A0', face: '#e8a84d' }
};

/**
 * A FLOATING ISLAND CHIP: a fragment the planet shed, hovering in the void.
 * Faceted dark rock tapering to a point, a glowing colored top, exactly one
 * structure (a hut with a lit window, or a crystal spire), and a pebble or
 * two drifting beneath. The magic-island feeling from Bryan's board-game
 * brief, in one small drawing.
 */
export function drawIslandChip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  top: string,
  kind: 'hut' | 'spire',
  index: number,
  time: number,
  scale: number
): void {
  const c = CHIP_TOPS[top] ?? CHIP_TOPS.teal;
  const hover = Math.sin(time * (6.283 / (6 + (index % 4))) + index * 1.3) * 4;
  const s = 40 * scale;
  ctx.save();
  ctx.translate(x, y + hover * scale);
  ctx.lineJoin = 'round';
  // Soft colored halo so the chip reads from afar and the void gets color.
  const halo = ctx.createRadialGradient(0, 0, s * 0.2, 0, 0, s * 2.2);
  halo.addColorStop(0, c.glow + '55');
  halo.addColorStop(1, c.glow + '00');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, s * 2.2, 0, 6.283);
  ctx.fill();
  // The rock underside: faceted violet taper.
  ctx.beginPath();
  ctx.moveTo(-s, 0);
  ctx.lineTo(-s * 0.45, s * 0.75);
  ctx.lineTo(0, s * 1.3);
  ctx.lineTo(s * 0.5, s * 0.7);
  ctx.lineTo(s, 0);
  ctx.closePath();
  ctx.fillStyle = '#2c2137';
  ctx.fill();
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = Math.max(2.5, s * 0.09);
  ctx.stroke();
  // Facet lines.
  ctx.strokeStyle = '#4a3a5e';
  ctx.lineWidth = Math.max(1.2, s * 0.045);
  ctx.beginPath();
  ctx.moveTo(-s * 0.45, s * 0.1);
  ctx.lineTo(0, s * 1.3);
  ctx.moveTo(s * 0.4, s * 0.15);
  ctx.lineTo(0, s * 1.3);
  ctx.stroke();
  // The glowing top.
  ctx.beginPath();
  ctx.ellipse(0, 0, s, s * 0.32, 0, 0, 6.283);
  ctx.fillStyle = c.face;
  ctx.fill();
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = Math.max(2.5, s * 0.09);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.06, s * 0.8, s * 0.2, 0, 0, 6.283);
  ctx.fillStyle = c.glow;
  ctx.globalAlpha = 0.75;
  ctx.fill();
  ctx.globalAlpha = 1;
  // The one structure.
  if (kind === 'hut') {
    ctx.fillStyle = '#3b2a4e';
    ctx.fillRect(-s * 0.28, -s * 0.62, s * 0.56, s * 0.5);
    ctx.strokeStyle = STICKER_OUTLINE;
    ctx.lineWidth = Math.max(2, s * 0.07);
    ctx.strokeRect(-s * 0.28, -s * 0.62, s * 0.56, s * 0.5);
    ctx.beginPath();
    ctx.moveTo(-s * 0.38, -s * 0.62);
    ctx.lineTo(0, -s * 0.95);
    ctx.lineTo(s * 0.38, -s * 0.62);
    ctx.closePath();
    ctx.fillStyle = c.face;
    ctx.fill();
    ctx.stroke();
    // The lit window: someone is home out here.
    const flick = 0.65 + Math.sin(time * 2.1 + index * 3) * 0.35;
    ctx.fillStyle = `rgba(255, 217, 160, ${(0.4 + flick * 0.6).toFixed(3)})`;
    ctx.fillRect(-s * 0.09, -s * 0.45, s * 0.18, s * 0.2);
  } else {
    const pulse = 0.6 + Math.sin(time * 1.3 + index * 2) * 0.4;
    ctx.beginPath();
    ctx.moveTo(-s * 0.2, -s * 0.05);
    ctx.lineTo(0, -s * 1.05);
    ctx.lineTo(s * 0.2, -s * 0.05);
    ctx.closePath();
    ctx.fillStyle = c.glow;
    ctx.globalAlpha = 0.5 + pulse * 0.4;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = STICKER_OUTLINE;
    ctx.lineWidth = Math.max(2, s * 0.07);
    ctx.stroke();
  }
  // Anti-gravity pebbles, drifting counter-phase below the taper.
  ctx.fillStyle = '#4a3a5e';
  for (let k = 0; k < 2; k++) {
    const py = s * (1.55 + k * 0.35) - hover * 0.6 * scale;
    ctx.beginPath();
    ctx.arc((k - 0.5) * s * 0.5, py, Math.max(1.5, s * 0.07), 0, 6.283);
    ctx.fill();
  }
  ctx.restore();
}

/** Stained glass in six saturated cuts; leading in deep violet-stone. */
const ROSE_GLASS: readonly string[] = ['#FF5C8A', '#FFC14D', '#4CE0A0', '#5CA8FF', '#B98AFF', '#FF9EDA'];
const ROSE_LEAD = '#241333';

/**
 * HIVE COMB HOME (was the Rose Window). Bryan: "go look at real images of
 * honeycombs... nature gives you the answer. just go mimic a real honey
 * comb. but keep the fun color changing." So this is a REAL comb now: one
 * wax slab hanging from a branch, cells hex-PACKED and sharing walls the
 * way bees actually build - centre cell, a ring of six honey cells, and an
 * outer ring of twelve where the ten link panes live in their stained-glass
 * colors (the two spare cells are wax-capped). Slight waviness and a slow
 * breath keep it organic; honey drips off the bottom edge and one bee is
 * always on patrol.
 */

/** Hex-cell size of the comb (centre-to-corner), in units of the window R. */
const COMB_S = 0.26;

/**
 * The twelve outer comb slots in pane order, clockwise from the top. Panes
 * fill these first; whatever slots are left over stay wax-capped, so the
 * comb absorbs new links without redesign (Bryan keeps moving icons in).
 */
function combSlots(R: number): { x: number; y: number; deg: number }[] {
  const ring2 = combSpots(R)
    .filter((sp) => sp.ring === 2)
    .sort((a, b) => ((a.deg + 90) % 360) - ((b.deg + 90) % 360));
  // THE GROWTH ROW: four cells built onto the comb's bottom edge, left to
  // right, the way a real comb extends downward. Panes overflow into these
  // once the twelve ring slots are full (Bryan keeps moving links in).
  const d = Math.sqrt(3) * COMB_S * R;
  const growth = [-1.5, -0.5, 0.5, 1.5].map((gx, i) => ({
    x: gx * d,
    y: 2.598 * d,
    deg: 500 + i * 37
  }));
  return [...ring2, ...growth];
}

/** All eighteen non-centre cell spots of the comb, hex-grid honest. */
function combSpots(R: number): { x: number; y: number; ring: 1 | 2; deg: number }[] {
  const s = COMB_S * R;
  const d = Math.sqrt(3) * s; // neighbour centre distance
  const spots: { x: number; y: number; ring: 1 | 2; deg: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const ca = (Math.PI / 180) * (i * 60);
    spots.push({ x: Math.cos(ca) * d, y: Math.sin(ca) * d, ring: 1, deg: i * 60 });
    spots.push({ x: Math.cos(ca) * 2 * d, y: Math.sin(ca) * 2 * d, ring: 2, deg: i * 60 });
    const ea = (Math.PI / 180) * (i * 60 + 30);
    spots.push({
      x: Math.cos(ea) * Math.sqrt(3) * d,
      y: Math.sin(ea) * Math.sqrt(3) * d,
      ring: 2,
      deg: i * 60 + 30
    });
  }
  return spots;
}

/** The ten pane cells, clockwise from the top. Shared by drawing, the
 *  label pass and the click hit test, so glass and target never drift. */
export function rosePaneCentre(k: number, count: number, R: number): { x: number; y: number } {
  const slots = combSlots(R);
  const sp = slots[k % slots.length];
  return { x: sp.x, y: sp.y };
}

export function drawRoseWindow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  R: number,
  time: number
): void {
  // TAKE THREE (Bryan): "combine those 2 images" - the GOOEY imperfect real
  // comb and the bold artist comb - "keep it with many colors and do
  // something sharp and fun and colorful as the back circle, why brown."
  // So: a sharp pinwheel COLOR BURST behind everything, a golden (not
  // brown) comb on top whose cells vary in size and wobble hard, honey
  // BULGING out of the full cells and running down over the walls, drips
  // letting go below, and the Hive mark stamped black on the red heart.
  const lw = Math.max(3, R * 0.05);
  ctx.save();
  ctx.translate(x, y);
  ctx.lineJoin = 'round';
  const wob = (i: number) => {
    const v = Math.sin(i * 12.9898) * 43758.5453;
    return (v - Math.floor(v)) - 0.5;
  };
  // A comb cell: hexagonal but visibly HANDMADE - strong per-corner wobble,
  // per-cell size, and a slow living breath.
  const cell = (cx: number, cy: number, r: number, seed: number) => {
    const size = 1 + wob(seed * 31) * 0.13;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + (i / 6) * 6.283 + wob(seed * 7 + i) * 0.14;
      const rr =
        r * size * (1 + wob(seed * 13 + i * 3) * 0.11 + Math.sin(time * 0.8 + seed * 1.9 + i) * 0.03);
      const px = cx + Math.cos(a) * rr;
      const py = cy + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  };
  // Warm glow.
  const halo = ctx.createRadialGradient(0, 0, R * 0.3, 0, 0, R * 2.0);
  halo.addColorStop(0, 'rgba(255, 200, 120, 0.22)');
  halo.addColorStop(1, 'rgba(255, 200, 120, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, R * 2.0, 0, 6.283);
  ctx.fill();
  // THE COLOR BURST: a sharp pinwheel of sixteen bright wedges turning very
  // slowly behind the comb. This is the back circle now; the brown is gone.
  const BURST = ['#FF5C8A', '#FFC14D', '#4CE0A0', '#5CA8FF', '#B98AFF', '#FF9EDA', '#5EE9D5', '#ff8a3d'];
  const spin = time * 0.04;
  for (let k = 0; k < 16; k++) {
    const a0 = spin + (k / 16) * 6.283;
    const a1 = spin + ((k + 1) / 16) * 6.283;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, R * 1.5, a0, a1);
    ctx.closePath();
    ctx.fillStyle = BURST[k % BURST.length];
    ctx.globalAlpha = 0.85;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = lw * 1.1;
  ctx.beginPath();
  ctx.arc(0, 0, R * 1.5, 0, 6.283);
  ctx.stroke();
  // THE BRANCH it hangs from.
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = R * 0.115;
  ctx.beginPath();
  ctx.moveTo(-R * 1.62, -R * 1.5);
  ctx.quadraticCurveTo(0, -R * 1.68, R * 1.68, -R * 1.56);
  ctx.stroke();
  ctx.strokeStyle = '#5a3d22';
  ctx.lineWidth = R * 0.08;
  ctx.beginPath();
  ctx.moveTo(-R * 1.62, -R * 1.5);
  ctx.quadraticCurveTo(0, -R * 1.68, R * 1.68, -R * 1.56);
  ctx.stroke();
  ctx.lineWidth = R * 0.045;
  ctx.beginPath();
  ctx.moveTo(R * 0.95, -R * 1.6);
  ctx.quadraticCurveTo(R * 1.2, -R * 1.78, R * 1.42, -R * 1.83);
  ctx.stroke();
  // Wax stems tying the comb to the branch.
  ctx.fillStyle = '#c98a2a';
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = lw * 0.6;
  for (const [sx, sw] of [
    [-R * 0.42, R * 0.24],
    [R * 0.38, R * 0.3]
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(sx - sw * 0.35, -R * 1.58);
    ctx.lineTo(sx + sw * 0.35, -R * 1.6);
    ctx.lineTo(sx + sw * 0.55, -R * 1.05);
    ctx.lineTo(sx - sw * 0.55, -R * 1.03);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // THE COMB SLAB: bright golden wax (not brown), edge wavy and irregular.
  ctx.beginPath();
  for (let i = 0; i <= 22; i++) {
    const a = (i / 22) * 6.283;
    const rr =
      R * (1.14 + wob(i % 22) * 0.07 + Math.sin(time * 0.5 + i * 1.7) * 0.015) *
      // The slab bulges DOWNWARD to back the growth row; the newest cells
      // still poke past its edge, which is exactly how a comb under
      // construction looks.
      (1 + 0.17 * Math.max(0, Math.sin(a)) - 0.05 * Math.sin(a));
    const px = Math.cos(a) * rr;
    const py = Math.sin(a) * rr * 0.97;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  const wax = ctx.createRadialGradient(-R * 0.2, -R * 0.3, R * 0.15, 0, 0, R * 1.25);
  wax.addColorStop(0, '#f0a83a');
  wax.addColorStop(0.6, '#cf7f1c');
  wax.addColorStop(1, '#9c5a10');
  ctx.fillStyle = wax;
  ctx.fill();
  ctx.strokeStyle = STICKER_OUTLINE;
  ctx.lineWidth = lw * 1.2;
  ctx.stroke();
  const cr = COMB_S * R * 0.9;
  const spots = combSpots(R);
  const paneCount = ROSE_WINDOW_PANES.length;
  const WALL = '#7a4410';
  // Ring 1: six honey cells in VARIED warm hues, each with its own fill
  // level, gloss and bubbles - the gooey half of the brief.
  const HONEY_HUES: readonly [string, string][] = [
    ['#ffd24a', '#c67a12'],
    ['#ffb42e', '#a85e0e'],
    ['#ff9a2e', '#b0500a'],
    ['#ffe07a', '#d18a16'],
    ['#ffab3d', '#96520c'],
    ['#ffc95c', '#bd6c10']
  ];
  let hi = 0;
  for (const sp of spots) {
    if (sp.ring !== 1) continue;
    const [top, deep] = HONEY_HUES[hi % HONEY_HUES.length];
    const gleam = 0.85 + Math.sin(time * 0.7 + sp.deg) * 0.15;
    cell(sp.x, sp.y, cr, sp.deg + 100);
    const honey = ctx.createRadialGradient(sp.x - cr * 0.3, sp.y - cr * 0.35, cr * 0.08, sp.x, sp.y, cr * 1.2);
    honey.addColorStop(0, top);
    honey.addColorStop(1, deep);
    ctx.fillStyle = honey;
    ctx.globalAlpha = gleam;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = WALL;
    ctx.lineWidth = lw * 0.75;
    ctx.stroke();
    // The BULGE: honey overflowing the cell mouth, glossy, spilling a
    // little over one wall.
    if (hi % 2 === 0) {
      const bx = sp.x + wob(sp.deg) * cr * 0.3;
      const by = sp.y + cr * 0.2;
      ctx.beginPath();
      ctx.ellipse(bx, by, cr * 0.72, cr * 0.6, wob(sp.deg + 5) * 0.5, 0, 6.283);
      const bul = ctx.createRadialGradient(bx - cr * 0.25, by - cr * 0.3, cr * 0.05, bx, by, cr * 0.8);
      bul.addColorStop(0, '#ffe9a8');
      bul.addColorStop(0.5, top);
      bul.addColorStop(1, deep);
      ctx.fillStyle = bul;
      ctx.globalAlpha = 0.92;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // Specular gleam and two tiny bubbles.
    ctx.fillStyle = 'rgba(255, 244, 210, 0.7)';
    ctx.beginPath();
    ctx.ellipse(sp.x - cr * 0.28, sp.y - cr * 0.34, cr * 0.24, cr * 0.12, -0.6, 0, 6.283);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 240, 200, 0.5)';
    ctx.beginPath();
    ctx.arc(sp.x + cr * 0.25, sp.y + cr * 0.1, cr * 0.06, 0, 6.283);
    ctx.arc(sp.x + cr * 0.05, sp.y + cr * 0.32, cr * 0.045, 0, 6.283);
    ctx.fill();
    // A honey RUN dribbling down over the wall below the cell.
    if (hi % 3 === 0) {
      const runLen = cr * (0.7 + wob(sp.deg + 9) * 0.3);
      ctx.beginPath();
      ctx.moveTo(sp.x - cr * 0.12, sp.y + cr * 0.72);
      ctx.quadraticCurveTo(sp.x - cr * 0.1, sp.y + cr * 0.72 + runLen * 0.7, sp.x, sp.y + cr * 0.72 + runLen);
      ctx.quadraticCurveTo(sp.x + cr * 0.1, sp.y + cr * 0.72 + runLen * 0.6, sp.x + cr * 0.12, sp.y + cr * 0.72);
      ctx.closePath();
      ctx.fillStyle = top;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    hi++;
  }
  // Whatever outer slots the panes do not use stay wax-capped, lighter
  // gold, dimpled.
  const slots = combSlots(R);
  for (let k = paneCount; k < slots.length; k++) {
    const sp = slots[k];
    cell(sp.x, sp.y, cr, sp.deg + 200);
    ctx.fillStyle = '#f2c56a';
    ctx.fill();
    ctx.strokeStyle = WALL;
    ctx.lineWidth = lw * 0.75;
    ctx.stroke();
    ctx.fillStyle = 'rgba(140, 85, 20, 0.35)';
    ctx.beginPath();
    ctx.arc(sp.x + cr * 0.1, sp.y + cr * 0.08, cr * 0.32, 0, 6.283);
    ctx.fill();
  }
  // THE TEN PANE CELLS: stained glass, breathing colour kept, shapes as
  // wobbly as the rest of the comb.
  for (let k = 0; k < paneCount; k++) {
    const c = rosePaneCentre(k, paneCount, R);
    const lit = 0.7 + Math.sin(time * 0.6 + k * 1.9) * 0.24;
    cell(c.x, c.y, cr, k + 1);
    ctx.fillStyle = ROSE_GLASS[k % 6];
    ctx.globalAlpha = lit;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = WALL;
    ctx.lineWidth = lw * 0.75;
    ctx.stroke();
  }
  // The heart cell: warm gold, the red Hive diamond, and the REAL Hive
  // mark stamped in black on it (Bryan's order).
  const beat = 0.7 + Math.sin(time * 1.1) * 0.3;
  cell(0, 0, cr, 77);
  const oc = ctx.createRadialGradient(0, 0, 0, 0, 0, cr * 1.1);
  oc.addColorStop(0, `rgba(255, 240, 200, ${(0.75 + beat * 0.25).toFixed(3)})`);
  oc.addColorStop(1, 'rgba(255, 194, 77, 0.4)');
  ctx.fillStyle = oc;
  ctx.fill();
  ctx.strokeStyle = WALL;
  ctx.lineWidth = lw * 0.75;
  ctx.stroke();
  const d2 = R * 0.15;
  ctx.beginPath();
  ctx.moveTo(0, -d2);
  ctx.lineTo(d2 * 0.85, 0);
  ctx.lineTo(0, d2);
  ctx.lineTo(-d2 * 0.85, 0);
  ctx.closePath();
  ctx.fillStyle = '#E31337';
  ctx.fill();
  ctx.strokeStyle = '#2e1c08';
  ctx.lineWidth = lw * 0.6;
  ctx.stroke();
  drawHiveMark(ctx, 0, 0, d2 * 0.95, '#141019');
  // HONEY DRIPS off the bottom edge, stretching, one droplet letting go.
  for (const [dx, ph, len] of [
    [-R * 0.34, 0, R * 0.36],
    [R * 0.16, 2.4, R * 0.5],
    [R * 0.6, 4.4, R * 0.28]
  ] as const) {
    const stretch = 1 + Math.sin(time * 0.6 + ph) * 0.2;
    // Hangs below the growth row now that the comb built downward.
    const topY = R * 1.45;
    ctx.beginPath();
    ctx.moveTo(dx - R * 0.06, topY);
    ctx.quadraticCurveTo(dx - R * 0.055, topY + len * stretch * 0.6, dx, topY + len * stretch);
    ctx.quadraticCurveTo(dx + R * 0.055, topY + len * stretch * 0.6, dx + R * 0.06, topY);
    ctx.closePath();
    const dg = ctx.createLinearGradient(0, topY, 0, topY + len * stretch);
    dg.addColorStop(0, '#b26a12');
    dg.addColorStop(1, '#ffc44d');
    ctx.fillStyle = dg;
    ctx.fill();
    ctx.strokeStyle = '#2e1c08';
    ctx.lineWidth = lw * 0.4;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 240, 200, 0.7)';
    ctx.beginPath();
    ctx.arc(dx - R * 0.015, topY + len * stretch * 0.8, R * 0.02, 0, 6.283);
    ctx.fill();
  }
  // The droplet that lets go of the long drip, falling on a loop.
  {
    const fall = ((time * 0.45 + 0.3) % 1);
    ctx.globalAlpha = 1 - fall * 0.7;
    ctx.fillStyle = '#ffc44d';
    ctx.beginPath();
    ctx.ellipse(R * 0.16, R * 1.45 + R * 0.55 + fall * R * 0.7, R * 0.035, R * 0.05, 0, 0, 6.283);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // Two bees on patrol.
  for (const [dir, ph, rr] of [
    [1, 0, 1.7],
    [-1, 2.6, 1.58]
  ] as const) {
    const ba = time * 0.5 * dir + ph;
    const bx = Math.cos(ba) * R * rr;
    const by = Math.sin(ba) * R * (rr * 0.78) - R * 0.05;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(ba + (dir > 0 ? Math.PI / 2 : -Math.PI / 2));
    ctx.fillStyle = '#ffd24a';
    ctx.beginPath();
    ctx.ellipse(0, 0, R * 0.055, R * 0.038, 0, 0, 6.283);
    ctx.fill();
    ctx.strokeStyle = '#141019';
    ctx.lineWidth = R * 0.016;
    ctx.beginPath();
    ctx.moveTo(-R * 0.015, -R * 0.036);
    ctx.lineTo(-R * 0.015, R * 0.036);
    ctx.moveTo(R * 0.02, -R * 0.03);
    ctx.lineTo(R * 0.02, R * 0.03);
    ctx.stroke();
    const buzz = Math.sin(time * 26 + ph) * 0.35;
    ctx.fillStyle = 'rgba(200, 230, 255, 0.75)';
    for (const ws of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(-R * 0.02, ws * R * 0.045, R * 0.035, R * 0.018, ws * (0.7 + buzz), 0, 6.283);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}

/* ----------------------- community emblems ----------------------- */

/** Stable small hash of a community name, so its emblem never changes. */
function nameHash(name: string): number {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

const EMBLEM_HEX = ['#5EE9D5', '#FFC24D', '#B79CFF', '#5BE39C', '#FF90AE', '#7fb8ff'];

/**
 * An animated emblem for a community bubble, chosen from the community's own
 * NAME so every community reads as its own place and always the same one.
 * Six kinds: orbit, pulse, shards, bubbles, wave, constellation.
 *
 * Decoration only. No lore, no text, nothing clickable.
 */
export function drawCommunityEmblem(
  ctx: CanvasRenderingContext2D,
  name: string,
  x: number,
  y: number,
  r: number,
  time: number
): void {
  const h = nameHash(name);
  const kind = Math.floor(h * 6) % 6;
  const col = EMBLEM_HEX[Math.floor(h * 977) % EMBLEM_HEX.length];
  const spin = time * (0.25 + (h % 0.4));
  ctx.save();
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = Math.max(1.5, r * 0.045);
  ctx.globalAlpha = 0.85;

  if (kind === 0) {
    // Orbit: two counter-rotating rings of beads.
    for (let ring = 0; ring < 2; ring++) {
      const rr = r * (0.66 + ring * 0.2);
      const dir = ring === 0 ? 1 : -1;
      for (let i = 0; i < 5 + ring * 2; i++) {
        const a = spin * dir + (i / (5 + ring * 2)) * 6.283;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.55, r * 0.055, 0, 6.283);
        ctx.fill();
      }
    }
  } else if (kind === 1) {
    // Pulse: expanding rings, like a beacon.
    for (let i = 0; i < 3; i++) {
      const f = ((time * 0.45 + i / 3) % 1);
      ctx.globalAlpha = 0.75 * (1 - f);
      ctx.beginPath();
      ctx.arc(x, y, r * (0.28 + f * 0.68), 0, 6.283);
      ctx.stroke();
    }
  } else if (kind === 2) {
    // Shards: a slowly turning crown of triangles.
    for (let i = 0; i < 6; i++) {
      const a = spin + (i / 6) * 6.283;
      const rr = r * 0.78;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      ctx.lineTo(x + Math.cos(a + 0.22) * r * 0.5, y + Math.sin(a + 0.22) * r * 0.5);
      ctx.lineTo(x + Math.cos(a - 0.22) * r * 0.5, y + Math.sin(a - 0.22) * r * 0.5);
      ctx.closePath();
      ctx.fill();
    }
  } else if (kind === 3) {
    // Bubbles: rising specks, because this is still a sea.
    for (let i = 0; i < 9; i++) {
      const f = ((time * 0.3 + i / 9) % 1);
      const bx = x + Math.sin(i * 2.3 + f * 2) * r * 0.6;
      const by = y + r * 0.8 - f * r * 1.6;
      ctx.globalAlpha = 0.7 * (1 - f);
      ctx.beginPath();
      ctx.arc(bx, by, r * (0.04 + 0.05 * (i % 3)), 0, 6.283);
      ctx.stroke();
    }
  } else if (kind === 4) {
    // Wave: a travelling sine, drawn twice for depth.
    for (let pass = 0; pass < 2; pass++) {
      ctx.globalAlpha = pass === 0 ? 0.35 : 0.85;
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) {
        const t = i / 24;
        const wx = x - r * 0.85 + t * r * 1.7;
        const wy = y + Math.sin(t * 9 + time * 1.6 + pass * 0.8) * r * 0.26;
        if (i === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.stroke();
    }
  } else {
    // Constellation: fixed stars with a link that sweeps between them.
    const pts: [number, number][] = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * 6.283 + h * 6.283;
      const rr = r * (0.4 + ((h * (i + 3)) % 0.45));
      pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
    }
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
    ctx.closePath();
    ctx.stroke();
    ctx.globalAlpha = 0.95;
    const lit = Math.floor(time * 2) % pts.length;
    pts.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p[0], p[1], r * (i === lit ? 0.075 : 0.045), 0, 6.283);
      ctx.fill();
    });
  }
  ctx.restore();
}

/* ----------------------- the tier fish ----------------------- */

/**
 * A simple fish silhouette: body, tail, eye. `dir` is +1 to face right,
 * -1 to face left. These are scenery only, drawn dim in the open water.
 */
export function drawFish(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  dir: number,
  alpha: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-size * 0.9, 0);
  ctx.quadraticCurveTo(-size * 0.3, -size * 0.55, size * 0.45, -size * 0.12);
  ctx.quadraticCurveTo(size * 0.7, 0, size * 0.45, size * 0.12);
  ctx.quadraticCurveTo(-size * 0.3, size * 0.55, -size * 0.9, 0);
  ctx.closePath();
  ctx.fill();
  // tail
  ctx.beginPath();
  ctx.moveTo(-size * 0.85, 0);
  ctx.lineTo(-size * 1.25, -size * 0.35);
  ctx.lineTo(-size * 1.25, size * 0.35);
  ctx.closePath();
  ctx.fill();
  // eye
  ctx.globalAlpha = Math.min(1, alpha * 2.4);
  ctx.fillStyle = '#04070f';
  ctx.beginPath();
  ctx.arc(size * 0.32, -size * 0.03, Math.max(1.4, size * 0.07), 0, 6.283);
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
}
