import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();

    // Exchange code for session
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirect to password reset page
  // The session is now established, so the reset page can update the password
  return NextResponse.redirect(new URL('/auth/reset-password', requestUrl.origin));
}
