-- Add password_hash column to users table for custom auth
-- This migration is safe to run multiple times

-- Add password_hash column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE users ADD COLUMN password_hash TEXT;
    COMMENT ON COLUMN users.password_hash IS 'Bcrypt hash of user password (null for anonymous users)';
  END IF;
END $$;

-- Add email column if it doesn't exist (should already exist, but just in case)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email'
  ) THEN
    ALTER TABLE users ADD COLUMN email TEXT UNIQUE;
    COMMENT ON COLUMN users.email IS 'User email address (unique, nullable for anonymous users)';
  END IF;
END $$;
