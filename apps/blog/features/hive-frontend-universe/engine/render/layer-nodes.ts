import { blobPath } from './sky';
import { avatarImage } from '../avatars';
import { MONO, PALETTE } from './palette';
import type { Pass } from './pass';

/**
 * Junctions and houses, as irregular blobs.
 */
export function drawNodes(p: Pass): void {
  const { scene, ctx, nodes, time, mapness, z, vis } = p;

  // Junctions and houses, as irregular blobs.
  for (const n of nodes) {
    if (!vis(n.x, n.y)) continue;
    if (n.kind === 'junction') {
      ctx.fillStyle = PALETTE.junction;
      ctx.globalAlpha = 0.85;
      blobPath(ctx, n.x, n.y, 6, n.id);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (n.kind === 'house') {
      const h = scene.houses[n.ref];
      if (!h) {
        ctx.fillStyle = PALETTE.junction;
        ctx.globalAlpha = 0.85;
        blobPath(ctx, n.x, n.y, 6, n.id);
        ctx.fill();
        ctx.globalAlpha = 1;
        continue;
      }
      const col = scene.tierColors[h.tier];
      const rNode = Math.min(17 / Math.max(z, 0.35), 180);
      const rHalo = rNode * (2.1 + mapness * 1.6);
      // CURATION MODE: every post breathes a faint ring, so "go engage with
      // live posts" reads off the map. Newcomers keep their louder trail
      // glow below.
      if (scene.mode === 'curation' && !h.isNewcomer) {
        const cb = 0.5 + Math.sin(time * 1.6 + n.id * 0.7) * 0.5;
        ctx.strokeStyle = '#9be8ff';
        ctx.globalAlpha = 0.18 + cb * 0.3;
        ctx.lineWidth = 2 / Math.max(z, 0.1);
        ctx.beginPath();
        ctx.arc(n.x, n.y, rNode * 2.2 + cb * 6, 0, 6.283);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      // ADVENTURE MODE, the DHF race: a house whose vote is still there
      // wears a gold ring; take it and the ring goes. Whales ring wider,
      // because their vote weighs more.
      if (scene.mode === 'adventure' && scene.race && !scene.race.taken.has(n.id) && !scene.race.funded) {
        const vb = 0.5 + Math.sin(time * 2.4 + n.id * 1.3) * 0.5;
        ctx.strokeStyle = '#ffd24a';
        ctx.globalAlpha = 0.35 + vb * 0.5;
        ctx.lineWidth = (2 + h.tier * 0.6) / Math.max(z, 0.1);
        ctx.beginPath();
        ctx.arc(n.x, n.y, rNode * (2 + h.tier * 0.25) + vb * 5, 0, 6.283);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (h.isNewcomer) {
        const beat = 0.5 + Math.sin(time * 1.9 + n.id) * 0.5;
        // THE NEWB TRAIL QUEST GLOW: an unvisited newcomer post burns in
        // the trail's pink - a soft halo plus two breathing rings, loud on
        // purpose so "go visit them all" is readable from the map. Once
        // visited it settles to one steady earned ring.
        const questDone = scene.newbieVisited?.has(n.id) ?? false;
        if (!questDone) {
          const qg = ctx.createRadialGradient(n.x, n.y, rNode * 0.4, n.x, n.y, rNode * 4.2);
          qg.addColorStop(0, `rgba(255, 95, 208, ${(0.16 + beat * 0.14).toFixed(3)})`);
          qg.addColorStop(1, 'rgba(255, 95, 208, 0)');
          ctx.fillStyle = qg;
          ctx.beginPath();
          ctx.arc(n.x, n.y, rNode * 4.2, 0, 6.283);
          ctx.fill();
          ctx.strokeStyle = '#ff5fd0';
          ctx.globalAlpha = 0.35 + beat * 0.6;
          ctx.lineWidth = 3 / Math.max(z, 0.1);
          ctx.beginPath();
          ctx.arc(n.x, n.y, rNode * 2.5 + beat * 9, 0, 6.283);
          ctx.stroke();
          ctx.globalAlpha = 0.25 + (1 - beat) * 0.45;
          ctx.beginPath();
          ctx.arc(n.x, n.y, rNode * 3.3 + (1 - beat) * 9, 0, 6.283);
          ctx.stroke();
          ctx.globalAlpha = 1;
        } else {
          ctx.strokeStyle = '#ff9ee8';
          ctx.globalAlpha = 0.8;
          ctx.lineWidth = 2.4 / Math.max(z, 0.1);
          ctx.beginPath();
          ctx.arc(n.x, n.y, rNode * 2.3, 0, 6.283);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        ctx.strokeStyle = PALETTE.newRing;
        ctx.globalAlpha = 0.2 + beat * 0.7;
        ctx.lineWidth = 2.6 / Math.max(z, 0.1);
        ctx.beginPath();
        ctx.arc(n.x, n.y, rNode * 2 + beat * 6, 0, 6.283);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.globalAlpha = 0.22 + mapness * 0.3;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(n.x, n.y, rHalo, 0, 6.283);
      ctx.fill();
      ctx.globalAlpha = 1;
      // The face: the author's real profile photo once it has lazily loaded,
      // framed by the same rings; until then (or if the load failed) a flat
      // tier-coloured disc with the account's first letter.
      const rFace = rNode * 1.18;
      const img = avatarImage(h.handle);
      if (img) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(n.x, n.y, rFace, 0, 6.283);
        ctx.clip();
        ctx.drawImage(img, n.x - rFace, n.y - rFace, rFace * 2, rFace * 2);
        ctx.restore();
      } else {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(n.x, n.y, rFace, 0, 6.283);
        ctx.fill();
        ctx.fillStyle = '#0b1016';
        ctx.font = `800 ${rFace * 1.15}px ${MONO}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(h.handle.charAt(0).toUpperCase(), n.x, n.y + rFace * 0.06);
      }
      ctx.strokeStyle = h.isNewcomer ? PALETTE.newRing : '#ffffff';
      ctx.lineWidth = 1.8 / Math.max(z, 0.2);
      ctx.beginPath();
      ctx.arc(n.x, n.y, rFace, 0, 6.283);
      ctx.stroke();

    }
  }
}
