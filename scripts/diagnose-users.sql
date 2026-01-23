-- Check how many users exist with this email
SELECT
  id,
  email,
  display_name,
  is_admin,
  created_at
FROM users
WHERE email = 'admin@todaysmartsolutions.com'
ORDER BY created_at;
