/**
 * Test sign-in after password reset
 *
 * Usage: node scripts/test-signin-after-reset.mjs gjavier3@gmail.com <new-password>
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
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignIn(email, password) {
  console.log('\n=== Testing Sign-In ===\n');
  console.log('Email:', email);
  console.log('Password:', '*'.repeat(password.length));
  console.log('');

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.log('❌ Sign-in failed');
      console.log('Error code:', error.status);
      console.log('Error message:', error.message);
      console.log('');

      if (error.message.includes('Invalid') || error.message.includes('credentials')) {
        console.log('Possible causes:');
        console.log('1. Password was not actually updated');
        console.log('2. There is a timing issue (password not saved yet)');
        console.log('3. Password is being hashed differently');
        console.log('4. User account has issues');
      }

      return false;
    }

    console.log('✅ Sign-in successful!');
    console.log('User ID:', data.user?.id);
    console.log('Email:', data.user?.email);
    console.log('Session:', data.session ? 'Created' : 'No session');
    console.log('');

    return true;

  } catch (error) {
    console.error('Unexpected error:', error);
    return false;
  }
}

// Get email and password from command line
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node scripts/test-signin-after-reset.mjs <email> <password>');
  console.error('Example: node scripts/test-signin-after-reset.mjs user@example.com newpassword123');
  process.exit(1);
}

testSignIn(email, password);
