'use client';

/**
 * User context for managing authentication and user state
 * Uses simple session-based auth with HTTP-only cookies
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type UserRow = Database['public']['Tables']['users']['Row'];
type StatsRow = Database['public']['Tables']['stats']['Row'];

interface UserData {
  id: string;
  email: string | null;
  username: string;
  isAdmin: boolean;
  createdAt: string;
  isAnonymous: boolean;
}

interface UserContextType {
  userId: string | null;
  user: UserRow | null;
  userData: UserData | null;
  stats: StatsRow | null;
  loading: boolean;
  refreshStats: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<UserRow | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [stats, setStats] = useState<StatsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Load user data from session API
  async function loadUserFromSession() {
    try {
      console.log('[UserContext] Loading user from session...');

      const response = await fetch('/api/auth/session', {
        credentials: 'include', // Include cookies
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[UserContext] Session API error:', data);
        setLoading(false);
        return;
      }

      if (data.user) {
        console.log('[UserContext] User loaded from session:', data.user.id.substring(0, 12));
        setUserData(data.user);
        setUserId(data.user.id);
        await loadUserDataFromDb(data.user.id);
      } else {
        console.warn('[UserContext] No user in response:', data);
      }
    } catch (error) {
      console.error('[UserContext] Error loading user from session:', error);
    } finally {
      setLoading(false);
    }
  }

  // Load full user data and stats from database
  async function loadUserDataFromDb(uid: string) {
    console.log('[UserContext] Loading user data from DB for:', uid.substring(0, 12));

    // We can't query users table directly with browser client due to RLS
    // The userData from session API already has what we need
    // Just load stats
    await refreshStatsInternal(uid);
  }

  // Initialize on mount
  useEffect(() => {
    // Clear any old Supabase Auth sessions from localStorage (only once per browser session)
    if (typeof window !== 'undefined' && !sessionStorage.getItem('auth_cleaned')) {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('sb-')) {
          console.log('[UserContext] Clearing old Supabase Auth key:', key);
          localStorage.removeItem(key);
        }
      });
      sessionStorage.setItem('auth_cleaned', 'true');
    }

    loadUserFromSession();
  }, []);

  // Refresh user data (call after signin/signup)
  async function refreshUser() {
    console.log('[UserContext] Refreshing user...');
    setLoading(true);
    await loadUserFromSession();
  }

  // Refresh user stats
  async function refreshStats() {
    if (userId) {
      await refreshStatsInternal(userId);
    }
  }

  async function refreshStatsInternal(uid: string) {
    const { data: statsData, error } = await supabase
      .from('stats')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();

    if (statsData) {
      setStats(statsData as StatsRow);
    } else if (error) {
      console.error('[UserContext] Error fetching stats:', error);
    }
  }

  const value: UserContextType = {
    userId,
    user,
    userData,
    stats,
    loading,
    refreshStats,
    refreshUser,
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
