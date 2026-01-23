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

const email = 'harpynox@gmail.com';
const newPassword = 'TempPass123!'; // Temporary password - user should change it

console.log('\n=== Fixing harpynox@gmail.com Account ===\n');

// Step 1: Check if user exists in database
console.log('1. Checking database for user...');
const { data: dbUser, error: dbError } = await supabase
  .from('users')
  .select('*')
  .eq('email', email)
  .maybeSingle();

if (dbError) {
  console.error('   ❌ Database error:', dbError);
  process.exit(1);
}

if (!dbUser) {
  console.log('   ❌ User not found in database');
  process.exit(1);
}

console.log('   ✅ User found in database');
console.log(`   User ID: ${dbUser.id}`);
console.log(`   Is Anonymous: ${dbUser.is_anonymous}`);

// Step 2: Check if auth user exists
console.log('\n2. Checking Supabase Auth...');
const { data: { users: authUsers }, error: authListError } = await supabase.auth.admin.listUsers();

if (authListError) {
  console.error('   ❌ Error listing auth users:', authListError);
  process.exit(1);
}

const authUser = authUsers.find(u => u.email === email);

if (!authUser) {
  console.log('   ❌ Auth user not found - creating one...');

  // Create auth user with the same ID
  const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
    email: email,
    password: newPassword,
    email_confirm: true,
    user_metadata: {
      display_name: dbUser.display_name
    }
  });

  if (createError) {
    console.error('   ❌ Error creating auth user:', createError);
    process.exit(1);
  }

  console.log('   ✅ Auth user created');
  console.log(`   Auth ID: ${newAuthUser.user.id}`);

  // Check if IDs match
  if (newAuthUser.user.id !== dbUser.id) {
    console.log('\n   ⚠️  Warning: Auth ID does not match database ID!');
    console.log(`   Database ID: ${dbUser.id}`);
    console.log(`   Auth ID: ${newAuthUser.user.id}`);
    console.log('\n   You will need to run a migration script to fix this.');
  }
} else {
  console.log('   ✅ Auth user found');
  console.log(`   Auth ID: ${authUser.id}`);

  // Update password
  console.log('\n3. Updating password...');
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    authUser.id,
    { password: newPassword }
  );

  if (updateError) {
    console.error('   ❌ Error updating password:', updateError);
    process.exit(1);
  }

  console.log('   ✅ Password updated');
}

// Step 3: Update database to ensure is_anonymous is false
console.log('\n4. Ensuring database record is not anonymous...');
const { error: updateDbError } = await supabase
  .from('users')
  .update({
    is_anonymous: false,
    last_login: new Date().toISOString()
  })
  .eq('id', dbUser.id);

if (updateDbError) {
  console.error('   ❌ Error updating database:', updateDbError);
  process.exit(1);
}

console.log('   ✅ Database updated');

console.log('\n=== Account Fixed Successfully! ===');
console.log(`\nTemporary credentials:`);
console.log(`Email: ${email}`);
console.log(`Password: ${newPassword}`);
console.log('\n⚠️  Please sign in and change the password immediately in Settings!\n');
