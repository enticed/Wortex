import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generatePuzzle, generatePuzzleBatch } from '@/lib/services/ai-puzzle-generator';

/**
 * POST /api/admin/puzzles/generate
 * Generate AI puzzles and save to database
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
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

    // Get request body
    const body = await request.json();
    const { startDate, count = 1, userId } = body;

    if (!startDate) {
      return NextResponse.json(
        { error: 'startDate is required (YYYY-MM-DD format)' },
        { status: 400 }
      );
    }

    // Validate API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Parse start date
    const start = new Date(startDate + 'T00:00:00');
    if (isNaN(start.getTime())) {
      return NextResponse.json(
        { error: 'Invalid startDate format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Find the next available date starting from startDate
    let currentDate = new Date(start);
    let availableDates: Date[] = [];
    let attempts = 0;
    const maxAttempts = count + 100; // Check up to count + 100 days to find available slots

    while (availableDates.length < count && attempts < maxAttempts) {
      const dateStr = currentDate.toISOString().split('T')[0];

      // Check if puzzle exists for this date
      const { data: existing } = await supabase
        .from('puzzles')
        .select('date')
        .eq('date', dateStr)
        .single();

      if (!existing) {
        availableDates.push(new Date(currentDate));
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      attempts++;
    }

    if (availableDates.length === 0) {
      return NextResponse.json(
        { error: 'No available dates found in the next ' + maxAttempts + ' days' },
        { status: 400 }
      );
    }

    // Generate puzzles for available dates
    const puzzles = [];
    for (const date of availableDates) {
      const puzzle = await generatePuzzle(date);
      puzzles.push({
        ...puzzle,
        date: date.toISOString().split('T')[0],
      });
    }

    // Save to database
    const savedPuzzles = [];
    const errors = [];

    for (const puzzle of puzzles) {
      try {
        // Insert puzzle (we already verified the date is available)
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
          console.error('Error saving puzzle for ' + puzzle.date + ':', error);
          errors.push({
            date: puzzle.date,
            error: error.message,
          });
        } else {
          savedPuzzles.push(data);
        }
      } catch (error) {
        console.error('Failed to save puzzle for ' + puzzle.date + ':', error);
        errors.push({
          date: puzzle.date,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      generated: puzzles.length,
      saved: savedPuzzles.length,
      errors: errors.length > 0 ? errors : undefined,
      puzzles: savedPuzzles,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/puzzles/generate:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate puzzles',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
