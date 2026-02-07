-- Drop Remaining RLS Policies
-- Based on Step 1 results, these policies still exist

-- Drop policies that weren't in the first script
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own scores" ON scores;
DROP POLICY IF EXISTS "Users can view all scores" ON scores;
DROP POLICY IF EXISTS "Users can insert their own stats" ON stats;
DROP POLICY IF EXISTS "Users can update their own stats" ON stats;
DROP POLICY IF EXISTS "Users can view all stats" ON stats;

-- Drop puzzle policies
DROP POLICY IF EXISTS "Anyone can view approved puzzles" ON puzzles;
DROP POLICY IF EXISTS "admin_only_write" ON puzzles;
DROP POLICY IF EXISTS "public_read_published" ON puzzles;

-- Drop admin and metadata policies
DROP POLICY IF EXISTS "admin_log_admin_only" ON admin_activity_log;
DROP POLICY IF EXISTS "metadata_admin_only" ON puzzle_metadata;

-- Verify RLS status again
SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'scores', 'stats', 'puzzles', 'admin_activity_log', 'puzzle_metadata')
ORDER BY tablename;

-- Verify no policies remain
SELECT COUNT(*) as remaining_policies
FROM pg_policies
WHERE schemaname = 'public';

-- List any remaining policies
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
