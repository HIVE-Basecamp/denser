/* eslint-disable no-console -- this is a command-line runner: printing the run IS the output. */
/**
 * Hive Frontend Universe — the headless checks.
 *
 * Run from `apps/blog`:
 *
 *   npx -y tsx --tsconfig tsconfig.json features/hive-frontend-universe/checks/run.ts
 *
 * No browser, no signed-in account, no test framework. Everything here is the
 * real engine code: the world is built from a real round start and the same
 * functions the game calls are called against it.
 */

import { worldChecks } from './world';
import { movementChecks } from './movement';
import { blockChecks } from './blocks';
import { footprintChecks } from './footprints';
import { keepChecks } from './keep';
import { raceChecks } from './race';
import { report } from './harness';

console.log('H.I.V.E.R. checks\n');
worldChecks();
movementChecks();
blockChecks();
footprintChecks();
keepChecks();
raceChecks();
report();
