-- Check if stats exist for the admin user
SELECT 'Stats records for admin user:' as check_type, COUNT(*) as count
FROM stats
WHERE user_id = 'dd32505d-acfc-4200-a1e2-321858816349';

-- Show actual stats if they exist
SELECT * FROM stats
WHERE user_id = 'dd32505d-acfc-4200-a1e2-321858816349';

-- Check RLS policies on stats table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'stats';

-- Check if RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'stats';
