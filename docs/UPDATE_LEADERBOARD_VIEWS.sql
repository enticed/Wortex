-- ============================================================================
-- UPDATE LEADERBOARD VIEWS TO SHOW ONLY BEST SCORE PER USER
-- ============================================================================
-- This script updates the leaderboard views to show only the best (lowest)
-- score per user per puzzle, rather than showing all qualifying scores.
--
-- Run this after MIGRATION_ADD_SPEED_TRACKING.sql has already been run.

-- Drop existing views first
DROP VIEW IF EXISTS leaderboards CASCADE;
DROP VIEW IF EXISTS leaderboards_pure CASCADE;
DROP VIEW IF EXISTS leaderboards_boosted CASCADE;
DROP VIEW IF EXISTS global_leaderboards_pure CASCADE;
DROP VIEW IF EXISTS global_leaderboards_boosted CASCADE;

-- Create Pure leaderboard view (first play of day with NO speed adjustments throughout game)
-- Shows only the BEST score per user per puzzle
CREATE VIEW leaderboards_pure AS
WITH best_pure_scores AS (
  SELECT DISTINCT ON (s.puzzle_id, s.user_id)
    s.puzzle_id,
    s.user_id,
    s.score,
    s.bonus_correct
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
  RANK() OVER (PARTITION BY b.puzzle_id ORDER BY b.score ASC) as rank,
  p.date as puzzle_date
FROM best_pure_scores b
JOIN users u ON b.user_id = u.id
JOIN puzzles p ON b.puzzle_id = p.id
ORDER BY b.puzzle_id, rank;

-- Create Boosted leaderboard view (repeat plays or speed adjustments used)
-- Shows only the BEST score per user per puzzle
CREATE VIEW leaderboards_boosted AS
WITH best_boosted_scores AS (
  SELECT DISTINCT ON (s.puzzle_id, s.user_id)
    s.puzzle_id,
    s.user_id,
    s.score,
    s.bonus_correct,
    s.min_speed,
    s.max_speed
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
  RANK() OVER (PARTITION BY b.puzzle_id ORDER BY b.score ASC) as rank,
  p.date as puzzle_date
FROM best_boosted_scores b
JOIN users u ON b.user_id = u.id
JOIN puzzles p ON b.puzzle_id = p.id
ORDER BY b.puzzle_id, rank;

-- Create the updated leaderboards view to include the new fields
-- This view still shows ALL scores (not deduplicated) for backwards compatibility
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
