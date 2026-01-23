-- Migration script for gjavier@gmail.com
-- Run this in Supabase SQL Editor

-- Step 1: Create new user with temporary email
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
  '8c5d350f-9aa0-423a-be2a-66ffd1332f9e',
  'gjavier_temp@gmail.com',
  'Javier',
  false,
  false,
  'UTC',
  'none',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  display_name = 'Javier',
  is_anonymous = false;

-- Step 2: Migrate scores from old ID to new ID
UPDATE scores
SET user_id = '8c5d350f-9aa0-423a-be2a-66ffd1332f9e'
WHERE user_id = '6f887553-4784-4b22-8795-601f9acd01a0';

-- Step 3: Migrate stats if they exist
UPDATE stats
SET user_id = '8c5d350f-9aa0-423a-be2a-66ffd1332f9e'
WHERE user_id = '6f887553-4784-4b22-8795-601f9acd01a0';

-- Step 4: Delete old user record
DELETE FROM users WHERE id = '6f887553-4784-4b22-8795-601f9acd01a0';

-- Step 5: Update email on new user
UPDATE users
SET email = 'gjavier@gmail.com'
WHERE id = '8c5d350f-9aa0-423a-be2a-66ffd1332f9e';

-- Verify
SELECT
  'Success!' as status,
  id,
  email,
  display_name,
  is_admin,
  (SELECT COUNT(*) FROM scores WHERE user_id = users.id) as score_count
FROM users
WHERE email = 'gjavier@gmail.com';
