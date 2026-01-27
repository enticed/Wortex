-- ============================================================================
-- FIX: REMOVE UNIQUE CONSTRAINT TO ALLOW MULTIPLE SCORES PER USER PER PUZZLE
-- ============================================================================
-- This migration removes the unique constraint that prevents users from
-- submitting multiple scores for the same puzzle.
--
-- IMPORTANT: Run this immediately to fix the score submission issue!

-- Drop the unique constraint that's blocking multiple scores
ALTER TABLE scores DROP CONSTRAINT IF EXISTS scores_user_id_puzzle_id_key;

-- Verify the constraint is gone
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'scores' AND constraint_type = 'UNIQUE';

-- Expected result: Should NOT show scores_user_id_puzzle_id_key
