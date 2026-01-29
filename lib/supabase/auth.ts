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

/**
 * Upgrade an anonymous user to an authenticated account
 * Preserves all user data, scores, and stats
 */
export async function upgradeToAuthenticatedAccount(
  supabase: any,
  currentUserId: string,
  email: string,
  password: string,
  displayName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Verify current user is anonymous
    const { data: user } = await supabase
      .from('users')
      .select('is_anonymous, email')
      .eq('id', currentUserId)
      .single();

    if (!user?.is_anonymous) {
      return { success: false, error: 'User is already authenticated' };
    }

    // 2. Check if email is already in use
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return { success: false, error: 'Email already in use' };
    }

    // 3. Update Supabase Auth to convert anonymous → authenticated
    const { error: authError } = await supabase.auth.updateUser({
      email,
      password,
    });

    if (authError) {
      return { success: false, error: authError.message };
    }

    // 4. Update user record in database
    const updateData: any = {
      email,
      is_anonymous: false,
      password_changed_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    };

    if (displayName) {
      updateData.display_name = displayName;
    }

    const { error: dbError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', currentUserId);

    if (dbError) {
      return { success: false, error: 'Failed to update user record' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

/**
 * Create a new authenticated account directly
 * For users who choose not to play anonymously first
 */
export async function signUpWithEmail(
  supabase: any,
  email: string,
  password: string,
  displayName?: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // 1. Create Supabase Auth user
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return { success: false, error: authError.message };
    }

    if (!data.user) {
      return { success: false, error: 'Failed to create user' };
    }

    // 2. Create user record
    const { error: dbError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email,
        display_name: displayName || null,
        is_anonymous: false,
        last_login: new Date().toISOString(),
      });

    if (dbError && dbError.code !== '23505') {
      return { success: false, error: 'Failed to create user record' };
    }

    return { success: true, userId: data.user.id };
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  supabase: any,
  email: string,
  password: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return { success: false, error: authError.message };
    }

    if (!data.user) {
      return { success: false, error: 'Failed to sign in' };
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id);

    return { success: true, userId: data.user.id };
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

/**
 * Sign out current user
 */
export async function signOut(supabase: any): Promise<boolean> {
  const { error } = await supabase.auth.signOut();
  return !error;
}

/**
 * Send password reset email
 */
export async function resetPassword(
  supabase: any,
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the app URL from environment variable or use window.location.origin as fallback
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ||
                   (typeof window !== 'undefined' ? window.location.origin : 'https://wortex.live');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/reset-password`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

/**
 * Update password (for authenticated users)
 */
export async function updatePassword(
  supabase: any,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Update password_changed_at timestamp
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('users')
        .update({ password_changed_at: new Date().toISOString() })
        .eq('id', user.id);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}
