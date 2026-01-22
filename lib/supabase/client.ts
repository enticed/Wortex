/**
 * Supabase client for browser/client-side usage
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Singleton client instance to ensure consistent session across the app
let clientInstance: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createClient() {
  // Return existing instance if available (browser only)
  if (typeof window !== 'undefined' && clientInstance) {
    return clientInstance;
  }

  // Create new instance using standard Supabase client (not SSR)
  // This uses localStorage directly without Next.js SSR complications
  const client = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'sb-wortex-auth',
        flowType: 'pkce', // Use PKCE flow for better client-side security and persistence
      },
    }
  );

  // Store instance for reuse (browser only)
  if (typeof window !== 'undefined') {
    clientInstance = client;
    console.log('[Supabase Client] Created singleton instance with standard client');
  }

  return client;
}
