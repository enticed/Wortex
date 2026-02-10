-- Fix the update_user_stats trigger function
-- Bug: NOT FOUND was checking the puzzle query instead of stats query
-- This caused stats rows to never be created for new users

CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_current_total INTEGER;
  v_current_avg NUMERIC;
  v_puzzle_date DATE;
  v_stats_exist BOOLEAN;
BEGIN
  -- Check if stats row exists for this user
  SELECT total_games, average_score
  INTO v_current_total, v_current_avg
  FROM stats
  WHERE user_id = NEW.user_id
  FOR UPDATE;

  -- Store whether stats were found BEFORE the next query
  v_stats_exist := FOUND;

  -- Get puzzle date
  SELECT date INTO v_puzzle_date FROM puzzles WHERE id = NEW.puzzle_id;

  -- If stats don't exist yet, insert them
  IF NOT v_stats_exist THEN
    INSERT INTO stats (user_id, total_games, average_score, last_played_date)
    VALUES (
      NEW.user_id,
      1,
      NEW.score,
      v_puzzle_date
    );
  ELSE
    -- Update existing stats with locked values
    UPDATE stats
    SET
      total_games = v_current_total + 1,
      average_score = (v_current_avg * v_current_total + NEW.score) / (v_current_total + 1),
      last_played_date = v_puzzle_date,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
