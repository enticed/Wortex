/**
 * API Route: Sign up with email and password
 * POST /api/auth/signup
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { signUpWithEmail } from '@/lib/supabase/auth';

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

    // Sign out any existing anonymous session first
    await supabase.auth.signOut();

    // Create new account
    const result = await signUpWithEmail(supabase, email, password, displayName);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      userId: result.userId,
      message: 'Account created successfully',
    });

  } catch (error: any) {
    console.error('Error in signup route:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
