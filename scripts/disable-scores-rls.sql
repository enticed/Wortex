-- Disable RLS on scores table to allow browser client to insert scores
ALTER TABLE scores DISABLE ROW LEVEL SECURITY;

-- Also check for any policies and drop them
DROP POLICY IF EXISTS "Users can view their own scores" ON scores;
DROP POLICY IF EXISTS "Users can insert their own scores" ON scores;
DROP POLICY IF EXISTS "Enable read access for all scores" ON scores;
DROP POLICY IF EXISTS "Enable insert for users" ON scores;
DROP POLICY IF EXISTS "Enable update for users" ON scores;
