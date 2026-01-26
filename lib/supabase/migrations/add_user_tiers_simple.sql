-- Simplified Migration: Add user tier system (Step by step)
-- Run each section separately if you encounter errors

-- ============================================================================
-- STEP 1: ADD USER TIER COLUMN
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS user_tier TEXT DEFAULT 'free';
ALTER TABLE users ADD CONSTRAINT user_tier_check CHECK (user_tier IN ('free', 'premium', 'admin'));
CREATE INDEX IF NOT EXISTS users_user_tier_idx ON users(user_tier);

-- ============================================================================
-- STEP 2: ADD PAYMENT INTEGRATION COLUMNS
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS users_stripe_customer_id_unique ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- ============================================================================
-- STEP 3: ADD USERNAME COLUMN
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS users_username_idx ON users(username) WHERE username IS NOT NULL;

-- ============================================================================
-- STEP 4: ADD LAST ACTIVE TRACKING
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS users_last_active_idx ON users(last_active);

-- ============================================================================
-- STEP 5: CREATE TRIGGER TO UPDATE LAST_ACTIVE
-- ============================================================================

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

-- ============================================================================
-- STEP 6: SYNC EXISTING DATA
-- ============================================================================

-- Sync admin status with user tier
UPDATE users SET user_tier = 'admin' WHERE is_admin = true AND user_tier = 'free';

-- Sync premium tier with active subscriptions
UPDATE users SET user_tier = 'premium' WHERE subscription_status = 'active' AND user_tier = 'free';

-- Set last_active to last_login for existing users
UPDATE users SET last_active = last_login WHERE last_active IS NULL AND last_login IS NOT NULL;

-- For users without last_login, set last_active to created_at
UPDATE users SET last_active = created_at WHERE last_active IS NULL;

-- ============================================================================
-- STEP 7: CREATE ADMIN ACTIVITY LOG TABLE
-- ============================================================================

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

-- ============================================================================
-- STEP 8: SET UP RLS FOR ADMIN LOG
-- ============================================================================

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

-- ============================================================================
-- STEP 9: ADD PERFORMANCE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS users_created_at_idx ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS users_admin_list_idx ON users(user_tier, created_at DESC);

-- ============================================================================
-- STEP 10: CREATE HELPER FUNCTION
-- ============================================================================

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

-- Done!
SELECT 'Migration completed successfully!' as status;
