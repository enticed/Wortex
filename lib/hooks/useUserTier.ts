/**
 * Hook to check the current user's tier
 */

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/contexts/UserContext';

export type UserTier = 'free' | 'premium' | 'admin';

export function useUserTier() {
  const [tier, setTier] = useState<UserTier>('free');
  const [loading, setLoading] = useState(true);
  const { userId } = useUser();
  const supabase = createClient();

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

        // Fetch user tier from users table
        const { data: userData, error } = await supabase
          .from('users')
          .select('user_tier, is_admin')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('[useUserTier] Error fetching user tier:', error);
          if (mounted) {
            setTier('free');
            setLoading(false);
          }
          return;
        }

        console.log('[useUserTier] Fetched data:', userData);

        if (mounted) {
          const userTier = (userData as any)?.user_tier || 'free';
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
  }, [userId, supabase]);

  return {
    tier,
    loading,
    isPremium: tier === 'premium' || tier === 'admin',
    isAdmin: tier === 'admin',
    isFree: tier === 'free',
  };
}
