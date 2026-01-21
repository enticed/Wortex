/**
 * Supabase client for browser/client-side usage
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// Singleton client instance to ensure consistent session across the app
let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  // Return existing instance if available (browser only)
  if (typeof window !== 'undefined' && clientInstance) {
    return clientInstance;
  }

  // Create new instance with explicit persistence settings
  const client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'wortex-auth-token',
      },
    }
  );

  // Store instance for reuse (browser only)
  if (typeof window !== 'undefined') {
    clientInstance = client;
    console.log('[Supabase Client] Created singleton instance');
  }

  return client;
}
