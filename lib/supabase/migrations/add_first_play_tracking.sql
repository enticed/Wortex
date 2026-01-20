-- Migration: Add first play of day tracking to scores table
-- This allows us to distinguish between "Pure" (first play, no speed adjustment)
-- and "Boosted" (repeat play or speed adjustment used) leaderboard rankings

-- Add first_play_of_day column to scores table
ALTER TABLE scores
ADD COLUMN IF NOT EXISTS first_play_of_day BOOLEAN DEFAULT FALSE NOT NULL;

-- Add index for efficient leaderboard queries
CREATE INDEX IF NOT EXISTS scores_first_play_idx ON scores(first_play_of_day);
CREATE INDEX IF NOT EXISTS scores_speed_idx ON scores(speed);

-- Drop existing views first to avoid column mismatch errors
DROP VIEW IF EXISTS leaderboards CASCADE;
DROP VIEW IF EXISTS leaderboards_pure CASCADE;
DROP VIEW IF EXISTS leaderboards_boosted CASCADE;
DROP VIEW IF EXISTS global_leaderboards_pure CASCADE;
DROP VIEW IF EXISTS global_leaderboards_boosted CASCADE;

-- Create Pure leaderboard view (first play of day with default speed only)
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
WHERE s.first_play_of_day = TRUE AND s.speed = 1.0
ORDER BY s.puzzle_id, rank;

-- Create Boosted leaderboard view (all scores not in Pure category)
CREATE VIEW leaderboards_boosted AS
SELECT
  s.puzzle_id,
  s.user_id,
  u.display_name,
  s.score,
  s.bonus_correct,
  s.speed,
  RANK() OVER (PARTITION BY s.puzzle_id ORDER BY s.score ASC) as rank,
  p.date as puzzle_date
FROM scores s
JOIN users u ON s.user_id = u.id
JOIN puzzles p ON s.puzzle_id = p.id
WHERE s.first_play_of_day = FALSE OR s.speed != 1.0
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
WHERE s.first_play_of_day = TRUE AND s.speed = 1.0
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
WHERE s.first_play_of_day = FALSE OR s.speed != 1.0
GROUP BY s.user_id, u.display_name
HAVING COUNT(*) >= 1
ORDER BY rank;

-- Backfill existing scores: mark all existing scores as first_play_of_day = TRUE
-- This ensures current players are grandfathered into the Pure leaderboard
UPDATE scores
SET first_play_of_day = TRUE
WHERE first_play_of_day = FALSE;

-- Comment: Going forward, the score submission logic will automatically determine
-- if a game is the first play of the day by checking if the user has already
-- played the current puzzle before.
