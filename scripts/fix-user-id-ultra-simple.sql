-- Ultra simple: Just update, migrate, and delete

-- Step 1: Update the new user with admin flag (it already exists)
UPDATE users
SET is_admin = true, display_name = 'TSSadmin'
WHERE id = 'dd32505d-acfc-4200-a1e2-321858816349';

-- Step 2: Migrate scores (both users exist now)
UPDATE scores
SET user_id = 'dd32505d-acfc-4200-a1e2-321858816349'
WHERE user_id = 'a31913cc-e34c-4884-9035-14ff2edbf656';

-- Step 3: Delete old user
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
