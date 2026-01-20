-- Check today's puzzle and its scores

-- 1. Show all puzzles with their dates and score counts
SELECT
  p.id,
  p.date,
  p.created_at,
  COUNT(s.id) as score_count
FROM puzzles p
LEFT JOIN scores s ON s.puzzle_id = p.id
GROUP BY p.id, p.date, p.created_at
ORDER BY p.date DESC
LIMIT 10;

-- 2. Check what "today" is based on created_at timestamps
SELECT
  DATE(created_at AT TIME ZONE 'UTC') as date_utc,
  DATE(created_at AT TIME ZONE 'America/New_York') as date_est,
  DATE(created_at AT TIME ZONE 'America/Los_Angeles') as date_pst,
  COUNT(*) as score_count
FROM scores
GROUP BY DATE(created_at AT TIME ZONE 'UTC'),
         DATE(created_at AT TIME ZONE 'America/New_York'),
         DATE(created_at AT TIME ZONE 'America/Los_Angeles')
ORDER BY date_utc DESC;

-- 3. Show the most recent puzzle
SELECT * FROM puzzles
ORDER BY date DESC
LIMIT 1;

-- 4. Show scores with their puzzle dates
SELECT
  s.id,
  s.user_id,
  s.score,
  s.speed,
  s.first_play_of_day,
  s.created_at,
  p.date as puzzle_date
FROM scores s
LEFT JOIN puzzles p ON s.puzzle_id = p.id
ORDER BY s.created_at DESC
LIMIT 10;

-- 5. Check if the puzzle IDs in scores actually match existing puzzles
SELECT
  s.puzzle_id,
  CASE WHEN p.id IS NULL THEN 'MISSING' ELSE 'EXISTS' END as puzzle_status,
  COUNT(*) as score_count
FROM scores s
LEFT JOIN puzzles p ON s.puzzle_id = p.id
GROUP BY s.puzzle_id, p.id
ORDER BY score_count DESC;
