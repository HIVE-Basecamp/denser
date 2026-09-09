import { ROSE_WINDOW_PANES } from '../../lib/fixed-world';
import { STICKER_OUTLINE } from './shared';
import { drawHiveMark } from './hive-mark';
import { COMB_S, combSlots, combSpots, rosePaneCentre } from './rose-comb';

/** Stained glass in six saturated cuts; leading in deep violet-stone. */
const ROSE_GLASS: readonly string[] = ['#FF5C8A', '#FFC14D', '#4CE0A0', '#5CA8FF', '#B98AFF', '#FF9EDA'];
const ROSE_LEAD = '#241333';

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
