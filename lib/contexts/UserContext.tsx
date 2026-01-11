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

  // Initialize anonymous user
  useEffect(() => {
    async function initializeUser() {
      try {
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          await loadUserData(session.user.id);
        } else {
          // Create anonymous user
          const { data, error } = await supabase.auth.signInAnonymously();

          if (error) {
            console.error('Error creating anonymous user:', error);
            setLoading(false);
            return;
          }

          if (data.user) {
            // Create user record
            const { error: insertError } = await supabase
              .from('users')
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
        setLoading(false);
      }
    }

    initializeUser();
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
