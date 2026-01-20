-- Fix: Update leaderboard views to use tolerance-based speed comparison
-- This prevents floating-point precision issues from excluding Pure rankings

-- Drop existing views
DROP VIEW IF EXISTS leaderboards CASCADE;
DROP VIEW IF EXISTS leaderboards_pure CASCADE;
DROP VIEW IF EXISTS leaderboards_boosted CASCADE;
DROP VIEW IF EXISTS global_leaderboards_pure CASCADE;
DROP VIEW IF EXISTS global_leaderboards_boosted CASCADE;

-- Create Pure leaderboard view with tolerance-based speed comparison
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
WHERE s.first_play_of_day = TRUE
  AND s.speed >= 0.99
  AND s.speed <= 1.01
ORDER BY s.puzzle_id, rank;

-- Create Boosted leaderboard view
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
WHERE s.first_play_of_day = FALSE
  OR s.speed < 0.99
  OR s.speed > 1.01
ORDER BY s.puzzle_id, rank;

-- Create the updated leaderboards view
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

-- Create Pure global leaderboard view with tolerance
CREATE VIEW global_leaderboards_pure AS
SELECT
  s.user_id,
  u.display_name,
  AVG(s.score) as average_score,
  COUNT(*) as total_games,
  RANK() OVER (ORDER BY AVG(s.score) ASC) as rank
FROM scores s
JOIN users u ON s.user_id = u.id
WHERE s.first_play_of_day = TRUE
  AND s.speed >= 0.99
  AND s.speed <= 1.01
GROUP BY s.user_id, u.display_name
HAVING COUNT(*) >= 1
ORDER BY rank;

-- Create Boosted global leaderboard view
CREATE VIEW global_leaderboards_boosted AS
SELECT
  s.user_id,
  u.display_name,
  AVG(s.score) as average_score,
  COUNT(*) as total_games,
  RANK() OVER (ORDER BY AVG(s.score) ASC) as rank
FROM scores s
JOIN users u ON s.user_id = u.id
WHERE s.first_play_of_day = FALSE
  OR s.speed < 0.99
  OR s.speed > 1.01
GROUP BY s.user_id, u.display_name
HAVING COUNT(*) >= 1
ORDER BY rank;
