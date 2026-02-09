-- ============================================================================
-- LEADERBOARD ENHANCEMENTS MIGRATION
-- ============================================================================
-- This script adds the following enhancements to the leaderboard system:
-- 1. Adds 'stars' column to daily leaderboard views (leaderboards_pure, leaderboards_boosted)
-- 2. Adds total_stars_pure and total_stars_boosted columns to stats table
-- 3. Updates update_user_stats() function to track total stars earned
-- 4. Updates global leaderboard views to include total_stars
--
-- Run this script against your Supabase database.
-- ============================================================================

-- Step 1: Add total_stars columns to stats table
ALTER TABLE stats
  ADD COLUMN IF NOT EXISTS total_stars_pure INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_stars_boosted INTEGER DEFAULT 0;

-- Step 2: Recreate leaderboard views with stars column

-- Drop existing views first
DROP VIEW IF EXISTS leaderboards_pure CASCADE;
DROP VIEW IF EXISTS leaderboards_boosted CASCADE;
DROP VIEW IF EXISTS global_leaderboards_pure CASCADE;
DROP VIEW IF EXISTS global_leaderboards_boosted CASCADE;

-- Create Pure leaderboard view (first play of day with NO speed adjustments throughout game)
-- Shows only the BEST score per user per puzzle, now including stars
CREATE VIEW leaderboards_pure AS
WITH best_pure_scores AS (
  SELECT DISTINCT ON (s.puzzle_id, s.user_id)
    s.puzzle_id,
    s.user_id,
    s.score,
    s.bonus_correct,
    s.stars
  FROM scores s
  WHERE s.first_play_of_day = TRUE AND s.min_speed = 1.0 AND s.max_speed = 1.0
  ORDER BY s.puzzle_id, s.user_id, s.score ASC
)
SELECT
  b.puzzle_id,
  b.user_id,
  u.display_name,
  b.score,
  b.bonus_correct,
  b.stars,
  RANK() OVER (PARTITION BY b.puzzle_id ORDER BY b.score ASC) as rank,
  p.date as puzzle_date
FROM best_pure_scores b
JOIN users u ON b.user_id = u.id
JOIN puzzles p ON b.puzzle_id = p.id
ORDER BY b.puzzle_id, rank;

-- Create Boosted leaderboard view (repeat plays or speed adjustments used)
-- Shows only the BEST score per user per puzzle, now including stars
CREATE VIEW leaderboards_boosted AS
WITH best_boosted_scores AS (
  SELECT DISTINCT ON (s.puzzle_id, s.user_id)
    s.puzzle_id,
    s.user_id,
    s.score,
    s.bonus_correct,
    s.min_speed,
    s.max_speed,
    s.stars
  FROM scores s
  WHERE s.first_play_of_day = FALSE OR s.min_speed != 1.0 OR s.max_speed != 1.0
  ORDER BY s.puzzle_id, s.user_id, s.score ASC
)
SELECT
  b.puzzle_id,
  b.user_id,
  u.display_name,
  b.score,
  b.bonus_correct,
  b.min_speed,
  b.max_speed,
  b.stars,
  RANK() OVER (PARTITION BY b.puzzle_id ORDER BY b.score ASC) as rank,
  p.date as puzzle_date
FROM best_boosted_scores b
JOIN users u ON b.user_id = u.id
JOIN puzzles p ON b.puzzle_id = p.id
ORDER BY b.puzzle_id, rank;

-- Create Pure global leaderboard view (average scores from Pure games only)
-- Now includes total_stars_pure for total stars ranking
CREATE VIEW global_leaderboards_pure AS
SELECT
  s.user_id,
  u.display_name,
  AVG(s.score) as average_score,
  COUNT(*) as total_games,
  COALESCE(MAX(st.total_stars_pure), 0) as total_stars,
  RANK() OVER (ORDER BY AVG(s.score) ASC) as rank
FROM scores s
JOIN users u ON s.user_id = u.id
LEFT JOIN stats st ON s.user_id = st.user_id
WHERE s.first_play_of_day = TRUE AND s.min_speed = 1.0 AND s.max_speed = 1.0
GROUP BY s.user_id, u.display_name
HAVING COUNT(*) >= 1
ORDER BY rank;

-- Create Boosted global leaderboard view (average scores from Boosted games)
-- Now includes total_stars_boosted for total stars ranking
CREATE VIEW global_leaderboards_boosted AS
SELECT
  s.user_id,
  u.display_name,
  AVG(s.score) as average_score,
  COUNT(*) as total_games,
  COALESCE(MAX(st.total_stars_boosted), 0) as total_stars,
  RANK() OVER (ORDER BY AVG(s.score) ASC) as rank
FROM scores s
JOIN users u ON s.user_id = u.id
LEFT JOIN stats st ON s.user_id = st.user_id
WHERE s.first_play_of_day = FALSE OR s.min_speed != 1.0 OR s.max_speed != 1.0
GROUP BY s.user_id, u.display_name
HAVING COUNT(*) >= 1
ORDER BY rank;

-- Step 3: Update the update_user_stats() function to track total stars
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_current_total INTEGER;
  v_current_avg NUMERIC;
  v_puzzle_date DATE;
  v_is_pure BOOLEAN;
  v_current_stars_pure INTEGER;
  v_current_stars_boosted INTEGER;
BEGIN
  -- Lock the stats row for this user to prevent concurrent updates
  SELECT total_games, average_score, total_stars_pure, total_stars_boosted
  INTO v_current_total, v_current_avg, v_current_stars_pure, v_current_stars_boosted
  FROM stats
  WHERE user_id = NEW.user_id
  FOR UPDATE;

  -- Get puzzle date once
  SELECT date INTO v_puzzle_date FROM puzzles WHERE id = NEW.puzzle_id;

  -- Determine if this is a Pure or Boosted score
  v_is_pure := (NEW.first_play_of_day = TRUE
                AND COALESCE(NEW.min_speed, 1.0) = 1.0
                AND COALESCE(NEW.max_speed, 1.0) = 1.0);

  -- If stats don't exist yet, insert them
  IF NOT FOUND THEN
    INSERT INTO stats (
      user_id,
      total_games,
      average_score,
      last_played_date,
      total_stars_pure,
      total_stars_boosted
    )
    VALUES (
      NEW.user_id,
      1,
      NEW.score,
      v_puzzle_date,
      CASE WHEN v_is_pure THEN COALESCE(NEW.stars, 0) ELSE 0 END,
      CASE WHEN NOT v_is_pure THEN COALESCE(NEW.stars, 0) ELSE 0 END
    );
  ELSE
    -- Update existing stats with locked values
    UPDATE stats
    SET
      total_games = v_current_total + 1,
      average_score = (v_current_avg * v_current_total + NEW.score) / (v_current_total + 1),
      last_played_date = v_puzzle_date,
      total_stars_pure = CASE
        WHEN v_is_pure THEN COALESCE(v_current_stars_pure, 0) + COALESCE(NEW.stars, 0)
        ELSE COALESCE(v_current_stars_pure, 0)
      END,
      total_stars_boosted = CASE
        WHEN NOT v_is_pure THEN COALESCE(v_current_stars_boosted, 0) + COALESCE(NEW.stars, 0)
        ELSE COALESCE(v_current_stars_boosted, 0)
      END,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Backfill existing total_stars data for users who already have scores
-- This calculates the total stars for all existing pure and boosted scores
UPDATE stats st
SET
  total_stars_pure = COALESCE((
    SELECT SUM(s.stars)
    FROM scores s
    WHERE s.user_id = st.user_id
      AND s.first_play_of_day = TRUE
      AND s.min_speed = 1.0
      AND s.max_speed = 1.0
      AND s.stars IS NOT NULL
  ), 0),
  total_stars_boosted = COALESCE((
    SELECT SUM(s.stars)
    FROM scores s
    WHERE s.user_id = st.user_id
      AND (s.first_play_of_day = FALSE OR s.min_speed != 1.0 OR s.max_speed != 1.0)
      AND s.stars IS NOT NULL
  ), 0);

-- Grant permissions on the new views to authenticated users
GRANT SELECT ON leaderboards_pure TO authenticated;
GRANT SELECT ON leaderboards_boosted TO authenticated;
GRANT SELECT ON global_leaderboards_pure TO authenticated;
GRANT SELECT ON global_leaderboards_boosted TO authenticated;

-- Verification queries (run these to check the migration worked)
-- Uncomment to verify:

-- SELECT 'Stats table structure' as check_type;
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'stats' AND column_name LIKE 'total_stars%';

-- SELECT 'Sample Pure leaderboard with stars' as check_type;
-- SELECT * FROM leaderboards_pure LIMIT 5;

-- SELECT 'Sample Global Pure leaderboard with total_stars' as check_type;
-- SELECT * FROM global_leaderboards_pure LIMIT 5;

-- SELECT 'Stats with total stars' as check_type;
-- SELECT user_id, total_games, total_stars_pure, total_stars_boosted
-- FROM stats WHERE total_stars_pure > 0 OR total_stars_boosted > 0 LIMIT 5;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
