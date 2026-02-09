/**
 * Score and stats management functions
 */

import type { Database } from '@/types/database';

type ScoreInsert = Database['public']['Tables']['scores']['Insert'];
type ScoreRow = Database['public']['Tables']['scores']['Row'];
type StatsRow = Database['public']['Tables']['stats']['Row'];
type LeaderboardRow = Database['public']['Views']['leaderboards']['Row'];
type LeaderboardPureRow = Database['public']['Views']['leaderboards_pure']['Row'];
type LeaderboardBoostedRow = Database['public']['Views']['leaderboards_boosted']['Row'];
type GlobalLeaderboardPureRow = Database['public']['Views']['global_leaderboards_pure']['Row'];
type GlobalLeaderboardBoostedRow = Database['public']['Views']['global_leaderboards_boosted']['Row'];

/**
 * Submit a score for a completed puzzle
 */
export async function submitScore(
  supabase: any,
  userId: string,
  puzzleId: string,
  score: number,
  bonusCorrect: boolean,
  timeTakenSeconds: number,
  phase1Score?: number,
  phase2Score?: number
): Promise<boolean> {
  const scoreData: ScoreInsert = {
    user_id: userId,
    puzzle_id: puzzleId,
    score,
    phase1_score: phase1Score,
    phase2_score: phase2Score,
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
    .maybeSingle();

  if (error) {
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

/**
 * Get Pure leaderboard for a specific puzzle (first play, no speed adjustments)
 * Extended with user_tier from users table
 */
export async function getPuzzleLeaderboardPure(
  supabase: any,
  puzzleId: string,
  limit: number = 100,
  offset: number = 0
): Promise<Array<LeaderboardPureRow & { user_tier?: 'free' | 'premium' | 'admin' }>> {
  const { data, error } = await supabase
    .from('leaderboards_pure')
    .select('*')
    .eq('puzzle_id', puzzleId)
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching Pure leaderboard:', error);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Fetch user tiers for all users in the leaderboard
  const userIds = data.map((entry: any) => entry.user_id);
  const { data: users } = await supabase
    .from('users')
    .select('id, user_tier')
    .in('id', userIds);

  // Create a map of user_id to user_tier
  const tierMap = new Map(users?.map((u: any) => [u.id, u.user_tier]) || []);

  // Merge user_tier into leaderboard entries
  return data.map((entry: any) => ({
    ...entry,
    user_tier: tierMap.get(entry.user_id) || 'free',
  }));
}

/**
 * Get Boosted leaderboard for a specific puzzle (repeat plays or speed adjustments)
 * Extended with user_tier from users table
 */
export async function getPuzzleLeaderboardBoosted(
  supabase: any,
  puzzleId: string,
  limit: number = 100,
  offset: number = 0
): Promise<Array<LeaderboardBoostedRow & { user_tier?: 'free' | 'premium' | 'admin' }>> {
  const { data, error } = await supabase
    .from('leaderboards_boosted')
    .select('*')
    .eq('puzzle_id', puzzleId)
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching Boosted leaderboard:', error);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Fetch user tiers for all users in the leaderboard
  const userIds = data.map((entry: any) => entry.user_id);
  const { data: users } = await supabase
    .from('users')
    .select('id, user_tier')
    .in('id', userIds);

  // Create a map of user_id to user_tier
  const tierMap = new Map(users?.map((u: any) => [u.id, u.user_tier]) || []);

  // Merge user_tier into leaderboard entries
  return data.map((entry: any) => ({
    ...entry,
    user_tier: tierMap.get(entry.user_id) || 'free',
  }));
}

/**
 * Get Pure global leaderboard (best average scores from Pure games)
 * Extended with user_tier from users table
 */
export async function getGlobalLeaderboardPure(
  supabase: any,
  limit: number = 100,
  offset: number = 0,
  sortBy: 'average_score' | 'total_stars' = 'average_score'
): Promise<Array<GlobalLeaderboardPureRow & { user_tier?: 'free' | 'premium' | 'admin' }>> {
  let query = supabase
    .from('global_leaderboards_pure')
    .select('*')
    .gte('total_games', 10);

  // Sort by the specified metric
  if (sortBy === 'total_stars') {
    query = query.order('total_stars', { ascending: false });
  } else {
    query = query.order('average_score', { ascending: true });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching Pure global leaderboard:', error);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Fetch user tiers for all users in the leaderboard
  const userIds = data.map((entry: any) => entry.user_id);
  const { data: users } = await supabase
    .from('users')
    .select('id, user_tier')
    .in('id', userIds);

  // Create a map of user_id to user_tier
  const tierMap = new Map(users?.map((u: any) => [u.id, u.user_tier]) || []);

  // Merge user_tier into leaderboard entries
  return data.map((entry: any) => ({
    ...entry,
    user_tier: tierMap.get(entry.user_id) || 'free',
  }));
}

/**
 * Get Boosted global leaderboard (best average scores from Boosted games)
 * Extended with user_tier from users table
 */
export async function getGlobalLeaderboardBoosted(
  supabase: any,
  limit: number = 100,
  offset: number = 0,
  sortBy: 'average_score' | 'total_stars' = 'average_score'
): Promise<Array<GlobalLeaderboardBoostedRow & { user_tier?: 'free' | 'premium' | 'admin' }>> {
  let query = supabase
    .from('global_leaderboards_boosted')
    .select('*')
    .gte('total_games', 10);

  // Sort by the specified metric
  if (sortBy === 'total_stars') {
    query = query.order('total_stars', { ascending: false });
  } else {
    query = query.order('average_score', { ascending: true });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching Boosted global leaderboard:', error);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Fetch user tiers for all users in the leaderboard
  const userIds = data.map((entry: any) => entry.user_id);
  const { data: users } = await supabase
    .from('users')
    .select('id, user_tier')
    .in('id', userIds);

  // Create a map of user_id to user_tier
  const tierMap = new Map(users?.map((u: any) => [u.id, u.user_tier]) || []);

  // Merge user_tier into leaderboard entries
  return data.map((entry: any) => ({
    ...entry,
    user_tier: tierMap.get(entry.user_id) || 'free',
  }));
}
