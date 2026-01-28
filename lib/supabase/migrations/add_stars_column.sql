-- Add stars column to scores table
-- Stars represent the final game rating (1-5 stars) shown in FinalResults

ALTER TABLE scores
ADD COLUMN IF NOT EXISTS stars INTEGER CHECK (stars >= 0 AND stars <= 5);

-- Add index for efficient star-based queries
CREATE INDEX IF NOT EXISTS idx_scores_stars ON scores(stars);

-- Add index for Pure/Boosted game queries with stars
CREATE INDEX IF NOT EXISTS idx_scores_user_first_play_stars ON scores(user_id, first_play_of_day, stars);
CREATE INDEX IF NOT EXISTS idx_scores_user_speed_stars ON scores(user_id, min_speed, max_speed, stars);

COMMENT ON COLUMN scores.stars IS 'Final star rating (1-5) for the completed game';
