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
          // Skip the delay if we're on a retry or if component is already unmounting
          if (typeof window !== 'undefined' && retryCount === 0 && isMounted && !abortController.signal.aborted) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          // Check if component was unmounted during the delay
          if (!isMounted) {
            console.log('[UserContext] Component unmounted during initialization');
            return;
          }

          // If aborted but still mounted, continue anyway (React Strict Mode case)
          if (abortController.signal.aborted && isMounted) {
            console.log('[UserContext] Abort signal detected but component still mounted - continuing initialization');
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
              // Don't throw, just log and continue to the next attempt
              if (sessionError.message?.includes('aborted') || sessionError.name === 'AbortError') {
                console.warn(`[UserContext] getSession aborted on attempt ${attempt + 1} (likely React remount) - will retry`);
                // Wait a bit before retry
                if (attempt < 2) {
                  await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
                }
                continue; // Try again
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
            // Try to recover session if auth keys exist
            let recoveredSession = null;
            if (typeof window !== 'undefined') {
              const storageKeys = Object.keys(localStorage);
              const sessionKeys = Object.keys(sessionStorage);
              const authKeys = [...storageKeys, ...sessionKeys].filter(k => k.includes('auth') || k.includes('sb-'));

              if (authKeys.length > 0) {
                console.log('[UserContext] Auth keys exist but no session - attempting to refresh session');

                // Try to refresh the session using stored tokens
                try {
                  const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

                  if (!refreshError && refreshData?.session?.user) {
                    console.log('[UserContext] Successfully recovered session from stored tokens');
                    recoveredSession = refreshData.session;
                  } else {
                    console.warn('[UserContext] Failed to recover session:', refreshError?.message || 'No session returned');
                    console.log('[UserContext] Clearing stale auth keys');
                    // Clear stale auth keys
                    authKeys.forEach(key => {
                      try {
                        localStorage.removeItem(key);
                        sessionStorage.removeItem(key);
                      } catch (e) {
                        console.warn('[UserContext] Failed to remove key:', key, e);
                      }
                    });
                  }
                } catch (e) {
                  console.warn('[UserContext] Exception during session refresh:', e);
                  // Clear stale auth keys on exception
                  authKeys.forEach(key => {
                    try {
                      localStorage.removeItem(key);
                      sessionStorage.removeItem(key);
                    } catch (err) {
                      console.warn('[UserContext] Failed to remove key:', key, err);
                    }
                  });
                }
              }
            }

            if (recoveredSession?.user) {
              // Successfully recovered session
              await loadUserData(recoveredSession.user.id);
            } else {
              // No session found after retries - create anonymous user
              console.log('[UserContext] No session found or recovered, creating anonymous user...');
              const { data, error } = await supabase.auth.signInAnonymously();

              if (error) {
                console.error('[UserContext] Error creating anonymous user:', error);
                // Don't throw - try to continue gracefully
                // User will see 'Player' but we want to at least show the UI
                if (isMounted) {
                  setLoading(false);
                }
                return;
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
                  console.error('[UserContext] Error creating user record:', insertError);
                  // Continue anyway - the user row might exist from a previous session
                }

                await loadUserData(data.user.id);
              } else {
                console.error('[UserContext] Anonymous sign-in succeeded but no user returned');
                if (isMounted) {
                  setLoading(false);
                }
              }
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
          // Handle AbortError gracefully
          if (error instanceof Error && (error.message?.includes('aborted') || error.name === 'AbortError')) {
            // If component is still mounted, this is likely React Strict Mode - continue with retry
            if (isMounted) {
              console.warn('[UserContext] Initialization aborted but component still mounted - will retry');
              // Fall through to retry logic below
            } else {
              console.warn('[UserContext] Initialization aborted due to unmount - exiting');
              return;
            }
          } else {
            console.error('Error initializing user:', error);
          }

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

  // Handle page visibility changes - refresh session when user returns to app
  // This is critical for mobile browsers that may suspend the app
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let visibilityTimeout: NodeJS.Timeout;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('[UserContext] Page became visible - checking session');

        // Small delay to let the browser restore state
        visibilityTimeout = setTimeout(async () => {
          try {
            // Try to refresh the session
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
              console.warn('[UserContext] Session check failed on visibility change:', error);
              return;
            }

            if (session?.user) {
              console.log('[UserContext] Session valid after visibility change');

              // Check if the userId has changed (session was replaced)
              if (session.user.id !== userId) {
                console.log('[UserContext] UserId changed - reloading user data');
                await loadUserData(session.user.id);
              }
            } else if (userId) {
              // We had a user but now the session is gone
              console.warn('[UserContext] Session lost after visibility change - user may need to refresh');

              // Check if there are auth keys in storage
              const storageKeys = Object.keys(localStorage);
              const authKeys = storageKeys.filter(k => k.includes('auth') || k.includes('sb-'));

              if (authKeys.length === 0) {
                console.warn('[UserContext] No auth keys found - creating new anonymous session');
                const { data, error: anonError } = await supabase.auth.signInAnonymously();

                if (data?.user && !anonError) {
                  console.log('[UserContext] Created new anonymous session after session loss');
                  await loadUserData(data.user.id);
                }
              }
            }
          } catch (error) {
            console.error('[UserContext] Error handling visibility change:', error);
          }
        }, 300); // 300ms delay for browser state restoration
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (visibilityTimeout) {
        clearTimeout(visibilityTimeout);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId]);

  // Periodic session health check - particularly important for mobile browsers
  // Check every 60 seconds when page is visible to catch session expiration early
  useEffect(() => {
    if (typeof window === 'undefined' || loading) return;

    let intervalId: NodeJS.Timeout;
    let isChecking = false;

    const checkSessionHealth = async () => {
      // Don't run if page is not visible or already checking
      if (document.visibilityState !== 'visible' || isChecking) return;

      isChecking = true;
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.warn('[UserContext] Session health check failed:', error);
          return;
        }

        if (session?.user) {
          // Session exists - check if user ID matches
          if (session.user.id !== userId) {
            console.warn('[UserContext] Session userId mismatch detected during health check');
            console.log('[UserContext] Current:', userId?.substring(0, 12), 'Session:', session.user.id.substring(0, 12));
            await loadUserData(session.user.id);
          }
        } else if (userId) {
          // Had a userId but session is now gone
          console.warn('[UserContext] Session lost during health check - attempting recovery');

          // Check storage for auth keys
          const storageKeys = Object.keys(localStorage);
          const sessionKeys = Object.keys(sessionStorage);
          const authKeys = [...storageKeys, ...sessionKeys].filter(k => k.includes('auth') || k.includes('sb-'));

          if (authKeys.length > 0) {
            console.log('[UserContext] Auth keys found in storage, attempting to restore session');
            // Force a session refresh
            const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
            if (refreshedSession?.user) {
              console.log('[UserContext] Session restored successfully');
              await loadUserData(refreshedSession.user.id);
            }
          } else {
            console.warn('[UserContext] No auth keys found - session appears to be lost');
          }
        }
      } catch (error) {
        console.error('[UserContext] Session health check error:', error);
      } finally {
        isChecking = false;
      }
    };

    // Initial check after 5 seconds
    const initialTimeout = setTimeout(checkSessionHealth, 5000);

    // Then check every 60 seconds
    intervalId = setInterval(checkSessionHealth, 60000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
  }, [userId, loading]);

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
