-- Fix users table foreign key constraints that are blocking anonymous user creation
-- Error 23503 indicates a foreign key violation

-- First, let's see what constraints exist on the users table
-- Run this query in Supabase SQL Editor to see all constraints:
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'users' AND tc.table_schema = 'public';

-- If you see a foreign key constraint to auth.users, drop it:
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- The users table should NOT have foreign keys to other tables
-- The id column should be a simple UUID primary key without foreign key constraints
