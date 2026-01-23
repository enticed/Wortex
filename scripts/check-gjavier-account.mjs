#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const email = 'gjavier@gmail.com';

console.log('\n=== Checking gjavier@gmail.com Account ===\n');

// Check users table
console.log('1. Checking users table:');
const { data: usersData, error: usersError } = await supabase
  .from('users')
  .select('*')
  .eq('email', email);

if (usersError) {
  console.error('   ❌ Error:', usersError);
} else if (!usersData || usersData.length === 0) {
  console.log('   ❌ No user found in users table');
} else {
  console.log(`   ✓ Found ${usersData.length} user(s) in users table:`);
  usersData.forEach(user => {
    console.log(`     - ID: ${user.id}`);
    console.log(`     - Email: ${user.email}`);
    console.log(`     - Display Name: ${user.display_name}`);
    console.log(`     - Is Admin: ${user.is_admin}`);
    console.log(`     - Is Anonymous: ${user.is_anonymous}`);
    console.log(`     - Created: ${user.created_at}`);
  });
}

// Check auth.users
console.log('\n2. Checking auth.users:');
const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

if (authError) {
  console.error('   ❌ Error:', authError);
} else {
  const matchingAuthUsers = authUsers.filter(u => u.email === email);
  if (matchingAuthUsers.length === 0) {
    console.log('   ❌ No user found in auth.users');
  } else {
    console.log(`   ✓ Found ${matchingAuthUsers.length} user(s) in auth.users:`);
    matchingAuthUsers.forEach(user => {
      console.log(`     - ID: ${user.id}`);
      console.log(`     - Email: ${user.email}`);
      console.log(`     - Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log(`     - Created: ${user.created_at}`);
      console.log(`     - Last Sign In: ${user.last_sign_in_at || 'Never'}`);
    });
  }
}

// Check for ID mismatches
if (usersData && usersData.length > 0 && authUsers) {
  const matchingAuthUsers = authUsers.filter(u => u.email === email);
  if (matchingAuthUsers.length > 0) {
    console.log('\n3. Checking for ID mismatches:');
    const dbIds = usersData.map(u => u.id);
    const authIds = matchingAuthUsers.map(u => u.id);

    if (dbIds.some(id => !authIds.includes(id))) {
      console.log('   ⚠️  MISMATCH: Some users table IDs not found in auth.users');
      console.log('   Database IDs:', dbIds);
      console.log('   Auth IDs:', authIds);
    } else if (authIds.some(id => !dbIds.includes(id))) {
      console.log('   ⚠️  MISMATCH: Some auth.users IDs not found in users table');
      console.log('   Database IDs:', dbIds);
      console.log('   Auth IDs:', authIds);
    } else {
      console.log('   ✓ IDs match correctly');
    }
  }
}

// Check scores for this email
console.log('\n4. Checking scores:');
if (usersData && usersData.length > 0) {
  for (const user of usersData) {
    const { data: scores, error: scoresError } = await supabase
      .from('scores')
      .select('id')
      .eq('user_id', user.id);

    if (scoresError) {
      console.error(`   ❌ Error fetching scores for ${user.id}:`, scoresError);
    } else {
      console.log(`   User ${user.id.substring(0, 8)}... has ${scores?.length || 0} scores`);
    }
  }
}

console.log('\n=== Check Complete ===\n');
