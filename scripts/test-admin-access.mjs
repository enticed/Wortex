/**
 * Test admin access flow
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
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const supabaseAnon = createClient(SUPABASE_URL, ANON_KEY);

async function testAdminAccess() {
  const userId = 'a31913cc-e34c-4884-9035-14ff2edbf656';

  console.log('🔍 Testing admin access flow...\n');

  // Test 1: Can service role read the user?
  console.log('Test 1: Service role access');
  const { data: userAdmin, error: errorAdmin } = await supabaseAdmin
    .from('users')
    .select('id, email, display_name, is_admin')
    .eq('id', userId)
    .single();

  if (errorAdmin) {
    console.log('❌ Service role cannot read user:', errorAdmin.message);
  } else {
    console.log('✅ Service role can read user');
    console.log(`   is_admin: ${userAdmin.is_admin}`);
  }

  // Test 2: Can anon key read the user?
  console.log('\nTest 2: Anonymous key access (RLS policies)');
  const { data: userAnon, error: errorAnon } = await supabaseAnon
    .from('users')
    .select('id, email, display_name, is_admin')
    .eq('id', userId)
    .single();

  if (errorAnon) {
    console.log('❌ Anonymous key cannot read user:', errorAnon.message);
    console.log('   This might be expected due to RLS policies');
  } else {
    console.log('✅ Anonymous key can read user');
    console.log(`   is_admin: ${userAnon.is_admin}`);
  }

  // Test 3: Check if is_admin column exists
  console.log('\nTest 3: Database schema check');
  const { error: schemaError } = await supabaseAdmin
    .from('users')
    .select('is_admin')
    .limit(1);

  if (schemaError) {
    console.log('❌ is_admin column might not exist!');
    console.log('   Error:', schemaError.message);
    console.log('\n   You need to run this SQL in Supabase Dashboard:');
    console.log('   ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;');
  } else {
    console.log('✅ is_admin column exists in database');
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY');
  console.log('='.repeat(50));

  if (userAdmin?.is_admin) {
    console.log('✅ User is admin in database');
    console.log('\nTo access admin panel:');
    console.log('1. Make sure you\'re logged in as this user');
    console.log('2. Visit http://localhost:3001/admin');
    console.log('\nIf still redirected, check browser console for errors');
  } else {
    console.log('❌ User is NOT admin in database');
    console.log('\nRun this in Supabase SQL Editor:');
    console.log(`UPDATE users SET is_admin = TRUE WHERE id = '${userId}';`);
  }
}

testAdminAccess().catch(console.error);
