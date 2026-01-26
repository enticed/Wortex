-- ============================================================================
-- ADD SPEED TRACKING (MIN/MAX SPEEDS)
-- ============================================================================
-- This migration adds columns to track the minimum and maximum speeds
-- used during a game, allowing for accurate "Pure Rankings" filtering
-- and better speed reporting in leaderboards.

-- Add min_speed and max_speed columns to scores table
ALTER TABLE scores
ADD COLUMN IF NOT EXISTS min_speed NUMERIC(3, 2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS max_speed NUMERIC(3, 2) DEFAULT 1.0;

-- Update existing rows to use the current speed value for both min and max
UPDATE scores
SET min_speed = speed, max_speed = speed
WHERE min_speed IS NULL OR max_speed IS NULL;

-- Make the columns NOT NULL after populating existing data
ALTER TABLE scores
ALTER COLUMN min_speed SET NOT NULL,
ALTER COLUMN max_speed SET NOT NULL;

-- Add check constraint to ensure min_speed <= max_speed
ALTER TABLE scores
ADD CONSTRAINT scores_speed_range_check
CHECK (min_speed <= max_speed);

-- Add comment explaining the purpose
COMMENT ON COLUMN scores.min_speed IS 'Minimum vortex speed used during gameplay (0.25 to 2.0)';
COMMENT ON COLUMN scores.max_speed IS 'Maximum vortex speed used during gameplay (0.25 to 2.0)';

-- ============================================================================
-- UPDATE LEADERBOARD VIEWS TO USE MIN/MAX SPEED
-- ============================================================================

-- Drop existing views first
DROP VIEW IF EXISTS leaderboards CASCADE;
DROP VIEW IF EXISTS leaderboards_pure CASCADE;
DROP VIEW IF EXISTS leaderboards_boosted CASCADE;
DROP VIEW IF EXISTS global_leaderboards_pure CASCADE;
DROP VIEW IF EXISTS global_leaderboards_boosted CASCADE;

-- Create Pure leaderboard view (first play of day with NO speed adjustments throughout game)
CREATE VIEW leaderboards_pure AS
SELECT
  s.puzzle_id,
  s.user_id,
  u.display_name,
  s.score,
  s.bonus_correct,
  RANK() OVER (PARTITION BY s.puzzle_id ORDER BY s.score ASC) as rank,
  p.date as puzzle_date
FROM scores s
JOIN users u ON s.user_id = u.id
JOIN puzzles p ON s.puzzle_id = p.id
WHERE s.first_play_of_day = TRUE AND s.min_speed = 1.0 AND s.max_speed = 1.0
ORDER BY s.puzzle_id, rank;

-- Create Boosted leaderboard view (repeat plays or speed adjustments used)
CREATE VIEW leaderboards_boosted AS
SELECT
  s.puzzle_id,
  s.user_id,
  u.display_name,
  s.score,
  s.bonus_correct,
  s.min_speed,
  s.max_speed,
  RANK() OVER (PARTITION BY s.puzzle_id ORDER BY s.score ASC) as rank,
  p.date as puzzle_date
FROM scores s
JOIN users u ON s.user_id = u.id
JOIN puzzles p ON s.puzzle_id = p.id
WHERE s.first_play_of_day = FALSE OR s.min_speed != 1.0 OR s.max_speed != 1.0
ORDER BY s.puzzle_id, rank;

-- Create the updated leaderboards view to include the new fields
CREATE VIEW leaderboards AS
SELECT
  s.puzzle_id,
  s.user_id,
  u.display_name,
  s.score,
  s.bonus_correct,
  s.speed,
  s.min_speed,
  s.max_speed,
  s.first_play_of_day,
  RANK() OVER (PARTITION BY s.puzzle_id ORDER BY s.score ASC) as rank,
  p.date as puzzle_date
FROM scores s
JOIN users u ON s.user_id = u.id
JOIN puzzles p ON s.puzzle_id = p.id
ORDER BY s.puzzle_id, rank;

-- Create Pure global leaderboard view (average scores from Pure games only)
CREATE VIEW global_leaderboards_pure AS
SELECT
  s.user_id,
  u.display_name,
  AVG(s.score) as average_score,
  COUNT(*) as total_games,
  RANK() OVER (ORDER BY AVG(s.score) ASC) as rank
FROM scores s
JOIN users u ON s.user_id = u.id
WHERE s.first_play_of_day = TRUE AND s.min_speed = 1.0 AND s.max_speed = 1.0
GROUP BY s.user_id, u.display_name
HAVING COUNT(*) >= 1
ORDER BY rank;

-- Create Boosted global leaderboard view (average scores from Boosted games)
CREATE VIEW global_leaderboards_boosted AS
SELECT
  s.user_id,
  u.display_name,
  AVG(s.score) as average_score,
  COUNT(*) as total_games,
  RANK() OVER (ORDER BY AVG(s.score) ASC) as rank
FROM scores s
JOIN users u ON s.user_id = u.id
WHERE s.first_play_of_day = FALSE OR s.min_speed != 1.0 OR s.max_speed != 1.0
GROUP BY s.user_id, u.display_name
HAVING COUNT(*) >= 1
ORDER BY rank;
