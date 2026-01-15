/**
 * Set a user as admin
 * Usage: node scripts/set-admin.mjs <email>
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

async function setAdmin() {
  const emailOrId = process.argv[2];

  if (!emailOrId) {
    console.error('❌ Please provide an email address or user ID');
    console.log('\n   Usage: node scripts/set-admin.mjs <email-or-user-id>');
    console.log('\n   Examples:');
    console.log('   node scripts/set-admin.mjs user@example.com');
    console.log('   node scripts/set-admin.mjs a31913cc-e34c-4884-9035-14ff2edbf656');
    process.exit(1);
  }

  // Check if input looks like a UUID (user ID)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(emailOrId);

  let user;
  let findError;

  if (isUUID) {
    console.log(`🔍 Looking for user with ID: ${emailOrId}...`);
    const result = await supabase
      .from('users')
      .select('id, email, display_name, is_admin')
      .eq('id', emailOrId)
      .single();
    user = result.data;
    findError = result.error;
  } else {
    console.log(`🔍 Looking for user with email: ${emailOrId}...`);
    const result = await supabase
      .from('users')
      .select('id, email, display_name, is_admin')
      .eq('email', emailOrId)
      .single();
    user = result.data;
    findError = result.error;
  }

  if (findError || !user) {
    console.error('❌ User not found');
    console.log('\n   Available users:');

    const { data: allUsers } = await supabase
      .from('users')
      .select('id, email, display_name')
      .order('created_at', { ascending: false })
      .limit(10);

    if (allUsers && allUsers.length > 0) {
      allUsers.forEach(u => {
        console.log(`   - ID: ${u.id}`);
        console.log(`     Email: ${u.email || 'anonymous'}`);
        console.log(`     Name: ${u.display_name || 'no name'}\n`);
      });
    } else {
      console.log('   No users found in database');
    }

    process.exit(1);
  }

  console.log(`\n✓ Found user: ${user.display_name || 'No display name'}`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Current admin status: ${user.is_admin || false}`);

  if (user.is_admin) {
    console.log('\n⚠️  This user is already an admin!');
    process.exit(0);
  }

  // Set as admin
  const { error: updateError } = await supabase
    .from('users')
    .update({
      is_admin: true,
      admin_notes: `Admin privileges granted on ${new Date().toISOString()}`
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('❌ Error setting admin status:', updateError.message);
    process.exit(1);
  }

  // Verify the change
  const { data: verifyUser } = await supabase
    .from('users')
    .select('is_admin, admin_notes')
    .eq('id', user.id)
    .single();

  if (verifyUser?.is_admin) {
    console.log('\n✅ Successfully granted admin privileges!');
    console.log(`   User ${email} is now an admin`);
  } else {
    console.log('\n⚠️  Update completed but could not verify admin status');
    console.log('   Please check the database manually');
  }
}

setAdmin().catch(console.error);
