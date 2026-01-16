# Speed Column Migration Guide

## Overview
This migration adds a `speed` column to the `scores` table to track the vortex speed multiplier used during each game. This enables proper speed-adjusted scoring where lower scores indicate better performance.

## Status
✅ Frontend code updated and ready
⚠️ Database migration pending

## Migration Steps

### Option 1: Using Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the following SQL:

```sql
-- Add speed column to scores table
ALTER TABLE scores
ADD COLUMN IF NOT EXISTS speed NUMERIC(3, 2) DEFAULT 1.0 NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN scores.speed IS 'Vortex speed multiplier used during gameplay (0.25 to 2.0)';
```

5. Click **Run** to execute
6. Verify the migration by running:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'scores' AND column_name = 'speed';
```

### Option 2: Using Migration Script

Run the provided migration script to see the SQL and verification steps:

```bash
node scripts/add-speed-column.mjs
```

This script will:
- Display the SQL migration script
- Check the current scores table schema
- Show the count of existing scores
- Provide instructions for applying the migration

## Impact

### Existing Data
- **11 existing scores** will have `speed = 1.0` (default normal speed)
- This is correct as the speed feature was just implemented

### New Scores
All new score submissions will include the actual speed multiplier used (0.25x to 2.0x)

## Files Updated

### Database Schema
- ✅ `lib/supabase/schema.sql` - Updated with speed column

### Migration Scripts
- ✅ `scripts/add-speed-column.mjs` - New migration script created

### Frontend (Already Complete)
- ✅ `types/game.ts` - Added speed to GameState
- ✅ `lib/utils/game.ts` - Speed-adjusted scoring formula
- ✅ `lib/hooks/useGameState.ts` - Speed state management
- ✅ `components/game/GameBoard.tsx` - Speed slider UI
- ✅ `components/game/Vortex.tsx` - Speed-adjusted animations
- ✅ `components/game/AssemblyArea.tsx` - Speed-adjusted score display
- ✅ `components/game/FinalResults.tsx` - Separate phase scores
- ✅ `app/api/score/submit/route.ts` - Speed field in submission

## Verification

After applying the migration, test score submission:

1. Play a complete game at any speed (e.g., 1.50x)
2. Complete both phases and answer the bonus question
3. Submit the score
4. Check the database to verify the speed column was saved correctly:

```sql
SELECT user_id, puzzle_id, score, speed, created_at
FROM scores
ORDER BY created_at DESC
LIMIT 5;
```

## Rollback (If Needed)

If you need to rollback this migration:

```sql
ALTER TABLE scores DROP COLUMN IF EXISTS speed;
```

Note: This will remove the speed data permanently.

## Next Steps

1. Apply the migration using Option 1 or Option 2 above
2. Verify the column was added successfully
3. Test a complete game playthrough with score submission
4. Monitor for any errors in the browser console or API logs
