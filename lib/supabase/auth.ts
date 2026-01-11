/**
 * Authentication and user management functions
 */

import type { Database } from '@/types/database';

type UserRow = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];

/**
 * Get or create anonymous user
 * This ensures every player has a user record for tracking stats
 */
export async function getOrCreateAnonymousUser(supabase: any): Promise<string | null> {
  // Check if user is already authenticated
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user) {
    // User already authenticated, ensure user record exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', session.user.id)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error checking user record:', userError);
      return null;
    }

    // If user record doesn't exist, create it
    if (!userData) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: session.user.id,
          is_anonymous: true,
        });

      if (insertError) {
        console.error('Error creating user record:', insertError);
        return null;
      }
    }

    return session.user.id;
  }

  // No session - create anonymous user
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    console.error('Error creating anonymous user:', error);
    return null;
  }

  if (!data?.user) {
    return null;
  }

  // Create user record
  const { error: insertError } = await supabase
    .from('users')
    .insert({
      id: data.user.id,
      is_anonymous: true,
    });

  if (insertError) {
    console.error('Error creating user record:', insertError);
    return null;
  }

  return data.user.id;
}

/**
 * Get user profile
 */
export async function getUserProfile(supabase: any, userId: string): Promise<UserRow | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

/**
 * Update user display name
 */
export async function updateDisplayName(
  supabase: any,
  userId: string,
  displayName: string
): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .update({ display_name: displayName })
    .eq('id', userId);

  if (error) {
    console.error('Error updating display name:', error);
    return false;
  }

  return true;
}
