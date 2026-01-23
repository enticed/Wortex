-- SQL Script to fix user ID mismatch
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/fkzqvhvqyfuxnwdhpytg/sql/new

-- Variables (for reference)
-- OLD_USER_ID: a31913cc-e34c-4884-9035-14ff2edbf656
-- NEW_USER_ID: dd32505d-acfc-4200-a1e2-321858816349

BEGIN;

-- Step 1: Drop ALL foreign key constraints on scores table
-- Find and drop any constraint that references user_id
DO $$
DECLARE
    constraint_name text;
BEGIN
    FOR constraint_name IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'scores'::regclass
        AND contype = 'f'
    LOOP
        EXECUTE 'ALTER TABLE scores DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- Step 2: Update new user record with admin data from old user
UPDATE users
SET
  display_name = (SELECT display_name FROM users WHERE id = 'a31913cc-e34c-4884-9035-14ff2edbf656'),
  is_admin = (SELECT is_admin FROM users WHERE id = 'a31913cc-e34c-4884-9035-14ff2edbf656'),
  timezone = (SELECT timezone FROM users WHERE id = 'a31913cc-e34c-4884-9035-14ff2edbf656'),
  subscription_status = (SELECT subscription_status FROM users WHERE id = 'a31913cc-e34c-4884-9035-14ff2edbf656'),
  last_login = NOW()
WHERE id = 'dd32505d-acfc-4200-a1e2-321858816349';

-- Step 3: Update all scores to point to new user ID (constraint is disabled)
UPDATE scores
SET user_id = 'dd32505d-acfc-4200-a1e2-321858816349'
WHERE user_id = 'a31913cc-e34c-4884-9035-14ff2edbf656';

-- Step 4: Delete old user record (no longer needed)
DELETE FROM users WHERE id = 'a31913cc-e34c-4884-9035-14ff2edbf656';

-- Step 5: Recreate foreign key constraint (after all migrations complete)
ALTER TABLE scores
ADD CONSTRAINT scores_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

COMMIT;

-- Verify the fix
SELECT
  'Verification:' as status,
  id,
  email,
  display_name,
  is_admin,
  (SELECT COUNT(*) FROM scores WHERE user_id = users.id) as score_count
FROM users
WHERE email = 'admin@todaysmartsolutions.com';
