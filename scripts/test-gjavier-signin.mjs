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

// Use ANON key (not service role) to simulate client-side sign-in
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const email = 'gjavier@gmail.com';
// Get password from command line
const password = process.argv[2];

if (!password) {
  console.error('\n❌ Usage: node test-gjavier-signin.mjs <password>');
  process.exit(1);
}

console.log('\n=== Testing Sign-In for gjavier@gmail.com ===\n');
console.log('Using anon key (simulating client-side sign-in)...');

// Try to sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (error) {
  console.error('❌ Sign-in failed:', error.message);
  process.exit(1);
}

if (!data.user) {
  console.error('❌ No user returned from sign-in');
  process.exit(1);
}

console.log('✓ Sign-in successful!');
console.log('\nUser details:');
console.log(`  ID: ${data.user.id}`);
console.log(`  Email: ${data.user.email}`);
console.log(`  Email Confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`);

// Check user record in database
console.log('\nChecking user record in database...');
const { data: userData, error: userError } = await supabase
  .from('users')
  .select('*')
  .eq('id', data.user.id)
  .single();

if (userError) {
  console.error('❌ Error fetching user record:', userError);
} else if (!userData) {
  console.error('❌ No user record found in database');
} else {
  console.log('✓ User record found:');
  console.log(`  Display Name: ${userData.display_name}`);
  console.log(`  Is Anonymous: ${userData.is_anonymous}`);
  console.log(`  Is Admin: ${userData.is_admin}`);
}

console.log('\n=== Test Complete ===\n');
