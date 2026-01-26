-- ============================================================================
-- STEP 7: CREATE ADMIN ACTIVITY LOG TABLE (MINIMAL VERSION)
-- ============================================================================
-- Run this version if other versions fail
-- This creates the table WITHOUT any RLS policies

-- Create the table
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS admin_log_admin_user_idx ON admin_activity_log(admin_user_id);
CREATE INDEX IF NOT EXISTS admin_log_target_user_idx ON admin_activity_log(target_user_id);
CREATE INDEX IF NOT EXISTS admin_log_created_at_idx ON admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS admin_log_action_idx ON admin_activity_log(action);

-- DO NOT enable RLS yet - we'll add it later once everything else is working
-- The admin endpoints will still work without RLS for now
