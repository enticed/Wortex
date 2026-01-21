import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get a user who played recently
const { data: recentScores } = await supabase
  .from('scores')
  .select('user_id, puzzle_id, created_at')
  .order('created_at', { ascending: false })
  .limit(5);

console.log('Recent scores:', recentScores?.length || 0);

if (recentScores && recentScores.length > 0) {
  const testUser = recentScores[0];
  console.log('\nTesting with user:', testUser.user_id.substring(0, 12), '...');
  console.log('Last played:', new Date(testUser.created_at).toLocaleString());

  // Test 1: Get user record
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', testUser.user_id)
    .single();

  console.log('\n1. User record:', userData ? 'found' : 'NOT FOUND');
  if (userData) {
    console.log('   - display_name:', userData.display_name || '[null]');
    console.log('   - is_anonymous:', userData.is_anonymous);
  }
  if (userError) console.log('   Error:', userError.message);

  // Test 2: Get stats
  const { data: stats, error: statsError } = await supabase
    .from('stats')
    .select('*')
    .eq('user_id', testUser.user_id)
    .maybeSingle();

  console.log('\n2. Stats:', stats ? 'found' : 'NOT FOUND');
  if (stats) {
    console.log('   - total_games:', stats.total_games);
    console.log('   - average_score:', stats.average_score);
  }
  if (statsError) console.log('   Error:', statsError.message);

  // Test 3: Get leaderboard entries for this user
  const { data: leaderboardPure, error: lbPureError } = await supabase
    .from('leaderboards_pure')
    .select('*')
    .eq('user_id', testUser.user_id)
    .limit(5);

  console.log('\n3. Pure leaderboard entries:', leaderboardPure?.length || 0);
  if (lbPureError) console.log('   Error:', lbPureError.message);

  // Test 4: Get all scores for this user
  const { data: allScores, error: scoresError } = await supabase
    .from('scores')
    .select('puzzle_id, score, first_play_of_day, speed')
    .eq('user_id', testUser.user_id);

  console.log('\n4. All scores for this user:', allScores?.length || 0);
  if (allScores && allScores.length > 0) {
    console.log('   Sample:', allScores[0]);
  }
  if (scoresError) console.log('   Error:', scoresError.message);
}
