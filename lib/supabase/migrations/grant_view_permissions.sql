-- Grant permissions on leaderboard views
-- Views in Supabase need explicit permissions for anon and authenticated roles

-- Grant SELECT on all leaderboard views to anon role (for unauthenticated users)
GRANT SELECT ON leaderboards TO anon;
GRANT SELECT ON leaderboards_pure TO anon;
GRANT SELECT ON leaderboards_boosted TO anon;
GRANT SELECT ON global_leaderboards_pure TO anon;
GRANT SELECT ON global_leaderboards_boosted TO anon;

-- Grant SELECT on all leaderboard views to authenticated role
GRANT SELECT ON leaderboards TO authenticated;
GRANT SELECT ON leaderboards_pure TO authenticated;
GRANT SELECT ON leaderboards_boosted TO authenticated;
GRANT SELECT ON global_leaderboards_pure TO authenticated;
GRANT SELECT ON global_leaderboards_boosted TO authenticated;

-- Verify grants were applied
SELECT
  table_name,
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name LIKE '%leaderboard%'
ORDER BY table_name, grantee;
