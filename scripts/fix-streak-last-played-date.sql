-- Fix the update_user_streak function to also update last_played_date
-- This ensures streak calculations work correctly on subsequent plays
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID, p_puzzle_date DATE)
RETURNS VOID AS $$
DECLARE
  v_last_played DATE;
  v_current_streak INTEGER;
  v_best_streak INTEGER;
BEGIN
  SELECT last_played_date, current_streak, best_streak
  INTO v_last_played, v_current_streak, v_best_streak
  FROM stats
  WHERE user_id = p_user_id;

  -- Handle NULL values (first time playing or no stats record)
  IF v_current_streak IS NULL THEN
    v_current_streak := 0;
  END IF;

  IF v_best_streak IS NULL THEN
    v_best_streak := 0;
  END IF;

  -- If this is the first game (no last played date), start streak at 1
  IF v_last_played IS NULL THEN
    v_current_streak := 1;
  -- If last played was yesterday, increment streak
  ELSIF v_last_played = p_puzzle_date - INTERVAL '1 day' THEN
    v_current_streak := v_current_streak + 1;
  -- If last played was today, keep streak
  ELSIF v_last_played = p_puzzle_date THEN
    -- No change to streak
    NULL;
  -- Otherwise (gap of more than 1 day), reset streak to 1
  ELSE
    v_current_streak := 1;
  END IF;

  -- Update best streak if current is higher
  IF v_current_streak > v_best_streak THEN
    v_best_streak := v_current_streak;
  END IF;

  -- Update stats (now includes last_played_date)
  UPDATE stats
  SET
    current_streak = v_current_streak,
    best_streak = v_best_streak,
    last_played_date = p_puzzle_date,  -- ADD THIS LINE
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
