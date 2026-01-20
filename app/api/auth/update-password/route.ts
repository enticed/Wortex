/**
 * API Route: Update password for authenticated user
 * POST /api/auth/update-password
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updatePassword } from '@/lib/supabase/auth';

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

    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Update password
    const result = await updatePassword(supabase, newPassword);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
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
