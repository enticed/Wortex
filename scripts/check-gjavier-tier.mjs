/**
 * Check gjavier@gmail.com account tier status
 */

import { createClient } from '@supabase/supabase-js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkAccount() {
  console.log('🔍 Checking gjavier@gmail.com account...\n');

  try {
    // Find user by email
    const { data: users, error: searchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'gjavier@gmail.com');

    if (searchError) {
      console.error('❌ Error searching for user:', searchError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ No user found with email gjavier@gmail.com');
      return;
    }

    if (users.length > 1) {
      console.log(`⚠️  Warning: Found ${users.length} users with this email:`);
      users.forEach((user, i) => {
        console.log(`\nUser ${i + 1}:`);
        console.log('  ID:', user.id);
        console.log('  Email:', user.email);
        console.log('  Display Name:', user.display_name);
        console.log('  User Tier:', user.user_tier);
        console.log('  Is Admin:', user.is_admin);
        console.log('  Is Anonymous:', user.is_anonymous);
      });
      return;
    }

    const user = users[0];
    console.log('✅ Found user account:');
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  Display Name:', user.display_name);
    console.log('  User Tier:', user.user_tier);
    console.log('  Is Admin:', user.is_admin);
    console.log('  Is Anonymous:', user.is_anonymous);
    console.log('  Created:', user.created_at);
    console.log('  Last Login:', user.last_login);

    // Check auth user
    console.log('\n🔐 Checking auth.users...');
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
    } else {
      const authUser = authUsers?.find(u => u.email === 'gjavier@gmail.com');
      if (authUser) {
        console.log('✅ Found in auth.users:');
        console.log('  Auth ID:', authUser.id);
        console.log('  Email:', authUser.email);
        console.log('  Email Confirmed:', authUser.email_confirmed_at ? 'Yes' : 'No');
        console.log('  Match:', authUser.id === user.id ? '✓ IDs match' : '✗ IDs do not match');
      } else {
        console.log('❌ Not found in auth.users');
      }
    }

    // Recommendation
    console.log('\n📋 Status:');
    if (user.user_tier === 'admin' || user.is_admin) {
      console.log('✅ User has admin tier - should have archive access');
    } else if (user.user_tier === 'premium') {
      console.log('✅ User has premium tier - should have archive access');
    } else {
      console.log('❌ User has FREE tier - needs to be upgraded to admin');
      console.log('\n💡 To fix: Run the set-admin.mjs script');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAccount();
