import { NextRequest, NextResponse } from 'next/server';
import { getDailyPuzzle } from '@/lib/services/puzzleService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timezone = searchParams.get('timezone') || 'UTC';

    const puzzle = await getDailyPuzzle(timezone);

    if (!puzzle) {
      return NextResponse.json(
        { error: 'No puzzle available for today' },
        { status: 404 }
      );
    }

    return NextResponse.json({ puzzle });
  } catch (error) {
    console.error('Error fetching daily puzzle:', error);
    return NextResponse.json(
      { error: 'Failed to fetch puzzle' },
      { status: 500 }
    );
  }
}
