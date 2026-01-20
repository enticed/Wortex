/**
 * API Route: Upgrade anonymous account to authenticated account
 * POST /api/auth/upgrade
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { upgradeToAuthenticatedAccount } from '@/lib/supabase/auth';

export async function POST(request: Request) {
  try {
    const { email, password, displayName } = await request.json();

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Password validation (minimum 8 characters)
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current user
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Upgrade the account
    const result = await upgradeToAuthenticatedAccount(
      supabase,
      session.user.id,
      email,
      password,
      displayName
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Account upgraded successfully',
    });

  } catch (error: any) {
    console.error('Error in upgrade route:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
