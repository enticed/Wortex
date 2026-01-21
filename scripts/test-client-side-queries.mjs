import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Use ANON key like the frontend does
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('Testing with ANON key (client-side simulation)...\n');

// Test getTodaysPuzzle with different timezones
const testTimezone = (tz) => {
  const today = new Date().toLocaleDateString('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return today;
};

console.log('Timezone tests:');
console.log('- UTC:', testTimezone('UTC'));
console.log('- America/Los_Angeles:', testTimezone('America/Los_Angeles'));
console.log('- America/New_York:', testTimezone('America/New_York'));

const puzzleDate = testTimezone('America/Los_Angeles');

// Get today's puzzle
const { data: puzzle, error: puzzleError } = await supabase
  .from('puzzles')
  .select('*')
  .eq('date', puzzleDate)
  .eq('approved', true)
  .single();

console.log('\nToday\'s puzzle (LA timezone):', puzzle?.id?.substring(0, 12) || 'NOT FOUND');
if (puzzleError) console.log('Error:', puzzleError.message);

if (puzzle) {
  // Test leaderboard query
  const { data: leaderboard, error: lbError } = await supabase
    .from('leaderboards_pure')
    .select('*')
    .eq('puzzle_id', puzzle.id)
    .limit(10);

  console.log('Pure leaderboard entries:', leaderboard?.length || 0);
  if (lbError) console.log('Error:', lbError.message);

  // Test My Stats query (for a specific user)
  const { data: recentScores } = await supabase
    .from('scores')
    .select('user_id')
    .limit(1);

  if (recentScores && recentScores.length > 0) {
    const testUserId = recentScores[0].user_id;

    const { data: userScores, error: userScoresError } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', testUserId);

    console.log('\nUser\'s scores:', userScores?.length || 0);
    if (userScoresError) console.log('Error:', userScoresError.message);

    // Test Archive query
    const { data: archive, error: archiveError } = await supabase
      .from('puzzles')
      .select(`
        *,
        scores!left(score, bonus_correct, first_play_of_day, speed)
      `)
      .eq('approved', true)
      .eq('scores.user_id', testUserId)
      .order('date', { ascending: false })
      .limit(10);

    console.log('Archive entries:', archive?.length || 0);
    if (archiveError) console.log('Error:', archiveError.message);
  }
}
