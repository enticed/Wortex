'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/contexts/UserContext';
import { useUserTier } from '@/lib/hooks/useUserTier';

export default function DebugEnvPage() {
  const { userId, user } = useUser();
  const { tier, isPremium, isAdmin } = useUserTier();
  const [supabaseUrl, setSupabaseUrl] = useState<string>('');
  const [hostname, setHostname] = useState<string>('');
  const [dbUserData, setDbUserData] = useState<any>(null);
  const [authUser, setAuthUser] = useState<any>(null);

  useEffect(() => {
    // Get Supabase URL from environment
    setSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set');
    setHostname(window.location.hostname);

    // Fetch auth user
    async function fetchAuthUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setAuthUser(user);
    }

    // Fetch user data directly from database
    async function fetchDbUser() {
      if (!userId) return;

      const supabase = createClient();
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user:', error);
      } else {
        setDbUserData(data);
      }
    }

    fetchAuthUser();
    fetchDbUser();
  }, [userId]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          Environment & Auth Debug
        </h1>

        {/* Environment Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Environment
          </h2>
          <div className="space-y-2 font-mono text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Domain:</span>{' '}
              <span className="text-gray-900 dark:text-gray-100">{hostname || 'Loading...'}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Supabase URL:</span>{' '}
              <span className="text-gray-900 dark:text-gray-100">{supabaseUrl || 'Loading...'}</span>
            </div>
          </div>
        </div>

        {/* Auth User Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Supabase Auth User
          </h2>
          <div className="space-y-2 font-mono text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Auth User ID:</span>{' '}
              <span className="text-gray-900 dark:text-gray-100">{authUser?.id || 'Not found'}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Auth Email:</span>{' '}
              <span className="text-gray-900 dark:text-gray-100">{authUser?.email || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* User Context Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            UserContext
          </h2>
          <div className="space-y-2 font-mono text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">User ID:</span>{' '}
              <span className="text-gray-900 dark:text-gray-100">{userId || 'Not logged in'}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Email:</span>{' '}
              <span className="text-gray-900 dark:text-gray-100">{user?.email || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Display Name:</span>{' '}
              <span className="text-gray-900 dark:text-gray-100">{user?.display_name || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Tier Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            User Tier (from useUserTier hook)
          </h2>
          <div className="space-y-2 font-mono text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Tier:</span>{' '}
              <span className={`font-bold ${
                tier === 'admin' ? 'text-red-600' :
                tier === 'premium' ? 'text-yellow-600' :
                'text-gray-600'
              }`}>{tier}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Is Premium:</span>{' '}
              <span className="text-gray-900 dark:text-gray-100">{isPremium ? 'Yes ✓' : 'No ✗'}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Is Admin:</span>{' '}
              <span className="text-gray-900 dark:text-gray-100">{isAdmin ? 'Yes ✓' : 'No ✗'}</span>
            </div>
          </div>
        </div>

        {/* Database User Data */}
        {dbUserData && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Database User Record
            </h2>
            <div className="space-y-2 font-mono text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">user_tier:</span>{' '}
                <span className={`font-bold ${
                  dbUserData.user_tier === 'admin' ? 'text-red-600' :
                  dbUserData.user_tier === 'premium' ? 'text-yellow-600' :
                  'text-gray-600'
                }`}>{dbUserData.user_tier}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">is_admin:</span>{' '}
                <span className="text-gray-900 dark:text-gray-100">{dbUserData.is_admin ? 'true ✓' : 'false ✗'}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">is_anonymous:</span>{' '}
                <span className="text-gray-900 dark:text-gray-100">{dbUserData.is_anonymous ? 'true' : 'false'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Archive Access Status */}
        <div className={`rounded-lg shadow-md p-6 ${
          isPremium ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
        }`}>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Archive Access Status
          </h2>
          <p className={`text-lg font-bold ${
            isPremium ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {isPremium ? '✓ Access Granted' : '✗ Access Denied'}
          </p>
        </div>
      </div>
    </div>
  );
}
