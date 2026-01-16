/**
 * Migration script to add speed column to scores table
 * This enables tracking of vortex speed multiplier for each game
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

async function addSpeedColumn() {
  console.log('🚀 Adding speed column to scores table...\n');

  // SQL to add speed column with default value of 1.0
  const sql = `
    -- Add speed column to scores table
    ALTER TABLE scores
    ADD COLUMN IF NOT EXISTS speed NUMERIC(3, 2) DEFAULT 1.0 NOT NULL;

    -- Add comment for documentation
    COMMENT ON COLUMN scores.speed IS 'Vortex speed multiplier used during gameplay (0.25 to 2.0)';
  `;

  try {
    // Execute the SQL via RPC call or direct SQL execution
    // Since Supabase doesn't have a direct SQL execution method in the client,
    // we'll need to use the SQL Editor in the dashboard
    console.log('📝 SQL Migration Script:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(sql);
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('⚠️  To apply this migration:');
    console.log('   1. Open your Supabase project dashboard');
    console.log('   2. Navigate to: SQL Editor');
    console.log('   3. Create a new query');
    console.log('   4. Copy and paste the SQL script above');
    console.log('   5. Click "Run" to execute\n');

    // Verify current schema
    console.log('🔍 Checking current scores table schema...');
    const { data: scores, error } = await supabase
      .from('scores')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error checking scores table:', error.message);
      return;
    }

    console.log('✅ Scores table is accessible');

    // Check if any scores exist
    const { count } = await supabase
      .from('scores')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Current scores count: ${count || 0}`);

    if (count && count > 0) {
      console.log('\n⚠️  Note: Existing scores will have speed = 1.0 (default) after migration');
    }

    console.log('\n✨ Migration script generated successfully!');
    console.log('   After running the SQL in Supabase dashboard,');
    console.log('   the speed column will be added with default value 1.0');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addSpeedColumn().catch(console.error);
