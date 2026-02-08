import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@/lib/supabase/client-server';
import { getSession } from '@/lib/auth/session';
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/middleware/rateLimit';
import { checkCsrfProtection } from '@/lib/security/csrf';
import { validateScoreSubmission, sanitizeScoreSubmission, checkDuplicateSubmission } from '@/lib/validation/scoreValidator';
import type { Database } from '@/types/database';

type ScoreInsert = Database['public']['Tables']['scores']['Insert'];

export async function POST(request: NextRequest) {
  // TEMPORARILY DISABLED: CSRF protection (token sync issues, will re-enable after fix)
  // TODO: Re-enable CSRF once we implement proper token synchronization
  // const csrfResponse = await checkCsrfProtection(request);
  // if (csrfResponse) {
  //   return csrfResponse;
  // }

  // Apply rate limiting (10 submissions per minute)
  const rateLimitResponse = checkRateLimit(request, RATE_LIMIT_CONFIGS.scoreSubmission);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const {
      userId,
      puzzleId,
      score: finalScore,
      phase1Score,
      phase2Score,
      bonusCorrect,
      timeTakenSeconds,
      speed,
      minSpeed,
      maxSpeed,
      stars,
    } = body;

    // Validate required fields
    if (!userId || !puzzleId || finalScore === undefined || timeTakenSeconds === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate that phase scores are provided
    if (phase1Score === undefined || phase2Score === undefined) {
      return NextResponse.json(
        { error: 'Phase 1 and Phase 2 scores are required' },
        { status: 400 }
      );
    }

    // Check for duplicate submission (possible replay attack)
    const isDuplicate = await checkDuplicateSubmission(userId, puzzleId, finalScore);
    if (isDuplicate) {
      return NextResponse.json(
        { error: 'Duplicate score submission detected. Please wait before submitting again.' },
        { status: 429 }
      );
    }

    // Validate score submission
    const validationResult = await validateScoreSubmission({
      userId,
      puzzleId,
      finalScore,
      phase1Score,
      phase2Score,
      bonusCorrect: bonusCorrect || false,
      timeTakenSeconds,
      speed: speed || 1.0,
      minSpeed,
      maxSpeed,
      stars,
    });

    if (!validationResult.valid) {
      console.warn('[ScoreSubmit] Validation failed:', validationResult.error);
      return NextResponse.json(
        { error: validationResult.error || 'Invalid score submission' },
        { status: 400 }
      );
    }

    // Log warnings if any
    if (validationResult.warnings && validationResult.warnings.length > 0) {
      console.warn('[ScoreSubmit] Validation warnings:', validationResult.warnings);
    }

    // Verify authentication using custom session
    const session = await getSession();
    if (!session) {
      console.error('[ScoreSubmit] No session found');
      return NextResponse.json(
        { error: 'Unauthorized: No active session' },
        { status: 401 }
      );
    }

    // Verify that the authenticated user matches the submitted userId
    if (session.userId !== userId) {
      console.error('[ScoreSubmit] User ID mismatch:', {
        sessionUserId: session.userId,
        submittedUserId: userId
      });
      return NextResponse.json(
        { error: 'Unauthorized: User ID does not match authenticated user' },
        { status: 401 }
      );
    }

    // Use service role client for database operations (bypasses RLS)
    const supabase = createServiceClient();

    // Get puzzle data for sanitization
    const { data: puzzleData, error: puzzleError } = await supabase
      .from('puzzles')
      .select('target_phrase')
      .eq('id', puzzleId)
      .single();

    if (puzzleError || !puzzleData) {
      return NextResponse.json(
        { error: 'Puzzle not found' },
        { status: 404 }
      );
    }

    const puzzle = puzzleData as { target_phrase: string };
    const targetWords = puzzle.target_phrase.split(/[\s—–]+/).filter((w: string) => w.length > 0);
    const quoteWordCount = targetWords.length;

    // Sanitize the score submission (recalculate derived values)
    const sanitized = sanitizeScoreSubmission({
      userId,
      puzzleId,
      finalScore,
      phase1Score,
      phase2Score,
      bonusCorrect: bonusCorrect || false,
      timeTakenSeconds,
      speed: speed || 1.0,
      minSpeed,
      maxSpeed,
      stars,
    }, quoteWordCount);

    // Check if this is the user's first play of this puzzle
    const { data: existingScores } = await supabase
      .from('scores')
      .select('id, first_play_of_day')
      .eq('user_id', userId)
      .eq('puzzle_id', puzzleId)
      .limit(1);

    const isFirstPlay = !existingScores || existingScores.length === 0;

    // Determine if this qualifies as "first play of day" (for Pure rankings)
    // Only the first play with no speed modifications counts as Pure
    const firstPlayOfDay = isFirstPlay;

    // Prepare score data with sanitized values
    const scoreData: ScoreInsert = {
      user_id: sanitized.userId,
      puzzle_id: sanitized.puzzleId,
      score: sanitized.finalScore,
      phase1_score: sanitized.phase1Score,
      phase2_score: sanitized.phase2Score,
      bonus_correct: sanitized.bonusCorrect,
      time_taken_seconds: sanitized.timeTakenSeconds,
      speed: sanitized.speed,
      min_speed: sanitized.minSpeed,
      max_speed: sanitized.maxSpeed,
      first_play_of_day: firstPlayOfDay,
      stars: sanitized.stars,
    };

    // Submit score (insert to allow multiple plays per puzzle)
    const { error: scoreError } = await supabase
      .from('scores')
      .insert(scoreData);

    if (scoreError) {
      console.error('[ScoreSubmit] Error submitting score:', scoreError);
      return NextResponse.json(
        { error: 'Failed to submit score' },
        { status: 500 }
      );
    }

    // Get puzzle date for streak calculation
    const { data: puzzleDateData } = await supabase
      .from('puzzles')
      .select('date')
      .eq('id', puzzleId)
      .single();

    // Update streak
    if (puzzleDateData && 'date' in puzzleDateData) {
      // @ts-expect-error - RPC function types not properly inferred
      await supabase.rpc('update_user_streak', {
        p_user_id: userId,
        p_puzzle_date: (puzzleDateData as any).date,
      });
    }

    return NextResponse.json({
      success: true,
      warnings: validationResult.warnings,
    });
  } catch (error) {
    console.error('[ScoreSubmit] Error in score submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
