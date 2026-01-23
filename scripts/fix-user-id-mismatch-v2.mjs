/**
 * Script to fix user ID mismatch between auth.users and users table
 * This version migrates data to the new user and deletes the old one
 */

import { createClient } from '@supabase/supabase-js';

const OLD_USER_ID = 'a31913cc-e34c-4884-9035-14ff2edbf656'; // Current ID in users table
const NEW_USER_ID = 'dd32505d-acfc-4200-a1e2-321858816349'; // New auth user ID

const supabaseUrl = 'https://fkzqvhvqyfuxnwdhpytg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrenF2aHZxeWZ1eG53ZGhweXRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk4NDUyOSwiZXhwIjoyMDgzNTYwNTI5fQ.1d9bO8bEXEGdqZHUuDIenCbhxb86inOe4xG_irUomdE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('Migrating user data from old ID to new ID...\n');
console.log('Old ID:', OLD_USER_ID);
console.log('New ID:', NEW_USER_ID);
console.log('');

try {
  // Step 1: Get old user data
  console.log('Fetching old user data...');
  const { data: oldUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('id', OLD_USER_ID)
    .single();

  if (fetchError) {
    console.error('✗ Error fetching old user:', fetchError);
    process.exit(1);
  }

  console.log('✓ Old user data retrieved');
  console.log('  Display name:', oldUser.display_name);
  console.log('  Email:', oldUser.email);
  console.log('  Is admin:', oldUser.is_admin);

  // Step 2: Update the new user record with old user's data
  console.log('\nUpdating new user record with migrated data...');
  const { error: updateError } = await supabase
    .from('users')
    .update({
      display_name: oldUser.display_name,
      email: oldUser.email,
      is_anonymous: oldUser.is_anonymous,
      is_admin: oldUser.is_admin,
      timezone: oldUser.timezone,
      subscription_status: oldUser.subscription_status,
      subscription_expires_at: oldUser.subscription_expires_at,
      admin_notes: oldUser.admin_notes,
      password_changed_at: oldUser.password_changed_at,
    })
    .eq('id', NEW_USER_ID);

  if (updateError) {
    console.error('✗ Error updating new user:', updateError);
    process.exit(1);
  }
  console.log('✓ New user record updated with old user data');

  // Step 3: Migrate scores
  console.log('\nMigrating scores...');
  const { error: scoresError } = await supabase
    .from('scores')
    .update({ user_id: NEW_USER_ID })
    .eq('user_id', OLD_USER_ID);

  if (scoresError) {
    console.error('✗ Error migrating scores:', scoresError);
    process.exit(1);
  }
  console.log('✓ Scores migrated');

  // Step 4: Delete old user record
  console.log('\nDeleting old user record...');
  const { error: deleteError } = await supabase
    .from('users')
    .delete()
    .eq('id', OLD_USER_ID);

  if (deleteError) {
    console.error('✗ Error deleting old user:', deleteError);
    console.error('  This is OK - the old record can be cleaned up manually later');
  } else {
    console.log('✓ Old user record deleted');
  }

  console.log('');
  console.log('✓✓✓ Migration complete! ✓✓✓');
  console.log('');
  console.log('You can now sign in with:');
  console.log('  Email:', oldUser.email);
  console.log('  Password: [the password you set in create-auth-for-existing-user.mjs]');
  console.log('');
  console.log('Your admin status has been preserved.');

} catch (err) {
  console.error('✗ Unexpected error:', err);
  process.exit(1);
}
