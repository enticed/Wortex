-- Migration: Fix first_play_of_day flags for existing scores
-- This fixes scores that were incorrectly marked as false due to replays

-- Strategy: Mark a score as first_play_of_day = TRUE if it's the only score
-- for that user+puzzle combination, OR if it was created first chronologically

-- First, for any user+puzzle combination with only one score, mark it as first play
UPDATE scores s1
SET first_play_of_day = TRUE
WHERE first_play_of_day = FALSE
  AND NOT EXISTS (
    SELECT 1 FROM scores s2
    WHERE s2.user_id = s1.user_id
      AND s2.puzzle_id = s1.puzzle_id
      AND s2.id != s1.id
  );

-- For user+puzzle combinations with multiple entries (shouldn't exist with unique constraint,
-- but just in case), mark the earliest one as first play
-- Note: This is a safeguard and shouldn't affect data with proper unique constraints
UPDATE scores s1
SET first_play_of_day = TRUE
WHERE first_play_of_day = FALSE
  AND s1.created_at = (
    SELECT MIN(s2.created_at)
    FROM scores s2
    WHERE s2.user_id = s1.user_id
      AND s2.puzzle_id = s1.puzzle_id
  );

-- Show summary of changes
SELECT
  COUNT(*) as total_scores,
  COUNT(*) FILTER (WHERE first_play_of_day = TRUE) as first_plays,
  COUNT(*) FILTER (WHERE first_play_of_day = FALSE) as replays
FROM scores;
