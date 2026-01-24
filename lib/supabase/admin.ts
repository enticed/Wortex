/**
 * Admin authentication utilities
 * Uses session-based auth with HTTP-only cookies
 */

import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/client-server';

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
  // Get session from cookie
  const session = await getSession();

  if (!session) {
    return null;
  }

  // Get user from database and check if admin
  const supabase = createClient();
  const { data: user, error } = await supabase
    .from('users')
    .select('id, display_name, is_admin, is_anonymous')
    .eq('id', session.userId)
    .single();

  if (error || !user) {
    return null;
  }

  // Type assertion for user data
  const userData = user as {
    id: string;
    display_name: string | null;
    is_admin: boolean;
    is_anonymous: boolean | null;
  };

  if (!userData.is_admin) {
    return null;
  }

  return userData;
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
