import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStreakData() {
  console.log('\n=== Checking Streak Data for ZiP11S ===\n');

  // Get user ID for ZiP11S
  const { data: user } = await supabase
    .from('users')
    .select('id, display_name')
    .eq('display_name', 'ZiP11S')
    .single();

  if (!user) {
    console.log('User ZiP11S not found');
    return;
  }

  console.log('User:', user);

  // Get stats
  const { data: stats } = await supabase
    .from('stats')
    .select('*')
    .eq('user_id', user.id)
    .single();

  console.log('\nStats record:');
  console.log(JSON.stringify(stats, null, 2));

  // Get all scores for this user
  const { data: scores } = await supabase
    .from('scores')
    .select('*, puzzles(date)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  console.log('\nRecent scores:');
  scores?.forEach((score, idx) => {
    console.log(`${idx + 1}. Puzzle date: ${score.puzzles?.date}, Score: ${score.score}, Created: ${score.created_at}`);
  });

  // Get today's puzzle
  const today = new Date().toISOString().split('T')[0];
  const { data: todayPuzzle } = await supabase
    .from('puzzles')
    .select('id, date')
    .eq('date', today)
    .single();

  console.log('\nToday\'s puzzle:', todayPuzzle);

  // Check if user played today
  if (todayPuzzle) {
    const { data: todayScore } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', user.id)
      .eq('puzzle_id', todayPuzzle.id)
      .single();

    console.log('\nUser\'s score for today:', todayScore ? 'Yes' : 'No');
    if (todayScore) {
      console.log(JSON.stringify(todayScore, null, 2));
    }
  }

  // Test the update_user_streak function manually
  if (todayPuzzle) {
    console.log('\n=== Testing update_user_streak function ===');
    const { data, error } = await supabase.rpc('update_user_streak', {
      p_user_id: user.id,
      p_puzzle_date: todayPuzzle.date,
    });

    if (error) {
      console.log('Error calling update_user_streak:', error);
    } else {
      console.log('Function executed successfully');

      // Check stats again
      const { data: updatedStats } = await supabase
        .from('stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('\nUpdated stats:');
      console.log(JSON.stringify(updatedStats, null, 2));
    }
  }
}

checkStreakData().catch(console.error);
