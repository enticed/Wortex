/**
 * API Route: Send password reset email
 * POST /api/auth/reset-password
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resetPassword } from '@/lib/supabase/auth';
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/middleware/rateLimit';
import { checkCsrfProtection } from '@/lib/security/csrf';

export async function POST(request: NextRequest) {
  // Check CSRF protection
  const csrfResponse = await checkCsrfProtection(request);
  if (csrfResponse) {
    return csrfResponse;
  }

  // Apply very strict rate limiting (3 attempts per hour)
  const rateLimitResponse = checkRateLimit(request, RATE_LIMIT_CONFIGS.passwordReset);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  try {
    const { email } = await request.json();

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
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

    const supabase = await createClient();

    // Send reset password email
    const result = await resetPassword(supabase, email);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent. Please check your inbox.',
    });

  } catch (error: any) {
    console.error('Error in reset-password route:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
