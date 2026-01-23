-- FINAL FIX: Create new user, migrate scores, delete old user
-- Problem: Only the OLD user exists in users table, but auth account exists for NEW user

-- Step 1: Create the new user record (it doesn't exist yet!)
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
VALUES (
  'dd32505d-acfc-4200-a1e2-321858816349',
  'admin_temp@todaysmartsolutions.com', -- Temporary email to avoid conflict
  'TSSadmin',
  false,
  true,
  'UTC',
  'none',
  NOW(),
  NOW()
);

-- Step 2: Now both users exist - migrate scores
UPDATE scores
SET user_id = 'dd32505d-acfc-4200-a1e2-321858816349'
WHERE user_id = 'a31913cc-e34c-4884-9035-14ff2edbf656';

-- Step 3: Delete old user
DELETE FROM users WHERE id = 'a31913cc-e34c-4884-9035-14ff2edbf656';

-- Step 4: Fix the email on the new user (now that old user is gone)
UPDATE users
SET email = 'admin@todaysmartsolutions.com'
WHERE id = 'dd32505d-acfc-4200-a1e2-321858816349';

-- Verify
SELECT
  'Success!' as status,
  id,
  email,
  display_name,
  is_admin,
  (SELECT COUNT(*) FROM scores WHERE user_id = users.id) as score_count
FROM users
WHERE id = 'dd32505d-acfc-4200-a1e2-321858816349';
