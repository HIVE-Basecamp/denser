/**
 * Hive Frontend Universe — user-facing copy, in one place.
 *
 * NOTE: this feature is not yet wired into the locale files (that edit is
 * deliberately deferred until the ship-location decision is made). To keep all
 * user-visible text in ONE spot so it moves cleanly to translation keys later,
 * every string lives here rather than being inlined across components. This is
 * a temporary shape, not a replacement for i18n.
 */

export const HFU_DISPLAY_NAME = 'Hive Frontend Universe';

export const HFU_COPY = {
  checkingAccount: 'Checking your account…',
  loadingBoard: 'Reading the last thirty minutes of the chain…',
  loadError: 'Could not read the chain right now. Try again shortly.',

  gate: {
    title: HFU_DISPLAY_NAME,
    loggedOut: 'Sign in with your Hive account to play.'
  },

  hud: {
    houses: 'HOUSES',
    window: 'WINDOW'
  },

  card: {
    newcomer: 'NEWCOMER',
    hp: 'HP',
    rep: 'rep',
    votes: 'votes',
    comments: 'comments',
    openPost: 'Open post',
    openProfile: 'Open profile',
    skip: 'Skip'
  }
} as const;
