#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anonSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const userId = 'dd32505d-acfc-4200-a1e2-321858816349';

console.log('\n=== Testing Stats Queries ===\n');

// Test 1: Admin query (should always work)
console.log('1. Querying with service role key (admin):');
const { data: adminData, error: adminError } = await adminSupabase
  .from('stats')
  .select('*')
  .eq('user_id', userId);

if (adminError) {
  console.error('   ❌ Error:', adminError);
} else {
  console.log('   ✓ Success! Found', adminData?.length || 0, 'records');
  if (adminData && adminData.length > 0) {
    console.log('   Stats:', JSON.stringify(adminData[0], null, 2));
  }
}

// Test 2: Anonymous query (will fail if RLS not configured)
console.log('\n2. Querying with anon key (public):');
const { data: anonData, error: anonError } = await anonSupabase
  .from('stats')
  .select('*')
  .eq('user_id', userId);

if (anonError) {
  console.error('   ❌ Error:', anonError);
  console.error('   This indicates an RLS policy issue');
} else {
  console.log('   ✓ Success! Found', anonData?.length || 0, 'records');
}

// Test 3: Check if any stats exist at all
console.log('\n3. Checking all stats in database:');
const { data: allStats, error: allStatsError } = await adminSupabase
  .from('stats')
  .select('user_id, total_games, total_score')
  .limit(10);

if (allStatsError) {
  console.error('   ❌ Error:', allStatsError);
} else {
  console.log('   ✓ Found', allStats?.length || 0, 'total stats records');
  if (allStats && allStats.length > 0) {
    console.log('   Sample:', allStats);
  }
}

console.log('\n=== Test Complete ===\n');
