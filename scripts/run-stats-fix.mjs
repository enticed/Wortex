#!/usr/bin/env node
/**
 * Run the stats trigger fix and backfill missing stats
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runFix() {
  console.log('Running stats trigger fix...\n');

  // Read the SQL file
  const sql = fs.readFileSync('scripts/fix-stats-trigger.sql', 'utf8');

  // Execute the SQL
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('Error executing SQL:', error);

    // If exec_sql doesn't exist, try running parts manually
    console.log('\nTrying manual execution...');

    // Get all users who have scores
    const { data: scoresData, error: scoresError } = await supabase
      .from('scores')
      .select('user_id');

    if (scoresError) {
      console.error('Error fetching scores:', scoresError);
      return;
    }

    // Get all users who have stats
    const { data: statsData, error: statsError } = await supabase
      .from('stats')
      .select('user_id');

    if (statsError) {
      console.error('Error fetching stats:', statsError);
      return;
    }

    // Find users with scores but no stats
    const usersWithScores = new Set(scoresData?.map(s => s.user_id) || []);
    const usersWithStats = new Set(statsData?.map(s => s.user_id) || []);
    const userIds = [...usersWithScores].filter(id => !usersWithStats.has(id));
    console.log(`Found ${userIds.length} users with scores but no stats`);

    // For each user, calculate their stats
    for (const userId of userIds) {
      const { data: userScores, error: scoresError } = await supabase
        .from('scores')
        .select('score, created_at')
        .eq('user_id', userId);

      if (scoresError) {
        console.error(`Error fetching scores for user ${userId}:`, scoresError);
        continue;
      }

      const totalGames = userScores.length;
      const averageScore = userScores.reduce((sum, s) => sum + s.score, 0) / totalGames;
      const lastPlayedDate = new Date(Math.max(...userScores.map(s => new Date(s.created_at).getTime())));

      // Insert stats
      const { error: insertError } = await supabase
        .from('stats')
        .insert({
          user_id: userId,
          total_games: totalGames,
          average_score: averageScore,
          last_played_date: lastPlayedDate.toISOString().split('T')[0],
        });

      if (insertError) {
        console.error(`Error creating stats for user ${userId}:`, insertError);
      } else {
        console.log(`✓ Created stats for user ${userId.substring(0, 12)}... (${totalGames} games)`);
      }
    }

    console.log('\nDone!');
  } else {
    console.log('SQL executed successfully');
    console.log(data);
  }
}

runFix().catch(console.error);
