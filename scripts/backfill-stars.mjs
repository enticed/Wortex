/**
 * Backfill stars for existing scores in the database
 *
 * Note: This script estimates stars based on final score since we don't have
 * separate phase1 and phase2 scores stored. The estimation uses a simplified
 * mapping based on typical score distributions.
 */

import { createClient } from '@supabase/supabase-js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Estimate stars from final score
 * This is an approximation since we don't have phase1/phase2 scores stored
 *
 * Based on typical scoring:
 * - Perfect game (1.0 efficiency + minimal moves) = ~1.25-1.5 final score = 5 stars
 * - Good game = ~2.0-3.0 final score = 4 stars
 * - Average game = ~3.5-5.0 final score = 3 stars
 * - Below average = ~5.5-7.0 final score = 2 stars
 * - Poor = >7.0 final score = 1 star
 */
function estimateStarsFromFinalScore(finalScore) {
  if (finalScore <= 1.8) return 5;
  if (finalScore <= 3.0) return 4;
  if (finalScore <= 5.0) return 3;
  if (finalScore <= 7.5) return 2;
  return 1;
}

async function backfillStars() {
  console.log('🌟 Starting stars backfill process...\n');

  try {
    // Get all scores that don't have stars yet
    console.log('📊 Fetching scores without stars...');
    const { data: scores, error: fetchError } = await supabase
      .from('scores')
      .select('id, score')
      .is('stars', null);

    if (fetchError) {
      console.error('❌ Error fetching scores:', fetchError);
      process.exit(1);
    }

    if (!scores || scores.length === 0) {
      console.log('✅ No scores need backfilling. All scores already have stars!');
      return;
    }

    console.log(`📈 Found ${scores.length} scores to backfill\n`);

    // Update each score with estimated stars
    let successCount = 0;
    let errorCount = 0;

    console.log('⚙️  Processing scores...');
    for (let i = 0; i < scores.length; i++) {
      const score = scores[i];
      const stars = estimateStarsFromFinalScore(score.score);

      const { error: updateError } = await supabase
        .from('scores')
        .update({ stars })
        .eq('id', score.id);

      if (updateError) {
        console.error(`❌ Error updating score ${score.id}:`, updateError);
        errorCount++;
      } else {
        successCount++;
      }

      // Progress indicator every 100 scores
      if ((i + 1) % 100 === 0) {
        console.log(`   Processed ${i + 1}/${scores.length} scores...`);
      }
    }

    console.log('\n✨ Backfill complete!');
    console.log(`✅ Successfully updated: ${successCount} scores`);
    if (errorCount > 0) {
      console.log(`❌ Errors: ${errorCount} scores`);
    }

    // Show star distribution
    console.log('\n📊 Star distribution after backfill:');
    const { data: distribution } = await supabase
      .from('scores')
      .select('stars')
      .not('stars', 'is', null);

    if (distribution) {
      const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      distribution.forEach(s => {
        if (s.stars >= 1 && s.stars <= 5) {
          starCounts[s.stars]++;
        }
      });

      console.log('   5 ⭐:', starCounts[5]);
      console.log('   4 ⭐:', starCounts[4]);
      console.log('   3 ⭐:', starCounts[3]);
      console.log('   2 ⭐:', starCounts[2]);
      console.log('   1 ⭐:', starCounts[1]);
    }

    console.log('\n💡 Note: These stars are estimates based on final scores.');
    console.log('   Future games will have accurate stars calculated from phase scores.\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

backfillStars();
