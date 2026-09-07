/**
 * H.I.V.E.R. - painting the planet. The numbers are in lib/planet.ts.
 *
 * A sphere seen face-on, drawn as a shaded disc: a dark sea over the stars,
 * lit from the upper left, falling to night at the lower-right rim, a thin
 * atmosphere along the limb, a glassy sheen. Drawn in plain world space
 * under the land and the ring, before the flip, so when the board turns at
 * the ruins the sphere stays round and only its face slides across.
 */
import { PLANET } from '../lib/planet';

/** The disc, optionally scaled, as the current path. */
export function planetPath(ctx: CanvasRenderingContext2D, scale = 1): void {
  ctx.beginPath();
  ctx.ellipse(0, 0, PLANET.rx * scale, PLANET.ry * scale, 0, 0, Math.PI * 2);
}

export function drawPlanet(ctx: CanvasRenderingContext2D, mapness: number): void {
  const { rx, ry } = PLANET;
  // Faint while playing, so the void keeps its stars; full on the map.
  const a = (0.2 + 0.68 * mapness).toFixed(3);
  const lx = -rx * 0.4;
  const ly = -ry * 0.42;
  ctx.save();

  // The sea, lit from the upper left.
  const sea = ctx.createRadialGradient(lx, ly, rx * 0.05, lx, ly, rx * 1.75);
  sea.addColorStop(0, `rgba(64, 108, 170, ${a})`);
  sea.addColorStop(0.5, `rgba(28, 50, 100, ${a})`);
  sea.addColorStop(1, `rgba(8, 12, 30, ${a})`);
  planetPath(ctx);
  ctx.fillStyle = sea;
  ctx.fill();

  // The atmosphere: a soft glow past the rim and a crisp line on it.
  planetPath(ctx);
  ctx.strokeStyle = `rgba(120, 180, 255, ${(0.1 + 0.16 * mapness).toFixed(3)})`;
  ctx.lineWidth = rx * 0.06;
  ctx.stroke();
  ctx.strokeStyle = `rgba(180, 216, 255, ${(0.2 + 0.32 * mapness).toFixed(3)})`;
  ctx.lineWidth = rx * 0.01;
  ctx.stroke();

  // Night: the far side of the sphere falls into shadow, limb included.
  const night = ctx.createRadialGradient(lx, ly, rx * 0.3, lx, ly, rx * 1.7);
  night.addColorStop(0, 'rgba(0, 0, 0, 0)');
  night.addColorStop(0.55, 'rgba(0, 0, 0, 0)');
  night.addColorStop(1, `rgba(0, 0, 0, ${(0.4 + 0.3 * mapness).toFixed(3)})`);
  planetPath(ctx, 1.04);
  ctx.fillStyle = night;
  ctx.fill();

  // Sheen: the glass catching the light.
  const sheen = ctx.createRadialGradient(lx * 1.1, ly * 1.1, 0, lx * 1.1, ly * 1.1, rx * 0.5);
  sheen.addColorStop(0, `rgba(255, 255, 255, ${(0.06 + 0.12 * mapness).toFixed(3)})`);
  sheen.addColorStop(1, 'rgba(255, 255, 255, 0)');
  planetPath(ctx);
  ctx.fillStyle = sheen;
  ctx.fill();

  ctx.restore();
}
