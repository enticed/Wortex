/**
 * Test anonymous authentication
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('🧪 Testing Anonymous Authentication\n');
  console.log('Supabase URL:', SUPABASE_URL);
  console.log('Attempting anonymous sign-in...\n');

  try {
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      console.error('❌ Anonymous sign-in failed:');
      console.error('   Error code:', error.status);
      console.error('   Error message:', error.message);
      console.error('\n📝 To fix this:');
      console.error('   1. Go to: https://supabase.com/dashboard/project/fkzqvhvqyfuxnwdhpytg/auth/providers');
      console.error('   2. Scroll to "Allow anonymous sign-ins"');
      console.error('   3. Toggle it ON (green)');
      console.error('   4. Click "Save changes" button at the bottom');
      console.error('   5. Wait a few seconds for the change to propagate');
      console.error('   6. Run this script again');
      process.exit(1);
    }

    if (data.user) {
      console.log('✅ Anonymous sign-in successful!');
      console.log('   User ID:', data.user.id);
      console.log('   Created at:', data.user.created_at);
      console.log('   Is anonymous:', data.user.is_anonymous);
      console.log('\n🎉 Anonymous authentication is working correctly!');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

main().catch(console.error);
