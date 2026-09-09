import { drawBeacon } from './decor';
import { DAPP_DIRECTORY } from '../../lib/fixed-world';
import { avatarImage } from '../avatars';
import { DAPP_WINDOWS, FERRIS_SPIN, drawIcon, rosePaneCentre } from '../icons';
import { drawKeepRelease, hoardLeft } from '../keep';
import { BIG_SIZE, BIG_SPAN, CATEGORY_HEX, MONO } from './palette';
import type { Pass } from './pass';

/**
 * The landmarks: every type its own vector icon, the destination worlds
 * drawn as structures, the keep's ending, and the trophy gondolas riding the
 * ferris wheel.
 */
export function drawLandmarks(p: Pass): void {
  const { scene, ctx, nodes, time, mapness, z, vis } = p;

  // Landmarks: every type its own vector icon; the destination worlds are
  // drawn as structures so arriving feels like arriving somewhere.
  let ferrisPos: { x: number; y: number; s: number } | null = null;
  for (const n of nodes) {
    if (n.kind !== 'landmark' || !vis(n.x, n.y)) continue;
    const lm = scene.landmarks[n.ref];
    if (!lm) continue;
    // The ruins are their own district, drawn above by drawSteemRuins.
    if (lm.icon === 'ruins') continue;
    const col = CATEGORY_HEX[lm.category];
    const minor = lm.icon === 'doc' || lm.icon === 'docq';
    // The big five are drawn at a fixed WORLD size, several times any other
    // marker, so they stay huge on the pulled-out map. Everything else is
    // sized in screen space and stays modest, which is what makes the five
    // stand out instead of competing.
    // Bigger than before: with the names gone the art has to carry identity
    // on its own, so an ordinary marker grew from 36 to 52 and the minor
    // paperwork from 24 to 34.
    // CARTOGRAPHIC EXAGGERATION: theme-park maps lie about scale. The big
    // places grow up to 1.9x as the camera pulls out, so at full map they
    // read as attractions instead of specks, and shrink back to honest size
    // as you fly in. This one factor is most of the difference between
    // "illustrated park map" and "network diagram".
    const bigScale = 1 + mapness * 0.9;
    const s = lm.big
      ? (BIG_SIZE[lm.icon] ?? 300) * bigScale
      : (minor ? 34 : 52) / Math.max(z, 0.45);
    // MODE BEACONS, sized from the art so they ring the tent as well as a
    // small marker, drawn before the pad and the icon so the art sits inside.
    // Front end: every hive.blog page, cyan. Adventure: the DHF Fun Park,
    // gold, the race's finish line.
    if (scene.mode === 'frontend' && lm.site) drawBeacon(ctx, n.x, n.y, s, z, time + n.id, '93, 240, 255', '#5df0ff');
    if (scene.mode === 'adventure' && lm.raceGoal) drawBeacon(ctx, n.x, n.y, s, z, time + n.id, '255, 210, 74', '#ffd24a');
    // GROUND PAD: a dark clearing under each big place, fading in with the
    // map. Anchors the attraction to the land (park maps sit rides in
    // plazas) and buys silhouette contrast against the busy red.
    if (lm.big) {
      const padR = s * 1.35;
      const padY = n.y + s * 0.5;
      ctx.globalAlpha = 0.1 + mapness * 0.3;
      ctx.fillStyle = '#20060c';
      ctx.beginPath();
      ctx.ellipse(n.x, padY, padR, padR * 0.42, 0, 0, 6.283);
      ctx.fill();
      ctx.globalAlpha = 0.08 + mapness * 0.18;
      ctx.strokeStyle = '#ff6a5a';
      ctx.lineWidth = 3 / Math.max(z, 0.05);
      ctx.beginPath();
      ctx.ellipse(n.x, padY, padR, padR * 0.42, 0, 0, 6.283);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // The black hole is the one big place that must NOT look welcoming, so it
    // is the one that does not get the warm pool.
    if (lm.big && lm.icon !== 'blackhole') {
      // A soft warm pool of light under each big place, so it sits ON the
      // terrain rather than floating above it. The pool uses the shared
      // footprint, not `s`, so all five are lit alike.
      const py = n.y + BIG_SPAN * 0.45;
      const pool = ctx.createRadialGradient(n.x, py, BIG_SPAN * 0.1, n.x, py, BIG_SPAN * 1.5);
      pool.addColorStop(0, 'rgba(255, 196, 120, 0.16)');
      pool.addColorStop(1, 'rgba(255, 170, 90, 0)');
      ctx.fillStyle = pool;
      ctx.beginPath();
      ctx.arc(n.x, py, BIG_SPAN * 1.5, 0, 6.283);
      ctx.fill();
    }
    // A landmark with a real Hive account wears that account's avatar once
    // it has loaded; otherwise (and meanwhile) its code-drawn icon.
    const lmImg = lm.handle ? avatarImage(lm.handle) : null;
    if (lmImg) {
      const rA = Math.max(s * 0.95, 30);
      ctx.save();
      ctx.beginPath();
      ctx.arc(n.x, n.y, rA, 0, 6.283);
      ctx.clip();
      ctx.drawImage(lmImg, n.x - rA, n.y - rA, rA * 2, rA * 2);
      ctx.restore();
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.4 / Math.max(z, 0.2);
      ctx.beginPath();
      ctx.arc(n.x, n.y, rA, 0, 6.283);
      ctx.stroke();
    } else {
      const hoard = lm.icon === 'jsonboss' ? hoardLeft(scene.keep) : 1;
      drawIcon(ctx, lm.icon, n.x, n.y, s, col, time, lm.label, hoard);
    }
    if (lm.icon === 'ferris') ferrisPos = { x: n.x, y: n.y, s };
    // THE dAPP STATION'S WINDOWS: real dApp logos looking out. The icon
    // draws the holes (DAPP_WINDOWS, same list); once each dApp account's
    // avatar loads it is clipped into its window. Until then the icon's own
    // coloured glass shows, so nothing ever looks broken.
    if (lm.icon === 'launchpad') {
      const shipR = s * 2.2;
      const slots = DAPP_WINDOWS;
      // ONE ship since the merge: every logo account rides the same craft.
      const crew = DAPP_DIRECTORY.filter((dd) => dd.account);
      for (let k = 0; k < slots.length && k < crew.length; k++) {
        const win = slots[k];
        const img = crew[k].account ? avatarImage(crew[k].account as string) : null;
        if (!img) continue;
        const wx = n.x + win.dx * shipR;
        const wy = n.y + win.dy * shipR;
        const wr = win.r * shipR * 0.92;
        ctx.save();
        ctx.beginPath();
        ctx.arc(wx, wy, wr, 0, 6.283);
        ctx.clip();
        ctx.drawImage(img, wx - wr, wy - wr, wr * 2, wr * 2);
        ctx.restore();
        ctx.strokeStyle = '#141019';
        ctx.lineWidth = Math.max(2, shipR * 0.04);
        ctx.beginPath();
        ctx.arc(wx, wy, wr, 0, 6.283);
        ctx.stroke();
      }
    }
    // THE ROSE WINDOW'S WORDS (Bryan: "some written words could be in the
    // panes when in game play"): each pane wears its own translated label,
    // shrunk to fit its glass, so the window reads as the link wheel it is
    // without hovering. Play zoom only; on the pulled-out map the words
    // would be finer than the lead lines.
    if (lm.icon === 'rosewindow' && scene.roseLabels?.length && z >= 0.3) {
      const R = s * 2.2;
      const count = scene.roseLabels.length;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const maxW = R * 0.36;
      for (let k = 0; k < count; k++) {
        const pc = rosePaneCentre(k, count, R);
        const words = scene.roseLabels[k].split(' ');
        const mid = Math.ceil(words.length / 2);
        const lines =
          words.length === 1 ? words : [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
        let fs = R * 0.082;
        ctx.font = `700 ${fs}px ${MONO}`;
        const widest = Math.max(...lines.map((ln) => ctx.measureText(ln).width));
        if (widest > maxW) {
          fs *= maxW / widest;
          ctx.font = `700 ${fs}px ${MONO}`;
        }
        for (let li = 0; li < lines.length; li++) {
          const ly = n.y + pc.y + (li - (lines.length - 1) / 2) * fs * 1.15;
          ctx.strokeStyle = '#141019';
          ctx.lineWidth = fs * 0.28;
          ctx.lineJoin = 'round';
          ctx.strokeText(lines[li], n.x + pc.x, ly);
          ctx.fillStyle = '#fdf6e6';
          ctx.fillText(lines[li], n.x + pc.x, ly);
        }
      }
    }
  }

  // THE KEEP'S ENDING: the hoard streaming away over the villain's head.
  if (scene.keep && mapness < 0.7) drawKeepRelease(ctx, scene.keep, time, vis);

  // TROPHY GONDOLAS: items brought to the ferris wheel and ridden one full
  // rotation mount into a gondola and ride with the wheel for the rest of
  // the 30-minute board (Bryan's Sagrada brief). Three mountables so far:
  // a helmet, a gem, a token; one new mount per completed ride.
  if (ferrisPos && scene.wheelTrophies && scene.wheelTrophies.length > 0) {
    const R = ferrisPos.s * 2.2;
    const tr = ferrisPos.s * 0.16;
    for (let k = 0; k < Math.min(8, scene.wheelTrophies.length); k++) {
      const a = time * FERRIS_SPIN + (k / 8) * 6.283;
      const tx = ferrisPos.x + Math.cos(a) * R;
      const ty = ferrisPos.y + Math.sin(a) * R;
      // Earned-light halo on the filled socket.
      ctx.globalAlpha = 0.55 + Math.sin(time * 2 + k) * 0.2;
      ctx.strokeStyle = '#FFD9A0';
      ctx.lineWidth = Math.max(2, tr * 0.35);
      ctx.beginPath();
      ctx.arc(tx, ty, tr * 1.5, 0, 6.283);
      ctx.stroke();
      ctx.globalAlpha = 1;
      const kind = scene.wheelTrophies[k];
      if (kind === 'gem') {
        ctx.beginPath();
        ctx.moveTo(-tr * 0.6 + tx, -tr * 0.4 + ty);
        ctx.lineTo(tr * 0.6 + tx, -tr * 0.4 + ty);
        ctx.lineTo(tr + tx, ty);
        ctx.lineTo(tx, tr + ty);
        ctx.lineTo(-tr + tx, ty);
        ctx.closePath();
        ctx.fillStyle = '#FF5C8A';
        ctx.fill();
        ctx.strokeStyle = '#141019';
        ctx.lineWidth = Math.max(1.6, tr * 0.22);
        ctx.stroke();
      } else if (kind === 'token') {
        ctx.beginPath();
        ctx.arc(tx, ty, tr, 0, 6.283);
        ctx.fillStyle = '#ffd24a';
        ctx.fill();
        ctx.strokeStyle = '#8a6d1f';
        ctx.lineWidth = Math.max(1.6, tr * 0.22);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(tx, ty, tr * 0.55, 0, 6.283);
        ctx.strokeStyle = '#fff3c9';
        ctx.stroke();
      } else {
        // The helmet: mini dome and collar.
        ctx.beginPath();
        ctx.arc(tx, ty - tr * 0.2, tr, Math.PI, 0);
        ctx.lineTo(tx + tr, ty + tr * 0.35);
        ctx.lineTo(tx - tr, ty + tr * 0.35);
        ctx.closePath();
        ctx.fillStyle = 'rgba(155, 232, 255, 0.5)';
        ctx.fill();
        ctx.strokeStyle = '#0e2a36';
        ctx.lineWidth = Math.max(1.6, tr * 0.22);
        ctx.stroke();
        ctx.fillStyle = '#ffd24a';
        ctx.fillRect(tx - tr * 1.15, ty + tr * 0.35, tr * 2.3, tr * 0.45);
      }
    }
  }
}
