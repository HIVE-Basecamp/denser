'use client';

import SockOrNotGame from './sock-or-not/sock-or-not-game';

/**
 * Sock or Not.
 *
 * The registry entry, the section layout and the selection logic are all
 * untouched; this file is still the one thing the registry points at. The
 * game itself lives in `sock-or-not/`.
 */
const SockOrNotEntry = () => <SockOrNotGame />;

export default SockOrNotEntry;
