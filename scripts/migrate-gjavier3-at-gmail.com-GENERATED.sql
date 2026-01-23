-- Migration for gjavier3@gmail.com
-- Old ID: f826ad24-e531-40af-8061-2719b1f91290
-- New ID: 09f0cb51-9494-4d5a-9685-7e72249b264a

-- Step 1: Create new user with temporary email
INSERT INTO users (id, email, display_name, is_anonymous, is_admin, timezone, subscription_status, created_at, last_login)
VALUES ('09f0cb51-9494-4d5a-9685-7e72249b264a', 'gjavier3@gmail.com_temp', 'KS10FF', false, false, 'UTC', 'none', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET display_name = 'KS10FF', is_anonymous = false;

-- Step 2: Migrate scores
UPDATE scores SET user_id = '09f0cb51-9494-4d5a-9685-7e72249b264a' WHERE user_id = 'f826ad24-e531-40af-8061-2719b1f91290';

-- Step 3: Migrate stats
UPDATE stats SET user_id = '09f0cb51-9494-4d5a-9685-7e72249b264a' WHERE user_id = 'f826ad24-e531-40af-8061-2719b1f91290';

-- Step 4: Delete old user
DELETE FROM users WHERE id = 'f826ad24-e531-40af-8061-2719b1f91290';

-- Step 5: Fix email
UPDATE users SET email = 'gjavier3@gmail.com' WHERE id = '09f0cb51-9494-4d5a-9685-7e72249b264a';

-- Verify
SELECT 'Success!' as status, id, email, display_name, (SELECT COUNT(*) FROM scores WHERE user_id = users.id) as score_count
FROM users WHERE email = 'gjavier3@gmail.com';
