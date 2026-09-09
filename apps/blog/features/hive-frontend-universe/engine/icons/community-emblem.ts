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
