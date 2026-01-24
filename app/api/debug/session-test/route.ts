/**
 * Debug endpoint to test session creation without side effects
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, createSession } from '@/lib/auth/session';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasSessionSecret: !!process.env.SESSION_SECRET,
  };

  try {
    // Check for existing session
    const existingSession = await getSessionFromRequest(request);
    diagnostics.existingSession = existingSession ? {
      userId: existingSession.userId.substring(0, 12) + '...',
      isAnonymous: existingSession.isAnonymous,
    } : null;

    // Try to create a test session token
    const testId = uuidv4();
    diagnostics.testUserId = testId.substring(0, 12) + '...';

    try {
      const testToken = await createSession(testId, true);
      diagnostics.tokenCreated = true;
      diagnostics.tokenLength = testToken.length;
      diagnostics.tokenPreview = testToken.substring(0, 50) + '...';
    } catch (err: any) {
      diagnostics.tokenCreated = false;
      diagnostics.tokenError = err.message;
    }

    // Create response with test cookie
    const response = NextResponse.json(diagnostics);

    // Try to set a test session cookie
    try {
      const sessionToken = await createSession(testId, true);
      response.cookies.set('wortex-session-test', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60, // 1 hour
        path: '/',
      });
      diagnostics.cookieSet = true;
    } catch (err: any) {
      diagnostics.cookieSet = false;
      diagnostics.cookieError = err.message;
    }

    return response;
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
      diagnostics,
    }, { status: 500 });
  }
}
