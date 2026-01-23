import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // This will refresh the session if needed and update cookies
  // Handle errors gracefully to avoid breaking the page
  try {
    const { error } = await supabase.auth.getUser();

    // If there's an auth error, clear the corrupted cookies
    if (error) {
      console.warn('[Middleware] Auth error, clearing cookies:', error.message);
      // Clear all auth-related cookies
      request.cookies.getAll().forEach(cookie => {
        if (cookie.name.includes('sb-') || cookie.name.includes('auth')) {
          response.cookies.delete(cookie.name);
        }
      });
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
