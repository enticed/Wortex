-- Add theme column to puzzles table
-- Theme is a short description (1-2 sentences) of the puzzle's theme or topic

ALTER TABLE puzzles
ADD COLUMN IF NOT EXISTS theme TEXT;

COMMENT ON COLUMN puzzles.theme IS 'Theme or topic description for the puzzle (displayed during Bonus Round)';
