/**
 * Hive Frontend Universe - the player's hit points.
 *
 * Three hits and the bug is sent back to Basecamp, carried tokens dropped.
 * Nothing here touches movement.ts or PlayerState: the caller reads
 * `respawned` and does the teleport with the ordinary placeAt, exactly the
 * way HazardState.tripped works for Socko.
 */

export interface CombatState {
  /** Hits taken so far this life, 0..MAX_HITS-1. */
  hits: number;
  /** Seconds of invincibility remaining after a hit or a respawn. */
  invincible: number;
  /** Seconds of red hit-flash remaining, visual only. */
  hitFlash: number;
  /** Set true the instant the third hit lands; the caller consumes it. */
  respawned: boolean;
}

export const MAX_HITS = 3;
const INVINCIBLE_SECONDS = 1.4;
const HIT_FLASH_SECONDS = 0.4;

export function createCombat(): CombatState {
  return { hits: 0, invincible: 0, hitFlash: 0, respawned: false };
}

/** Timers first, so a fresh hit this tick is not immediately decayed. */
export function tickCombat(state: CombatState, dt: number): void {
  if (state.invincible > 0) state.invincible = Math.max(0, state.invincible - dt);
  if (state.hitFlash > 0) state.hitFlash = Math.max(0, state.hitFlash - dt);
}

export function registerPlayerHit(state: CombatState): void {
  if (state.invincible > 0) return;
  state.hits++;
  state.invincible = INVINCIBLE_SECONDS;
  state.hitFlash = HIT_FLASH_SECONDS;
  if (state.hits >= MAX_HITS) {
    state.hits = 0;
    state.respawned = true;
  }
}
