#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Checking Admin User ===\n');

// Check users table
console.log('1. Checking users table for admin@todaysmartsolutions.com:');
const { data: usersData, error: usersError } = await supabase
  .from('users')
  .select('*')
  .eq('email', 'admin@todaysmartsolutions.com');

if (usersError) {
  console.error('Error:', usersError);
} else if (!usersData || usersData.length === 0) {
  console.log('   ❌ No user found in users table');
} else {
  console.log('   ✓ Found in users table:');
  usersData.forEach(user => {
    console.log(`     - ID: ${user.id}`);
    console.log(`     - Email: ${user.email}`);
    console.log(`     - Display Name: ${user.display_name}`);
    console.log(`     - Is Admin: ${user.is_admin}`);
    console.log(`     - Is Anonymous: ${user.is_anonymous}`);
  });
}

// Check auth.users
console.log('\n2. Checking auth.users for admin@todaysmartsolutions.com:');
const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

if (authError) {
  console.error('Error:', authError);
} else {
  const adminAuthUsers = authUsers.filter(u => u.email === 'admin@todaysmartsolutions.com');
  if (adminAuthUsers.length === 0) {
    console.log('   ❌ No user found in auth.users');
  } else {
    console.log('   ✓ Found in auth.users:');
    adminAuthUsers.forEach(user => {
      console.log(`     - ID: ${user.id}`);
      console.log(`     - Email: ${user.email}`);
      console.log(`     - Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log(`     - Created: ${user.created_at}`);
      console.log(`     - Last Sign In: ${user.last_sign_in_at || 'Never'}`);
    });
  }
}

console.log('\n=== Check Complete ===\n');
