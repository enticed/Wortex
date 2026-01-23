#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Finding and Fixing All Orphaned Accounts ===\n');

// Get all non-anonymous users with emails
console.log('1. Finding all non-anonymous users with emails...');
const { data: usersWithEmails, error: usersError } = await supabase
  .from('users')
  .select('*')
  .eq('is_anonymous', false)
  .not('email', 'is', null);

if (usersError) {
  console.error('   ❌ Error:', usersError);
  process.exit(1);
}

console.log(`   ✓ Found ${usersWithEmails.length} non-anonymous users\n`);

// Get all auth users
const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

if (authError) {
  console.error('   ❌ Error fetching auth users:', authError);
  process.exit(1);
}

const authEmails = new Set(authUsers.map(u => u.email));
const orphanedAccounts = [];

console.log('2. Checking which accounts need fixing...\n');

for (const user of usersWithEmails) {
  if (!authEmails.has(user.email)) {
    console.log(`   ⚠️  ORPHANED: ${user.email} (ID: ${user.id.substring(0, 12)}...)`);
    console.log(`      Display Name: ${user.display_name || '(none)'}`);
    orphanedAccounts.push(user);
  } else {
    console.log(`   ✓ OK: ${user.email}`);
  }
}

if (orphanedAccounts.length === 0) {
  console.log('\n✓ All accounts have matching auth users!');
  process.exit(0);
}

console.log(`\n3. Found ${orphanedAccounts.length} orphaned account(s) that need fixing\n`);
console.log('Do you want to fix these accounts? This will:');
console.log('  1. Create auth users for each orphaned account');
console.log('  2. Migrate data if IDs don\'t match');
console.log('  3. Generate temporary passwords\n');

// For now, just create auth accounts with temp passwords
const tempPassword = 'TempPass123!ChangeMe';
const fixes = [];

for (const user of orphanedAccounts) {
  console.log(`\nFixing: ${user.email}...`);

  // Create auth account
  const { data: authData, error: createError } = await supabase.auth.admin.createUser({
    email: user.email,
    password: tempPassword,
    email_confirm: true,
  });

  if (createError) {
    console.error(`   ❌ Failed to create auth user: ${createError.message}`);
    continue;
  }

  const newAuthId = authData.user.id;
  const oldDbId = user.id;

  if (newAuthId === oldDbId) {
    console.log(`   ✓ Auth created with matching ID: ${newAuthId}`);
    fixes.push({
      email: user.email,
      password: tempPassword,
      needsMigration: false,
    });
  } else {
    console.log(`   ⚠️  ID mismatch - auth: ${newAuthId}, db: ${oldDbId}`);
    console.log(`   Will need data migration`);
    fixes.push({
      email: user.email,
      password: tempPassword,
      needsMigration: true,
      oldId: oldDbId,
      newId: newAuthId,
      displayName: user.display_name,
    });
  }
}

// Generate SQL migration scripts for accounts that need it
const migrations = fixes.filter(f => f.needsMigration);

if (migrations.length > 0) {
  console.log(`\n4. Generating SQL migration scripts for ${migrations.length} account(s)...\n`);

  for (const migration of migrations) {
    const sql = `-- Migration for ${migration.email}
-- Old ID: ${migration.oldId}
-- New ID: ${migration.newId}

-- Step 1: Create new user with temporary email
INSERT INTO users (id, email, display_name, is_anonymous, is_admin, timezone, subscription_status, created_at, last_login)
VALUES ('${migration.newId}', '${migration.email}_temp', '${migration.displayName || 'User'}', false, false, 'UTC', 'none', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET display_name = '${migration.displayName || 'User'}', is_anonymous = false;

-- Step 2: Migrate scores
UPDATE scores SET user_id = '${migration.newId}' WHERE user_id = '${migration.oldId}';

-- Step 3: Migrate stats
UPDATE stats SET user_id = '${migration.newId}' WHERE user_id = '${migration.oldId}';

-- Step 4: Delete old user
DELETE FROM users WHERE id = '${migration.oldId}';

-- Step 5: Fix email
UPDATE users SET email = '${migration.email}' WHERE id = '${migration.newId}';

-- Verify
SELECT 'Success!' as status, id, email, display_name, (SELECT COUNT(*) FROM scores WHERE user_id = users.id) as score_count
FROM users WHERE email = '${migration.email}';
`;

    const filename = `./scripts/migrate-${migration.email.replace('@', '-at-')}-GENERATED.sql`;
    writeFileSync(filename, sql);
    console.log(`   ✓ Created: ${filename}`);
  }
}

console.log('\n=== Summary ===\n');
console.log('Login credentials for all fixed accounts:');
console.log(`  Password (all accounts): ${tempPassword}\n`);

fixes.forEach(fix => {
  console.log(`  ${fix.email}`);
  if (fix.needsMigration) {
    console.log(`    → Run migration SQL first!`);
  }
});

console.log('\n⚠️  IMPORTANT: Users should use "Forgot Password" to set their own passwords!\n');
console.log('=== Fix Complete ===\n');
