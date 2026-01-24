/**
 * Debug endpoint to check cookie behavior
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Read current cookies
  const currentCookies = request.cookies.getAll();

  // Create a test cookie
  const response = NextResponse.json({
    message: 'Cookie debug endpoint',
    receivedCookies: currentCookies,
    environment: process.env.NODE_ENV,
  });

  // Set a test cookie
  response.cookies.set('test-cookie', 'test-value-' + Date.now(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
    path: '/',
  });

  return response;
}
