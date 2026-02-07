/**
 * API Route: Get User's Score for a Specific Puzzle
 * GET /api/user/puzzle-score?puzzleId=xxx
 *
 * Returns the user's score for a specific puzzle (if it exists)
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const puzzleId = searchParams.get('puzzleId');

    if (!puzzleId) {
      return NextResponse.json(
        { error: 'puzzleId parameter is required' },
        { status: 400 }
      );
    }

    // Use service role client (server-side only, bypasses RLS)
    const supabase = createClient();

    // Get user's score for this puzzle (most recent if multiple)
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', session.userId)
      .eq('puzzle_id', puzzleId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[API /user/puzzle-score] Error fetching score:');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: 'Failed to fetch puzzle score', details: error.message },
        { status: 500 }
      );
    }

    // Return score data (or null if not found)
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[API /user/puzzle-score] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
