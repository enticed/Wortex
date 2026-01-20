-- Migration: Add support for authenticated user accounts
-- This enables users to upgrade from anonymous to email/password accounts
-- while preserving all their game data, scores, and stats

-- Add email column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create unique index for email (excluding NULL values for anonymous users)
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email)
WHERE email IS NOT NULL;

-- Add password_changed_at timestamp for security tracking
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;

-- Add last_login timestamp for activity tracking
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email)
WHERE email IS NOT NULL;

-- Update RLS policies to ensure authenticated users can access their data
-- (These policies should already exist, but we'll ensure they're correct)

-- Drop and recreate user update policy to include email updates
DROP POLICY IF EXISTS "Users can update their own data" ON users;
CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure users can insert their own records (for account creation)
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
CREATE POLICY "Users can insert their own data"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Comment: Migration complete
-- Users can now:
-- 1. Upgrade from anonymous to authenticated accounts
-- 2. Sign up directly with email/password
-- 3. Sign in with existing credentials
-- All existing anonymous users are unaffected and can continue playing
