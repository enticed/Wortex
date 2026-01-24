-- Query to see the current definition of update_user_streak function
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'update_user_streak';
