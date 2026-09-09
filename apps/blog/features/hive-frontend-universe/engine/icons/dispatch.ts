import { type IconKey } from '../../lib/fixed-world';
import { ICON_MONO, STICKER_OUTLINE, roundRect } from './shared';
import { drawHiveMark } from './hive-mark';
import { drawFerris } from './fun-park';
import { drawTowers } from './towers';
import { drawLaunchpad } from './launchpad';
import { drawBlackHole } from './black-hole';
import { drawArcade } from './arcade';
import { drawJsonBoss } from './json-boss';
import { drawSockMount } from './sock-mount';
import { drawRoseWindow } from './rose-window';

/**
 * Landmark icons. `s` is the icon's rough half-size in world px; `col` is the
 * category colour; `time` drives small idle animations (pulses, blinks).
 */
export function drawIcon(
  ctx: CanvasRenderingContext2D,
  key: IconKey,
  x: number,
  y: number,
  s: number,
  col: string,
  time: number,
  /** The landmark's own name, for the few icons that letter themselves. */
  label?: string,
  /** How much of the Emperor's hoard is still at his feet, 1 to 0 (engine/keep.ts). */
  hoard = 1
): void {
  ctx.save();
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = Math.max(2, s * 0.12);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  switch (key) {
    case 'ferris':
      drawFerris(ctx, x, y, s * 2.2, col, time);
      break;
    case 'towers':
      drawTowers(ctx, x, y, s * 2.2, col, time);
      break;
    case 'launchpad':
      drawLaunchpad(ctx, x, y, s * 2.2, col, time);
      break;
    case 'arcadebldg':
      drawArcade(ctx, x, y, s * 2.2, col, time);
      break;
    case 'blackhole':
      drawBlackHole(ctx, x, y, s * 1.5, time);
      break;
    case 'jsonboss':
      drawJsonBoss(ctx, x, y, s * 1.5, time, hoard);
      break;
    case 'sockmount':
      drawSockMount(ctx, x, y, s * 2.2, time);
      break;
    case 'rosewindow':
      drawRoseWindow(ctx, x, y, s * 2.2, time);
      break;
    case 'spaceship': {
      // Small rocket in flight.
      ctx.beginPath();
      ctx.moveTo(x, y - s);
      ctx.quadraticCurveTo(x + s * 0.55, y - s * 0.2, x + s * 0.35, y + s * 0.6);
      ctx.lineTo(x - s * 0.35, y + s * 0.6);
      ctx.quadraticCurveTo(x - s * 0.55, y - s * 0.2, x, y - s);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y - s * 0.15, s * 0.18, 0, 6.283);
      ctx.stroke();
      // fins + flame
      ctx.beginPath();
      ctx.moveTo(x - s * 0.35, y + s * 0.6);
      ctx.lineTo(x - s * 0.6, y + s * 0.9);
      ctx.moveTo(x + s * 0.35, y + s * 0.6);
      ctx.lineTo(x + s * 0.6, y + s * 0.9);
      ctx.stroke();
      ctx.globalAlpha = 0.5 + Math.sin(time * 9) * 0.4;
      ctx.beginPath();
      ctx.moveTo(x - s * 0.15, y + s * 0.62);
      ctx.lineTo(x, y + s * (0.95 + 0.1 * Math.sin(time * 11)));
      ctx.lineTo(x + s * 0.15, y + s * 0.62);
      ctx.stroke();
      ctx.globalAlpha = 1;
      break;
    }
    case 'magnifier':
      ctx.beginPath();
      ctx.arc(x - s * 0.2, y - s * 0.2, s * 0.55, 0, 6.283);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + s * 0.2, y + s * 0.2);
      ctx.lineTo(x + s * 0.75, y + s * 0.75);
      ctx.stroke();
      break;
    case 'quill':
      // A feather: curved spine with barbs, nib at the bottom.
      ctx.beginPath();
      ctx.moveTo(x - s * 0.6, y + s * 0.8);
      ctx.quadraticCurveTo(x + s * 0.1, y + s * 0.1, x + s * 0.7, y - s * 0.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - s * 0.1, y + s * 0.15);
      ctx.quadraticCurveTo(x + s * 0.5, y - s * 0.1, x + s * 0.7, y - s * 0.8);
      ctx.quadraticCurveTo(x + s * 0.15, y - s * 0.55, x - s * 0.1, y + s * 0.15);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - s * 0.6, y + s * 0.8);
      ctx.lineTo(x - s * 0.75, y + s * 0.95);
      ctx.stroke();
      break;
    case 'wallet': {
      // An actual wallet: a chunky billfold with a flap, a clasp, and a note
      // and a coin peeking out of the top.
      const ww = s * 0.82;
      const wh = s * 0.6;
      const lwW = Math.max(2, s * 0.09);
      // Banknote sticking out behind the body.
      ctx.fillStyle = '#8ee87f';
      ctx.strokeStyle = STICKER_OUTLINE;
      ctx.lineWidth = lwW;
      roundRect(ctx, x - ww * 0.55, y - wh - s * 0.16, ww * 1.1, s * 0.34, s * 0.05);
      ctx.fill();
      ctx.stroke();
      // Coin peeking out beside it.
      ctx.beginPath();
      ctx.arc(x + ww * 0.62, y - wh - s * 0.02, s * 0.17, 0, 6.283);
      ctx.fillStyle = '#ffd24a';
      ctx.fill();
      ctx.stroke();
      // Body.
      ctx.fillStyle = '#c4643a';
      roundRect(ctx, x - ww, y - wh, ww * 2, wh * 2, s * 0.14);
      ctx.fill();
      ctx.stroke();
      // Flap across the lower half.
      ctx.fillStyle = '#9c4a2a';
      roundRect(ctx, x - ww, y - wh * 0.05, ww * 2, wh * 1.05, s * 0.12);
      ctx.fill();
      ctx.stroke();
      // Clasp.
      ctx.fillStyle = '#ffd24a';
      roundRect(ctx, x - s * 0.14, y - wh * 0.22, s * 0.28, s * 0.24, s * 0.06);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'bubble':
      ctx.beginPath();
      ctx.moveTo(x - s * 0.7, y - s * 0.5);
      ctx.lineTo(x + s * 0.7, y - s * 0.5);
      ctx.quadraticCurveTo(x + s * 0.85, y - s * 0.5, x + s * 0.85, y - s * 0.3);
      ctx.lineTo(x + s * 0.85, y + s * 0.2);
      ctx.quadraticCurveTo(x + s * 0.85, y + s * 0.4, x + s * 0.7, y + s * 0.4);
      ctx.lineTo(x - s * 0.2, y + s * 0.4);
      ctx.lineTo(x - s * 0.5, y + s * 0.75);
      ctx.lineTo(x - s * 0.45, y + s * 0.4);
      ctx.lineTo(x - s * 0.7, y + s * 0.4);
      ctx.quadraticCurveTo(x - s * 0.85, y + s * 0.4, x - s * 0.85, y + s * 0.2);
      ctx.lineTo(x - s * 0.85, y - s * 0.3);
      ctx.quadraticCurveTo(x - s * 0.85, y - s * 0.5, x - s * 0.7, y - s * 0.5);
      ctx.stroke();
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.arc(x + i * s * 0.3, y - s * 0.05, s * 0.06, 0, 6.283);
        ctx.fill();
      }
      break;
    case 'doc':
    case 'docq': {
      // A chunky sticker paper: white fill, coloured fold, fat outline. The
      // old thin outline read as detached wireframe next to the painted world.
      const w = s * 0.95;
      const h = s * 1.2;
      const f = s * 0.32;
      ctx.beginPath();
      ctx.moveTo(x - w / 2, y - h / 2);
      ctx.lineTo(x + w / 2 - f, y - h / 2);
      ctx.lineTo(x + w / 2, y - h / 2 + f);
      ctx.lineTo(x + w / 2, y + h / 2);
      ctx.lineTo(x - w / 2, y + h / 2);
      ctx.closePath();
      ctx.fillStyle = '#f5f2e8';
      ctx.fill();
      ctx.strokeStyle = STICKER_OUTLINE;
      ctx.lineWidth = Math.max(2.5, s * 0.14);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + w / 2 - f, y - h / 2);
      ctx.lineTo(x + w / 2 - f, y - h / 2 + f);
      ctx.lineTo(x + w / 2, y - h / 2 + f);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.lineWidth = Math.max(2, s * 0.1);
      if (key === 'docq') {
        ctx.font = `700 ${s * 0.8}px ui-monospace, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', x, y + s * 0.1);
      } else {
        ctx.beginPath();
        ctx.moveTo(x - w * 0.3, y - h * 0.15);
        ctx.lineTo(x + w * 0.3, y - h * 0.15);
        ctx.moveTo(x - w * 0.3, y + h * 0.1);
        ctx.lineTo(x + w * 0.3, y + h * 0.1);
        ctx.stroke();
      }
      break;
    }
    case 'newspaper': {
      const w = s * 1.5;
      const h = s * 1.05;
      ctx.strokeRect(x - w / 2, y - h / 2, w, h);
      ctx.fillRect(x - w / 2 + s * 0.12, y - h / 2 + s * 0.12, w * 0.5, s * 0.22);
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        ctx.moveTo(x - w / 2 + s * 0.12, y - h / 2 + s * 0.5 + i * s * 0.2);
        ctx.lineTo(x + w / 2 - s * 0.12, y - h / 2 + s * 0.5 + i * s * 0.2);
      }
      ctx.stroke();
      break;
    }
    case 'tent': {
      // Basecamp: chunky sticker tent. Thick dark outline, flat bright fill,
      // dark door slit, red pennant.
      ctx.strokeStyle = STICKER_OUTLINE;
      // 0.16 was tuned for the small marker; at big-five size it produced a
      // 56px outline that swallowed the tent, so the ratio is now in line with
      // the other chunky places (about 0.075 of the half-width).
      ctx.lineWidth = Math.max(3, s * 0.075);
      ctx.beginPath();
      ctx.moveTo(x - s * 0.95, y + s * 0.62);
      ctx.lineTo(x, y - s * 0.72);
      ctx.lineTo(x + s * 0.95, y + s * 0.62);
      ctx.closePath();
      ctx.fillStyle = '#FFC24D';
      ctx.fill();
      ctx.stroke();
      // Canvas seam and the dark door slit.
      ctx.beginPath();
      ctx.moveTo(x, y - s * 0.72);
      ctx.lineTo(x, y + s * 0.62);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - s * 0.28, y + s * 0.62);
      ctx.lineTo(x, y - s * 0.08);
      ctx.lineTo(x + s * 0.28, y + s * 0.62);
      ctx.closePath();
      ctx.fillStyle = '#3b2a14';
      ctx.fill();
      // THE TENT'S HEART. Warm light spilling from the doorway with an
      // actual HEARTBEAT: a quick rise, a slow fall, ~1.2s around a resting
      // pulse. Basecamp is the newcomer's home, and homes have heartbeats
      // (pass seventeen, from the ice-temple brief). Still the only place
      // on the map visibly lit from the inside.
      ctx.save();
      ctx.clip();
      const hb = (time % 1.2) / 1.2;
      const beat = hb < 0.3 ? hb / 0.3 : 1 - (hb - 0.3) / 0.7;
      const lamp = 0.5 + beat * 0.5;
      const spill = ctx.createRadialGradient(x, y + s * 0.5, s * 0.02, x, y + s * 0.5, s * 0.62);
      spill.addColorStop(0, `rgba(255, 193, 77, ${0.85 * lamp})`);
      spill.addColorStop(0.55, `rgba(255, 140, 107, ${0.38 * lamp})`);
      spill.addColorStop(1, 'rgba(255, 140, 107, 0)');
      ctx.fillStyle = spill;
      ctx.fillRect(x - s, y - s, s * 2, s * 2);
      ctx.restore();
      // Pennant, fluttering.
      ctx.beginPath();
      ctx.moveTo(x, y - s * 0.72);
      ctx.lineTo(x, y - s * 1.12);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y - s * 1.12);
      ctx.lineTo(x + s * (0.42 + 0.05 * Math.sin(time * 3)), y - s * 0.99);
      ctx.lineTo(x, y - s * 0.86);
      ctx.closePath();
      ctx.fillStyle = '#E31337';
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'flag': {
      // A proper welcome banner: a striped, waving flag with the place's own
      // name across it, so you can read where you are from the flag itself.
      const poleX = x - s * 0.62;
      const lwF = Math.max(2, s * 0.1);
      const wave = Math.sin(time * 2.2) * s * 0.07;
      // Pole plus finial.
      ctx.strokeStyle = STICKER_OUTLINE;
      ctx.lineWidth = lwF * 1.2;
      ctx.beginPath();
      ctx.moveTo(poleX, y + s * 0.95);
      ctx.lineTo(poleX, y - s * 1.0);
      ctx.stroke();
      ctx.fillStyle = '#ffd24a';
      ctx.beginPath();
      ctx.arc(poleX, y - s * 1.05, s * 0.1, 0, 6.283);
      ctx.fill();
      ctx.stroke();

      // Banner body, four bright stripes, waving at the free edge.
      const bx = poleX;
      const by = y - s * 0.98;
      const bw = s * 1.75;
      const bh = s * 0.92;
      const STRIPES = ['#ff4d6d', '#ffa63d', '#48d17a', '#3fb6ff'];
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + bw * 0.5, by + wave, bx + bw, by - wave * 0.6);
      ctx.lineTo(bx + bw, by + bh - wave * 0.6);
      ctx.quadraticCurveTo(bx + bw * 0.5, by + bh + wave, bx, by + bh);
      ctx.closePath();
      ctx.clip();
      for (let i = 0; i < STRIPES.length; i++) {
        ctx.fillStyle = STRIPES[i];
        ctx.fillRect(bx, by + (i * bh) / STRIPES.length - s * 0.1, bw, bh / STRIPES.length + s * 0.2);
      }
      ctx.restore();
      // Outline over the stripes.
      ctx.strokeStyle = STICKER_OUTLINE;
      ctx.lineWidth = lwF;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + bw * 0.5, by + wave, bx + bw, by - wave * 0.6);
      ctx.lineTo(bx + bw, by + bh - wave * 0.6);
      ctx.quadraticCurveTo(bx + bw * 0.5, by + bh + wave, bx, by + bh);
      ctx.closePath();
      ctx.stroke();

      // The name, across the banner.
      if (label) {
        const text = label.toUpperCase();
        const fs = Math.min(bh * 0.34, (bw * 1.45) / Math.max(text.length, 1));
        ctx.font = `800 ${fs}px ${ICON_MONO}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = Math.max(1.5, fs * 0.3);
        ctx.strokeStyle = STICKER_OUTLINE;
        ctx.strokeText(text, bx + bw * 0.5, by + bh * 0.5 + wave * 0.4);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, bx + bw * 0.5, by + bh * 0.5 + wave * 0.4);
      }
      break;
    }
    case 'door': {
      // THE GATEWAY: a glowing arch portal, not a wireframe door. Sign-up is
      // the way IN to Hive, so it gets warmth: a lit archway, breathing light
      // inside, and a doormat step, chunky sticker style.
      const pulseIn = 0.55 + Math.sin(time * 1.8) * 0.45;
      ctx.lineWidth = Math.max(3, s * 0.16);
      ctx.strokeStyle = STICKER_OUTLINE;
      // Arch frame.
      ctx.fillStyle = '#3fb6ff';
      ctx.beginPath();
      ctx.moveTo(x - s * 0.75, y + s * 0.9);
      ctx.lineTo(x - s * 0.75, y - s * 0.2);
      ctx.arc(x, y - s * 0.2, s * 0.75, Math.PI, 0);
      ctx.lineTo(x + s * 0.75, y + s * 0.9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // The glow inside: somewhere worth walking into.
      const gl = ctx.createLinearGradient(x, y - s * 0.6, x, y + s * 0.9);
      gl.addColorStop(0, 'rgba(255, 244, 200, ' + (0.55 + pulseIn * 0.4).toFixed(3) + ')');
      gl.addColorStop(1, 'rgba(255, 210, 74, ' + (0.25 + pulseIn * 0.3).toFixed(3) + ')');
      ctx.fillStyle = gl;
      ctx.beginPath();
      ctx.moveTo(x - s * 0.52, y + s * 0.9);
      ctx.lineTo(x - s * 0.52, y - s * 0.15);
      ctx.arc(x, y - s * 0.15, s * 0.52, Math.PI, 0);
      ctx.lineTo(x + s * 0.52, y + s * 0.9);
      ctx.closePath();
      ctx.fill();
      // Doormat step.
      ctx.fillStyle = '#ff5f7a';
      ctx.fillRect(x - s * 0.9, y + s * 0.9, s * 1.8, s * 0.22);
      ctx.strokeRect(x - s * 0.9, y + s * 0.9, s * 1.8, s * 0.22);
      break;
    }
    case 'hivemark':
      drawHiveMark(ctx, x, y, s * 1.7, col);
      break;
    case 'blocks': {
      const b = s * 0.55;
      ctx.strokeRect(x - b - 2, y, b, b);
      ctx.strokeRect(x + 2, y, b, b);
      ctx.strokeRect(x - b / 2, y - b - 2, b, b);
      break;
    }
    case 'pulse':
      ctx.beginPath();
      ctx.moveTo(x - s, y);
      ctx.lineTo(x - s * 0.4, y);
      ctx.lineTo(x - s * 0.15, y - s * 0.7);
      ctx.lineTo(x + s * 0.15, y + s * 0.7);
      ctx.lineTo(x + s * 0.4, y);
      ctx.lineTo(x + s, y);
      ctx.stroke();
      break;
    case 'gate':
      // An arch you pass through.
      ctx.beginPath();
      ctx.moveTo(x - s * 0.7, y + s * 0.8);
      ctx.lineTo(x - s * 0.7, y - s * 0.1);
      ctx.quadraticCurveTo(x, y - s * 1.0, x + s * 0.7, y - s * 0.1);
      ctx.lineTo(x + s * 0.7, y + s * 0.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - s * 0.45, y + s * 0.8);
      ctx.lineTo(x - s * 0.45, y + s * 0.05);
      ctx.quadraticCurveTo(x, y - s * 0.6, x + s * 0.45, y + s * 0.05);
      ctx.lineTo(x + s * 0.45, y + s * 0.8);
      ctx.stroke();
      break;
  }
  ctx.restore();
}
