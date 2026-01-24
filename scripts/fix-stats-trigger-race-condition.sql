-- Fix the race condition where update_user_stats trigger updates last_played_date
-- before update_user_streak can read it, preventing streak increments

-- Remove last_played_date from the trigger function
-- The update_user_streak function should be the ONLY place that updates last_played_date
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO stats (user_id, total_games, average_score)
  VALUES (
    NEW.user_id,
    1,
    NEW.score
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_games = stats.total_games + 1,
    average_score = (stats.average_score * stats.total_games + NEW.score) / (stats.total_games + 1),
    updated_at = NOW();
  -- REMOVED: last_played_date update (this should only be done by update_user_streak)

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
