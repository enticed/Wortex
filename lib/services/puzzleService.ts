/**
 * Puzzle service for fetching daily puzzles from Supabase
 */

import { createClient } from '@/lib/supabase/server';
import { normalizeCapitalizationAcrossTexts, createPhraseWithNormalizedCaps, getCurrentDateForTimezone } from '@/lib/utils/game';
import type { Puzzle, BonusQuestion } from '@/types/game';

/**
 * Get the daily puzzle for a specific date and timezone
 */
export async function getDailyPuzzle(timezone: string = 'UTC'): Promise<Puzzle | null> {
  const supabase = await createClient();
  const currentDate = getCurrentDateForTimezone(timezone);

  const { data, error } = await supabase
    .from('puzzles')
    .select('*')
    .eq('date', currentDate)
    .eq('approved', true)
    .single();

  if (error || !data) {
    console.error('Error fetching daily puzzle:', error);
    return null;
  }

  // Normalize capitalization across both phrases
  const targetText = (data as any).target_phrase;
  const facsimileText = (data as any).facsimile_phrase;
  const capMap = normalizeCapitalizationAcrossTexts([targetText, facsimileText]);

  // Transform database row to Puzzle type
  const metadata = (data as any).metadata;
  const puzzle: Puzzle = {
    id: (data as any).id,
    date: (data as any).date,
    targetPhrase: createPhraseWithNormalizedCaps(targetText, 'target', capMap),
    facsimilePhrase: createPhraseWithNormalizedCaps(facsimileText, 'facsimile', capMap),
    difficulty: (data as any).difficulty,
    bonusQuestion: (data as any).bonus_question as BonusQuestion,
    allWords: [],
    theme: metadata?.theme || (data as any).theme || undefined,
  };

  return puzzle;
}

/**
 * Get a puzzle by specific date (for archive mode)
 */
export async function getPuzzleByDate(date: string): Promise<Puzzle | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('puzzles')
    .select('*')
    .eq('date', date)
    .eq('approved', true)
    .single();

  if (error || !data) {
    console.error('Error fetching puzzle by date:', error);
    return null;
  }

  // Normalize capitalization across both phrases
  const targetText = (data as any).target_phrase;
  const facsimileText = (data as any).facsimile_phrase;
  const capMap = normalizeCapitalizationAcrossTexts([targetText, facsimileText]);

  const metadata = (data as any).metadata;
  const puzzle: Puzzle = {
    id: (data as any).id,
    date: (data as any).date,
    targetPhrase: createPhraseWithNormalizedCaps(targetText, 'target', capMap),
    facsimilePhrase: createPhraseWithNormalizedCaps(facsimileText, 'facsimile', capMap),
    difficulty: (data as any).difficulty,
    bonusQuestion: (data as any).bonus_question as BonusQuestion,
    allWords: [],
    theme: metadata?.theme || (data as any).theme || undefined,
  };

  return puzzle;
}

/**
 * Get all available puzzle dates (for archive mode)
 */
export async function getAvailablePuzzleDates(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('puzzles')
    .select('date')
    .eq('approved', true)
    .order('date', { ascending: false });

  if (error || !data) {
    console.error('Error fetching puzzle dates:', error);
    return [];
  }

  return data.map((row) => (row as any).date);
}

/**
 * Check if user has already played today's puzzle
 */
export async function hasPlayedToday(
  userId: string,
  puzzleId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('scores')
    .select('id')
    .eq('user_id', userId)
    .eq('puzzle_id', puzzleId)
    .single();

  if (error) {
    // User hasn't played yet (no row found)
    return false;
  }

  return !!data;
}
