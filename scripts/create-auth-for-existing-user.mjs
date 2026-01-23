/**
 * Script to create Supabase Auth account for existing user in database
 * This fixes the situation where a user exists in the users table but not in auth.users
 */

import { createClient } from '@supabase/supabase-js';

const USER_EMAIL = 'admin@todaysmartsolutions.com';
const USER_ID = 'a31913cc-e34c-4884-9035-14ff2edbf656'; // From check-user-account.mjs output
const NEW_PASSWORD = '3q&DyJVyirDQo7k8'; // CHANGE THIS to your desired password

const supabaseUrl = 'https://fkzqvhvqyfuxnwdhpytg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrenF2aHZxeWZ1eG53ZGhweXRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk4NDUyOSwiZXhwIjoyMDgzNTYwNTI5fQ.1d9bO8bEXEGdqZHUuDIenCbhxb86inOe4xG_irUomdE';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('Creating Supabase Auth account for existing user...\n');
console.log('User ID:', USER_ID);
console.log('Email:', USER_EMAIL);
console.log('');

try {
  // Create the auth user using the admin API
  const { data, error } = await supabase.auth.admin.createUser({
    email: USER_EMAIL,
    password: NEW_PASSWORD,
    email_confirm: true, // Auto-confirm the email
    user_metadata: {
      display_name: 'TSSadmin'
    }
  });

  if (error) {
    console.error('✗ Failed to create auth account:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }

  console.log('✓ Auth account created successfully!');
  console.log('');
  console.log('New Auth User Details:');
  console.log('  ID:', data.user.id);
  console.log('  Email:', data.user.email);
  console.log('  Email confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');
  console.log('');

  // Important note about ID mismatch
  if (data.user.id !== USER_ID) {
    console.log('⚠️  WARNING: Auth user ID does not match database user ID!');
    console.log('   Database user ID:', USER_ID);
    console.log('   Auth user ID:    ', data.user.id);
    console.log('');
    console.log('   You need to update the users table with the new auth ID.');
    console.log('   Run the fix-user-id-mismatch.mjs script next.');
  } else {
    console.log('✓ User IDs match - all set!');
  }

  console.log('');
  console.log('You can now sign in with:');
  console.log('  Email:', USER_EMAIL);
  console.log('  Password: [the password you set in this script]');

} catch (err) {
  console.error('✗ Unexpected error:', err);
  process.exit(1);
}
