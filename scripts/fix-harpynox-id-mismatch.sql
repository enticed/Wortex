-- Fix harpynox@gmail.com account ID mismatch (NEW ACCOUNT - NO HISTORY)
-- Database ID: 63243142-1bd1-4115-917c-39f05a140681
-- Auth ID: f6981ac2-84ce-42bd-b081-ac42ea6e4801

BEGIN;

-- Step 1: Create temporary user with new auth ID and temp email
INSERT INTO users (id, email, display_name, is_anonymous, created_at, last_login, password_changed_at)
VALUES (
  'f6981ac2-84ce-42bd-b081-ac42ea6e4801',
  'temp-harpynox@temp.com',
  NULL,
  false,
  NOW(),
  NOW(),
  NOW()
);

-- Step 2: Delete old user record (no scores or stats to migrate since this is a new account)
DELETE FROM users WHERE id = '63243142-1bd1-4115-917c-39f05a140681';

-- Step 3: Update email back to real one
UPDATE users
SET email = 'harpynox@gmail.com'
WHERE id = 'f6981ac2-84ce-42bd-b081-ac42ea6e4801';

COMMIT;

-- Verify the fix
SELECT 'User record:' as check_type, id, email, is_anonymous, created_at FROM users WHERE email = 'harpynox@gmail.com';
SELECT 'Score count:' as check_type, COUNT(*) as count FROM scores WHERE user_id = 'f6981ac2-84ce-42bd-b081-ac42ea6e4801';
SELECT 'Stats record:' as check_type, user_id, total_games, average_score FROM stats WHERE user_id = 'f6981ac2-84ce-42bd-b081-ac42ea6e4801';
