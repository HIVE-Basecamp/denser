'use client';

import BotOrNotGame from './bot-or-not/bot-or-not-game';

/**
 * Spot the Bot — played as Bot or Not.
 *
 * The registry entry, the section layout and the selection logic are all
 * untouched; this file is still the one thing the registry points at. The
 * game itself lives in `bot-or-not/`.
 */
const SpotTheBotGame = () => <BotOrNotGame />;

export default SpotTheBotGame;
