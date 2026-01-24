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
    const { newPassword } = await request.json();

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

    // Get session
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Hash the new password
    const passwordHash = await hashPassword(newPassword);

    // Update password in database
    const supabase = createClient();
    const { error } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        password_changed_at: new Date().toISOString(),
      })
      .eq('id', session.userId);

    if (error) {
      console.error('Error updating password:', error);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

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
