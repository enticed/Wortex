-- Temporarily Disable RLS on All Tables
-- This provides a clean slate before enabling RLS with proper configuration

-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE puzzles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_activity_log DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Deny direct access" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for anon users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;

DROP POLICY IF EXISTS "Deny direct access" ON scores;
DROP POLICY IF EXISTS "Users can view their own scores" ON scores;
DROP POLICY IF EXISTS "Users can insert their own scores" ON scores;
DROP POLICY IF EXISTS "Enable read access for all scores" ON scores;
DROP POLICY IF EXISTS "Enable insert for users" ON scores;
DROP POLICY IF EXISTS "Enable update for users" ON scores;

DROP POLICY IF EXISTS "Deny direct access" ON stats;
DROP POLICY IF EXISTS "Users can view their own stats" ON stats;
DROP POLICY IF EXISTS "Users can update their own stats" ON stats;
DROP POLICY IF EXISTS "Enable read access for all stats" ON stats;
DROP POLICY IF EXISTS "Enable insert for users" ON stats;
DROP POLICY IF EXISTS "Enable update for users" ON stats;

DROP POLICY IF EXISTS "Allow public read" ON puzzles;
DROP POLICY IF EXISTS "Deny direct write" ON puzzles;
DROP POLICY IF EXISTS "Deny direct update" ON puzzles;
DROP POLICY IF EXISTS "Deny direct delete" ON puzzles;
DROP POLICY IF EXISTS "Enable read access for all puzzles" ON puzzles;

DROP POLICY IF EXISTS "Deny direct access" ON admin_activity_log;

-- Verify RLS is disabled
SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'scores', 'stats', 'puzzles', 'admin_activity_log')
ORDER BY tablename;

-- Verify no policies remain
SELECT COUNT(*) as remaining_policies
FROM pg_policies
WHERE schemaname = 'public';
