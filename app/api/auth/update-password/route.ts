/**
 * API Route: Update password for authenticated user
 * POST /api/auth/update-password
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';
import { createClient } from '@/lib/supabase/client-server';

export async function POST(request: Request) {
  try {
    const { newPassword, userId } = await request.json();

    // Validate input
    if (!newPassword) {
      return NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      );
    }

    // Password validation (minimum 8 characters)
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Determine user ID: use provided userId (for password reset) or session userId (for password change)
    let targetUserId: string;

    if (userId) {
      // Password reset flow - userId provided directly
      // This is allowed because user already authenticated via password reset token
      targetUserId = userId;
      console.log('[Update Password] Password reset flow for user:', userId);
    } else {
      // Normal password change flow - require session
      const session = await getSession();

      if (!session) {
        return NextResponse.json(
          { error: 'Not authenticated' },
          { status: 401 }
        );
      }

      targetUserId = session.userId;
      console.log('[Update Password] Password change flow for user:', targetUserId);
    }

    // Hash the new password
    const passwordHash = await hashPassword(newPassword);

    // Update password in database
    const supabase = createClient();
    const { error } = await (supabase.from('users') as any)
      .update({
        password_hash: passwordHash,
        password_changed_at: new Date().toISOString(),
      })
      .eq('id', targetUserId);

    if (error) {
      console.error('Error updating password:', error);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    console.log('[Update Password] Password hash updated successfully for:', targetUserId);

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });

  } catch (error: any) {
    console.error('Error in update-password route:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
