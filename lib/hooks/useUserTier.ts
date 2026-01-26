/**
 * Hook to check the current user's tier
 */

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type UserTier = 'free' | 'premium' | 'admin';

export function useUserTier() {
  const [tier, setTier] = useState<UserTier>('free');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    async function fetchUserTier() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          if (mounted) {
            setTier('free');
            setLoading(false);
          }
          return;
        }

        // Fetch user tier from users table
        const { data: userData, error } = await supabase
          .from('users')
          .select('user_tier')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user tier:', error);
          if (mounted) {
            setTier('free');
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setTier((userData as any)?.user_tier || 'free');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in useUserTier:', error);
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
  }, [supabase]);

  return {
    tier,
    loading,
    isPremium: tier === 'premium' || tier === 'admin',
    isAdmin: tier === 'admin',
    isFree: tier === 'free',
  };
}
