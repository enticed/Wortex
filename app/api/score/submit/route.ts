import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type ScoreInsert = Database['public']['Tables']['scores']['Insert'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, puzzleId, score, bonusCorrect, timeTakenSeconds, speed } = body;

    // Validate inputs
    if (!userId || !puzzleId || score === undefined || timeTakenSeconds === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if this is the user's first play of this puzzle
    const { data: existingScore } = await supabase
      .from('scores')
      .select('id')
      .eq('user_id', userId)
      .eq('puzzle_id', puzzleId)
      .single();

    const isFirstPlay = !existingScore;

    // Prepare score data with proper typing
    const scoreData: ScoreInsert = {
      user_id: userId,
      puzzle_id: puzzleId,
      score: Number(score),
      bonus_correct: bonusCorrect || false,
      time_taken_seconds: Number(timeTakenSeconds),
      speed: speed ? Number(speed) : 1.0,
      first_play_of_day: isFirstPlay,
    };

    // Submit score (upsert to handle replays)
    const { error: scoreError } = await (supabase
      .from('scores')
      // @ts-expect-error - Supabase types not properly inferred in server context
      .upsert(scoreData, {
        onConflict: 'user_id,puzzle_id'
      }));

    if (scoreError) {
      console.error('Error submitting score:', scoreError);
      return NextResponse.json(
        { error: 'Failed to submit score' },
        { status: 500 }
      );
    }

    // Get puzzle date for streak calculation
    const { data: puzzleData } = await supabase
      .from('puzzles')
      .select('date')
      .eq('id', puzzleId)
      .single();

    // Update streak
    if (puzzleData && 'date' in puzzleData) {
      // @ts-expect-error - RPC function types not properly inferred
      await supabase.rpc('update_user_streak', {
        p_user_id: userId,
        p_puzzle_date: (puzzleData as any).date,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in score submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
