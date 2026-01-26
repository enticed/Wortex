-- ============================================================================
-- STEP 7 (FIXED): CREATE ADMIN ACTIVITY LOG TABLE
-- ============================================================================
-- This version creates the table without RLS policies first

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
-- STEP 7B: SET UP RLS (Run this ONLY if is_admin column exists)
-- ============================================================================
-- First check if is_admin exists:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_admin';
-- If it returns a row, run the commands below. Otherwise, skip this step for now.

-- Enable RLS on admin_activity_log
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first
DROP POLICY IF EXISTS admin_log_admin_only ON admin_activity_log;

-- Create policy that checks is_admin column
-- ONLY RUN THIS IF is_admin COLUMN EXISTS!
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
-- ALTERNATIVE: If is_admin doesn't exist, use user_tier instead
-- ============================================================================
-- If is_admin column doesn't exist, use this policy instead:

/*
DROP POLICY IF EXISTS admin_log_admin_only ON admin_activity_log;

CREATE POLICY admin_log_admin_only ON admin_activity_log
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_tier = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_tier = 'admin'
    )
  );
*/
