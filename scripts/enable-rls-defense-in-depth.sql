-- Enable RLS as Defense in Depth
-- This script enables Row Level Security with DENY ALL policies
-- Since all database access now goes through authenticated API routes,
-- we use RLS as a backup security layer in case the ANON_KEY is compromised

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on scores table
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Enable RLS on stats table
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;

-- Enable RLS on puzzles table
ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on admin_activity_log table (if exists)
ALTER TABLE IF EXISTS admin_activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DROP ANY EXISTING POLICIES (clean slate)
-- ============================================================================

-- Users table policies
DROP POLICY IF EXISTS "Deny direct access" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for anon users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;

-- Scores table policies
DROP POLICY IF EXISTS "Deny direct access" ON scores;
DROP POLICY IF EXISTS "Users can view their own scores" ON scores;
DROP POLICY IF EXISTS "Users can insert their own scores" ON scores;
DROP POLICY IF EXISTS "Enable read access for all scores" ON scores;
DROP POLICY IF EXISTS "Enable insert for users" ON scores;
DROP POLICY IF EXISTS "Enable update for users" ON scores;

-- Stats table policies
DROP POLICY IF EXISTS "Deny direct access" ON stats;
DROP POLICY IF EXISTS "Users can view their own stats" ON stats;
DROP POLICY IF EXISTS "Users can update their own stats" ON stats;
DROP POLICY IF EXISTS "Enable read access for all stats" ON stats;
DROP POLICY IF EXISTS "Enable insert for users" ON stats;
DROP POLICY IF EXISTS "Enable update for users" ON stats;

-- Puzzles table policies
DROP POLICY IF EXISTS "Allow public read" ON puzzles;
DROP POLICY IF EXISTS "Deny direct write" ON puzzles;
DROP POLICY IF EXISTS "Enable read access for all puzzles" ON puzzles;

-- Admin activity log policies
DROP POLICY IF EXISTS "Deny direct access" ON admin_activity_log;

-- ============================================================================
-- CREATE NEW POLICIES (DENY ALL for sensitive tables, PUBLIC READ for puzzles)
-- ============================================================================

-- USERS TABLE: Deny all direct access
-- Reasoning: User data (including password hashes) is highly sensitive
-- All access must go through authenticated API routes
CREATE POLICY "Deny direct access" ON users
  FOR ALL
  USING (false);

COMMENT ON POLICY "Deny direct access" ON users IS
  'Denies all direct database access. All user data access must go through authenticated API endpoints.';

-- SCORES TABLE: Deny all direct access
-- Reasoning: Score submissions must be validated server-side
-- All access must go through authenticated API routes
CREATE POLICY "Deny direct access" ON scores
  FOR ALL
  USING (false);

COMMENT ON POLICY "Deny direct access" ON scores IS
  'Denies all direct database access. All score operations must go through validated API endpoints.';

-- STATS TABLE: Deny all direct access
-- Reasoning: Stats are personal data
-- All access must go through authenticated API routes
CREATE POLICY "Deny direct access" ON stats
  FOR ALL
  USING (false);

COMMENT ON POLICY "Deny direct access" ON stats IS
  'Denies all direct database access. All stats operations must go through authenticated API endpoints.';

-- PUZZLES TABLE: Allow public read
-- Reasoning: Puzzles are public content, safe to read
-- But prevent direct writes (must go through admin API)
CREATE POLICY "Allow public read" ON puzzles
  FOR SELECT
  USING (true);

CREATE POLICY "Deny direct write" ON puzzles
  FOR INSERT
  USING (false);

CREATE POLICY "Deny direct update" ON puzzles
  FOR UPDATE
  USING (false);

CREATE POLICY "Deny direct delete" ON puzzles
  FOR DELETE
  USING (false);

COMMENT ON POLICY "Allow public read" ON puzzles IS
  'Allows anyone to read puzzle data (public content). Writes must go through admin API.';

-- ADMIN ACTIVITY LOG: Deny all direct access (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_activity_log') THEN
    EXECUTE 'CREATE POLICY "Deny direct access" ON admin_activity_log FOR ALL USING (false)';
  END IF;
END $$;

-- ============================================================================
-- VERIFY RLS IS ENABLED
-- ============================================================================

-- Query to check RLS status
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'scores', 'stats', 'puzzles', 'admin_activity_log')
ORDER BY tablename;

-- Query to list all policies
SELECT
  schemaname,
  tablename,
  policyname,
  cmd AS operation,
  qual AS using_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- NOTES
-- ============================================================================

-- HOW THIS WORKS:
--
-- 1. All tables have RLS enabled
-- 2. Sensitive tables (users, scores, stats) have DENY ALL policies
-- 3. API routes use SERVICE_ROLE_KEY which bypasses RLS automatically
-- 4. Browser clients use ANON_KEY which is subject to RLS
-- 5. Even if ANON_KEY is compromised, attackers cannot access data
--
-- BENEFITS:
--
-- - Defense in depth: Multiple layers of security
-- - API routes work normally (service role bypasses RLS)
-- - Direct browser queries are blocked (ANON_KEY subject to RLS)
-- - Backup protection if API auth is bypassed
--
-- TESTING:
--
-- Run in browser console to verify RLS is blocking:
--
-- const supabase = createClient(URL, ANON_KEY);
-- const { data, error } = await supabase.from('users').select('*');
-- // Should return empty or error
--
-- API routes should still work:
-- fetch('/api/user/profile', { credentials: 'include' })
-- // Should return user data (uses service role internally)

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- To disable RLS (NOT RECOMMENDED):
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE scores DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE stats DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE puzzles DISABLE ROW LEVEL SECURITY;
