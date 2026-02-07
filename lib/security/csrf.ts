/**
 * CSRF (Cross-Site Request Forgery) Protection
 * Uses double-submit cookie pattern for stateless CSRF protection
 *
 * How it works:
 * 1. Server generates a random token and sets it as a cookie
 * 2. Client reads the cookie and includes token in request header/body
 * 3. Server validates that cookie value matches header/body value
 * 4. Since attackers can't read cookies from other domains (same-origin policy),
 *    they can't forge requests with valid tokens
 */

import type { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

const CSRF_COOKIE_NAME = 'wortex-csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32; // 256 bits

/**
 * Generate a cryptographically secure random CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('base64url');
}

/**
 * Set CSRF token as an HTTP-only cookie
 * This cookie can only be read by the server, not by JavaScript
 */
export function setCsrfCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true, // Prevent JavaScript access
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict', // Strong CSRF protection
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

/**
 * Get CSRF token from cookie
 */
export function getCsrfTokenFromCookie(request: NextRequest): string | undefined {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value;
}

/**
 * Get CSRF token from request header
 */
export function getCsrfTokenFromHeader(request: NextRequest): string | undefined {
  return request.headers.get(CSRF_HEADER_NAME) || undefined;
}

/**
 * Validate CSRF token using double-submit cookie pattern
 * Returns true if valid, false otherwise
 */
export function validateCsrfToken(request: NextRequest): boolean {
  const cookieToken = getCsrfTokenFromCookie(request);
  const headerToken = getCsrfTokenFromHeader(request);

  // Both tokens must exist
  if (!cookieToken || !headerToken) {
    return false;
  }

  // Tokens must match exactly (timing-safe comparison)
  // Using constant-time comparison to prevent timing attacks
  return timingSafeEqual(cookieToken, headerToken);
}

/**
 * Timing-safe string comparison to prevent timing attacks
 * Compares strings in constant time regardless of where they differ
 */
function timingSafeEqual(a: string, b: string): boolean {
  // If lengths differ, immediately return false (this is safe)
  if (a.length !== b.length) {
    return false;
  }

  // Use crypto.timingSafeEqual for constant-time comparison
  const bufferA = Buffer.from(a, 'utf-8');
  const bufferB = Buffer.from(b, 'utf-8');

  try {
    const crypto = require('crypto');
    return crypto.timingSafeEqual(bufferA, bufferB);
  } catch {
    // Fallback: manual constant-time comparison
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= bufferA[i] ^ bufferB[i];
    }
    return result === 0;
  }
}

/**
 * Middleware to check CSRF token on state-changing requests
 * Should be called at the start of POST/PUT/DELETE/PATCH handlers
 */
export async function checkCsrfProtection(request: NextRequest): Promise<NextResponse | null> {
  // Dynamic import to avoid loading NextResponse at module level
  const { NextResponse } = await import('next/server');

  const method = request.method;

  // Only check CSRF on state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return null; // Allow request to proceed
  }

  // Validate CSRF token
  if (!validateCsrfToken(request)) {
    console.warn('[CSRF] Invalid or missing CSRF token', {
      method,
      url: request.url,
      hasCookie: !!getCsrfTokenFromCookie(request),
      hasHeader: !!getCsrfTokenFromHeader(request),
    });

    return NextResponse.json(
      {
        error: 'Invalid or missing CSRF token',
        message: 'This request appears to be a potential CSRF attack. Please refresh the page and try again.',
      },
      { status: 403 }
    );
  }

  // Token is valid, allow request to proceed
  return null;
}

/**
 * API route to get a new CSRF token
 * Client should call this before making any state-changing requests
 * GET /api/csrf-token
 */
export async function generateCsrfTokenResponse(): Promise<NextResponse> {
  // Dynamic import to avoid loading NextResponse at module level
  const { NextResponse } = await import('next/server');

  const token = generateCsrfToken();
  const response = NextResponse.json({
    token,
    message: 'CSRF token generated successfully',
  });

  setCsrfCookie(response, token);
  return response;
}

/**
 * Refresh CSRF token in response
 * Call this after successful authentication to rotate tokens
 */
export function refreshCsrfToken(response: NextResponse): void {
  const newToken = generateCsrfToken();
  setCsrfCookie(response, newToken);
}
