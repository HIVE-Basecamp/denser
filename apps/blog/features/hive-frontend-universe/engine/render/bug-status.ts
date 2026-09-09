import type { CombatState } from '../combat';
import { MAX_HITS } from '../combat';
import type { HazardState } from '../hazards';
import { lerp } from './util';

/**
 * The bug, kept exactly as before: red diamond body, antennae with googly
 * eyes, the cyan surfboard, and the drift countdown ring.
 */
/** Hit pips over the bug's head, a red flash on each hit, and a faint
 *  pulse while invincible. Graphical only: no text, no locale keys. */
export function drawCombatOnBug(
  ctx: CanvasRenderingContext2D,
  combat: CombatState,
  x: number,
  y: number,
  time: number
): void {
  for (let i = 0; i < MAX_HITS; i++) {
    const px = x + (i - (MAX_HITS - 1) / 2) * 14;
    const py = y - 58;
    ctx.beginPath();
    ctx.arc(px, py, 4.5, 0, 6.283);
    ctx.fillStyle = i < combat.hits ? '#ff4d6d' : '#ffffff';
    ctx.globalAlpha = i < combat.hits ? 0.95 : 0.35;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#141019';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }
  if (combat.hitFlash > 0) {
    ctx.globalAlpha = (combat.hitFlash / 0.4) * 0.8;
    ctx.strokeStyle = '#ff4d6d';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(x, y, 48 + (0.4 - combat.hitFlash) * 120, 0, 6.283);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (combat.invincible > 0) {
    ctx.globalAlpha = 0.25 + Math.sin(time * 18) * 0.15;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, 6.283);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

/**
 * What the nuisances look like ON the bug: green slime while gooed, waving
 * pasta arms while wrapped, and the sock-envelop trip (a giant sock drops
 * over the bug, closes, and lifts). Also paints in-flight goo spits, which
 * are the only hazard visual that lives away from the bug itself.
 */
export function drawHazardsOnBug(
  ctx: CanvasRenderingContext2D,
  hz: HazardState,
  x: number,
  y: number,
  time: number
): void {
  // Goo spits in flight: a fat green lob from Blahgart to where the bug
  // was, SLOWED to a full watchable second (Bryan's order) with a dribble
  // trail behind it. Visual only; the hit has always been instant.
  for (const s of hz.splats) {
    const f = Math.min(1, s.age / 0.95);
    const px = lerp(s.fromX, s.toX, f);
    const py = lerp(s.fromY, s.toY, f) - Math.sin(f * Math.PI) * 22;
    ctx.fillStyle = '#52f22e';
    // The dribble trail: three shrinking blobs behind the lob.
    for (let k = 1; k <= 3; k++) {
      const tf = Math.max(0, f - k * 0.07);
      const tx = lerp(s.fromX, s.toX, tf);
      const ty = lerp(s.fromY, s.toY, tf) - Math.sin(tf * Math.PI) * 22;
      ctx.globalAlpha = (1 - s.age / 1.3) * (0.5 - k * 0.12);
      ctx.beginPath();
      ctx.arc(tx, ty, 5 - k, 0, 6.283);
      ctx.fill();
    }
    ctx.globalAlpha = Math.max(0, 1 - s.age / 1.3);
    ctx.beginPath();
    ctx.ellipse(px, py, 10, 8, f * 2, 0, 6.283);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Slime coat: bright green blob dripping off the bug, sliding down as it
  // wears off. Loud on purpose; being slimed should feel embarrassing.
  if (hz.gooT > 0) {
    const wear = Math.min(1, hz.gooT / 3.2);
    ctx.globalAlpha = 0.5 + wear * 0.35;
    ctx.fillStyle = '#52f22e';
    ctx.beginPath();
    ctx.ellipse(x, y - 4 + (1 - wear) * 10, 30, 24 * wear + 6, 0, 0, 6.283);
    ctx.fill();
    // Drips.
    for (let k = -1; k <= 1; k++) {
      const dy = ((time * 40 + k * 23) % 26) * wear;
      ctx.beginPath();
      ctx.ellipse(x + k * 16, y + 14 + dy, 4, 6, 0, 0, 6.283);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // The pasta wrap: noodles cinched around the bug, wiggling harder with
  // every escape jump. The count is legible from the wrap thinning.
  if (hz.wrapJumps > 0) {
    const shake = hz.wrapShake > 0 ? Math.sin(time * 60) * 4 : 0;
    ctx.strokeStyle = '#f2dfa8';
    for (let k = 0; k < hz.wrapJumps * 2; k++) {
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#141019';
      ctx.beginPath();
      ctx.ellipse(x + shake, y, 34, 15 + k * 6, -0.35 + k * 0.28, 0, 6.283);
      ctx.stroke();
      ctx.lineWidth = 3.6;
      ctx.strokeStyle = '#f2dfa8';
      ctx.beginPath();
      ctx.ellipse(x + shake, y, 34, 15 + k * 6, -0.35 + k * 0.28, 0, 6.283);
      ctx.stroke();
    }
  }

  // The sock envelop, TUBE FIRST (Bryan's fix: "it should come at you with
  // the tube side... it just makes more sense to get swallowed by the open
  // side of the sock"). The sock descends opening-down like a grabbing bag:
  // dark mouth at the bottom rim, red cuff ring, the toe curling up top,
  // slanty eyes delighted with themselves. Drops over phase 0 to 0.5
  // (teleport fires at the midpoint, hidden inside), lifts away 0.5 to 1.
  if (hz.sockT !== null) {
    const t = hz.sockT;
    // Three beats: drop (0 to 0.3), HOLD covering the bug (0.3 to 0.7,
    // the part Bryan wanted to actually see), lift away (0.7 to 1).
    const drop = t < 0.3 ? t / 0.3 : 1;
    const lift = t > 0.7 ? (t - 0.7) / 0.3 : 0;
    const sy = y - 170 + drop * 170 - lift * 330;
    // A slow contented squeeze while it holds, like a sock digesting.
    const holding = t >= 0.3 && t <= 0.7;
    const squash =
      1 + (holding ? Math.sin((t - 0.3) * 15) * 0.05 : Math.sin(Math.min(drop, 1) * Math.PI) * 0.12);
    ctx.save();
    ctx.translate(x, sy);
    ctx.scale(2.6 * squash, 2.6 / squash);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#141019';
    ctx.lineWidth = 3.5;
    // The tube, hanging opening-down; the toe bends away up top.
    ctx.beginPath();
    ctx.moveTo(-11, 18); // opening rim, left
    ctx.lineTo(-11, -14); // tube left wall
    ctx.quadraticCurveTo(-11, -24, -2, -26); // shoulder
    ctx.quadraticCurveTo(10, -28, 16, -22); // toe curling right
    ctx.quadraticCurveTo(20, -17, 14, -13); // toe underside
    ctx.quadraticCurveTo(11, -11, 11, -2); // back to tube right wall
    ctx.lineTo(11, 18); // opening rim, right
    ctx.closePath();
    ctx.fillStyle = '#f2f5fb';
    ctx.fill();
    ctx.stroke();
    // THE MOUTH: the dark open end coming at you.
    ctx.beginPath();
    ctx.ellipse(0, 18, 11, 4.5, 0, 0, 6.283);
    ctx.fillStyle = '#171019';
    ctx.fill();
    ctx.stroke();
    // Red cuff ring around the opening.
    ctx.beginPath();
    ctx.ellipse(0, 15.5, 11.5, 4, 0, 0, 6.283);
    ctx.strokeStyle = '#e3123a';
    ctx.lineWidth = 3;
    ctx.stroke();
    // The slanty eyes on the tube, delighted with itself.
    ctx.strokeStyle = '#141019';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-7, -6);
    ctx.lineTo(0, -2.5);
    ctx.moveTo(9, -8);
    ctx.lineTo(1.5, -4);
    ctx.stroke();
    ctx.restore();
  }
}
