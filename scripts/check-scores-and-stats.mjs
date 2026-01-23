#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const userId = 'dd32505d-acfc-4200-a1e2-321858816349';

console.log('\n=== Checking Scores and Stats for Admin User ===\n');

// Check scores
console.log('1. Checking scores:');
const { data: scores, error: scoresError } = await supabase
  .from('scores')
  .select('*')
  .eq('user_id', userId);

if (scoresError) {
  console.error('   ❌ Error:', scoresError);
} else {
  console.log(`   ✓ Found ${scores?.length || 0} scores`);
  if (scores && scores.length > 0) {
    scores.forEach((score, idx) => {
      console.log(`     ${idx + 1}. Score: ${score.score}, Bonus: ${score.bonus_correct}, Created: ${score.created_at}`);
    });
  }
}

// Check stats
console.log('\n2. Checking stats:');
const { data: stats, error: statsError } = await supabase
  .from('stats')
  .select('*')
  .eq('user_id', userId);

if (statsError) {
  console.error('   ❌ Error:', statsError);
} else {
  if (!stats || stats.length === 0) {
    console.log('   ❌ No stats found');
  } else {
    console.log('   ✓ Found stats:');
    console.log('     Total Games:', stats[0].total_games);
    console.log('     Average Score:', stats[0].average_score);
    console.log('     Current Streak:', stats[0].current_streak);
    console.log('     Best Streak:', stats[0].best_streak);
    console.log('     Last Played:', stats[0].last_played_date);
  }
}

console.log('\n=== Check Complete ===\n');
