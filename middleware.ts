import { NextResponse, type NextRequest } from 'next/server';
import { getSessionFromRequest, createSession, setSessionCookieInResponse } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/client-server';
import { v4 as uuidv4 } from 'uuid';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    // Check if user has a valid session
    const session = await getSessionFromRequest(request);

    // If no session or session is invalid, create an anonymous user
    if (!session) {
      // Create anonymous user in database
      const anonymousId = uuidv4();
      const supabase = createClient();

      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          id: anonymousId,
          display_name: `Anon-${anonymousId.slice(0, 8)}`,
          is_admin: false,
          is_anonymous: true,
        }] as any)

      if (insertError) {
        console.error('[Middleware] Failed to create anonymous user:', insertError);
        return response; // Continue without blocking
      }

      // Create session for anonymous user
      const token = await createSession(anonymousId, true);
      setSessionCookieInResponse(response, token);

      console.log('[Middleware] Created anonymous user:', anonymousId);
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
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
