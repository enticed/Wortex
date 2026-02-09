-- Wortex Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  display_name TEXT,
  timezone TEXT DEFAULT 'UTC',
  is_anonymous BOOLEAN DEFAULT TRUE,
  subscription_status TEXT DEFAULT 'none' CHECK (subscription_status IN ('none', 'active', 'expired')),
  subscription_expires_at TIMESTAMPTZ,
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Puzzles table
CREATE TABLE IF NOT EXISTS puzzles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  target_phrase TEXT NOT NULL,
  facsimile_phrase TEXT NOT NULL,
  difficulty INTEGER DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 5),
  bonus_question JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_ai BOOLEAN DEFAULT FALSE,
  approved BOOLEAN DEFAULT FALSE
);

-- Index on date for fast lookups
CREATE INDEX IF NOT EXISTS puzzles_date_idx ON puzzles(date);
CREATE INDEX IF NOT EXISTS puzzles_approved_idx ON puzzles(approved);

-- Scores table
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  puzzle_id UUID NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
  score NUMERIC(10, 2) NOT NULL,
  phase1_score NUMERIC(10, 2) NOT NULL,
  phase2_score NUMERIC(10, 2) NOT NULL,
  bonus_correct BOOLEAN DEFAULT FALSE,
  time_taken_seconds INTEGER NOT NULL,
  speed NUMERIC(3, 2) DEFAULT 1.0 NOT NULL, -- Vortex speed multiplier (0.0 to 2.0)
  min_speed NUMERIC(3, 2), -- Minimum speed used during play
  max_speed NUMERIC(3, 2), -- Maximum speed used during play
  first_play_of_day BOOLEAN DEFAULT TRUE, -- Track if this was the first play
  stars INTEGER CHECK (stars >= 1 AND stars <= 5), -- Star rating (1-5)
  created_at TIMESTAMPTZ DEFAULT NOW()
  -- Note: No UNIQUE constraint - allows multiple scores per user per puzzle for replay functionality
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS scores_user_id_idx ON scores(user_id);
CREATE INDEX IF NOT EXISTS scores_puzzle_id_idx ON scores(puzzle_id);
CREATE INDEX IF NOT EXISTS scores_score_idx ON scores(score);
CREATE INDEX IF NOT EXISTS scores_created_at_idx ON scores(created_at);
CREATE INDEX IF NOT EXISTS idx_scores_first_play_speed ON scores(user_id, puzzle_id, first_play_of_day, speed, min_speed, max_speed);
CREATE INDEX IF NOT EXISTS idx_scores_score_created ON scores(user_id, puzzle_id, score, created_at);

-- Stats table (one row per user)
CREATE TABLE IF NOT EXISTS stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_games INTEGER DEFAULT 0,
  average_score NUMERIC(10, 2) DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_played_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pure Rankings view (first play, default speed only)
CREATE OR REPLACE VIEW pure_rankings AS
SELECT DISTINCT ON (user_id, puzzle_id)
  id,
  user_id,
  puzzle_id,
  score,
  phase1_score,
  phase2_score,
  bonus_correct,
  time_taken_seconds,
  speed,
  min_speed,
  max_speed,
  stars,
  created_at,
  first_play_of_day
FROM scores
WHERE first_play_of_day = TRUE
  AND speed = 1.0
  AND COALESCE(min_speed, 1.0) = 1.0
  AND COALESCE(max_speed, 1.0) = 1.0
ORDER BY user_id, puzzle_id, score ASC, created_at ASC;

-- Boosted Rankings view (best score from replays or speed-adjusted plays)
CREATE OR REPLACE VIEW boosted_rankings AS
SELECT DISTINCT ON (user_id, puzzle_id)
  id,
  user_id,
  puzzle_id,
  score,
  phase1_score,
  phase2_score,
  bonus_correct,
  time_taken_seconds,
  speed,
  min_speed,
  max_speed,
  stars,
  created_at,
  first_play_of_day
FROM scores
WHERE NOT (
  first_play_of_day = TRUE
  AND speed = 1.0
  AND COALESCE(min_speed, 1.0) = 1.0
  AND COALESCE(max_speed, 1.0) = 1.0
)
ORDER BY user_id, puzzle_id, score ASC, created_at ASC;

-- Legacy leaderboard view (for backwards compatibility)
-- TODO: Update leaderboard components to use pure_rankings and boosted_rankings instead
CREATE OR REPLACE VIEW leaderboards AS
SELECT
  s.puzzle_id,
  s.user_id,
  u.display_name,
  s.score,
  RANK() OVER (PARTITION BY s.puzzle_id ORDER BY s.score ASC) as rank,
  p.date as puzzle_date
FROM scores s
JOIN users u ON s.user_id = u.id
JOIN puzzles p ON s.puzzle_id = p.id
ORDER BY s.puzzle_id, rank;

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Puzzles policies (read-only for players)
CREATE POLICY "Anyone can view approved puzzles"
  ON puzzles FOR SELECT
  USING (approved = TRUE);

-- Scores policies
CREATE POLICY "Users can view all scores"
  ON scores FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can insert their own scores"
  ON scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scores"
  ON scores FOR UPDATE
  USING (auth.uid() = user_id);

-- Stats policies
CREATE POLICY "Users can view all stats"
  ON stats FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can update their own stats"
  ON stats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats"
  ON stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Functions

-- Function to update stats after a score is inserted
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_current_total INTEGER;
  v_current_avg NUMERIC;
  v_puzzle_date DATE;
BEGIN
  -- Lock the stats row for this user to prevent concurrent updates
  SELECT total_games, average_score
  INTO v_current_total, v_current_avg
  FROM stats
  WHERE user_id = NEW.user_id
  FOR UPDATE;

  -- Get puzzle date once
  SELECT date INTO v_puzzle_date FROM puzzles WHERE id = NEW.puzzle_id;

  -- If stats don't exist yet, insert them
  IF NOT FOUND THEN
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

-- Trigger to update stats
CREATE TRIGGER update_stats_after_score
  AFTER INSERT ON scores
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();

-- Function to update streak
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

  -- Update stats
  UPDATE stats
  SET
    current_streak = v_current_streak,
    best_streak = v_best_streak,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some sample data (for development)
INSERT INTO puzzles (date, target_phrase, facsimile_phrase, difficulty, bonus_question, approved)
VALUES (
  CURRENT_DATE,
  'To be or not to be, that is the question',
  'To exist or to cease, this is what we must decide',
  1,
  '{
    "type": "literature",
    "question": "Who wrote this famous line?",
    "options": [
      {"id": "1", "author": "William Shakespeare", "book": "Hamlet"},
      {"id": "2", "author": "Charles Dickens", "book": "Great Expectations"},
      {"id": "3", "author": "Jane Austen", "book": "Pride and Prejudice"},
      {"id": "4", "author": "Mark Twain", "book": "Huckleberry Finn"},
      {"id": "5", "author": "Ernest Hemingway", "book": "The Old Man and the Sea"}
    ],
    "correctAnswerId": "1"
  }'::jsonb,
  TRUE
)
ON CONFLICT (date) DO NOTHING;
