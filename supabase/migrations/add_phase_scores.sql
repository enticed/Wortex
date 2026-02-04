-- Add phase1_score and phase2_score columns to scores table
ALTER TABLE scores
ADD COLUMN phase1_score DECIMAL(10, 2),
ADD COLUMN phase2_score DECIMAL(10, 2);

-- Add comment explaining these fields
COMMENT ON COLUMN scores.phase1_score IS 'Score from Phase 1 (word collection). Lower is better.';
COMMENT ON COLUMN scores.phase2_score IS 'Score from Phase 2 (word reordering). Lower is better. 0.25 points per reorder move, 0.5 points per hint.';

-- Note: Existing rows will have NULL values for phase scores
-- The application should handle NULL by using approximations or hiding the breakdown
