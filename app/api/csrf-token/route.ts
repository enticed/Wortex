/**
 * API Route: Get CSRF Token
 * GET /api/csrf-token
 *
 * Returns a CSRF token and sets it as an HTTP-only cookie.
 * Clients should call this endpoint before making state-changing requests.
 */

import { NextRequest } from 'next/server';
import { generateCsrfTokenResponse } from '@/lib/security/csrf';

export async function GET(request: NextRequest) {
  return generateCsrfTokenResponse();
}
