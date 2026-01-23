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

const userId = '8c5d350f-9aa0-423a-be2a-66ffd1332f9e';

console.log('\n=== Checking Auth Details for gjavier@gmail.com ===\n');

// Get user from auth
const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);

if (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

console.log('Auth User Details:');
console.log(`  ID: ${user.id}`);
console.log(`  Email: ${user.email}`);
console.log(`  Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
console.log(`  Created: ${user.created_at}`);
console.log(`  Updated: ${user.updated_at}`);
console.log(`  Last Sign In: ${user.last_sign_in_at || 'Never'}`);

// Check if user has a password set
console.log('\nPassword Status:');
if (user.encrypted_password) {
  console.log('  ✓ Password is set');
} else {
  console.log('  ❌ No password set');
}

console.log('\n=== Check Complete ===\n');
