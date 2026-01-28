import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, createSession, setSessionCookie } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/client-server';
import { v4 as uuidv4 } from 'uuid';

// Bot detection - common bot user agents
const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scrapy/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /googlebot/i,
  /bingbot/i,
  /slurp/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /whatsapp/i,
  /telegrambot/i,
  /slackbot/i,
  /discordbot/i,
  /uptimerobot/i,
  /pingdom/i,
  /headless/i,
];

function isLikelyBot(userAgent: string | null): boolean {
  if (!userAgent) return true; // No user agent = suspicious
  return BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}

export async function GET(request: NextRequest) {
  try {
    // Get session from cookie
    let session = await getSessionFromRequest(request);

    // If no session, create an anonymous user
    if (!session) {
      // Bot detection
      const userAgent = request.headers.get('user-agent');
      const isBot = isLikelyBot(userAgent);

      if (isBot) {
        console.log('[SessionAPI] Bot detected, not creating user. UA:', userAgent?.substring(0, 100));
        return NextResponse.json(
          { error: 'Bot detected' },
          { status: 403 }
        );
      }

      console.log('[SessionAPI] No session found, creating anonymous user...');
      console.log('[SessionAPI] User-Agent:', userAgent?.substring(0, 100));
      console.log('[SessionAPI] IP:', request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown');

      const anonymousId = uuidv4();
      const supabase = createClient();

      // Create anonymous user in database
      const { error: insertError } = await (supabase.from('users') as any)
        .insert([{
          id: anonymousId,
          display_name: `Anon-${anonymousId.slice(0, 8)}`,
          is_admin: false,
          is_anonymous: true,
        }]);

      if (insertError) {
        console.error('[SessionAPI] Failed to create anonymous user:', insertError);
        console.error('[SessionAPI] Error details:', JSON.stringify(insertError, null, 2));
        return NextResponse.json(
          {
            error: 'Failed to create session',
            details: insertError.message,
            code: insertError.code
          },
          { status: 500 }
        );
      }

      // Create session for anonymous user
      console.log('[SessionAPI] ✓ Successfully created anonymous user:', anonymousId.substring(0, 12));
      console.log('[SessionAPI]   Timestamp:', new Date().toISOString());
      console.log('[SessionAPI]   Display name: Anon-' + anonymousId.slice(0, 8));

      const token = await createSession(anonymousId, true);
      console.log('[SessionAPI] ✓ Session token created successfully');

      // Return the newly created anonymous user with cookie
      const response = NextResponse.json({
        user: {
          id: anonymousId,
          email: null,
          username: `Anon-${anonymousId.slice(0, 8)}`,
          isAdmin: false,
          createdAt: new Date().toISOString(),
          isAnonymous: true
        }
      });

      // Set cookie in response (use correct cookie name)
      response.cookies.set('wortex-session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });

      console.log('[SessionAPI] ✓ Cookie set, returning user session');
      return response;
    }

    // Get user data from database
    const supabase = createClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, display_name, is_admin, created_at')
      .eq('id', session.userId)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Type assertion for user data
    const userData = user as {
      id: string;
      email: string | null;
      display_name: string | null;
      is_admin: boolean;
      created_at: string;
    };

    return NextResponse.json({
      user: {
        id: userData.id,
        email: userData.email,
        username: userData.display_name || 'Player',
        isAdmin: userData.is_admin,
        createdAt: userData.created_at,
        isAnonymous: !userData.email // Anonymous if no email
      }
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
