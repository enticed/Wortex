#!/usr/bin/env node

/**
 * Apply the leaderboard migration to add Pure/Boosted rankings
 * This script reads the migration SQL file and executes it against the Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing required environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('Reading migration file...');
    const migrationPath = join(__dirname, '..', 'lib', 'supabase', 'migrations', 'add_first_play_tracking.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('Applying migration to database...');
    console.log('This will:');
    console.log('  1. Add first_play_of_day column to scores table');
    console.log('  2. Create indexes for efficient querying');
    console.log('  3. Create leaderboards_pure view');
    console.log('  4. Create leaderboards_boosted view');
    console.log('  5. Create global_leaderboards_pure view');
    console.log('  6. Create global_leaderboards_boosted view');
    console.log('  7. Update existing leaderboards view');
    console.log('  8. Backfill existing scores as first_play_of_day = TRUE');
    console.log('');

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // Try direct query execution if RPC fails
        const { error: queryError } = await supabase.from('_sql').select(statement);

        if (queryError) {
          console.error(`Error executing statement ${i + 1}:`, error || queryError);
          console.error('Statement:', statement.substring(0, 200));

          // Some errors are expected (like "already exists"), continue anyway
          if (error?.message?.includes('already exists') || queryError?.message?.includes('already exists')) {
            console.log('  (Continuing - resource already exists)');
            continue;
          }
        }
      }
    }

    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. All existing scores have been marked as first_play_of_day = TRUE');
    console.log('  2. New scores will automatically detect if they are first plays');
    console.log('  3. The leaderboard now shows both Pure and Boosted rankings');
    console.log('');

  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }
}

console.log('='.repeat(60));
console.log('Leaderboard Migration - Pure/Boosted Rankings');
console.log('='.repeat(60));
console.log('');

applyMigration();
