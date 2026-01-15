/**
 * Migration: Add admin features to database
 * - Add is_admin column to users table
 * - Add admin_notes column to users table
 * - Add status, metadata, created_by, approved_by columns to puzzles table
 * - Create puzzle_metadata table
 * - Create admin_activity_log table
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration() {
  console.log('🚀 Starting admin features migration...\n');

  // 1. Add columns to users table
  console.log('1️⃣  Adding admin columns to users table...');
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS admin_notes TEXT;
      `
    });

    if (error) {
      // If RPC doesn't exist, we'll need to use Supabase dashboard or direct SQL
      console.log('   ⚠️  Could not add columns via RPC. Please run this SQL manually in Supabase dashboard:');
      console.log(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS admin_notes TEXT;
      `);
    } else {
      console.log('   ✅ Admin columns added to users table');
    }
  } catch (e) {
    console.log('   ⚠️  Please add these columns manually in Supabase dashboard');
  }

  // 2. Add columns to puzzles table
  console.log('\n2️⃣  Adding status and metadata columns to puzzles table...');
  console.log('   ⚠️  Please run this SQL manually in Supabase dashboard:');
  console.log(`
    ALTER TABLE puzzles
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
    ADD COLUMN IF NOT EXISTS metadata JSONB,
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP;
  `);

  // 3. Create puzzle_metadata table
  console.log('\n3️⃣  Creating puzzle_metadata table...');
  console.log('   ⚠️  Please run this SQL manually in Supabase dashboard:');
  console.log(`
    CREATE TABLE IF NOT EXISTS puzzle_metadata (
      puzzle_date DATE PRIMARY KEY REFERENCES puzzles(date),
      source TEXT,
      theme TEXT,
      tags TEXT[],
      created_by UUID REFERENCES auth.users(id),
      approved_by UUID REFERENCES auth.users(id),
      approval_date TIMESTAMP,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // 4. Create admin_activity_log table
  console.log('\n4️⃣  Creating admin_activity_log table...');
  console.log('   ⚠️  Please run this SQL manually in Supabase dashboard:');
  console.log(`
    CREATE TABLE IF NOT EXISTS admin_activity_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_user_id UUID REFERENCES auth.users(id),
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_admin_log_user ON admin_activity_log(admin_user_id);
    CREATE INDEX IF NOT EXISTS idx_admin_log_date ON admin_activity_log(created_at);
  `);

  // 5. Update RLS policies
  console.log('\n5️⃣  Setting up Row Level Security policies...');
  console.log('   ⚠️  Please run this SQL manually in Supabase dashboard:');
  console.log(`
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS admin_only_write ON puzzles;
    DROP POLICY IF EXISTS public_read_published ON puzzles;

    -- Only admins can insert/update/delete puzzles
    CREATE POLICY admin_only_write ON puzzles
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.is_admin = TRUE
        )
      );

    -- Everyone can read published puzzles
    CREATE POLICY public_read_published ON puzzles
      FOR SELECT
      USING (status = 'published' OR status IS NULL);

    -- Admin activity log: only admins can read/write
    CREATE POLICY admin_log_admin_only ON admin_activity_log
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.is_admin = TRUE
        )
      );

    -- Puzzle metadata: admins can read/write
    CREATE POLICY metadata_admin_only ON puzzle_metadata
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.is_admin = TRUE
        )
      );
  `);

  console.log('\n✅ Migration instructions provided!');
  console.log('\n📝 Next steps:');
  console.log('   1. Copy the SQL commands above');
  console.log('   2. Go to Supabase Dashboard → SQL Editor');
  console.log('   3. Paste and run each SQL block');
  console.log('   4. Run the set-admin script to make your account admin');
}

runMigration().catch(console.error);
