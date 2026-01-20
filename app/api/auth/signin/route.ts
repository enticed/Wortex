/**
 * API Route: Sign in with email and password
 * POST /api/auth/signin
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { signInWithEmail } from '@/lib/supabase/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Sign in
    const result = await signInWithEmail(supabase, email, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      userId: result.userId,
      message: 'Signed in successfully',
    });

  } catch (error: any) {
    console.error('Error in signin route:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
