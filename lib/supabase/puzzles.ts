/**
 * Puzzle management functions for Supabase
 */

import type { Database } from '@/types/database';
import type { Puzzle, BonusQuestion } from '@/types/game';
import { createPhrase } from '@/lib/utils/game';

type PuzzleRow = Database['public']['Tables']['puzzles']['Row'];

/**
 * Convert database puzzle row to game Puzzle type
 */
export function dbPuzzleToPuzzle(dbPuzzle: PuzzleRow): Puzzle {
  const bonusQuestion = dbPuzzle.bonus_question as BonusQuestion;

  return {
    id: dbPuzzle.id,
    date: dbPuzzle.date,
    targetPhrase: createPhrase(dbPuzzle.target_phrase, 'target'),
    facsimilePhrase: createPhrase(dbPuzzle.facsimile_phrase, 'facsimile'),
    difficulty: dbPuzzle.difficulty,
    bonusQuestion,
    allWords: [],
  };
}

/**
 * Fetch today's puzzle from Supabase (timezone-aware)
 */
export async function getTodaysPuzzle(supabase: any, timezone?: string): Promise<Puzzle | null> {
  // Get today's date in the user's timezone
  // Default to America/Los_Angeles to avoid UTC issues on server-side rendering
  const userTimezone = timezone || (typeof window !== 'undefined'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : 'America/Los_Angeles');
  const today = new Date().toLocaleDateString('en-CA', {
    timeZone: userTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  console.log('[getTodaysPuzzle] Timezone:', userTimezone);
  console.log('[getTodaysPuzzle] Calculated date:', today);

  const { data, error } = await supabase
    .from('puzzles')
    .select('*')
    .eq('date', today)
    .eq('approved', true)
    .single();

  if (error) {
    console.error('[getTodaysPuzzle] Error fetching puzzle:', error);
    return null;
  }

  if (!data) {
    console.log('[getTodaysPuzzle] No puzzle found for date:', today);
    return null;
  }

  console.log('[getTodaysPuzzle] Found puzzle:', data.id?.substring(0, 12), 'for date:', data.date);
  return dbPuzzleToPuzzle(data);
}

/**
 * Fetch a specific puzzle by date
 */
export async function getPuzzleByDate(supabase: any, date: string): Promise<Puzzle | null> {
  const { data, error } = await supabase
    .from('puzzles')
    .select('*')
    .eq('date', date)
    .eq('approved', true)
    .single();

  if (error) {
    console.error(`Error fetching puzzle for ${date}:`, error);
    return null;
  }

  if (!data) {
    return null;
  }

  return dbPuzzleToPuzzle(data);
}

/**
 * Fetch all approved puzzles (for archive mode)
 */
export async function getAllPuzzles(supabase: any): Promise<Puzzle[]> {
  const { data, error } = await supabase
    .from('puzzles')
    .select('*')
    .eq('approved', true)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching puzzles:', error);
    return [];
  }

  return data.map(dbPuzzleToPuzzle);
}
