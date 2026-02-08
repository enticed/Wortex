/**
 * API Route: Sign in with email and password
 * POST /api/auth/signin
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client-server';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/middleware/rateLimit';
import { checkCsrfProtection, refreshCsrfToken } from '@/lib/security/csrf';

export async function POST(request: NextRequest) {
  // Check CSRF protection
  const csrfResponse = await checkCsrfProtection(request);
  if (csrfResponse) {
    return csrfResponse;
  }

  // Apply rate limiting (5 attempts per 15 minutes)
  const rateLimitResponse = checkRateLimit(request, RATE_LIMIT_CONFIGS.auth);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  try {
    const { email, password } = await request.json();

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, display_name, is_anonymous')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Type assertion for user data
    const userData = user as {
      id: string;
      email: string | null;
      password_hash: string | null;
      display_name: string | null;
      is_anonymous: boolean;
    };

    // Verify password
    if (!userData.password_hash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(password, userData.password_hash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session
    const sessionToken = await createSession(userData.id, false, userData.email || undefined);

    const response = NextResponse.json({
      success: true,
      userId: userData.id,
      message: 'Signed in successfully',
    });

    // Set cookie in response
    response.cookies.set('wortex-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    // Refresh CSRF token after successful authentication
    const newCsrfToken = refreshCsrfToken(response);

    // Update response to include new CSRF token
    return NextResponse.json({
      success: true,
      userId: userData.id,
      message: 'Signed in successfully',
      csrfToken: newCsrfToken,
    }, {
      status: 200,
      headers: response.headers,
    });

  } catch (error: any) {
    console.error('Error in signin route:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
