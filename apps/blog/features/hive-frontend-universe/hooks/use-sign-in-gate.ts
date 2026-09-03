'use client';

/**
 * H.I.V.E.R. — the sign-in gate.
 *
 * There is no account-age gate. New users are meant to play, with no
 * differentiation and no barrier based on how old their account is: the game
 * exists to make the first year on Hive worth staying for, so locking it away
 * from people in their first year defeated the point.
 *
 * Signing in is still required, because the player rides their own avatar and
 * the world is drawn around who they are.
 */

import { useUserClient } from '@smart-signer/lib/auth/use-user-client';

export type SignInGateStatus = 'loading' | 'blocked-logged-out' | 'allowed';

export function useSignInGate(): SignInGateStatus {
  const { user, isHydrated } = useUserClient();

  if (!isHydrated) return 'loading';
  return user.isLoggedIn ? 'allowed' : 'blocked-logged-out';
}
