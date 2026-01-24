import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/client-server';

export async function GET(request: NextRequest) {
  try {
    // Get session from cookie
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
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
