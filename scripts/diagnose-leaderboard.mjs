import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log('=== Leaderboard Diagnostic ===\n');

// Test 1: Check if views exist
console.log('1. Testing view access with service role...');
const { data: pureData, error: pureError } = await supabase
  .from('leaderboards_pure')
  .select('*')
  .limit(5);

const { data: boostedData, error: boostedError } = await supabase
  .from('leaderboards_boosted')
  .select('*')
  .limit(5);

console.log('Pure leaderboard:', pureData?.length || 0, 'rows');
if (pureError) console.log('  Error:', pureError.message);

console.log('Boosted leaderboard:', boostedData?.length || 0, 'rows');
if (boostedError) console.log('  Error:', boostedError.message);

// Test 2: Check scores table
console.log('\n2. Checking scores table...');
const { data: scores, error: scoresError } = await supabase
  .from('scores')
  .select('*')
  .limit(5);

console.log('Scores:', scores?.length || 0, 'rows');
if (scoresError) console.log('  Error:', scoresError.message);

// Test 3: Check anon access to views
console.log('\n3. Testing anonymous access to views...');
const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const { data: anonPure, error: anonPureError } = await anonClient
  .from('leaderboards_pure')
  .select('*')
  .limit(5);

const { data: anonBoosted, error: anonBoostedError } = await anonClient
  .from('leaderboards_boosted')
  .select('*')
  .limit(5);

console.log('Pure (anon):', anonPure?.length || 0, 'rows');
if (anonPureError) console.log('  Error:', anonPureError.message);

console.log('Boosted (anon):', anonBoosted?.length || 0, 'rows');
if (anonBoostedError) console.log('  Error:', anonBoostedError.message);

console.log('\n=== Diagnostic Complete ===');
