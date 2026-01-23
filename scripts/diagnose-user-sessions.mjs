#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Diagnosing Recent User Sessions ===\n');

// Get all recent users (last 24 hours)
const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

console.log('1. Recent users (last 24 hours):');
const { data: users, error: usersError } = await supabase
  .from('users')
  .select('*')
  .gte('created_at', oneDayAgo)
  .order('created_at', { ascending: false });

if (usersError) {
  console.error('   ❌ Error:', usersError);
} else {
  console.log(`   Found ${users.length} recent users:\n`);
  users.forEach((user, idx) => {
    console.log(`   ${idx + 1}. ID: ${user.id.substring(0, 12)}...`);
    console.log(`      Email: ${user.email || '(none)'}`);
    console.log(`      Display Name: ${user.display_name || '(none)'}`);
    console.log(`      Is Anonymous: ${user.is_anonymous}`);
    console.log(`      Created: ${user.created_at}`);
    console.log('');
  });
}

// Check for gjavier specifically
console.log('\n2. All gjavier@gmail.com users:');
const { data: gjavierUsers, error: gjavierError } = await supabase
  .from('users')
  .select('*')
  .eq('email', 'gjavier@gmail.com');

if (gjavierError) {
  console.error('   ❌ Error:', gjavierError);
} else {
  console.log(`   Found ${gjavierUsers.length} user(s):\n`);
  gjavierUsers.forEach((user, idx) => {
    console.log(`   ${idx + 1}. ID: ${user.id}`);
    console.log(`      Email: ${user.email}`);
    console.log(`      Display Name: ${user.display_name}`);
    console.log(`      Is Anonymous: ${user.is_anonymous}`);
    console.log(`      Created: ${user.created_at}`);
    console.log('');
  });
}

// Check auth.users for gjavier
console.log('\n3. Auth users for gjavier@gmail.com:');
const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

if (authError) {
  console.error('   ❌ Error:', authError);
} else {
  const gjavierAuthUsers = authUsers.filter(u => u.email === 'gjavier@gmail.com');
  console.log(`   Found ${gjavierAuthUsers.length} auth user(s):\n`);
  gjavierAuthUsers.forEach((user, idx) => {
    console.log(`   ${idx + 1}. ID: ${user.id}`);
    console.log(`      Email: ${user.email}`);
    console.log(`      Last Sign In: ${user.last_sign_in_at || 'Never'}`);
    console.log('');
  });
}

console.log('=== Diagnosis Complete ===\n');
