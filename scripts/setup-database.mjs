/**
 * Database setup script
 * Run this to initialize the Supabase database with the schema
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
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

async function checkConnection() {
  console.log('🔍 Checking Supabase connection...');

  const { data, error } = await supabase
    .from('puzzles')
    .select('count')
    .limit(1);

  if (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }

  console.log('✅ Connected to Supabase successfully');
  return true;
}

async function checkTables() {
  console.log('\n📊 Checking database tables...');

  const tables = ['users', 'puzzles', 'scores', 'stats'];
  const results = {};

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (error) {
      results[table] = '❌ Not found or error: ' + error.message;
    } else {
      results[table] = '✅ Exists';
    }
  }

  console.table(results);
}

async function checkSampleData() {
  console.log('\n🎯 Checking for sample puzzle...');

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('puzzles')
    .select('*')
    .eq('date', today)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('❌ Error checking sample data:', error.message);
    return;
  }

  if (data) {
    console.log('✅ Sample puzzle exists for today');
    console.log('   Target:', data.target_phrase);
    console.log('   Facsimile:', data.facsimile_phrase);
  } else {
    console.log('⚠️  No puzzle found for today');
    console.log('   You may need to run the SQL schema in Supabase SQL Editor');
  }
}

async function main() {
  console.log('🚀 Wortex Database Setup\n');

  const connected = await checkConnection();

  if (!connected) {
    console.log('\n⚠️  Cannot proceed without database connection');
    console.log('\n📝 To set up the database:');
    console.log('   1. Go to your Supabase project dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Copy and paste the contents of lib/supabase/schema.sql');
    console.log('   4. Run the SQL script');
    console.log('   5. Run this script again to verify');
    process.exit(1);
  }

  await checkTables();
  await checkSampleData();

  console.log('\n✨ Setup check complete!');
  console.log('\n📝 If tables are missing:');
  console.log('   1. Open Supabase Dashboard → SQL Editor');
  console.log('   2. Run the script from: lib/supabase/schema.sql');
  console.log('   3. Run this setup script again to verify');
}

main().catch(console.error);
