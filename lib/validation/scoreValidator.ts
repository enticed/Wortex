/**
 * Server-side score validation
 * Prevents clients from submitting fake or manipulated scores
 */

import { createClient } from '@/lib/supabase/client-server';
import { calculateScore } from '@/lib/utils/game';
import { calculateFinalStars, calculatePhase1Stars, calculatePhase2Stars } from '@/lib/utils/stars';

export interface ScoreSubmission {
  userId: string;
  puzzleId: string;
  finalScore: number;
  phase1Score: number;
  phase2Score: number;
  bonusCorrect: boolean;
  timeTakenSeconds: number;
  speed: number;
  minSpeed?: number;
  maxSpeed?: number;
  stars?: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

/**
 * Validate a score submission
 * Returns validation result with specific error messages
 */
export async function validateScoreSubmission(
  submission: ScoreSubmission
): Promise<ValidationResult> {
  const warnings: string[] = [];

  // 1. Validate basic constraints
  if (submission.finalScore < 0) {
    return { valid: false, error: 'Score cannot be negative' };
  }

  if (submission.phase1Score < 0 || submission.phase2Score < 0) {
    return { valid: false, error: 'Phase scores cannot be negative' };
  }

  if (submission.timeTakenSeconds < 0) {
    return { valid: false, error: 'Time cannot be negative' };
  }

  if (submission.timeTakenSeconds > 24 * 60 * 60) {
    // More than 24 hours is suspicious
    return { valid: false, error: 'Time taken exceeds reasonable limit' };
  }

  // 2. Validate speed values (slider range is 0.0 - 2.0)
  if (submission.speed < 0.0 || submission.speed > 2.0) {
    return { valid: false, error: 'Speed must be between 0.0 and 2.0' };
  }

  if (submission.minSpeed !== undefined && (submission.minSpeed < 0.0 || submission.minSpeed > 2.0)) {
    return { valid: false, error: 'Min speed must be between 0.0 and 2.0' };
  }

  if (submission.maxSpeed !== undefined && (submission.maxSpeed < 0.0 || submission.maxSpeed > 2.0)) {
    return { valid: false, error: 'Max speed must be between 0.0 and 2.0' };
  }

  if (submission.minSpeed && submission.maxSpeed && submission.minSpeed > submission.maxSpeed) {
    return { valid: false, error: 'Min speed cannot exceed max speed' };
  }

  // 3. Fetch puzzle data to validate against
  console.log('[Score Validator] Fetching puzzle data for ID:', submission.puzzleId);
  const supabase = createClient();
  const { data: puzzleData, error: puzzleError } = await supabase
    .from('puzzles')
    .select('target_phrase, facsimile_phrase')
    .eq('id', submission.puzzleId)
    .single();

  console.log('[Score Validator] Puzzle query result:', {
    puzzleId: submission.puzzleId,
    hasData: !!puzzleData,
    hasError: !!puzzleError,
    errorDetails: puzzleError ? { message: puzzleError.message, code: puzzleError.code, details: puzzleError.details, hint: puzzleError.hint } : null
  });

  if (puzzleError || !puzzleData) {
    console.error('[Score Validator] Puzzle not found:', puzzleError);
    return { valid: false, error: 'Puzzle not found' };
  }

  console.log('[Score Validator] Successfully fetched puzzle data');

  // 4. Validate puzzle structure
  type PuzzleData = {
    target_phrase: string;
    facsimile_phrase: string;
  };
  const puzzle = puzzleData as PuzzleData;
  if (!puzzle.target_phrase || !puzzle.facsimile_phrase) {
    return { valid: false, error: 'Invalid puzzle data' };
  }

  // Parse puzzle words
  const targetWords = puzzle.target_phrase.split(/[\s—–]+/).filter((w: string) => w.length > 0);
  const facsimileWords = puzzle.facsimile_phrase.split(/[\s—–]+/).filter((w: string) => w.length > 0);
  const uniqueWords = new Set([...targetWords, ...facsimileWords]).size;
  const quoteWordCount = targetWords.length;

  // 5. Validate Phase 1 score (word finding efficiency)
  // Phase 1 score = totalWordsSeen / uniqueWords
  // Perfect score = 1.0 (saw exactly the unique words)
  // Can be < 1.0 if player collects words faster than vortex delivers them
  // Can be > 20.0 if player gets distracted and vortex keeps delivering words

  const MIN_PHASE1_SCORE = 0.0; // Theoretical minimum (no words seen)
  const MAX_PHASE1_SCORE = 100.0; // Very high but possible if left idle

  if (submission.phase1Score < MIN_PHASE1_SCORE) {
    return {
      valid: false,
      error: `Phase 1 score cannot be negative (${submission.phase1Score})`,
    };
  }

  if (submission.phase1Score > MAX_PHASE1_SCORE) {
    warnings.push(
      `Phase 1 score is very high (${submission.phase1Score}). User may have left game idle.`
    );
  }

  // 6. Validate Phase 2 score (reordering efficiency)
  // Phase 2 score = 0.25 * number of moves
  // Perfect score = 0 (no reordering needed)
  // Max reasonable moves = quoteWordCount * 3 (very inefficient)

  const MAX_MOVES = quoteWordCount * 3;
  const MAX_PHASE2_SCORE = MAX_MOVES * 0.25;

  if (submission.phase2Score < 0) {
    return { valid: false, error: 'Phase 2 score cannot be negative' };
  }

  if (submission.phase2Score > MAX_PHASE2_SCORE) {
    return {
      valid: false,
      error: `Phase 2 score too high (${submission.phase2Score}). Maximum for ${quoteWordCount} words is ${MAX_PHASE2_SCORE}`,
    };
  }

  // Phase 2 score should be a multiple of 0.25 (each move = 0.25 points)
  const remainder = (submission.phase2Score * 100) % 25;
  if (remainder !== 0) {
    warnings.push(
      `Phase 2 score (${submission.phase2Score}) is not a multiple of 0.25. This may indicate score manipulation.`
    );
  }

  // 7. Validate final score calculation
  // In this game, lower score is better
  // - If bonus correct: finalScore = (phase1 + phase2) * 0.9 (10% discount)
  // - If bonus wrong/skip: finalScore = phase1 + phase2 (no change)
  const totalScore = submission.phase1Score + submission.phase2Score;
  const expectedFinalScore = submission.bonusCorrect
    ? Math.round((totalScore * 0.9) * 100) / 100
    : totalScore;

  // Allow small floating point differences
  const scoreDifference = Math.abs(submission.finalScore - expectedFinalScore);
  if (scoreDifference > 0.01) {
    return {
      valid: false,
      error: `Final score mismatch. Expected ${expectedFinalScore}, got ${submission.finalScore}`,
    };
  }

  // 8. Validate star calculation if provided
  if (submission.stars !== undefined && submission.stars !== null) {
    const expectedStars = calculateFinalStars(
      submission.phase1Score,
      submission.phase2Score,
      quoteWordCount
    );

    if (submission.stars !== expectedStars) {
      warnings.push(
        `Star count mismatch. Expected ${expectedStars}, got ${submission.stars}. Using calculated value.`
      );
    }

    if (submission.stars < 1 || submission.stars > 5) {
      return { valid: false, error: 'Stars must be between 1 and 5' };
    }
  }

  // 9. Validate time taken is reasonable for puzzle complexity
  // A puzzle with 20 words should take at least 10 seconds (very fast)
  // And no more than 1 hour (very slow)
  const minTime = Math.max(5, uniqueWords); // At least 5 seconds, or 1 second per unique word
  const maxTime = 60 * 60; // 1 hour

  if (submission.timeTakenSeconds < minTime) {
    warnings.push(
      `Time taken (${submission.timeTakenSeconds}s) seems suspiciously fast for ${uniqueWords} unique words. Minimum expected: ${minTime}s`
    );
  }

  if (submission.timeTakenSeconds > maxTime) {
    warnings.push(
      `Time taken (${submission.timeTakenSeconds}s) exceeds ${maxTime}s. User may have left game open.`
    );
  }

  // 10. Validate bonus answer flag is boolean
  if (typeof submission.bonusCorrect !== 'boolean') {
    return { valid: false, error: 'Bonus correct must be a boolean value' };
  }

  // All validations passed
  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Sanitize and normalize a score submission
 * Recalculates values that should be derived
 */
export function sanitizeScoreSubmission(
  submission: ScoreSubmission,
  quoteWordCount: number
): ScoreSubmission {
  // Recalculate final score from components
  // In this game, lower score is better
  // - If bonus correct: finalScore = (phase1 + phase2) * 0.9 (10% discount)
  // - If bonus wrong/skip: finalScore = phase1 + phase2 (no change)
  const totalScore = submission.phase1Score + submission.phase2Score;
  const sanitizedFinalScore = submission.bonusCorrect
    ? Math.round((totalScore * 0.9) * 100) / 100
    : totalScore;

  // Recalculate stars from phase scores
  const sanitizedStars = calculateFinalStars(
    submission.phase1Score,
    submission.phase2Score,
    quoteWordCount
  );

  // Round scores to 2 decimal places
  const sanitized: ScoreSubmission = {
    ...submission,
    finalScore: Math.round(sanitizedFinalScore * 100) / 100,
    phase1Score: Math.round(submission.phase1Score * 100) / 100,
    phase2Score: Math.round(submission.phase2Score * 100) / 100,
    speed: Math.round(submission.speed * 100) / 100,
    stars: sanitizedStars,
  };

  // Ensure min/max speeds are set
  if (sanitized.minSpeed !== undefined) {
    sanitized.minSpeed = Math.round(sanitized.minSpeed * 100) / 100;
  }
  if (sanitized.maxSpeed !== undefined) {
    sanitized.maxSpeed = Math.round(sanitized.maxSpeed * 100) / 100;
  }

  return sanitized;
}

/**
 * Check if user is attempting to submit the same score multiple times rapidly
 * (Possible replay attack or bug)
 */
export async function checkDuplicateSubmission(
  userId: string,
  puzzleId: string,
  finalScore: number
): Promise<boolean> {
  const supabase = await createClient();

  // Check for recent identical scores (within last 5 minutes)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data: recentScores } = await supabase
    .from('scores')
    .select('id, score, created_at')
    .eq('user_id', userId)
    .eq('puzzle_id', puzzleId)
    .eq('score', finalScore)
    .gte('created_at', fiveMinutesAgo)
    .order('created_at', { ascending: false })
    .limit(1);

  return (recentScores?.length ?? 0) > 0;
}
