/**
 * API Route: Sign up with email and password
 * POST /api/auth/signup
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client-server';
import { hashPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/middleware/rateLimit';
import { checkCsrfProtection, refreshCsrfToken } from '@/lib/security/csrf';
import { sanitizeDisplayName, sanitizeEmail } from '@/lib/security/sanitize';
import { v4 as uuidv4 } from 'uuid';

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
    const { email, password, displayName } = await request.json();

    // Sanitize inputs
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedDisplayName = sanitizeDisplayName(displayName);

    // Validate inputs
    if (!sanitizedEmail || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Email validation (already done by sanitizeEmail, but check result)
    if (!sanitizedEmail) {
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

    const supabase = createClient();

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', sanitizedEmail)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user with sanitized inputs
    const userId = uuidv4();
    const { error: insertError } = await supabase
      .from('users')
      .insert([{
        id: userId,
        email: sanitizedEmail,
        password_hash: passwordHash,
        display_name: sanitizedDisplayName || sanitizedEmail.split('@')[0],
        is_anonymous: false,
      }] as any);

    if (insertError) {
      console.error('Error creating user:', insertError);
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }

    // Create session
    const sessionToken = await createSession(userId, false, sanitizedEmail);

    const response = NextResponse.json({
      success: true,
      userId,
      message: 'Account created successfully',
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
      userId,
      message: 'Account created successfully',
      csrfToken: newCsrfToken,
    }, {
      status: 200,
      headers: response.headers,
    });

  } catch (error: any) {
    console.error('Error in signup route:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
