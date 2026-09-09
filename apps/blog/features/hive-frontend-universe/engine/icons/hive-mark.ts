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
