'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/lib/contexts/UserContext';
import { createClient } from '@/lib/supabase/client';
import AppLayout from '@/components/layout/AppLayout';

export default function DiagnosticsPage() {
  const { userId, user, loading } = useUser();
  const [localStorageData, setLocalStorageData] = useState<Record<string, string>>({});
  const [sessionData, setSessionData] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    // Read localStorage
    const storage: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        storage[key] = localStorage.getItem(key) || '';
      }
    }
    setLocalStorageData(storage);

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionData(session);
    });
  }, []);

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Auth Diagnostics</h1>

          {/* UserContext State */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
            <h2 className="text-xl font-bold mb-2">UserContext State</h2>
            <pre className="text-xs overflow-auto bg-gray-100 dark:bg-gray-900 p-2 rounded">
              {JSON.stringify({ userId, user, loading }, null, 2)}
            </pre>
          </div>

          {/* Session Data */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
            <h2 className="text-xl font-bold mb-2">Supabase Session</h2>
            <pre className="text-xs overflow-auto bg-gray-100 dark:bg-gray-900 p-2 rounded">
              {JSON.stringify(sessionData, null, 2)}
            </pre>
          </div>

          {/* localStorage */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
            <h2 className="text-xl font-bold mb-2">localStorage Contents</h2>
            <pre className="text-xs overflow-auto bg-gray-100 dark:bg-gray-900 p-2 rounded">
              {JSON.stringify(localStorageData, null, 2)}
            </pre>
          </div>

          {/* Actions */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-2">Actions</h2>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="bg-red-600 text-white px-4 py-2 rounded mr-2"
            >
              Clear localStorage & Reload
            </button>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.reload();
              }}
              className="bg-orange-600 text-white px-4 py-2 rounded mr-2"
            >
              Sign Out & Reload
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
