import { avatarImage } from '../avatars';
import { drawCommunityEmblem } from '../icons';
import type { Pass } from './pass';

/**
 * Communities: glowing translucent bubbles of varying size.
 */
export function drawCommunities(p: Pass): void {
  const { scene, ctx, nodes, time, z, vis } = p;

  // Communities: glowing translucent bubbles of varying size.
  for (const n of nodes) {
    if (n.kind !== 'community' || !vis(n.x, n.y)) continue;
    const c = scene.communities[n.ref];
    if (!c) continue;
    const beat = 0.5 + Math.sin(time * 1.3 + n.ref) * 0.5;
    // The bubble the bug is standing in brightens, so "you are here" is
    // visible on the map itself and not only in the banner.
    const here = n.ref === scene.activeCommunity;
    // Dim-until-visited (socket grammar, Bryan's yes on question 4): an
    // unvisited bubble rests quiet, with a floor so the ring of ten never
    // looks broken. Visiting lights it for good.
    const seen = here || !scene.visitedCommunities || scene.visitedCommunities.has(c.handle);
    ctx.fillStyle = here ? '#a8e8ff' : '#7fd8ff';
    ctx.globalAlpha = (here ? 0.3 + beat * 0.12 : 0.1 + beat * 0.05) * (seen ? 1 : 0.5);
    ctx.beginPath();
    ctx.arc(n.x, n.y, c.radius, 0, 6.283);
    ctx.fill();
    ctx.globalAlpha = here ? 1 : seen ? 0.5 : 0.42;
    ctx.strokeStyle = here ? '#d8f4ff' : '#7fd8ff';
    ctx.lineWidth = (here ? 4.4 : 2.4) / Math.max(z, 0.08);
    ctx.beginPath();
    ctx.arc(n.x, n.y, c.radius, 0, 6.283);
    ctx.stroke();
    ctx.globalAlpha = 1;
    // An animated emblem chosen from the community's own NAME, so each bubble
    // reads as its own place rather than as one of ten identical circles.
    // Unvisited bubbles keep only their avatar: the emblem is earned light.
    if (seen) {
      drawCommunityEmblem(ctx, c.handle, n.x, n.y, c.radius * 0.82, time);
    }

    // The community's real avatar floats at the bubble's heart once loaded;
    // a small bright dot till then. Noticeably bigger than pass seven drew it,
    // since the logo is the thing that identifies the place.
    const cImg = avatarImage(c.handle);
    if (cImg) {
      const rC = Math.min(c.radius * 0.62, 190);
      ctx.save();
      ctx.beginPath();
      ctx.arc(n.x, n.y, rC, 0, 6.283);
      ctx.clip();
      ctx.drawImage(cImg, n.x - rC, n.y - rC, rC * 2, rC * 2);
      ctx.restore();
      ctx.strokeStyle = here ? '#d8f4ff' : '#7fd8ff';
      ctx.lineWidth = (here ? 5 : 3.4) / Math.max(z, 0.2);
      ctx.beginPath();
      ctx.arc(n.x, n.y, rC, 0, 6.283);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#bfe9ff';
      ctx.beginPath();
      ctx.arc(n.x, n.y, 12 / Math.max(z, 0.3), 0, 6.283);
      ctx.fill();
    }
  }
}
