-- Final working version: Update or create new user, then migrate

-- Step 1: Ensure new user has correct admin data
-- First check if it exists and update it
UPDATE users
SET
  display_name = 'TSSadmin',
  is_admin = true,
  timezone = 'UTC',
  subscription_status = 'none',
  last_login = NOW()
WHERE id = 'dd32505d-acfc-4200-a1e2-321858816349';

-- If no rows were updated (user doesn't exist), create it
INSERT INTO users (
  id,
  email,
  display_name,
  is_anonymous,
  is_admin,
  timezone,
  subscription_status,
  created_at,
  last_login
)
SELECT
  'dd32505d-acfc-4200-a1e2-321858816349',
  'admin@todaysmartsolutions.com',
  'TSSadmin',
  false,
  true,
  'UTC',
  'none',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE id = 'dd32505d-acfc-4200-a1e2-321858816349'
);

-- Step 2: Now migrate scores (both users exist, foreign key is satisfied)
UPDATE scores
SET user_id = 'dd32505d-acfc-4200-a1e2-321858816349'
WHERE user_id = 'a31913cc-e34c-4884-9035-14ff2edbf656';

-- Step 3: Delete old user record
DELETE FROM users WHERE id = 'a31913cc-e34c-4884-9035-14ff2edbf656';

-- Verify
SELECT
  'Success!' as status,
  id,
  email,
  display_name,
  is_admin,
  (SELECT COUNT(*) FROM scores WHERE user_id = users.id) as score_count
FROM users
WHERE email = 'admin@todaysmartsolutions.com';
