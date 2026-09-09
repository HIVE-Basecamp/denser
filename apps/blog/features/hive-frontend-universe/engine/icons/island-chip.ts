import { STICKER_OUTLINE } from './shared';

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
