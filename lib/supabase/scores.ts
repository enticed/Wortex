/**
 * Score and stats management functions
 */

import type { Database } from '@/types/database';

type ScoreInsert = Database['public']['Tables']['scores']['Insert'];
type ScoreRow = Database['public']['Tables']['scores']['Row'];
type StatsRow = Database['public']['Tables']['stats']['Row'];
type LeaderboardRow = Database['public']['Views']['leaderboards']['Row'];

/**
 * Submit a score for a completed puzzle
 */
export async function submitScore(
  supabase: any,
  userId: string,
  puzzleId: string,
  score: number,
  bonusCorrect: boolean,
  timeTakenSeconds: number
): Promise<boolean> {
  const scoreData: ScoreInsert = {
    user_id: userId,
    puzzle_id: puzzleId,
    score,
    bonus_correct: bonusCorrect,
    time_taken_seconds: timeTakenSeconds,
  };

  const { error } = await supabase
    .from('scores')
    .upsert(scoreData, {
      onConflict: 'user_id,puzzle_id',
    });

  if (error) {
    console.error('Error submitting score:', error);
    return false;
  }

  // Update streak
  const { data: puzzleData } = await supabase
    .from('puzzles')
    .select('date')
    .eq('id', puzzleId)
    .single();

  if (puzzleData) {
    await supabase.rpc('update_user_streak', {
      p_user_id: userId,
      p_puzzle_date: puzzleData.date,
    });
  }

  return true;
}

/**
 * Get user's stats
 */
export async function getUserStats(supabase: any, userId: string): Promise<StatsRow | null> {
  const { data, error } = await supabase
    .from('stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user stats:', error);
    return null;
  }

  return data || null;
}

/**
 * Get leaderboard for a specific puzzle
 */
export async function getPuzzleLeaderboard(
  supabase: any,
  puzzleId: string,
  limit: number = 100
): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase
    .from('leaderboards')
    .select('*')
    .eq('puzzle_id', puzzleId)
    .limit(limit);

  if (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }

  return data || [];
}

/**
 * Get global leaderboard (best average scores)
 */
export async function getGlobalLeaderboard(
  supabase: any,
  limit: number = 100
): Promise<Array<{ user_id: string; display_name: string | null; average_score: number; total_games: number }>> {
  const { data, error } = await supabase
    .from('stats')
    .select(`
      user_id,
      average_score,
      total_games,
      users!inner (
        display_name
      )
    `)
    .order('average_score', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching global leaderboard:', error);
    return [];
  }

  return data.map((row: any) => ({
    user_id: row.user_id,
    display_name: row.users.display_name,
    average_score: row.average_score,
    total_games: row.total_games,
  }));
}

/**
 * Get user's score for a specific puzzle
 */
export async function getUserPuzzleScore(
  supabase: any,
  userId: string,
  puzzleId: string
): Promise<ScoreRow | null> {
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', userId)
    .eq('puzzle_id', puzzleId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user puzzle score:', error);
    return null;
  }

  return data || null;
}
