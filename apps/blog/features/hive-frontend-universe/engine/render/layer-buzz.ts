import type { Pass } from './pass';

/**
 * The buzzing station: today's double-token zone, humming in gold.
 */
export function drawBuzzingStation(p: Pass): void {
  const { scene, ctx, time, z } = p;

  // THE BUZZING STATION: today's double-token zone, humming in gold. Two
  // breathing rings and a swarm of little bee motes orbiting the boundary,
  // loud enough to read from the pulled-out map so the day's draw is visible
  // the moment the world is.
  if (scene.buzz) {
    const b = scene.buzz;
    const hum = 0.5 + Math.sin(time * 2.4) * 0.5;
    ctx.strokeStyle = '#ffd24a';
    for (const [mul, w, a] of [
      [1, 5, 0.5],
      [0.82 + hum * 0.06, 2.6, 0.35]
    ] as const) {
      ctx.globalAlpha = a + hum * 0.25;
      ctx.lineWidth = w / Math.max(z, 0.05);
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * mul, 0, 6.283);
      ctx.stroke();
    }
    for (let k = 0; k < 7; k++) {
      const a = time * (0.5 + (k % 3) * 0.14) + (k / 7) * 6.283;
      const br = b.r * (0.94 + Math.sin(time * 3 + k * 2.1) * 0.05);
      const bx = b.x + Math.cos(a) * br;
      const by = b.y + Math.sin(a) * br * 0.97;
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = k % 2 ? '#ffd24a' : '#fff3c0';
      ctx.beginPath();
      ctx.arc(bx, by, 9 / Math.max(z, 0.12), 0, 6.283);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
