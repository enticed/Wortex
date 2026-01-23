/**
 * Script to fix user ID mismatch - Complete solution
 * Creates new user record, migrates scores, deletes old record
 */

import { createClient } from '@supabase/supabase-js';

const OLD_USER_ID = 'a31913cc-e34c-4884-9035-14ff2edbf656';
const NEW_USER_ID = 'dd32505d-acfc-4200-a1e2-321858816349';

const supabaseUrl = 'https://fkzqvhvqyfuxnwdhpytg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrenF2aHZxeWZ1eG53ZGhweXRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk4NDUyOSwiZXhwIjoyMDgzNTYwNTI5fQ.1d9bO8bEXEGdqZHUuDIenCbhxb86inOe4xG_irUomdE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('='.repeat(60));
console.log('FIXING USER ID MISMATCH');
console.log('='.repeat(60));
console.log('Old ID:', OLD_USER_ID);
console.log('New ID:', NEW_USER_ID);
console.log('');

try {
  // Step 1: Get old user data
  console.log('[1/5] Fetching old user data...');
  const { data: oldUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('id', OLD_USER_ID)
    .single();

  if (fetchError) {
    console.error('✗ Error:', fetchError.message);
    process.exit(1);
  }

  console.log('      ✓ Retrieved:', oldUser.email, `(admin: ${oldUser.is_admin})`);

  // Step 2: Create new user record with correct ID
  console.log('[2/5] Creating new user record...');
  const { error: insertError } = await supabase
    .from('users')
    .insert({
      id: NEW_USER_ID,
      email: oldUser.email,
      display_name: oldUser.display_name,
      is_anonymous: false,
      is_admin: oldUser.is_admin,
      timezone: oldUser.timezone,
      subscription_status: oldUser.subscription_status,
      subscription_expires_at: oldUser.subscription_expires_at,
      admin_notes: oldUser.admin_notes,
      password_changed_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    });

  if (insertError) {
    if (insertError.code === '23505') {
      console.log('      ℹ User record already exists, updating instead...');
      const { error: updateError } = await supabase
        .from('users')
        .update({
          display_name: oldUser.display_name,
          is_admin: oldUser.is_admin,
          timezone: oldUser.timezone,
          subscription_status: oldUser.subscription_status,
          last_login: new Date().toISOString(),
        })
        .eq('id', NEW_USER_ID);

      if (updateError) {
        console.error('✗ Error updating:', updateError.message);
        process.exit(1);
      }
      console.log('      ✓ Updated existing record');
    } else {
      console.error('✗ Error:', insertError.message);
      process.exit(1);
    }
  } else {
    console.log('      ✓ Created new record');
  }

  // Step 3: Migrate scores to new user ID
  console.log('[3/5] Migrating scores...');
  const { data: scores, error: scoresQueryError } = await supabase
    .from('scores')
    .select('id')
    .eq('user_id', OLD_USER_ID);

  if (scoresQueryError) {
    console.error('✗ Error querying scores:', scoresQueryError.message);
    process.exit(1);
  }

  if (scores && scores.length > 0) {
    console.log(`      Found ${scores.length} score(s) to migrate...`);
    const { error: scoresUpdateError } = await supabase
      .from('scores')
      .update({ user_id: NEW_USER_ID })
      .eq('user_id', OLD_USER_ID);

    if (scoresUpdateError) {
      console.error('✗ Error migrating:', scoresUpdateError.message);
      process.exit(1);
    }
    console.log(`      ✓ Migrated ${scores.length} score(s)`);
  } else {
    console.log('      ℹ No scores to migrate');
  }

  // Step 4: Delete old user record
  console.log('[4/5] Deleting old user record...');
  const { error: deleteError } = await supabase
    .from('users')
    .delete()
    .eq('id', OLD_USER_ID);

  if (deleteError) {
    console.error('✗ Error:', deleteError.message);
    console.log('      ℹ Old record remains (can be cleaned up manually)');
  } else {
    console.log('      ✓ Deleted old record');
  }

  // Step 5: Verify
  console.log('[5/5] Verifying migration...');
  const { data: newUser, error: verifyError } = await supabase
    .from('users')
    .select('*')
    .eq('id', NEW_USER_ID)
    .single();

  if (verifyError || !newUser) {
    console.error('✗ Verification failed!');
    process.exit(1);
  }

  console.log('      ✓ New user verified');
  console.log('');
  console.log('='.repeat(60));
  console.log('✓✓✓ MIGRATION COMPLETE ✓✓✓');
  console.log('='.repeat(60));
  console.log('');
  console.log('You can now sign in with:');
  console.log('  Email:', newUser.email);
  console.log('  Password: [the password from create-auth-for-existing-user.mjs]');
  console.log('');
  console.log('Admin status:', newUser.is_admin ? 'YES' : 'NO');
  console.log('');

} catch (err) {
  console.error('\n✗ Unexpected error:', err.message);
  process.exit(1);
}
