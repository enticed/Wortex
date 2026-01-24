/**
 * Script to migrate an existing account to the new auth system
 * Sets a new password for an existing user account
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateAccount(email, newPassword) {
  try {
    console.log(`\nMigrating account: ${email}`);

    // Check if user exists
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, email, display_name, is_admin')
      .eq('email', email.toLowerCase())
      .single();

    if (fetchError || !user) {
      console.error('❌ User not found:', email);
      return false;
    }

    console.log('✓ Found user:', {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      isAdmin: user.is_admin
    });

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update the user with the new password hash
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        is_anonymous: false,
        password_changed_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Failed to update user:', updateError);
      return false;
    }

    console.log('✅ Account migrated successfully!');
    console.log(`   You can now sign in with: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error migrating account:', error);
    return false;
  }
}

// Get email and password from command line
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: node scripts/migrate-existing-account.mjs <email> <new-password>');
  console.log('Example: node scripts/migrate-existing-account.mjs admin@example.com MyNewPassword123');
  process.exit(1);
}

if (password.length < 8) {
  console.error('❌ Password must be at least 8 characters');
  process.exit(1);
}

migrateAccount(email, password).then(success => {
  process.exit(success ? 0 : 1);
});
