/**
 * Hook to check the current user's tier
 * Uses userData from UserContext which already has user_tier from session API
 */

import { useUser } from '@/lib/contexts/UserContext';

export type UserTier = 'free' | 'premium' | 'admin';

export function useUserTier() {
  const { userData, loading } = useUser();

  // Get tier from userData (already loaded from session API)
  const tier: UserTier = userData?.user_tier || 'free';

  return {
    tier,
    loading,
    isPremium: tier === 'premium' || tier === 'admin',
    isAdmin: tier === 'admin',
    isFree: tier === 'free',
  };
}
