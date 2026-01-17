import { NextRequest, NextResponse } from 'next/server';
import { getDailyPuzzle, getPuzzleByDate } from '@/lib/services/puzzleService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timezone = searchParams.get('timezone') || 'UTC';
    const date = searchParams.get('date');

    // If date parameter provided, fetch specific puzzle (archive mode)
    let puzzle;
    if (date) {
      puzzle = await getPuzzleByDate(date);
    } else {
      // Otherwise fetch today's puzzle
      puzzle = await getDailyPuzzle(timezone);
    }

    if (!puzzle) {
      return NextResponse.json(
        { error: date ? 'No puzzle available for this date' : 'No puzzle available for today' },
        { status: 404 }
      );
    }

    return NextResponse.json({ puzzle });
  } catch (error) {
    console.error('Error fetching puzzle:', error);
    return NextResponse.json(
      { error: 'Failed to fetch puzzle' },
      { status: 500 }
    );
  }
}
