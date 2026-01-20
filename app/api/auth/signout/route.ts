/**
 * API Route: Sign out current user
 * POST /api/auth/signout
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/lib/supabase/auth';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Sign out
    const success = await signOut(supabase);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to sign out' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Signed out successfully',
    });

  } catch (error: any) {
    console.error('Error in signout route:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
