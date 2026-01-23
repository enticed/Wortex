-- Simplified approach: Run each step separately to avoid transaction rollback issues

-- Step 1: Check current state
SELECT 'Old user exists:' as check_type, EXISTS(SELECT 1 FROM users WHERE id = 'a31913cc-e34c-4884-9035-14ff2edbf656') as result
UNION ALL
SELECT 'New user exists:' as check_type, EXISTS(SELECT 1 FROM users WHERE id = 'dd32505d-acfc-4200-a1e2-321858816349') as result
UNION ALL
SELECT 'Scores with old ID:' as check_type, EXISTS(SELECT 1 FROM scores WHERE user_id = 'a31913cc-e34c-4884-9035-14ff2edbf656') as result;

-- Step 2: Drop constraint (run this alone first)
-- ALTER TABLE scores DROP CONSTRAINT IF EXISTS scores_user_id_fkey;

-- Step 3: Update new user with admin data (run after Step 2 succeeds)
-- UPDATE users
-- SET
--   display_name = 'TSSadmin',
--   is_admin = true,
--   timezone = 'UTC',
--   subscription_status = 'none',
--   last_login = NOW()
-- WHERE id = 'dd32505d-acfc-4200-a1e2-321858816349';

-- Step 4: Migrate scores (run after Step 3 succeeds)
-- UPDATE scores
-- SET user_id = 'dd32505d-acfc-4200-a1e2-321858816349'
-- WHERE user_id = 'a31913cc-e34c-4884-9035-14ff2edbf656';

-- Step 5: Delete old user (run after Step 4 succeeds)
-- DELETE FROM users WHERE id = 'a31913cc-e34c-4884-9035-14ff2edbf656';

-- Step 6: Recreate constraint (run after Step 5 succeeds)
-- ALTER TABLE scores
-- ADD CONSTRAINT scores_user_id_fkey
-- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 7: Verify (run at the end)
-- SELECT id, email, display_name, is_admin,
--   (SELECT COUNT(*) FROM scores WHERE user_id = users.id) as score_count
-- FROM users
-- WHERE email = 'admin@todaysmartsolutions.com';
