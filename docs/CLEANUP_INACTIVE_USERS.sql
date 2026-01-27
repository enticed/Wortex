-- ============================================================================
-- AUTOMATIC CLEANUP OF INACTIVE ANONYMOUS USERS
-- ============================================================================
-- This migration creates a function to delete anonymous users who:
-- 1. Have been inactive for more than 30 days
-- 2. Have no scores (never played any games)
-- 3. Are anonymous accounts (is_anonymous = true)
--
-- This prevents the database from filling up with abandoned anonymous accounts.
-- ============================================================================

-- Create function to clean up inactive users
CREATE OR REPLACE FUNCTION cleanup_inactive_anonymous_users()
RETURNS TABLE (
  deleted_count INTEGER,
  deleted_user_ids TEXT[]
) AS $$
DECLARE
  v_deleted_count INTEGER;
  v_deleted_ids TEXT[];
  v_cutoff_date TIMESTAMP;
BEGIN
  -- Calculate cutoff date (30 days ago)
  v_cutoff_date := NOW() - INTERVAL '30 days';

  -- Log the cleanup operation
  RAISE NOTICE 'Starting cleanup of anonymous users inactive since %', v_cutoff_date;

  -- Delete anonymous users with no scores and inactive for 30+ days
  -- Store the deleted user IDs before deletion
  WITH users_to_delete AS (
    SELECT u.id
    FROM users u
    LEFT JOIN scores s ON u.id = s.user_id
    WHERE
      u.is_anonymous = TRUE
      AND u.created_at < v_cutoff_date
      AND s.id IS NULL  -- No scores exist
    GROUP BY u.id
  ),
  deleted AS (
    DELETE FROM users
    WHERE id IN (SELECT id FROM users_to_delete)
    RETURNING id
  )
  SELECT
    COUNT(*)::INTEGER,
    ARRAY_AGG(id::TEXT)
  INTO v_deleted_count, v_deleted_ids
  FROM deleted;

  -- Return results
  deleted_count := COALESCE(v_deleted_count, 0);
  deleted_user_ids := COALESCE(v_deleted_ids, ARRAY[]::TEXT[]);

  RAISE NOTICE 'Cleanup complete. Deleted % inactive anonymous users.', deleted_count;

  RETURN QUERY SELECT deleted_count, deleted_user_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (for manual runs if needed)
GRANT EXECUTE ON FUNCTION cleanup_inactive_anonymous_users() TO authenticated;

-- ============================================================================
-- OPTIONAL: Create a pg_cron job to run cleanup daily at 3 AM UTC
-- ============================================================================
-- NOTE: pg_cron must be enabled in your Supabase project first
-- You can enable it from: Database > Extensions > pg_cron
--
-- After enabling pg_cron, uncomment and run the following:

/*
SELECT cron.schedule(
  'cleanup-inactive-users',           -- Job name
  '0 3 * * *',                        -- Run daily at 3 AM UTC (cron format)
  $$SELECT cleanup_inactive_anonymous_users()$$
);
*/

-- To check if the job is scheduled:
-- SELECT * FROM cron.job WHERE jobname = 'cleanup-inactive-users';

-- To unschedule the job (if needed):
-- SELECT cron.unschedule('cleanup-inactive-users');

-- ============================================================================
-- MANUAL CLEANUP
-- ============================================================================
-- To manually run the cleanup at any time:
-- SELECT * FROM cleanup_inactive_anonymous_users();

-- To preview which users would be deleted (without actually deleting):
/*
SELECT
  u.id,
  u.display_name,
  u.created_at,
  DATE_PART('day', NOW() - u.created_at) as days_inactive
FROM users u
LEFT JOIN scores s ON u.id = s.user_id
WHERE
  u.is_anonymous = TRUE
  AND u.created_at < NOW() - INTERVAL '30 days'
  AND s.id IS NULL
GROUP BY u.id, u.display_name, u.created_at
ORDER BY u.created_at DESC;
*/

-- ============================================================================
-- TESTING
-- ============================================================================
-- Test the function (should return 0 if no users meet criteria):
-- SELECT * FROM cleanup_inactive_anonymous_users();
