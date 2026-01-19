import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generatePuzzleBatch } from '@/lib/services/ai-puzzle-generator';

// Prevent caching of this route - required for cron jobs
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for puzzle generation

/**
 * GET /api/cron/puzzle-buffer
 * Cron job to maintain 30-day puzzle buffer
 * Triggered daily by Vercel Cron or manual call
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional security measure)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Validate API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Get all future puzzles (including today)
    const { data: futurePuzzles, error: fetchError } = await supabase
      .from('puzzles')
      .select('date')
      .gte('date', todayStr)
      .order('date', { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch future puzzles: ${fetchError.message}`);
    }

    const futurePuzzleCount = futurePuzzles?.length || 0;
    const targetBufferDays = 30;
    const neededPuzzles = targetBufferDays - futurePuzzleCount;

    console.log(`[Puzzle Buffer] Current buffer: ${futurePuzzleCount} days, Target: ${targetBufferDays} days`);

    if (neededPuzzles <= 0) {
      return NextResponse.json({
        success: true,
        message: `Buffer is healthy (${futurePuzzleCount} days). No action needed.`,
        currentBuffer: futurePuzzleCount,
        targetBuffer: targetBufferDays,
      });
    }

    // Find the last future puzzle date or use today
    let startDate: Date;
    if (futurePuzzles && futurePuzzles.length > 0) {
      const lastPuzzleDate = futurePuzzles[futurePuzzles.length - 1].date;
      startDate = new Date(lastPuzzleDate);
      startDate.setDate(startDate.getDate() + 1); // Start day after last puzzle
    } else {
      startDate = new Date(today);
    }

    console.log(`[Puzzle Buffer] Generating ${neededPuzzles} puzzles starting from ${startDate.toISOString().split('T')[0]}`);

    // Generate puzzles
    const puzzles = await generatePuzzleBatch(startDate, neededPuzzles);

    // Save to database
    const savedPuzzles = [];
    const errors = [];

    for (const puzzle of puzzles) {
      try {
        const { data, error } = await supabase
          .from('puzzles')
          .insert({
            date: puzzle.date,
            target_phrase: puzzle.targetPhrase,
            facsimile_phrase: puzzle.facsimilePhrase,
            difficulty: puzzle.difficulty,
            bonus_question: puzzle.bonusQuestion,
            created_by_ai: true,
            approved: false, // Require manual approval
            metadata: puzzle.metadata,
          })
          .select()
          .single();

        if (error) {
          console.error(`Error saving puzzle for ${puzzle.date}:`, error);
          errors.push({
            date: puzzle.date,
            error: error.message,
          });
        } else {
          savedPuzzles.push(data);
        }
      } catch (error) {
        console.error(`Failed to save puzzle for ${puzzle.date}:`, error);
        errors.push({
          date: puzzle.date,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const newBufferCount = futurePuzzleCount + savedPuzzles.length;

    return NextResponse.json({
      success: true,
      message: `Generated ${savedPuzzles.length} puzzles. Buffer now at ${newBufferCount} days.`,
      previousBuffer: futurePuzzleCount,
      currentBuffer: newBufferCount,
      targetBuffer: targetBufferDays,
      generated: puzzles.length,
      saved: savedPuzzles.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error in puzzle buffer cron:', error);
    return NextResponse.json(
      {
        error: 'Failed to maintain puzzle buffer',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Allow POST for manual triggering
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
