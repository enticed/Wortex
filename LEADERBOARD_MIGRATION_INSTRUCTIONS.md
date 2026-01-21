# Leaderboard Migration Instructions

## Overview
This migration adds support for two separate leaderboard rankings:
- **Pure Rankings**: First play of the puzzle with no speed adjustments (1.0x speed only)
- **Boosted Rankings**: Repeat plays and/or games with speed adjustments

## How to Apply the Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Navigate to the **SQL Editor** in the left sidebar
3. Open the migration file: `lib/supabase/migrations/add_first_play_tracking.sql`
4. Copy the entire contents of the SQL file
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration
7. Verify success - you should see "Success. No rows returned"

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db push
```

Or run the migration directly:

```bash
supabase db execute -f lib/supabase/migrations/add_first_play_tracking.sql
```

### Option 3: Using psql (Direct Database Connection)

If you have direct PostgreSQL access:

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f lib/supabase/migrations/add_first_play_tracking.sql
```

## What the Migration Does

1. **Adds `first_play_of_day` column** to the `scores` table
   - Boolean field tracking if this was the player's first attempt at the puzzle
   - Defaults to FALSE for new scores

2. **Creates indexes** for efficient querying:
   - `scores_first_play_idx` on `first_play_of_day`
   - `scores_speed_idx` on `speed`

3. **Creates new database views**:
   - `leaderboards_pure` - Daily Pure rankings
   - `leaderboards_boosted` - Daily Boosted rankings
   - `global_leaderboards_pure` - All-time Pure average scores
   - `global_leaderboards_boosted` - All-time Boosted average scores

4. **Updates existing view**:
   - `leaderboards` - Now includes additional fields

5. **Backfills existing data**:
   - Sets all existing scores to `first_play_of_day = TRUE`
   - This grandfathers existing players into the Pure leaderboard

## After Migration

### Automatic Behavior

From now on, when a score is submitted:
- The system checks if the user has already played this puzzle
- First-time plays are marked as `first_play_of_day = TRUE`
- Subsequent plays are marked as `first_play_of_day = FALSE`

### Leaderboard Display

The leaderboard page now shows two sections in each tab:

**Daily Tab:**
- Pure Rankings (first play, 1.0x speed) - Green header
- Boosted Rankings (repeat plays or speed adjustments) - Purple header

**Global Tab:**
- Pure Rankings - Best Averages (Pure games only) - Green header
- Boosted Rankings - Best Averages (Boosted games only) - Purple header

### Speed Display

The Boosted leaderboards include a "Speed" column showing the vortex speed multiplier used (0.25x to 2.0x).

## Verification

After applying the migration, you can verify it worked by:

1. Check the scores table structure:
   ```sql
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_name = 'scores' AND column_name = 'first_play_of_day';
   ```

2. Check the views exist:
   ```sql
   SELECT table_name
   FROM information_schema.views
   WHERE table_name IN ('leaderboards_pure', 'leaderboards_boosted', 'global_leaderboards_pure', 'global_leaderboards_boosted');
   ```

3. Test the Pure leaderboard query:
   ```sql
   SELECT * FROM leaderboards_pure LIMIT 5;
   ```

4. Test the Boosted leaderboard query:
   ```sql
   SELECT * FROM leaderboards_boosted LIMIT 5;
   ```

## Rollback (if needed)

If you need to roll back this migration:

```sql
-- Drop the new views
DROP VIEW IF EXISTS leaderboards_pure;
DROP VIEW IF EXISTS leaderboards_boosted;
DROP VIEW IF EXISTS global_leaderboards_pure;
DROP VIEW IF EXISTS global_leaderboards_boosted;

-- Restore the original leaderboards view
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

-- Drop the indexes
DROP INDEX IF EXISTS scores_first_play_idx;
DROP INDEX IF EXISTS scores_speed_idx;

-- Remove the column
ALTER TABLE scores DROP COLUMN IF EXISTS first_play_of_day;
```

## Support

If you encounter any issues during migration, check:
- Database permissions (ensure you're using a role with DDL privileges)
- Existing data integrity (run `SELECT COUNT(*) FROM scores;` to verify data)
- View dependencies (ensure no other views depend on the tables being modified)
