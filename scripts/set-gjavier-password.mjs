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

const userId = '8c5d350f-9aa0-423a-be2a-66ffd1332f9e'; // New auth ID for gjavier
const email = 'gjavier@gmail.com';

// Get password from command line argument
const password = process.argv[2];

if (!password) {
  console.error('\n❌ Usage: node set-gjavier-password.mjs <password>');
  console.error('   Example: node set-gjavier-password.mjs "MyNewPassword123"');
  process.exit(1);
}

if (password.length < 6) {
  console.error('\n❌ Password must be at least 6 characters long');
  process.exit(1);
}

console.log('\n=== Update Password for gjavier@gmail.com ===\n');
console.log('Updating password...');

const { data, error } = await supabase.auth.admin.updateUserById(
  userId,
  { password: password }
);

if (error) {
  console.error('❌ Error updating password:', error);
  process.exit(1);
}

console.log('✓ Password updated successfully!');
console.log(`\nLogin credentials:`);
console.log(`  Email: ${email}`);
console.log(`  Password: ${password}`);
console.log('\n=== Update Complete ===\n');
