import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const puzzleId = searchParams.get('puzzleId');

    // Validate inputs
    if (!userId || !puzzleId) {
      return NextResponse.json(
        { error: 'Missing userId or puzzleId' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch the score using server-side client (bypasses RLS session issues)
    const { data: score, error } = await (supabase
      .from('scores') as any)
      .select('*')
      .eq('user_id', userId)
      .eq('puzzle_id', puzzleId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[API /score/get] Error fetching score:', error);
      return NextResponse.json(
        { error: 'Failed to fetch score' },
        { status: 500 }
      );
    }

    if (!score) {
      return NextResponse.json(
        { error: 'Score not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ score });
  } catch (error) {
    console.error('[API /score/get] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
