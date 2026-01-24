-- Manually fix ZiP11S streak based on play history
-- User played on consecutive days: 2026-01-22, 2026-01-23, 2026-01-24
-- Current streak should be 3

UPDATE stats
SET
  current_streak = 3,
  best_streak = GREATEST(best_streak, 3)
WHERE user_id = 'f6981ac2-84ce-42bd-b081-ac42ea6e4801';

-- Verify the update
SELECT
  user_id,
  current_streak,
  best_streak,
  last_played_date
FROM stats
WHERE user_id = 'f6981ac2-84ce-42bd-b081-ac42ea6e4801';
