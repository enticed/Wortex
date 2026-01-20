-- Diagnostic queries to check why leaderboard is empty

-- 1. Check scores table data
SELECT
  COUNT(*) as total_scores,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT puzzle_id) as unique_puzzles
FROM scores;

-- 2. Check if users exist for the scores
SELECT
  s.user_id,
  u.id as user_exists,
  u.display_name
FROM scores s
LEFT JOIN users u ON s.user_id = u.id
LIMIT 5;

-- 3. Check if puzzles exist for the scores
SELECT
  s.puzzle_id,
  p.id as puzzle_exists,
  p.date
FROM scores s
LEFT JOIN puzzles p ON s.puzzle_id = p.id
LIMIT 5;

-- 4. Check first_play_of_day distribution
SELECT
  first_play_of_day,
  speed,
  COUNT(*) as count
FROM scores
GROUP BY first_play_of_day, speed
ORDER BY first_play_of_day, speed;

-- 5. Try to manually query what the Pure leaderboard view should return
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
LEFT JOIN users u ON s.user_id = u.id
LEFT JOIN puzzles p ON s.puzzle_id = p.id
WHERE s.first_play_of_day = TRUE AND s.speed = 1.0
ORDER BY s.puzzle_id, rank
LIMIT 10;

-- 6. Check if the views actually exist
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name LIKE '%leaderboard%';

-- 7. Try querying the Pure leaderboard view directly
SELECT * FROM leaderboards_pure LIMIT 10;

-- 8. Try querying the global Pure leaderboard view
SELECT * FROM global_leaderboards_pure LIMIT 10;
