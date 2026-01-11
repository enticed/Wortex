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
 * Fetch today's puzzle from Supabase
 */
export async function getTodaysPuzzle(supabase: any): Promise<Puzzle | null> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('puzzles')
    .select('*')
    .eq('date', today)
    .eq('approved', true)
    .single();

  if (error) {
    console.error('Error fetching today\'s puzzle:', error);
    return null;
  }

  if (!data) {
    return null;
  }

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
