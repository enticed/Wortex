/**
 * Final fix - Uses raw SQL to handle foreign key constraints properly
 */

import { createClient } from '@supabase/supabase-js';

const OLD_USER_ID = 'a31913cc-e34c-4884-9035-14ff2edbf656';
const NEW_USER_ID = 'dd32505d-acfc-4200-a1e2-321858816349';

const supabaseUrl = 'https://fkzqvhvqyfuxnwdhpytg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrenF2aHZxeWZ1eG53ZGhweXRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk4NDUyOSwiZXhwIjoyMDgzNTYwNTI5fQ.1d9bO8bEXEGdqZHUuDIenCbhxb86inOe4xG_irUomdE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('='.repeat(60));
console.log('FINAL FIX: User ID Migration with Foreign Key Handling');
console.log('='.repeat(60));
console.log('');

try {
  // Get old user data first
  const { data: oldUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', OLD_USER_ID)
    .single();

  console.log('Old user:', oldUser.email, `(admin: ${oldUser.is_admin})`);
  console.log('');

  // Use PostgreSQL function to do the migration in a single transaction
  console.log('Executing migration...');

  const { data, error } = await supabase.rpc('migrate_user_id', {
    p_old_user_id: OLD_USER_ID,
    p_new_user_id: NEW_USER_ID,
    p_email: oldUser.email,
    p_display_name: oldUser.display_name,
    p_is_admin: oldUser.is_admin,
    p_timezone: oldUser.timezone || 'UTC',
    p_subscription_status: oldUser.subscription_status || 'none'
  });

  if (error) {
    if (error.code === '42883') {
      // Function doesn't exist - do it manually with ALTER TABLE
      console.log('Using manual approach (ALTER TABLE)...');
      console.log('');

      // This approach requires executing raw SQL
      console.log('Step 1: Creating new user record if needed...');
      await supabase.from('users').upsert({
        id: NEW_USER_ID,
        email: oldUser.email,
        display_name: oldUser.display_name,
        is_anonymous: false,
        is_admin: oldUser.is_admin,
        timezone: oldUser.timezone,
        subscription_status: oldUser.subscription_status,
        last_login: new Date().toISOString()
      }, { onConflict: 'id' });

      console.log('Step 2: Temporarily disabling foreign key constraint...');
      console.log('   (This requires running SQL manually in Supabase dashboard)');
      console.log('');
      console.log('   Please execute these SQL commands in Supabase SQL Editor:');
      console.log('');
      console.log('   -- Step 1: Drop foreign key');
      console.log('   ALTER TABLE scores DROP CONSTRAINT IF EXISTS scores_user_id_fkey;');
      console.log('');
      console.log('   -- Step 2: Update scores');
      console.log(`   UPDATE scores SET user_id = '${NEW_USER_ID}' WHERE user_id = '${OLD_USER_ID}';`);
      console.log('');
      console.log('   -- Step 3: Delete old user');
      console.log(`   DELETE FROM users WHERE id = '${OLD_USER_ID}';`);
      console.log('');
      console.log('   -- Step 4: Recreate foreign key');
      console.log('   ALTER TABLE scores ADD CONSTRAINT scores_user_id_fkey');
      console.log('     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;');
      console.log('');
      console.log('After running these, your account will be fixed!');

    } else {
      console.error('✗ Error:', error.message);
      process.exit(1);
    }
  } else {
    console.log('✓ Migration complete via stored procedure!');
  }

} catch (err) {
  console.error('✗ Error:', err.message);
  process.exit(1);
}
