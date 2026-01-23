#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { createInterface } from 'readline';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const userId = '8c5d350f-9aa0-423a-be2a-66ffd1332f9e'; // New auth ID for gjavier
const email = 'gjavier@gmail.com';

// Create readline interface to get password from user
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n=== Update Password for gjavier@gmail.com ===\n');

rl.question('Enter the new password: ', async (password) => {
  if (!password || password.length < 6) {
    console.error('\n❌ Password must be at least 6 characters long');
    rl.close();
    process.exit(1);
  }

  console.log('\nUpdating password...');

  const { data, error } = await supabase.auth.admin.updateUserById(
    userId,
    { password: password }
  );

  if (error) {
    console.error('❌ Error updating password:', error);
    rl.close();
    process.exit(1);
  }

  console.log('✓ Password updated successfully!');
  console.log(`\nLogin credentials:`);
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${password}`);
  console.log('\n=== Update Complete ===\n');

  rl.close();
});
