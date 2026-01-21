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
    let retryCount = 0;
    const maxRetries = 3;

    async function initializeUser() {
      console.log('[UserContext] Initializing user... (attempt', retryCount + 1, '/', maxRetries + 1, ')');
      try {
        // Check for existing session - wait as long as needed
        console.log('[UserContext] Checking for existing session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[UserContext] getSession error:', sessionError);
          throw sessionError;
        }

        console.log('[UserContext] Session check complete:', session ? 'Found' : 'None');

        if (session?.user) {
          await loadUserData(session.user.id);
        } else {
          // Create anonymous user - wait as long as needed
          console.log('[UserContext] Creating anonymous user...');
          const { data, error } = await supabase.auth.signInAnonymously();

          if (error) {
            console.error('Error creating anonymous user:', error);
            throw error;
          }

          console.log('[UserContext] Anonymous sign-in complete:', data?.user ? 'Success' : 'Failed');

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

        console.log('[UserContext] Initialization complete');
        setLoading(false);
      } catch (error) {
        console.error('Error initializing user:', error);

        // Retry with exponential backoff if we haven't exceeded max retries
        if (retryCount < maxRetries) {
          retryCount++;
          const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
          console.log('[UserContext] Retrying in', delay, 'ms...');
          setTimeout(() => initializeUser(), delay);
        } else {
          console.error('[UserContext] Max retries exceeded, giving up');
          setLoading(false);
        }
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

    console.log('[UserContext] Loading user data for:', uid.substring(0, 12));

    // Load user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', uid)
      .single();

    if (userError) {
      console.warn('[UserContext] User record not found, creating...', userError.code);

      // User record doesn't exist - create it
      const { data: { session } } = await supabase.auth.getSession();
      const isAnonymous = session?.user?.is_anonymous ?? true;

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        // @ts-ignore - Supabase browser client types not properly inferred
        .insert({
          id: uid,
          is_anonymous: isAnonymous,
        })
        .select()
        .single();

      if (insertError) {
        console.error('[UserContext] Failed to create user record:', insertError);
      } else if (newUser) {
        console.log('[UserContext] Created user record successfully');
        setUser(newUser);
      }
    } else if (userData) {
      console.log('[UserContext] User record loaded successfully');
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
