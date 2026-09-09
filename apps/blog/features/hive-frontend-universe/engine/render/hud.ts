import { MONO, PALETTE } from './palette';
import type { RenderScene } from './types';
import { gridCellName } from './util';
export function drawHud(scene: RenderScene): void {
  const { ctx, hud } = scene;
  // No scrim box any more (Bryan: "the score card stuff is bright enough
  // and doesnt need that shaded box") - it was shading whatever stood in
  // the top-left corner, the hydra's west head included. The text draws
  // straight over the world.
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = `600 13px ${MONO}`;
  ctx.fillStyle = PALETTE.newRing;
  ctx.fillText(`${hud.housesLabel} ${hud.housesCount}`, 16, 14);
  ctx.fillStyle = PALETTE.textDim;
  ctx.fillText(`${hud.windowLabel} ${hud.windowTime}`, 16, 33);
  ctx.fillStyle = '#ffd24a';
  ctx.fillText(`${hud.tokensLabel} ${hud.carried} / ${hud.banked}`, 16, 52);
  ctx.fillStyle = '#9be8ff';
  ctx.fillText(`${hud.helmetsLabel} ${hud.helmets} / ${hud.helmetTotal}`, 16, 71);
  let hudY = 90;
  if (hud.placesLabel !== undefined) {
    ctx.fillStyle = '#b8ffd2';
    ctx.fillText(`${hud.placesLabel} ${hud.places} / ${hud.placesTotal}`, 16, hudY);
    hudY += 19;
  }
  if (hud.gemsLabel !== undefined) {
    ctx.fillStyle = '#FF9EDA';
    ctx.fillText(`${hud.gemsLabel} ${hud.gems}`, 16, hudY);
    hudY += 19;
  }
  // The newb-trail quest line, only when this window actually has newcomer
  // posts to visit.
  if (hud.newbsLabel !== undefined && (hud.newbsTotal ?? 0) > 0) {
    ctx.fillStyle = '#ff5fd0';
    ctx.fillText(`${hud.newbsLabel} ${hud.newbs} / ${hud.newbsTotal}`, 16, hudY);
    hudY += 19;
  }
  // THE ROUND CLOCK and the mode: one line, so the clock is readable even
  // with the top-right chip covered by a panel.
  if (hud.roundLabel !== undefined && hud.roundLeft !== undefined) {
    ctx.fillStyle = '#ffd24a';
    const modePart = hud.modeLabel ? `  ${hud.modeLabel}` : '';
    ctx.fillText(`${hud.roundLabel} ${hud.roundLeft}${modePart}`, 16, hudY);
    hudY += 19;
  }
  // THE BACK OF THE BOARD says so, in the cold colour of the ruins.
  if (hud.sideLabel !== undefined) {
    ctx.fillStyle = '#9fb4c8';
    ctx.fillText(hud.sideLabel, 16, hudY);
    hudY += 19;
  }
  // THE DHF RACE line, adventure mode only: votes carried against the return
  // line, then FUNDED once delivered.
  if (hud.votesLabel !== undefined && hud.votes !== undefined) {
    ctx.fillStyle = '#ffd24a';
    const text = hud.funded ? `${hud.votesLabel} ${hud.fundedLabel ?? ''}` : `${hud.votesLabel} ${hud.votes} / ${hud.votesLine ?? 0}`;
    ctx.fillText(text, 16, hudY);
    hudY += 19;
  }
  // With the planning grid on, the HUD names the box the bug stands in, so
  // "where should this go" can be answered by walking there and reading it.
  if (scene.debugGrid) {
    ctx.fillStyle = '#8cdcff';
    ctx.fillText(`[${gridCellName(scene.player.x, scene.player.y)}]`, 16, hudY);
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
}
