/**
 * API Route: Get User Statistics
 * GET /api/user/stats
 *
 * Returns statistics for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/client-server';

export async function GET(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('wortex-session')?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify session
    const session = await verifySession(sessionToken);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use service role client (server-side only, bypasses RLS)
    const supabase = createClient();

    // Fetch user stats
    const { data: stats, error } = await supabase
      .from('stats')
      .select('*')
      .eq('user_id', session.userId)
      .maybeSingle();

    if (error) {
      console.error('[API /user/stats] Error fetching stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user statistics' },
        { status: 500 }
      );
    }

    // Return stats (or null if user has no stats yet)
    return NextResponse.json(stats);

  } catch (error: any) {
    console.error('[API /user/stats] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
