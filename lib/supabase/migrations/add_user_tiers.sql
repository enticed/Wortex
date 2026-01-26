-- Migration: Add user tier system and enhanced user tracking
-- Date: 2026-01-25
-- Purpose: Enable premium subscriptions and better user management

-- ============================================================================
-- 1. ADD USER TIER COLUMN
-- ============================================================================

-- Add user_tier column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS user_tier TEXT DEFAULT 'free'
CHECK (user_tier IN ('free', 'premium', 'admin'));

-- Add index for faster tier-based queries
CREATE INDEX IF NOT EXISTS users_user_tier_idx ON users(user_tier);

-- ============================================================================
-- 2. ADD PAYMENT INTEGRATION COLUMNS
-- ============================================================================

-- Add Stripe customer and subscription IDs for payment integration
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Add unique index for Stripe customer ID
CREATE UNIQUE INDEX IF NOT EXISTS users_stripe_customer_id_unique
ON users(stripe_customer_id)
WHERE stripe_customer_id IS NOT NULL;

-- ============================================================================
-- 3. ADD USERNAME COLUMN
-- ============================================================================

-- Add username column for better user identification
ALTER TABLE users
ADD COLUMN IF NOT EXISTS username TEXT;

-- Create unique index for username (excluding NULL values for users without username)
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users(username)
WHERE username IS NOT NULL;

-- Add index for faster username lookups
CREATE INDEX IF NOT EXISTS users_username_idx ON users(username)
WHERE username IS NOT NULL;

-- ============================================================================
-- 4. ADD LAST ACTIVE TRACKING
-- ============================================================================

-- Add last_active tracking for activity monitoring
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW();

-- Add index for sorting by last active
CREATE INDEX IF NOT EXISTS users_last_active_idx ON users(last_active);

-- ============================================================================
-- 5. CREATE TRIGGER TO UPDATE LAST_ACTIVE ON GAMEPLAY
-- ============================================================================

-- Function to update last_active timestamp when user plays
CREATE OR REPLACE FUNCTION update_user_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET last_active = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update last_active on score submission
DROP TRIGGER IF EXISTS update_user_last_active_trigger ON scores;
CREATE TRIGGER update_user_last_active_trigger
  AFTER INSERT ON scores
  FOR EACH ROW
  EXECUTE FUNCTION update_user_last_active();

-- ============================================================================
-- 6. SYNC EXISTING DATA
-- ============================================================================

-- Sync admin status with user tier (admins get 'admin' tier)
UPDATE users
SET user_tier = 'admin'
WHERE is_admin = true AND user_tier = 'free';

-- Sync premium tier with active subscriptions
UPDATE users
SET user_tier = 'premium'
WHERE subscription_status = 'active' AND user_tier = 'free';

-- Set last_active to last_login for existing users (if they have logged in)
UPDATE users
SET last_active = last_login
WHERE last_active IS NULL AND last_login IS NOT NULL;

-- For users without last_login, set last_active to created_at
UPDATE users
SET last_active = created_at
WHERE last_active IS NULL;

-- ============================================================================
-- 7. CREATE ADMIN ACTIVITY LOG TABLE
-- ============================================================================

-- Create table for logging admin actions
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for admin activity log
CREATE INDEX IF NOT EXISTS admin_log_admin_user_idx ON admin_activity_log(admin_user_id);
CREATE INDEX IF NOT EXISTS admin_log_target_user_idx ON admin_activity_log(target_user_id);
CREATE INDEX IF NOT EXISTS admin_log_created_at_idx ON admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS admin_log_action_idx ON admin_activity_log(action);

-- Enable RLS on admin_activity_log
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view and insert into admin_activity_log
CREATE POLICY admin_log_admin_only ON admin_activity_log
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- ============================================================================
-- 8. ADD PERFORMANCE INDEXES
-- ============================================================================

-- Add index on created_at for user list sorting
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users(created_at DESC);

-- Add composite index for admin user queries
CREATE INDEX IF NOT EXISTS users_admin_list_idx ON users(user_tier, created_at DESC);

-- ============================================================================
-- 9. HELPER FUNCTION TO LOG ADMIN ACTIONS
-- ============================================================================

-- Function to log admin actions (to be called from API endpoints)
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

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify migration
DO $$
BEGIN
  RAISE NOTICE 'User tier migration completed successfully!';
  RAISE NOTICE 'Added columns: user_tier, stripe_customer_id, stripe_subscription_id, username, last_active';
  RAISE NOTICE 'Created table: admin_activity_log';
  RAISE NOTICE 'Created function: update_user_last_active()';
  RAISE NOTICE 'Created function: log_admin_action()';
END $$;
