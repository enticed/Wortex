-- Check if scores meet the Pure leaderboard criteria

-- 1. Check all scores with their relevant fields
SELECT
  s.id,
  s.puzzle_id,
  s.user_id,
  s.score,
  s.speed,
  s.first_play_of_day,
  s.created_at,
  p.date as puzzle_date,
  u.display_name
FROM scores s
LEFT JOIN puzzles p ON s.puzzle_id = p.id
LEFT JOIN users u ON s.user_id = u.id
ORDER BY s.created_at DESC;

-- 2. Count scores by Pure leaderboard criteria
SELECT
  COUNT(*) FILTER (WHERE first_play_of_day = TRUE AND speed = 1.0) as pure_eligible,
  COUNT(*) FILTER (WHERE first_play_of_day = FALSE OR speed != 1.0) as boosted_eligible,
  COUNT(*) as total_scores
FROM scores;

-- 3. Check speed values (to see if there's a precision issue)
SELECT DISTINCT speed, COUNT(*) as count
FROM scores
GROUP BY speed
ORDER BY speed;

-- 4. Directly query the Pure leaderboard view
SELECT * FROM leaderboards_pure;

-- 5. Directly query the Boosted leaderboard view
SELECT * FROM leaderboards_boosted;

-- 6. Check if there's a specific puzzle that should have scores today
SELECT
  p.id,
  p.date,
  p.created_at,
  COUNT(s.id) as score_count,
  COUNT(s.id) FILTER (WHERE s.first_play_of_day = TRUE AND s.speed = 1.0) as pure_count,
  COUNT(s.id) FILTER (WHERE s.first_play_of_day = FALSE OR s.speed != 1.0) as boosted_count
FROM puzzles p
LEFT JOIN scores s ON s.puzzle_id = p.id
WHERE p.date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY p.id, p.date, p.created_at
ORDER BY p.date DESC;
