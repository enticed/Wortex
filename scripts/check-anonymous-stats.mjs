#!/usr/bin/env node
/**
 * Check stats for anonymous users who appear in leaderboard but show 0 games
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAnonymousUsers() {
  console.log('Checking stats for anonymous users Anon-15c25adb and Anon-d9639d1f...\n');

  // Find users by display_name pattern
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, display_name, username, created_at')
    .or('display_name.like.Anon-15c25adb%,display_name.like.Anon-d9639d1f%');

  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }

  if (!users || users.length === 0) {
    console.log('No matching users found');
    return;
  }

  console.log(`Found ${users.length} matching users:\n`);

  for (const user of users) {
    console.log(`User: ${user.display_name} (${user.id.substring(0, 12)}...)`);
    console.log(`  Created: ${user.created_at}`);

    // Check stats
    const { data: stats, error: statsError } = await supabase
      .from('stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (statsError) {
      if (statsError.code === 'PGRST116') {
        console.log('  ❌ NO STATS ENTRY FOUND');
      } else {
        console.log('  Error:', statsError.message);
      }
    } else if (stats) {
      console.log(`  ✓ Stats found:`);
      console.log(`    - Total games: ${stats.total_games}`);
      console.log(`    - Games today: ${stats.games_today}`);
      console.log(`    - Current streak: ${stats.current_streak}`);
      console.log(`    - Best streak: ${stats.best_streak}`);
    }

    // Check scores
    const { data: scores, error: scoresError } = await supabase
      .from('scores')
      .select('id, puzzle_id, score, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (scoresError) {
      console.log('  Error fetching scores:', scoresError.message);
    } else if (scores && scores.length > 0) {
      console.log(`  ✓ Found ${scores.length} score(s):`);
      scores.forEach((score, i) => {
        console.log(`    ${i + 1}. Score: ${score.score}, Puzzle: ${score.puzzle_id.substring(0, 12)}, Date: ${score.created_at}`);
      });
    } else {
      console.log('  ❌ NO SCORES FOUND');
    }

    console.log('');
  }
}

checkAnonymousUsers().catch(console.error);
