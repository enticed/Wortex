/**
 * Script to fix user ID mismatch between auth.users and users table
 * Run this AFTER create-auth-for-existing-user.mjs if IDs don't match
 */

import { createClient } from '@supabase/supabase-js';

const OLD_USER_ID = 'a31913cc-e34c-4884-9035-14ff2edbf656'; // Current ID in users table
const NEW_USER_ID = 'dd32505d-acfc-4200-a1e2-321858816349'; // Get this from create-auth-for-existing-user.mjs output

const supabaseUrl = 'https://fkzqvhvqyfuxnwdhpytg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrenF2aHZxeWZ1eG53ZGhweXRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk4NDUyOSwiZXhwIjoyMDgzNTYwNTI5fQ.1d9bO8bEXEGdqZHUuDIenCbhxb86inOe4xG_irUomdE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('Fixing user ID mismatch...\n');
console.log('Old ID (database):', OLD_USER_ID);
console.log('New ID (auth):    ', NEW_USER_ID);
console.log('');

if (NEW_USER_ID === 'paste_new_auth_user_id_here') {
  console.error('✗ Please update NEW_USER_ID in this script first!');
  console.error('   Get the new auth user ID from the create-auth-for-existing-user.mjs output');
  process.exit(1);
}

try {
  // Update related tables FIRST (before users table, to avoid foreign key constraint)
  console.log('Updating scores table...');
  const { error: scoresError } = await supabase
    .from('scores')
    .update({ user_id: NEW_USER_ID })
    .eq('user_id', OLD_USER_ID);

  if (scoresError) {
    console.error('✗ Error updating scores table:', scoresError);
    process.exit(1);
  }
  console.log('✓ Scores table updated');

  // Now update users table (after foreign key references are fixed)
  console.log('Updating users table...');
  const { error: usersError } = await supabase
    .from('users')
    .update({ id: NEW_USER_ID })
    .eq('id', OLD_USER_ID);

  if (usersError) {
    console.error('✗ Error updating users table:', usersError);
    process.exit(1);
  }
  console.log('✓ Users table updated');

  console.log('');
  console.log('✓ All done! User ID mismatch fixed.');
  console.log('  You can now sign in with the new credentials.');

} catch (err) {
  console.error('✗ Unexpected error:', err);
  process.exit(1);
}
