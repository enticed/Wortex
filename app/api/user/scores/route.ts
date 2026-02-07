/**
 * API Route: Get User Scores
 * GET /api/user/scores
 *
 * Returns score data for the authenticated user
 * Supports query parameters for filtering and pagination
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryType = searchParams.get('type') || 'recent';
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    switch (queryType) {
      case 'recent': {
        // Get recent games (last N)
        const { data: games, error } = await supabase
          .from('scores')
          .select(`
            id,
            puzzle_id,
            score,
            bonus_correct,
            time_taken_seconds,
            speed,
            min_speed,
            max_speed,
            stars,
            created_at,
            puzzles!inner (
              date
            )
          `)
          .eq('user_id', session.userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) {
          console.error('[API /user/scores] Error loading recent games:', error);
          return NextResponse.json(
            { error: 'Failed to fetch recent games' },
            { status: 500 }
          );
        }

        return NextResponse.json(games);
      }

      case 'pure': {
        // Get Pure games (first play, 1.0x speed only)
        const { data: pureGames, error } = await supabase
          .from('scores')
          .select('stars, puzzles!inner(date)')
          .eq('user_id', session.userId)
          .eq('first_play_of_day', true)
          .eq('min_speed', 1.0)
          .eq('max_speed', 1.0)
          .not('stars', 'is', null);

        if (error) {
          console.error('[API /user/scores] Error loading pure games:', error);
          return NextResponse.json(
            { error: 'Failed to fetch pure games' },
            { status: 500 }
          );
        }

        return NextResponse.json(pureGames);
      }

      case 'boosted': {
        // Get Boosted games (repeat plays or speed adjustments)
        const { data: boostedGames, error } = await supabase
          .from('scores')
          .select('stars, puzzles!inner(date)')
          .eq('user_id', session.userId)
          .or('first_play_of_day.eq.false,min_speed.neq.1.0,max_speed.neq.1.0')
          .not('stars', 'is', null);

        if (error) {
          console.error('[API /user/scores] Error loading boosted games:', error);
          return NextResponse.json(
            { error: 'Failed to fetch boosted games' },
            { status: 500 }
          );
        }

        return NextResponse.json(boostedGames);
      }

      case 'average-stars': {
        // Get all scores with stars for average calculation
        const { data: scores, error } = await supabase
          .from('scores')
          .select('stars')
          .eq('user_id', session.userId)
          .not('stars', 'is', null);

        if (error) {
          console.error('[API /user/scores] Error loading scores for average:', error);
          return NextResponse.json(
            { error: 'Failed to fetch scores' },
            { status: 500 }
          );
        }

        return NextResponse.json(scores);
      }

      default:
        return NextResponse.json(
          { error: 'Invalid query type' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('[API /user/scores] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
