/**
 * Check if a user is admin
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkAdmin() {
  const userId = 'a31913cc-e34c-4884-9035-14ff2edbf656';

  console.log('🔍 Checking admin status...\n');

  // Try to get the user
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('❌ Error querying users table:', error.message);
    console.error('Full error:', error);
    return;
  }

  if (!user) {
    console.log('❌ User not found');
    return;
  }

  console.log('✓ User found!');
  console.log('\nUser details:');
  console.log(`  ID: ${user.id}`);
  console.log(`  Email: ${user.email || 'anonymous'}`);
  console.log(`  Display Name: ${user.display_name || 'no name'}`);
  console.log(`  Is Admin: ${user.is_admin || false}`);
  console.log(`  Created: ${user.created_at}`);

  if (user.is_admin) {
    console.log('\n✅ You are an admin! You can access /admin');
  } else {
    console.log('\n⚠️  Not an admin yet. Run this SQL in Supabase:');
    console.log(`UPDATE users SET is_admin = TRUE WHERE id = '${userId}';`);
  }
}

checkAdmin().catch(console.error);
