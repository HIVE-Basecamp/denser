/**
 * H.I.V.E.R. - painting the ball the world is on. The numbers are in
 * lib/planet.ts, and how it turns is lib/globe.ts.
 *
 * A sphere seen face on, drawn as a shaded disc: an ocean over the stars,
 * lit from the upper left, falling to night at the lower-right rim, a thin
 * atmosphere along the limb, a glassy sheen.
 *
 * WHAT IS HERE AND WHAT IS NOT. Everything here is the LIGHT on the ball,
 * which belongs to the viewer and not to the surface: it does not turn when
 * the globe turns, so it is painted straight onto the screen under (and
 * over) the board. The water's own surface used to be painted here too;
 * it is on the surface, it has to turn with it, so it moved out to
 * render/layer-water.ts where the warp can reach it.
 */
import { PLANET } from '../lib/planet';

/** The disc, optionally scaled, as the current path. */
export function planetPath(ctx: CanvasRenderingContext2D, scale = 1): void {
  ctx.beginPath();
  ctx.ellipse(0, 0, PLANET.rx * scale, PLANET.ry * scale, 0, 0, Math.PI * 2);
}

/** Where the light stands, world px from the ball's middle. */
export const LIGHT = { x: -PLANET.rx * 0.4, y: -PLANET.ry * 0.42 } as const;

/**
 * THE SEA ITSELF, under the board: the body of water and the light on it.
 * Bryan, 2026-09-15: the sea used to all but vanish at play zoom, which is
 * what made it read as a glow rather than as water. It holds its colour
 * while you play now and still lets the star field glitter through, like
 * light under the surface; full on the map.
 */
export function drawPlanetBody(ctx: CanvasRenderingContext2D, mapness: number): void {
  const { rx } = PLANET;
  // On the map the sea is OPAQUE: stars glittering through the water is
  // exactly what made the ball read as a glow instead of an ocean.
  const a = (0.5 + 0.49 * mapness).toFixed(3);
  const lx = LIGHT.x;
  const ly = LIGHT.y;
  ctx.save();

  // Lit from the upper left: shallow teal under the light, falling through
  // ocean blue to near-black in the deep.
  const sea = ctx.createRadialGradient(lx, ly, rx * 0.05, lx, ly, rx * 1.75);
  sea.addColorStop(0, `rgba(58, 138, 176, ${a})`);
  sea.addColorStop(0.35, `rgba(30, 86, 148, ${a})`);
  sea.addColorStop(0.72, `rgba(16, 44, 96, ${a})`);
  sea.addColorStop(1, `rgba(5, 10, 28, ${a})`);
  planetPath(ctx);
  ctx.fillStyle = sea;
  ctx.fill();
  ctx.restore();
}

/**
 * THE LIGHT ON TOP, over the board: the glitter path where the sun hits, the
 * atmosphere on the limb, the night falling round the far rim and the sheen
 * of the glass.
 *
 * This runs AFTER the board now, not under it, because a globe that turns
 * has to have a terminator: land sliding toward the rim must darken with the
 * water it sits in or the turn reads as a sliding picture. It is held to the
 * pulled-out map: `strength` crossfades it from under the board at play zoom
 * to over the board on the map, so play zoom is left exactly as it was.
 */
export function drawPlanetLight(ctx: CanvasRenderingContext2D, mapness: number, strength = 1): void {
  if (strength <= 0.001) return;
  const { rx, ry } = PLANET;
  const A = (v: number) => (v * strength).toFixed(3);
  const lx = LIGHT.x;
  const ly = LIGHT.y;
  ctx.save();

  // The glitter path: the light's own reflection smeared across the swell,
  // the way sun on water always is. Elongated, and only where the light is.
  ctx.save();
  planetPath(ctx);
  ctx.clip();
  ctx.translate(lx, ly);
  ctx.scale(1, 2.1);
  const glit = ctx.createRadialGradient(0, 0, 0, 0, 0, rx * 0.42);
  glit.addColorStop(0, `rgba(198, 236, 255, ${A(0.1 + 0.08 * mapness)})`);
  glit.addColorStop(1, 'rgba(198, 236, 255, 0)');
  ctx.fillStyle = glit;
  ctx.fillRect(-rx, -ry, rx * 2, ry * 2);
  ctx.restore();

  // Night: the far side of the sphere falls into shadow, limb included.
  // Under the board this only ever shaded the water; over it, it shades the
  // land as well, which is what gives the turning ball its round side.
  const night = ctx.createRadialGradient(lx, ly, rx * 0.3, lx, ly, rx * 1.7);
  night.addColorStop(0, 'rgba(0, 0, 0, 0)');
  night.addColorStop(0.5, `rgba(0, 0, 0, ${A(0.05 * mapness)})`);
  night.addColorStop(1, `rgba(0, 0, 0, ${A(0.4 + 0.34 * mapness)})`);
  planetPath(ctx, 1.04);
  ctx.fillStyle = night;
  ctx.fill();

  // The atmosphere: a soft glow past the rim and a crisp line on it.
  planetPath(ctx);
  ctx.strokeStyle = `rgba(120, 180, 255, ${A(0.1 + 0.16 * mapness)})`;
  ctx.lineWidth = rx * 0.06;
  ctx.stroke();
  ctx.strokeStyle = `rgba(180, 216, 255, ${A(0.2 + 0.32 * mapness)})`;
  ctx.lineWidth = rx * 0.01;
  ctx.stroke();

  // Sheen: the glass catching the light.
  const sheen = ctx.createRadialGradient(lx * 1.1, ly * 1.1, 0, lx * 1.1, ly * 1.1, rx * 0.5);
  sheen.addColorStop(0, `rgba(255, 255, 255, ${A(0.06 + 0.12 * mapness)})`);
  sheen.addColorStop(1, 'rgba(255, 255, 255, 0)');
  planetPath(ctx);
  ctx.fillStyle = sheen;
  ctx.fill();

  ctx.restore();
}
