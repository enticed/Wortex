/**
 * Admin authentication utilities
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export interface AdminUser {
  id: string;
  display_name: string | null;
  is_admin: boolean;
  is_anonymous: boolean | null;
}

/**
 * Check if the current user is an admin
 * Returns the user if admin, null otherwise
 */
export async function requireAdmin(): Promise<AdminUser | null> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component, ignore
          }
        },
      },
    }
  );

  // Get current user (more secure than getSession)
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return null;
  }

  // Check if user is admin
  const { data: user, error } = await supabase
    .from('users')
    .select('id, display_name, is_admin, is_anonymous')
    .eq('id', authUser.id)
    .single();

  if (error || !user || !user.is_admin) {
    return null;
  }

  return user as AdminUser;
}

/**
 * Get admin user or throw error
 */
export async function getAdminUser(): Promise<AdminUser> {
  const user = await requireAdmin();

  if (!user) {
    throw new Error('Unauthorized: Admin access required');
  }

  return user;
}

/**
 * Check if current user is admin (boolean check)
 */
export async function isAdmin(): Promise<boolean> {
  const user = await requireAdmin();
  return user !== null;
}
