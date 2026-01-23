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
        // Improved storage for mobile browsers
        storage: typeof window !== 'undefined' ? {
          getItem: (key: string) => {
            // Try localStorage first (primary storage)
            try {
              const item = window.localStorage.getItem(key);
              if (item) return item;
            } catch (e) {
              console.warn('[Storage] localStorage.getItem failed:', e);
            }

            // Fallback to sessionStorage if localStorage fails
            try {
              return window.sessionStorage.getItem(key);
            } catch (e) {
              console.warn('[Storage] sessionStorage.getItem failed:', e);
              return null;
            }
          },
          setItem: (key: string, value: string) => {
            // Write to both localStorage and sessionStorage for redundancy
            try {
              window.localStorage.setItem(key, value);
            } catch (e) {
              console.warn('[Storage] localStorage.setItem failed:', e);
            }

            try {
              window.sessionStorage.setItem(key, value);
            } catch (e) {
              console.warn('[Storage] sessionStorage.setItem failed:', e);
            }
          },
          removeItem: (key: string) => {
            // Remove from both storages
            try {
              window.localStorage.removeItem(key);
            } catch (e) {
              console.warn('[Storage] localStorage.removeItem failed:', e);
            }

            try {
              window.sessionStorage.removeItem(key);
            } catch (e) {
              console.warn('[Storage] sessionStorage.removeItem failed:', e);
            }
          },
        } : undefined,
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
