import { drawCoins } from '../coins';
import { drawCritters } from '../critters';
import { drawFootprints } from '../footprints';
import { drawHelmets } from '../helmets';
import { posAt } from '../movement';
import { drawProjectiles } from '../projectiles';
import { FLOW_STYLE, MONO, PALETTE } from './palette';
import { clamp, lerp, scratch } from './util';
import type { Pass } from './pass';

/**
 * Everything moving on the network: operation flows, json factories, voter
 * traffic, critters, shots, tokens, helmets, footprints, and the stake fog.
 */
export function drawTraffic(p: Pass): void {
  const { scene, ctx, nodes, edges, player, time, mapness, z, vx0, vx1, vy0, vy1, vis } = p;

  // Operation flows: the real counts, moving. Each type its own shape.
  for (const p of scene.flows) {
    const e = edges[p.edge];
    if (!e) continue;
    posAt(e, p.t, scratch);
    if (!vis(scratch.x, scratch.y)) continue;
    const style = FLOW_STYLE[p.type];
    if (p.type === 'vote') {
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = style.col;
      ctx.beginPath();
      ctx.arc(scratch.x, scratch.y, style.size, 0, 6.283);
      ctx.fill();
    } else if (p.type === 'customJson') {
      ctx.save();
      ctx.translate(scratch.x, scratch.y);
      ctx.rotate(time * 3 + p.edge);
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = style.col;
      ctx.fillRect(-style.size, -style.size, style.size * 2, style.size * 2);
      ctx.restore();
    } else if (p.type === 'comment') {
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = style.col;
      ctx.beginPath();
      ctx.arc(scratch.x, scratch.y, style.size, 0, 6.283);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(scratch.x - 2, scratch.y + style.size - 1);
      ctx.lineTo(scratch.x - style.size, scratch.y + style.size + 5);
      ctx.lineTo(scratch.x + 2, scratch.y + style.size);
      ctx.closePath();
      ctx.fill();
    } else {
      // transfer: a coin with a soft glow. Rare, valuable, deliberate.
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = style.col;
      ctx.beginPath();
      ctx.arc(scratch.x, scratch.y, style.size * 2.4, 0, 6.283);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(scratch.x, scratch.y, style.size, 0, 6.283);
      ctx.fill();
      ctx.strokeStyle = '#8a6d1f';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.strokeStyle = '#fff3c9';
      ctx.beginPath();
      ctx.arc(scratch.x, scratch.y, style.size * 0.55, 0, 6.283);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  // Json factories: pulsing, spitting into the flows.
  for (const f of scene.factories) {
    if (!vis(f.x, f.y)) continue;
    const pulse = 0.5 + Math.sin(time * 2.1 + f.phase) * 0.5;
    ctx.fillStyle = PALETTE.factory;
    ctx.fillRect(f.x - 26, f.y - 18, 52, 36);
    ctx.fillStyle = PALETTE.factoryGlow;
    ctx.globalAlpha = 0.25 + pulse * 0.55;
    ctx.fillRect(f.x - 8, f.y - 30, 16, 12);
    ctx.globalAlpha = 0.5 + pulse * 0.5;
    ctx.font = `600 ${13 / Math.max(z, 0.3)}px ${MONO}`;
    ctx.textAlign = 'center';
    ctx.fillText('{ }', f.x, f.y + 5);
    ctx.globalAlpha = 1;
  }

  // Voter traffic: real handles passing along the lines. Decoration only.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const m of scene.traffic) {
    const e = edges[m.edge];
    if (!e) continue;
    posAt(e, m.t, scratch);
    if (!vis(scratch.x, scratch.y)) continue;
    const a = clamp(m.life / m.max, 0, 1);
    ctx.globalAlpha = a * 0.9;
    ctx.fillStyle = PALETTE.traffic;
    ctx.beginPath();
    ctx.arc(scratch.x, scratch.y, 3, 0, 6.283);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // The population: inert critters drifting along the lines. Skipped on the
  // pulled-out map, where they would be sub-pixel noise.
  if (scene.critters && mapness < 0.6) {
    drawCritters(ctx, scene.critters, time, vis);
  }

  // Shots in flight, over the critter that fired them, under the tokens.
  if (scene.projectiles && mapness < 0.6) {
    drawProjectiles(ctx, scene.projectiles, vis);
  }

  // JSON tokens, the trunk of whatever is stealing them, and what the bug is
  // carrying. Skipped on the pulled-out map, where a token is sub-pixel.
  if (scene.coins && mapness < 0.6) {
    drawCoins(ctx, scene.coins, scene.critters, player, time, z, vis);
  }

  // The oxygen helmets, waiting to be found. Sub-pixel on the far map.
  if (scene.helmetState && mapness < 0.6) {
    drawHelmets(ctx, scene.helmetState, time, vis);
  }

  // FOOTPRINTS: who voted or replied this round, as prints on the street
  // leading out from the post to the account that left them. Play zoom
  // only; on the pulled-out map they would be dust.
  if (scene.footprints && mapness < 0.6) {
    drawFootprints(ctx, scene.footprints, edges, vis);
  }

  // Stake fog.
  const fogAlpha = lerp(0.3, 1, mapness);
  const fogRadius = lerp(0.42, 1, mapness);
  for (const n of nodes) {
    if (n.kind !== 'house') continue;
    const h = scene.houses[n.ref];
    if (!h) continue;
    const r = h.bubble * fogRadius;
    if (n.x + r < vx0 || n.x - r > vx1 || n.y + r < vy0 || n.y - r > vy1) continue;
    ctx.globalAlpha = h.glow * fogAlpha;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(n.x, n.y, r, 0, 6.283);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
