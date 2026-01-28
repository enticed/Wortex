/**
 * Migration script to add stars column to scores table
 * This enables tracking of final star rating (1-5) for each game
 */

import { createClient } from '@supabase/supabase-js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
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

async function addStarsColumn() {
  console.log('🚀 Adding stars column to scores table...\n');

  try {
    // Read the SQL migration file
    const migrationPath = join(__dirname, '..', 'lib', 'supabase', 'migrations', 'add_stars_column.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    console.log('📄 Executing migration SQL...\n');

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
      // If rpc doesn't exist, try direct execution
      const { error } = await supabase.from('_supabase_migrations').select('*').limit(1);
      if (error) {
        // Try alternative: execute via admin API
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          },
          body: JSON.stringify({ sql_query: sql })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return { error: null };
      }
      return { error };
    });

    if (error) {
      console.error('❌ Error executing migration:', error);
      console.log('\n📋 Please run this SQL manually in your Supabase SQL editor:');
      console.log('\n' + sql);
      process.exit(1);
    }

    console.log('✅ Stars column added successfully!');
    console.log('✅ Indexes created successfully!');
    console.log('\n✨ Migration complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Please run this migration manually in your Supabase SQL editor:');

    const migrationPath = join(__dirname, '..', 'lib', 'supabase', 'migrations', 'add_stars_column.sql');
    const sql = readFileSync(migrationPath, 'utf8');
    console.log('\n' + sql);

    process.exit(1);
  }
}

addStarsColumn();
