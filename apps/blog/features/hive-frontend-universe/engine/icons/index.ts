'use client';

/**
 * Hive Frontend Universe — the icon seam.
 *
 * Every landmark type gets one simple vector shape, drawn in code in the same
 * line-art style as the bug and the wobbled lines. One function per shape,
 * dispatched by `IconKey`; upgrading to real art later means replacing the
 * body of a case here and nothing else.
 *
 * Also here: the REAL Hive mark (path data copied verbatim from the app's own
 * `Icons.hive` in packages/ui/components/icons.tsx, viewBox 220x190) and the
 * ambient tier fish for the sea-in-space theme.
 *
 * This was one 3441-line file until the tidy-up for dev review. It is now one
 * place per file, all of them drawn exactly as they were; this index is the
 * seam the rest of the module still imports from, so nothing outside changed.
 */

export { drawHiveMark, drawBugMark } from './hive-mark';
export { drawIcon } from './dispatch';
export { FERRIS_SPIN } from './fun-park';
export { DAPP_WINDOWS } from './launchpad';
export { drawFormation } from './formation';
export { drawWitnessCitadel } from './citadel';
export { drawTrollHole } from './troll-hole';
export { drawSteemRuins } from './steem-ruins';
export { drawIslandChip } from './island-chip';
export { rosePaneCentre } from './rose-comb';
export { drawRoseWindow } from './rose-window';
export { drawCommunityEmblem } from './community-emblem';
export { drawFish } from './fish';
