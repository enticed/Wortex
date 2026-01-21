'use client';

/**
 * User context for managing authentication and user state
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type UserRow = Database['public']['Tables']['users']['Row'];
type StatsRow = Database['public']['Tables']['stats']['Row'];

interface UserContextType {
  userId: string | null;
  user: UserRow | null;
  stats: StatsRow | null;
  loading: boolean;
  refreshStats: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<UserRow | null>(null);
  const [stats, setStats] = useState<StatsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Initialize user and listen for auth changes
  useEffect(() => {
    async function initializeUser() {
      console.log('[UserContext] Initializing user...');
      try {
        // Check for existing session with timeout fallback
        console.log('[UserContext] Checking for existing session...');
        let session = null;
        let sessionTimedOut = false;

        const timeoutId = setTimeout(() => {
          console.warn('[UserContext] getSession timed out after 5s, proceeding with new session');
          sessionTimedOut = true;
        }, 5000);

        try {
          const { data: { session: sessionData } } = await supabase.auth.getSession();
          clearTimeout(timeoutId);
          if (!sessionTimedOut) {
            session = sessionData;
            console.log('[UserContext] Session check complete:', session ? 'Found' : 'None');
          }
        } catch (error) {
          clearTimeout(timeoutId);
          console.error('[UserContext] getSession error:', error);
        }

        if (session?.user) {
          await loadUserData(session.user.id);
        } else {
          // Create anonymous user with timeout fallback
          console.log('[UserContext] Creating anonymous user...');
          let signInTimedOut = false;
          let data, error;

          const signInTimeoutId = setTimeout(() => {
            console.warn('[UserContext] signInAnonymously timed out after 5s');
            signInTimedOut = true;
            setLoading(false);
          }, 5000);

          try {
            const result = await supabase.auth.signInAnonymously();
            clearTimeout(signInTimeoutId);

            if (!signInTimedOut) {
              data = result.data;
              error = result.error;
              console.log('[UserContext] Anonymous sign-in complete:', data?.user ? 'Success' : 'Failed');
            } else {
              console.log('[UserContext] Sign-in completed but already timed out');
              return;
            }
          } catch (signInError) {
            clearTimeout(signInTimeoutId);
            error = signInError;
            console.error('[UserContext] signInAnonymously error:', error);
          }

          if (error) {
            console.error('Error creating anonymous user:', error);
            setLoading(false);
            return;
          }

          if (data?.user) {
            // Create user record
            const { error: insertError } = await supabase
              .from('users')
              // @ts-ignore - Supabase browser client types not properly inferred
              .insert({
                id: data.user.id,
                is_anonymous: true,
              })
              .select()
              .single();

            if (insertError && insertError.code !== '23505') {
              console.error('Error creating user record:', insertError);
            }

            await loadUserData(data.user.id);
          }
        }
      } catch (error) {
        console.error('Error initializing user:', error);
      } finally {
        console.log('[UserContext] Initialization complete');
        setLoading(false);
      }
    }

    initializeUser();

    // Listen for auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            await loadUserData(session.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          // Clear user data on sign out
          setUserId(null);
          setUser(null);
          setStats(null);

          // Create new anonymous session
          const { data, error } = await supabase.auth.signInAnonymously();
          if (data?.user) {
            await loadUserData(data.user.id);
          }
        } else if (event === 'USER_UPDATED') {
          // Refresh user data when user info changes (e.g., upgrade to authenticated)
          if (session?.user) {
            await loadUserData(session.user.id);
          }
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load user data and stats
  async function loadUserData(uid: string) {
    setUserId(uid);

    // Load user profile
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', uid)
      .single();

    if (userData) {
      setUser(userData);
    }

    // Load stats
    await refreshStats(uid);
  }

  // Refresh user stats
  async function refreshStats(uid: string | null = userId) {
    if (!uid) return;

    const { data: statsData, error } = await supabase
      .from('stats')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();

    // maybeSingle() returns null if no rows (instead of error)
    if (statsData) {
      setStats(statsData);
    } else if (error) {
      console.error('Error fetching stats:', error);
    }
  }

  const value: UserContextType = {
    userId,
    user,
    stats,
    loading,
    refreshStats: () => refreshStats(),
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
