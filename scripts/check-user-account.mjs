/**
 * Script to check if a user account exists in Supabase
 */

import { createClient } from '@supabase/supabase-js';

// UPDATE THIS WITH YOUR EMAIL
const TEST_EMAIL = 'admin@todaysmartsolutions.com'; // REPLACE THIS

const supabaseUrl = 'https://fkzqvhvqyfuxnwdhpytg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrenF2aHZxeWZ1eG53ZGhweXRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk4NDUyOSwiZXhwIjoyMDgzNTYwNTI5fQ.1d9bO8bEXEGdqZHUuDIenCbhxb86inOe4xG_irUomdE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('Checking user account...\n');
console.log('Email:', TEST_EMAIL);
console.log('');

// Check users table
try {
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', TEST_EMAIL)
    .maybeSingle();

  if (userError) {
    console.log('✗ Error querying users table:', userError.message);
  } else if (userData) {
    console.log('✓ User found in users table:');
    console.log(JSON.stringify(userData, null, 2));
  } else {
    console.log('✗ No user found in users table with this email');
  }
} catch (err) {
  console.error('Error:', err);
}

console.log('\n' + '='.repeat(60));

// Check auth.users (via admin API)
try {
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.log('✗ Error listing auth users:', authError.message);
  } else {
    const user = authData.users.find(u => u.email === TEST_EMAIL);
    if (user) {
      console.log('✓ User found in auth.users:');
      console.log('  ID:', user.id);
      console.log('  Email:', user.email);
      console.log('  Email confirmed:', user.email_confirmed_at ? 'Yes' : 'No');
      console.log('  Created:', user.created_at);
      console.log('  Last sign in:', user.last_sign_in_at);
    } else {
      console.log('✗ No user found in auth.users with this email');
      console.log('\nAll registered emails:');
      authData.users.forEach(u => console.log('  -', u.email));
    }
  }
} catch (err) {
  console.error('Error:', err);
}
