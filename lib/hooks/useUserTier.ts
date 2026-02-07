/**
 * Hook to check the current user's tier
 */

import { useEffect, useState } from 'react';
import { useUser } from '@/lib/contexts/UserContext';

export type UserTier = 'free' | 'premium' | 'admin';

export function useUserTier() {
  const [tier, setTier] = useState<UserTier>('free');
  const [loading, setLoading] = useState(true);
  const { userId } = useUser();

  useEffect(() => {
    let mounted = true;

    async function fetchUserTier() {
      try {
        if (!userId) {
          console.log('[useUserTier] No userId from UserContext');
          if (mounted) {
            setTier('free');
            setLoading(false);
          }
          return;
        }

        console.log('[useUserTier] Fetching tier for user:', userId.substring(0, 12));

        // Use API endpoint instead of direct database query
        const response = await fetch('/api/user/profile', {
          credentials: 'include', // Include session cookie
        });

        if (!response.ok) {
          console.error('[useUserTier] Error fetching user tier:', response.status);
          if (mounted) {
            setTier('free');
            setLoading(false);
          }
          return;
        }

        const userData = await response.json();
        console.log('[useUserTier] Fetched data:', userData);

        if (mounted) {
          const userTier = userData.userTier || 'free';
          setTier(userTier);
          setLoading(false);
          console.log('[useUserTier] Set tier to:', userTier);
        }
      } catch (error) {
        console.error('[useUserTier] Error in useUserTier:', error);
        if (mounted) {
          setTier('free');
          setLoading(false);
        }
      }
    }

    fetchUserTier();

    return () => {
      mounted = false;
    };
  }, [userId]);

  return {
    tier,
    loading,
    isPremium: tier === 'premium' || tier === 'admin',
    isAdmin: tier === 'admin',
    isFree: tier === 'free',
  };
}
