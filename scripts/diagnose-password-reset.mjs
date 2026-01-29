/**
 * Diagnose password reset issues
 *
 * Usage: node scripts/diagnose-password-reset.mjs gjavier3@gmail.com
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function diagnosePasswordReset(email) {
  console.log('\n=== Password Reset Diagnosis ===\n');
  console.log('Email:', email);
  console.log('');

  try {
    // 1. Check Supabase Auth user
    console.log('1. Checking Supabase Auth...');
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('Error listing users:', authError);
      return;
    }

    const authUser = users.find(u => u.email === email);

    if (!authUser) {
      console.log('❌ No auth user found with this email');
      console.log('   User may need to sign up first');
      return;
    }

    console.log('✅ Auth user found');
    console.log('   User ID:', authUser.id);
    console.log('   Email confirmed:', authUser.email_confirmed_at ? 'Yes' : 'No');
    console.log('   Last sign in:', authUser.last_sign_in_at || 'Never');
    console.log('   Created:', authUser.created_at);
    console.log('   Provider:', authUser.app_metadata?.provider || 'email');
    console.log('   Is anonymous:', authUser.is_anonymous || false);
    console.log('');

    // 2. Check users table
    console.log('2. Checking users table...');
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (dbError) {
      console.error('Error querying users table:', dbError);
    } else if (!dbUser) {
      console.log('⚠️  No user record in database');
      console.log('   This might cause issues');
    } else {
      console.log('✅ Database user found');
      console.log('   User ID:', dbUser.id);
      console.log('   Is anonymous:', dbUser.is_anonymous);
      console.log('   Display name:', dbUser.display_name || '(none)');
      console.log('   Last login:', dbUser.last_login || 'Never');
      console.log('');

      // Check if IDs match
      if (authUser.id !== dbUser.id) {
        console.log('❌ MISMATCH: Auth user ID and DB user ID are different!');
        console.log('   Auth ID:', authUser.id);
        console.log('   DB ID:', dbUser.id);
        console.log('   This could cause authentication issues');
      } else {
        console.log('✅ User IDs match between auth and database');
      }
    }
    console.log('');

    // 3. Test password reset
    console.log('3. Testing password reset email...');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
    });

    if (resetError) {
      console.log('❌ Failed to send reset email:', resetError.message);
    } else {
      console.log('✅ Password reset email sent successfully');
      console.log('   Check the inbox for', email);
      console.log('   (May take a few seconds to arrive)');
    }
    console.log('');

    // 4. Recommendations
    console.log('4. Recommendations:');
    if (authUser.is_anonymous) {
      console.log('   ⚠️  This is an anonymous account');
      console.log('   → User should "upgrade" to email/password account first');
      console.log('   → Or create a new account with email/password');
    }

    if (!authUser.email_confirmed_at) {
      console.log('   ⚠️  Email not confirmed');
      console.log('   → User may need to confirm email first');
    }

    if (authUser && dbUser && authUser.id !== dbUser.id) {
      console.log('   ❌ User ID mismatch detected');
      console.log('   → This needs to be fixed in the database');
      console.log('   → Run: node scripts/fix-user-id-mismatch.mjs', email);
    }

    console.log('\n=== Diagnosis Complete ===\n');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/diagnose-password-reset.mjs <email>');
  console.error('Example: node scripts/diagnose-password-reset.mjs user@example.com');
  process.exit(1);
}

diagnosePasswordReset(email);
