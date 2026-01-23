#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const userId = '8c5d350f-9aa0-423a-be2a-66ffd1332f9e'; // New auth ID for gjavier

console.log('\n=== Regenerating Stats for gjavier@gmail.com ===\n');

// Get all scores for this user
console.log('1. Fetching all scores...');
const { data: scores, error: scoresError } = await supabase
  .from('scores')
  .select('*, puzzles!inner(date)')
  .eq('user_id', userId)
  .order('created_at', { ascending: true });

if (scoresError) {
  console.error('   ❌ Error fetching scores:', scoresError);
  process.exit(1);
}

console.log(`   ✓ Found ${scores.length} scores`);

if (scores.length === 0) {
  console.log('   No scores to process - run the SQL migration first!');
  process.exit(0);
}

// Calculate stats
const totalGames = scores.length;
const totalScore = scores.reduce((sum, score) => sum + parseFloat(score.score), 0);
const averageScore = totalScore / totalGames;

// Get last played date
const lastPlayedDate = scores[scores.length - 1].puzzles.date;

// Calculate streaks (simplified - just count consecutive days)
const playDates = scores.map(s => s.puzzles.date).sort();
let currentStreak = 1;
let bestStreak = 1;
let tempStreak = 1;

for (let i = 1; i < playDates.length; i++) {
  const prevDate = new Date(playDates[i - 1]);
  const currDate = new Date(playDates[i]);
  const dayDiff = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));

  if (dayDiff === 1) {
    tempStreak++;
    bestStreak = Math.max(bestStreak, tempStreak);
  } else if (dayDiff > 1) {
    tempStreak = 1;
  }
  // if dayDiff === 0, same day, don't change streak
}

// Check if the last played date is today or yesterday for current streak
const today = new Date();
today.setHours(0, 0, 0, 0);
const lastPlayed = new Date(lastPlayedDate);
const daysSinceLastPlay = Math.floor((today - lastPlayed) / (1000 * 60 * 60 * 24));

if (daysSinceLastPlay <= 1) {
  currentStreak = tempStreak;
} else {
  currentStreak = 0; // Streak broken
}

console.log('\n2. Calculated stats:');
console.log(`   Total Games: ${totalGames}`);
console.log(`   Average Score: ${averageScore.toFixed(2)}`);
console.log(`   Current Streak: ${currentStreak}`);
console.log(`   Best Streak: ${bestStreak}`);
console.log(`   Last Played: ${lastPlayedDate}`);

// Upsert stats (in case they already exist)
console.log('\n3. Upserting stats into database...');
const { data: insertData, error: insertError } = await supabase
  .from('stats')
  .upsert({
    user_id: userId,
    total_games: totalGames,
    average_score: averageScore,
    current_streak: currentStreak,
    best_streak: bestStreak,
    last_played_date: lastPlayedDate,
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'user_id'
  })
  .select()
  .single();

if (insertError) {
  console.error('   ❌ Error upserting stats:', insertError);
  process.exit(1);
}

console.log('   ✓ Stats created/updated successfully!');

console.log('\n=== Stats Regeneration Complete ===\n');
