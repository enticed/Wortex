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

// Guard to prevent concurrent initializations
let isInitializing = false;
let initializationPromise: Promise<void> | null = null;

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
    let isMounted = true;
    let initTimeout: NodeJS.Timeout;
    const abortController = new AbortController();

    async function initializeUser() {
      console.log('[UserContext] Initializing user... (attempt', retryCount + 1, '/', maxRetries + 1, ')');

      // If already initializing, wait for it to complete
      if (isInitializing && initializationPromise) {
        console.log('[UserContext] Initialization already in progress, waiting...');
        try {
          await initializationPromise;
          console.log('[UserContext] Previous initialization completed');
          if (isMounted) {
            setLoading(false);
          }
          return;
        } catch (error) {
          console.log('[UserContext] Previous initialization failed, proceeding with new attempt');
        }
      }

      // Set guard to prevent concurrent initializations
      isInitializing = true;
      initializationPromise = (async () => {
        try {
          // Log current localStorage state
          if (typeof window !== 'undefined') {
            const storageKeys = Object.keys(localStorage);
            const authKeys = storageKeys.filter(k => k.includes('auth') || k.includes('sb-'));
            console.log('[UserContext] localStorage auth keys:', authKeys.length ? authKeys : 'NONE');
          }

          // Small delay to ensure localStorage is fully initialized (particularly on mobile)
          if (typeof window !== 'undefined' && retryCount === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          // Check if component was unmounted or aborted during delay
          if (!isMounted || abortController.signal.aborted) {
            console.log('[UserContext] Component unmounted or aborted, cancelling initialization');
            return;
          }

          // Check for existing session - retry a few times to handle race conditions
          console.log('[UserContext] Checking for existing session...');
          let session = null;
          let sessionError = null;

          // Try up to 3 times with delays to handle session loading race conditions
          for (let attempt = 0; attempt < 3; attempt++) {
            const result = await supabase.auth.getSession();
            session = result.data.session;
            sessionError = result.error;

            if (sessionError) {
              // Handle AbortError gracefully - this is expected during React Strict Mode remounts
              if (sessionError.message?.includes('aborted') || sessionError.name === 'AbortError') {
                console.warn('[UserContext] getSession aborted (likely React remount) - ignoring');
                if (isMounted) {
                  setLoading(false);
                }
                return;
              }
              console.error('[UserContext] getSession error:', sessionError);
              throw sessionError;
            }

            if (session) {
              console.log(`[UserContext] Session found on attempt ${attempt + 1}`);
              break; // Found session
            }

            // No session yet - check if there are auth keys in localStorage
            if (typeof window !== 'undefined') {
              const storageKeys = Object.keys(localStorage);
              const authKeys = storageKeys.filter(k => k.includes('auth') || k.includes('sb-'));
              if (authKeys.length > 0 && attempt < 2) {
                console.log(`[UserContext] Auth keys found in localStorage but no session yet (attempt ${attempt + 1}/3), retrying in ${200 * (attempt + 1)}ms...`);
                await new Promise(resolve => setTimeout(resolve, 200 * (attempt + 1)));
                continue;
              }
            }

            break; // No auth keys or final attempt, stop retrying
          }

          console.log('[UserContext] Session check complete:', session ? 'Found' : 'None');

          if (session?.user) {
            await loadUserData(session.user.id);
          } else {
            // CRITICAL FIX: Do NOT create anonymous session if there are auth keys in localStorage
            // This prevents overwriting authenticated sessions that are still loading
            if (typeof window !== 'undefined') {
              const storageKeys = Object.keys(localStorage);
              const authKeys = storageKeys.filter(k => k.includes('auth') || k.includes('sb-'));
              if (authKeys.length > 0) {
                console.warn('[UserContext] Auth keys exist but session not found - NOT creating anonymous user to avoid overwriting session');
                console.warn('[UserContext] User will need to refresh or sign in again');
                if (isMounted) {
                  setLoading(false);
                }
                return;
              }
            }

            // No session found after retries - create anonymous user
            console.log('[UserContext] No session found after retries, creating anonymous user...');
            const { data, error } = await supabase.auth.signInAnonymously();

            if (error) {
              console.error('Error creating anonymous user:', error);
              throw error;
            }

            console.log('[UserContext] Anonymous sign-in complete:', data?.user ? 'Success' : 'Failed');

            if (data?.user) {
              // Log localStorage immediately after sign-in
              if (typeof window !== 'undefined') {
                const storageKeys = Object.keys(localStorage);
                const authKeys = storageKeys.filter(k => k.includes('auth') || k.includes('sb-'));
                console.log('[UserContext] localStorage after sign-in:', authKeys.length ? authKeys : 'STILL EMPTY - PERSISTENCE FAILED!');
              }

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

          // Final localStorage check
          if (typeof window !== 'undefined') {
            const storageKeys = Object.keys(localStorage);
            const authKeys = storageKeys.filter(k => k.includes('auth') || k.includes('sb-'));
            console.log('[UserContext] Final localStorage state:', authKeys.length ? authKeys : 'EMPTY');
          }

          if (isMounted) {
            setLoading(false);
          }
        } catch (error) {
          console.error('Error initializing user:', error);

          // Check if component was unmounted during error
          if (!isMounted || abortController.signal.aborted) {
            console.log('[UserContext] Component unmounted or aborted, not retrying');
            return;
          }

          // Retry with exponential backoff if we haven't exceeded max retries
          if (retryCount < maxRetries) {
            retryCount++;
            const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
            console.log('[UserContext] Retrying in', delay, 'ms...');
            initTimeout = setTimeout(() => {
              if (isMounted && !abortController.signal.aborted) {
                initializeUser();
              }
            }, delay);
          } else {
            console.error('[UserContext] Max retries exceeded, giving up');
            if (isMounted) {
              setLoading(false);
            }
          }
        } finally {
          isInitializing = false;
          initializationPromise = null;
        }
      })();

      await initializationPromise;
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

          console.log('[UserContext] SIGNED_OUT event - creating new anonymous session');

          // Create new anonymous session
          const { data, error } = await supabase.auth.signInAnonymously();
          if (data?.user) {
            console.log('[UserContext] New anonymous session created after sign-out');

            // Log localStorage after creating new session
            if (typeof window !== 'undefined') {
              const storageKeys = Object.keys(localStorage);
              const authKeys = storageKeys.filter(k => k.includes('auth') || k.includes('sb-'));
              console.log('[UserContext] localStorage after new session:', authKeys.length ? authKeys : 'EMPTY - PERSISTENCE ISSUE');
            }

            await loadUserData(data.user.id);
          } else if (error) {
            console.error('[UserContext] Failed to create new session after sign-out:', error);
          }
        } else if (event === 'USER_UPDATED') {
          // Refresh user data when user info changes (e.g., upgrade to authenticated)
          if (session?.user) {
            await loadUserData(session.user.id);
          }
        }
      }
    );

    // Cleanup subscription and pending operations on unmount
    return () => {
      console.log('[UserContext] Cleaning up - component unmounting');
      isMounted = false;
      abortController.abort();
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
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
