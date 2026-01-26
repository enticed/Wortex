# Speed Tracking Implementation

## Summary

This update improves how the game tracks and reports vortex speed usage to provide accurate "Pure Rankings" and better speed reporting in leaderboards and stats.

## Changes Made

### 1. Pre-Game Page Fix (`app/pre-game/page.tsx`)
- **Issue**: "Continue to Game" button was hidden under bottom navigation bar on Android Firefox
- **Fix**: Changed bottom padding from `pb-6` to `pb-20` to accommodate mobile browser UI

### 2. Game State Tracking (`types/game.ts`, `lib/hooks/useGameState.ts`)
- **Added**: `minSpeed` and `maxSpeed` fields to track the full range of speeds used during gameplay
- **Purpose**: Detect if any non-1.00x speed was used at any point in the game, not just the final speed
- **Implementation**:
  - Initialize both to the starting speed (1.0)
  - Update min/max whenever the speed slider is adjusted during gameplay

### 3. Score Submission (`components/game/GameBoard.tsx`)
- **Updated**: Score submission now includes `min_speed` and `max_speed` values
- **Data Sent**: `min_speed`, `max_speed` along with existing `speed` (final speed)

### 4. Database Schema (`docs/MIGRATION_ADD_SPEED_TRACKING.sql`)
- **Added Columns**:
  - `min_speed NUMERIC(3, 2)` - Minimum speed used during game
  - `max_speed NUMERIC(3, 2)` - Maximum speed used during game
  - Constraint: `min_speed <= max_speed`
- **Updated Views**:
  - `leaderboards_pure`: Now filters `WHERE min_speed = 1.0 AND max_speed = 1.0`
  - `leaderboards_boosted`: Now filters `WHERE min_speed != 1.0 OR max_speed != 1.0`
  - `global_leaderboards_pure`: Same filtering as pure leaderboards
  - `global_leaderboards_boosted`: Same filtering as boosted leaderboards
  - All views now include `min_speed` and `max_speed` columns

### 5. Leaderboard Display (`components/leaderboard/LeaderboardTable.tsx`)
- **Speed Column**: Now shows speed range instead of final speed
  - If `min_speed === max_speed`: Shows "1.00x" (single value)
  - If different: Shows "0.75-1.50x" (range)
- **Purpose**: Provides transparency about actual speed usage

### 6. Stats Page (`app/stats/page.tsx`, `components/stats/RecentGamesTable.tsx`)
- **Speed Column**: Updated to fetch and display min/max speeds
  - Shows range if speeds varied during game
  - Shows single value if constant speed maintained
- **Query**: Now selects `min_speed` and `max_speed` from database

## Why These Changes Matter

### Problem 1: Pure Rankings Exploit
**Before**: A player could use any speed for most of the game, then switch to 1.00x at the end, and still qualify for "Pure Rankings"

**After**: Pure Rankings only include games where speed was 1.00x throughout the entire game (never adjusted)

### Problem 2: Misleading Speed Display
**Before**: Leaderboards and stats showed only the final speed setting, which could be misleading if the player changed speeds during gameplay

**After**: Speed column shows the actual range of speeds used, providing transparency:
- `1.00x` = No speed adjustment (Pure)
- `0.75-1.25x` = Speed varied between 0.75x and 1.25x
- `1.50x` = Constant 1.50x speed throughout

## Database Migration Instructions

### Step 1: Run the Migration SQL

1. Open your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file: `docs/MIGRATION_ADD_SPEED_TRACKING.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** or press `Ctrl/Cmd + Enter`

### Step 2: Verify Migration Success

Check that the migration completed successfully:

```sql
-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'scores'
  AND column_name IN ('min_speed', 'max_speed');

-- Should return 2 rows showing both columns exist

-- Verify views were updated
SELECT viewname FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN (
    'leaderboards_pure',
    'leaderboards_boosted',
    'global_leaderboards_pure',
    'global_leaderboards_boosted'
  );

-- Should return 4 rows showing all views exist

-- Check that existing data was backfilled
SELECT COUNT(*) FROM scores WHERE min_speed IS NULL OR max_speed IS NULL;

-- Should return 0 (no NULL values)
```

### Step 3: Test the Changes Locally

Before deploying, test locally:

```bash
# Make sure dev server is running
npm run dev

# Play a test game:
# 1. Start at 1.00x speed
# 2. Change to a different speed during the game
# 3. Complete the game
# 4. Check leaderboard - you should appear in "Boosted" not "Pure"
# 5. Check stats page - speed should show as range (e.g., "1.00-1.50x")
```

### Step 4: Deploy to Production

Once migration is run and tested:

```bash
git add .
git commit -m "Implement comprehensive speed tracking for accurate leaderboard filtering"
git push
```

Vercel will automatically deploy the changes.

## Expected Behavior After Migration

### Pure Rankings
- **Only includes games where**:
  - First play of the day (`first_play_of_day = TRUE`)
  - Speed never changed from 1.00x (`min_speed = 1.0 AND max_speed = 1.0`)

### Boosted Rankings
- **Includes games where**:
  - Not first play of day, OR
  - Speed was adjusted at any point (min or max != 1.0)

### Speed Display
- **Pure games**: "1.00x"
- **Boosted with varied speeds**: "0.75-1.50x" (shows range)
- **Boosted with constant non-1.0 speed**: "1.50x" (single value)

## Testing Checklist

- [ ] Database migration ran successfully
- [ ] No NULL values in min_speed or max_speed columns
- [ ] All 4 leaderboard views exist and query successfully
- [ ] Play a game with constant 1.00x speed → appears in Pure leaderboard
- [ ] Play a game and change speed → appears in Boosted leaderboard
- [ ] Speed column shows correct range in leaderboards
- [ ] Speed column shows correct range in stats page
- [ ] Pre-game "Continue" button is visible on mobile browsers
- [ ] No TypeScript compilation errors
- [ ] Local dev server runs without errors

## Rollback Plan

If issues occur, you can rollback:

```sql
-- Remove the new columns (will also drop the updated views)
ALTER TABLE scores DROP COLUMN IF EXISTS min_speed;
ALTER TABLE scores DROP COLUMN IF EXISTS max_speed;

-- Recreate original views from:
-- lib/supabase/migrations/add_first_play_tracking.sql
```

Then revert the code changes:
```bash
git revert HEAD
git push
```

## Files Modified

### TypeScript/React
- `app/pre-game/page.tsx` - Fixed button positioning
- `types/game.ts` - Added minSpeed/maxSpeed to GameState
- `lib/hooks/useGameState.ts` - Track min/max speeds
- `components/game/GameBoard.tsx` - Submit min/max speeds
- `components/leaderboard/LeaderboardTable.tsx` - Display speed range
- `app/stats/page.tsx` - Fetch min/max speeds
- `components/stats/RecentGamesTable.tsx` - Display speed range

### Database
- `docs/MIGRATION_ADD_SPEED_TRACKING.sql` - New migration file

### Documentation
- `docs/SPEED_TRACKING_IMPLEMENTATION.md` - This file
