#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const email = 'gjavier@gmail.com';
const oldUserId = '6f887553-4784-4b22-8795-601f9acd01a0';
// Generate a temporary password that the user can reset later
const tempPassword = 'TempPass123!ChangeMe';

console.log('\n=== Fixing gjavier@gmail.com Account ===\n');

// Step 1: Create auth account
console.log('1. Creating auth account...');
console.log(`   Email: ${email}`);
console.log(`   Temporary Password: ${tempPassword}`);
console.log('   (User will need to use "Forgot Password" to set their own password)');

const { data: authData, error: authError } = await supabase.auth.admin.createUser({
  email: email,
  password: tempPassword,
  email_confirm: true, // Auto-confirm email
});

if (authError) {
  console.error('   ❌ Error creating auth user:', authError);
  process.exit(1);
}

if (!authData.user) {
  console.error('   ❌ No user returned from auth.admin.createUser');
  process.exit(1);
}

const newUserId = authData.user.id;
console.log('   ✓ Auth account created successfully!');
console.log(`   New Auth ID: ${newUserId}`);
console.log(`   Old Database ID: ${oldUserId}`);

// Step 2: Check if IDs match
if (newUserId === oldUserId) {
  console.log('\n2. ✓ IDs match - no migration needed!');
  console.log('   Account is ready to use.');
} else {
  console.log('\n2. ⚠️  ID mismatch detected - need to migrate data');
  console.log('   Will create migration SQL script...');

  // Create SQL migration script
  const sqlScript = `-- Migration script for gjavier@gmail.com
-- Run this in Supabase SQL Editor

-- Step 1: Create new user with temporary email
INSERT INTO users (
  id,
  email,
  display_name,
  is_anonymous,
  is_admin,
  timezone,
  subscription_status,
  created_at,
  last_login
)
VALUES (
  '${newUserId}',
  'gjavier_temp@gmail.com',
  'Javier',
  false,
  false,
  'UTC',
  'none',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  display_name = 'Javier',
  is_anonymous = false;

-- Step 2: Migrate scores from old ID to new ID
UPDATE scores
SET user_id = '${newUserId}'
WHERE user_id = '${oldUserId}';

-- Step 3: Migrate stats if they exist
UPDATE stats
SET user_id = '${newUserId}'
WHERE user_id = '${oldUserId}';

-- Step 4: Delete old user record
DELETE FROM users WHERE id = '${oldUserId}';

-- Step 5: Update email on new user
UPDATE users
SET email = '${email}'
WHERE id = '${newUserId}';

-- Verify
SELECT
  'Success!' as status,
  id,
  email,
  display_name,
  is_admin,
  (SELECT COUNT(*) FROM scores WHERE user_id = users.id) as score_count
FROM users
WHERE email = '${email}';
`;

  // Save SQL script
  const fs = await import('fs');
  const scriptPath = './scripts/migrate-gjavier-GENERATED.sql';
  fs.writeFileSync(scriptPath, sqlScript);
  console.log(`   ✓ SQL script saved to: ${scriptPath}`);
  console.log('\n   Next steps:');
  console.log('   1. Go to Supabase SQL Editor');
  console.log('   2. Copy and run the SQL from migrate-gjavier-GENERATED.sql');
  console.log('   3. Verify the "Success!" message shows the correct data');
}

console.log('\n3. Login credentials:');
console.log(`   Email: ${email}`);
console.log(`   Temporary Password: ${tempPassword}`);
console.log('\n   IMPORTANT: User should use "Forgot Password" to set their own password!');

console.log('\n=== Fix Complete ===\n');
