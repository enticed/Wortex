/**
 * Session management utilities using HTTP-only cookies and JWTs
 */

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'wortex-session';
const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'fallback-secret-change-in-production'
);

export interface SessionData {
  userId: string;
  isAnonymous: boolean;
  email?: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Create a new session token
 */
export async function createSession(userId: string, isAnonymous: boolean, email?: string): Promise<string> {
  const now = Date.now();
  const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days

  const token = await new SignJWT({
    userId,
    isAnonymous,
    email,
    createdAt: now,
    expiresAt,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SESSION_SECRET);

  return token;
}

/**
 * Verify and decode a session token
 */
export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET);

    // Check if session is expired
    const expiresAt = payload.expiresAt as number;
    if (Date.now() > expiresAt) {
      return null;
    }

    return {
      userId: payload.userId as string,
      isAnonymous: payload.isAnonymous as boolean,
      email: payload.email as string | undefined,
      createdAt: payload.createdAt as number,
      expiresAt: payload.expiresAt as number,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Set session cookie (server-side)
 */
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
  });
}

/**
 * Get session from cookie (server-side)
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySession(token);
}

/**
 * Get session from request (middleware)
 */
export async function getSessionFromRequest(request: NextRequest): Promise<SessionData | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySession(token);
}

/**
 * Set session cookie in response (middleware)
 */
export function setSessionCookieInResponse(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
  });
}

/**
 * Clear session cookie (server-side)
 */
export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Clear session cookie in response (middleware)
 */
export function clearSessionInResponse(response: NextResponse) {
  response.cookies.delete(SESSION_COOKIE_NAME);
}
