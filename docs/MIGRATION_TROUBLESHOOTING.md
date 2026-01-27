# Database Migration Troubleshooting Guide

## Issue: "column does not exist" error

### Problem
When running `add_user_tiers.sql`, you might see:
```
Error: Failed to run sql query: ERROR: 42703: column "target_user_id" does not exist
```
OR
```
Error: Failed to run sql query: ERROR: 42703: column "is_admin" does not exist
```

### Solution

This happens because the migration references columns that may not exist yet in your database. The latest version (commit 663ba69) fixes this by checking for column existence before using it.

---

## How to Run the Migration

### Option 1: Run the Full Migration (Latest Version)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/fkzqvhvqyfuxnwdhpytg)
2. Click **SQL Editor**
3. Copy the LATEST version from: `lib/supabase/migrations/add_user_tiers.sql`
4. Paste into SQL Editor
5. Click **Run**

The latest version includes:
- Checks if `is_admin` column exists before using it
- Uses `DO` blocks for conditional updates
- Proper error handling

### Option 2: Run Step-by-Step (If Full Migration Fails)

Use `lib/supabase/migrations/add_user_tiers_simple.sql` which breaks the migration into 10 clear steps.

**Steps:**
1. Copy the ENTIRE contents of `add_user_tiers_simple.sql`
2. Paste into Supabase SQL Editor
3. Run all at once

If any step fails, you can run individual sections.

---

## Individual Step Commands (Manual Recovery)

If you need to run steps manually:

### Step 1: Add user_tier column
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_tier TEXT DEFAULT 'free';
ALTER TABLE users ADD CONSTRAINT user_tier_check CHECK (user_tier IN ('free', 'premium', 'admin'));
CREATE INDEX IF NOT EXISTS users_user_tier_idx ON users(user_tier);
```

### Step 2: Add Stripe columns
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS users_stripe_customer_id_unique ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
```

### Step 3: Add username column
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users(username) WHERE username IS NOT NULL;
```

### Step 4: Add last_active column
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS users_last_active_idx ON users(last_active);
```

### Step 5: Create trigger for last_active
```sql
CREATE OR REPLACE FUNCTION update_user_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users SET last_active = NOW() WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_user_last_active_trigger ON scores;
CREATE TRIGGER update_user_last_active_trigger
  AFTER INSERT ON scores
  FOR EACH ROW
  EXECUTE FUNCTION update_user_last_active();
```

### Step 6: Sync existing data (ONLY if is_admin column exists)
```sql
-- Check if is_admin exists first:
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'is_admin';

-- If it exists, run this:
UPDATE users SET user_tier = 'admin' WHERE is_admin = true AND user_tier = 'free';

-- Always safe to run:
UPDATE users SET user_tier = 'premium' WHERE subscription_status = 'active' AND user_tier = 'free';
UPDATE users SET last_active = last_login WHERE last_active IS NULL AND last_login IS NOT NULL;
UPDATE users SET last_active = created_at WHERE last_active IS NULL;
```

### Step 7: Create admin_activity_log table
```sql
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_log_admin_user_idx ON admin_activity_log(admin_user_id);
CREATE INDEX IF NOT EXISTS admin_log_target_user_idx ON admin_activity_log(target_user_id);
CREATE INDEX IF NOT EXISTS admin_log_created_at_idx ON admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS admin_log_action_idx ON admin_activity_log(action);
```

### Step 8: Set up RLS policies
```sql
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_log_admin_only ON admin_activity_log;

CREATE POLICY admin_log_admin_only ON admin_activity_log
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );
```

### Step 9: Add performance indexes
```sql
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS users_admin_list_idx ON users(user_tier, created_at DESC);
```

### Step 10: Create helper function
```sql
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_user_id UUID,
  p_action TEXT,
  p_target_user_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO admin_activity_log (
    admin_user_id,
    action,
    target_user_id,
    details,
    ip_address
  )
  VALUES (
    p_admin_user_id,
    p_action,
    p_target_user_id,
    p_details,
    p_ip_address
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Verification

After running the migration, verify it worked:

### Check new columns exist:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('user_tier', 'username', 'last_active', 'stripe_customer_id', 'stripe_subscription_id')
ORDER BY column_name;
```

Should return 5 rows.

### Check admin_activity_log table exists:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_name = 'admin_activity_log';
```

Should return 1 row.

### Check functions exist:
```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_name IN ('update_user_last_active', 'log_admin_action');
```

Should return 2 rows.

### Check indexes:
```sql
SELECT indexname FROM pg_indexes
WHERE tablename = 'users'
AND indexname LIKE '%tier%' OR indexname LIKE '%username%' OR indexname LIKE '%last_active%';
```

Should return several index names.

---

## Common Issues

### Issue: "CHECK constraint failed"
**Cause:** Trying to set user_tier to invalid value
**Solution:** Only use 'free', 'premium', or 'admin' as values

### Issue: "duplicate key value violates unique constraint"
**Cause:** Trying to set duplicate username or stripe_customer_id
**Solution:** Ensure usernames and Stripe customer IDs are unique

### Issue: "function already exists"
**Cause:** Re-running migration
**Solution:** Use `CREATE OR REPLACE FUNCTION` (already in migration)

### Issue: RLS policy prevents updates
**Cause:** Row Level Security blocking admin operations
**Solution:** Make sure your account has `is_admin = true`

---

## Need Help?

If migration still fails:

1. **Check which exact line failed** - Supabase will show the line number
2. **Run that section manually** - Use the individual step commands above
3. **Check for existing data conflicts** - Query the users table to see current data
4. **Verify is_admin column exists:**
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'users' AND column_name = 'is_admin';
   ```

If `is_admin` doesn't exist, you need to run the admin migration first from: `scripts/migrate-admin-features.mjs`

---

## After Successful Migration

1. ✅ Visit `/admin/users` - Should load without errors
2. ✅ Check user list - Should show all users with tiers
3. ✅ Try changing a user's tier - Should work smoothly
4. ✅ Check admin_activity_log - Should log the tier change

---

**Last Updated:** 2026-01-25
**Migration Version:** v1.1 (with is_admin column check)
