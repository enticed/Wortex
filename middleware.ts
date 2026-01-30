import { NextResponse, type NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    // Check if user has a valid session (but don't create one here)
    // Session creation is now handled by /api/auth/session to prevent duplicate user creation
    const session = await getSessionFromRequest(request);

    // Optional: Add session info to request headers for downstream use
    if (session) {
      response.headers.set('x-user-id', session.userId);
      response.headers.set('x-is-anonymous', session.isAnonymous.toString());
    }
  } catch (err) {
    console.error('[Middleware] Unexpected error:', err);
    // Don't block the request, just continue
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/stripe/webhook (Stripe webhook endpoint - must skip middleware)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
