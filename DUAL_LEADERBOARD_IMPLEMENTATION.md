# Dual Leaderboard Implementation Summary

## Overview

The Wortex leaderboard now features two distinct ranking categories:

### 🟢 Pure Rankings
- First play of each puzzle
- Standard speed only (1.0x)
- Level playing field for all players
- Displayed with emerald/green theme

### 🟣 Boosted Rankings
- Repeat plays of puzzles
- Any speed adjustment used (0.25x - 2.0x)
- Opportunity to perfect scores
- Displayed with purple theme
- Shows speed multiplier in leaderboard

## Implementation Details

### Database Changes

#### 1. New Column: `scores.first_play_of_day`
```sql
ALTER TABLE scores
ADD COLUMN first_play_of_day BOOLEAN DEFAULT FALSE NOT NULL;
```

**Purpose**: Tracks whether a score was from the player's first attempt at that specific puzzle.

**Logic**:
- `TRUE` = First time playing this puzzle (eligible for Pure rankings)
- `FALSE` = Repeat play of this puzzle (goes to Boosted rankings)

#### 2. New Indexes
```sql
CREATE INDEX scores_first_play_idx ON scores(first_play_of_day);
CREATE INDEX scores_speed_idx ON scores(speed);
```

**Purpose**: Optimize leaderboard queries by indexing the filtering columns.

#### 3. New Database Views

**Daily Leaderboards:**
- `leaderboards_pure` - Filters for `first_play_of_day = TRUE AND speed = 1.0`
- `leaderboards_boosted` - Filters for `first_play_of_day = FALSE OR speed != 1.0`

**Global Leaderboards:**
- `global_leaderboards_pure` - Average scores from Pure games only
- `global_leaderboards_boosted` - Average scores from Boosted games only

### Code Changes

#### 1. Score Submission Logic ([app/api/score/submit/route.ts](app/api/score/submit/route.ts))

**Before submission:**
```typescript
// Check if this is the user's first play of this puzzle
const { data: existingScore } = await supabase
  .from('scores')
  .select('id')
  .eq('user_id', userId)
  .eq('puzzle_id', puzzleId)
  .single();

const isFirstPlay = !existingScore;
```

**During submission:**
```typescript
const scoreData: ScoreInsert = {
  // ... other fields
  first_play_of_day: isFirstPlay,  // Auto-detected
};
```

#### 2. Type Definitions ([types/database.ts](types/database.ts))

Added new types for the database views:
- `LeaderboardPureRow`
- `LeaderboardBoostedRow`
- `GlobalLeaderboardPureRow`
- `GlobalLeaderboardBoostedRow`

Updated `scores` table types to include `first_play_of_day`.

#### 3. Query Functions ([lib/supabase/scores.ts](lib/supabase/scores.ts))

New functions:
- `getPuzzleLeaderboardPure()` - Fetch daily Pure rankings
- `getPuzzleLeaderboardBoosted()` - Fetch daily Boosted rankings
- `getGlobalLeaderboardPure()` - Fetch global Pure rankings
- `getGlobalLeaderboardBoosted()` - Fetch global Boosted rankings

#### 4. Leaderboard Page ([app/leaderboard/page.tsx](app/leaderboard/page.tsx))

**State Management:**
```typescript
const [dailyEntriesPure, setDailyEntriesPure] = useState<LeaderboardPureRow[]>([]);
const [dailyEntriesBoosted, setDailyEntriesBoosted] = useState<LeaderboardBoostedRow[]>([]);
const [globalEntriesPure, setGlobalEntriesPure] = useState<GlobalLeaderboardPureRow[]>([]);
const [globalEntriesBoosted, setGlobalEntriesBoosted] = useState<GlobalLeaderboardBoostedRow[]>([]);
```

**Display Structure:**

Each tab (Daily & Global) now contains two sections:
1. Pure Rankings (top) - Green header
2. Boosted Rankings (bottom) - Purple header

**Real-time Updates:**
The page subscribes to score changes and automatically reloads both leaderboard types.

#### 5. Leaderboard Table Component ([components/leaderboard/LeaderboardTable.tsx](components/leaderboard/LeaderboardTable.tsx))

**New Props:**
- `showSpeed?: boolean` - Displays speed multiplier column (for Boosted rankings)

**Enhanced Display:**
- Conditionally renders "Speed" column when `showSpeed={true}`
- Supports all three leaderboard view types (standard, pure, boosted)

### UI/UX Details

#### Color Scheme
- **Pure Rankings**: Emerald/Green (`emerald-700`, `emerald-400`)
- **Boosted Rankings**: Purple (`purple-700`, `purple-400`)

#### Daily Tab Layout
```
┌─────────────────────────────────────┐
│  🟢 Pure Rankings                   │
│  First play, no speed adjustments   │
│  [Leaderboard Table]                │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  🟣 Boosted Rankings                │
│  Repeat plays and/or speed control  │
│  [Leaderboard Table with Speed]     │
└─────────────────────────────────────┘
```

#### Global Tab Layout
```
┌─────────────────────────────────────┐
│  🟢 Pure Rankings - Best Averages   │
│  Average from Pure games only       │
│  [Global Leaderboard Table]         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  🟣 Boosted Rankings - Best Averages│
│  Average from Boosted games         │
│  [Global Leaderboard Table]         │
└─────────────────────────────────────┘
```

#### Info Section

Updated to explain the two ranking categories with a visual gradient from emerald to purple.

### Migration Strategy

#### Backfilling Existing Data
```sql
UPDATE scores
SET first_play_of_day = TRUE
WHERE first_play_of_day = FALSE;
```

**Rationale**: All existing players are grandfathered into the Pure leaderboard. This ensures:
- Fair treatment of historical data
- No loss of rankings for current players
- Smooth transition to the new system

Going forward, only truly first plays will be marked as Pure.

### Testing Scenarios

1. **New Player First Play**
   - Should appear in Pure rankings (if speed = 1.0x)
   - Should NOT appear in Boosted rankings

2. **New Player First Play with Speed Adjustment**
   - Should NOT appear in Pure rankings
   - Should appear in Boosted rankings (with speed displayed)

3. **Player Replays Puzzle**
   - Should NOT appear in Pure rankings
   - Should appear in Boosted rankings

4. **Existing Player Scores (Before Migration)**
   - Should appear in Pure rankings (grandfathered)
   - May also appear in Boosted if speed != 1.0x

### Benefits

1. **Fair Competition**: Pure rankings ensure everyone competes on equal terms for their first attempt
2. **Experimentation**: Boosted rankings encourage players to replay and try different strategies
3. **Flexibility**: Players can use speed controls without penalty to separate rankings
4. **Engagement**: Two leaderboards mean more opportunities to rank highly
5. **Clarity**: Clear visual distinction between ranking types

### Performance Considerations

- **Indexes**: Added indexes on filtering columns prevent full table scans
- **Views**: Pre-computed rankings using PostgreSQL window functions
- **Caching**: Views are fast to query since ranking logic is embedded in SQL
- **Real-time**: WebSocket subscription keeps both leaderboards live

### Future Enhancements (Optional)

1. **Filtering Options**: Allow users to toggle between Pure/Boosted views
2. **Personal Stats**: Show player's rank in both categories side-by-side
3. **Badges**: Award badges for Pure rankings achievements
4. **Speed Leaderboards**: Separate rankings for each speed tier (0.25x, 0.5x, etc.)
5. **Difficulty Categories**: Pure/Boosted rankings per difficulty level

## Files Modified

### Database
- ✅ `lib/supabase/migrations/add_first_play_tracking.sql` (new)

### Backend/API
- ✅ `app/api/score/submit/route.ts` (modified)
- ✅ `types/database.ts` (modified)
- ✅ `lib/supabase/scores.ts` (modified)

### Frontend
- ✅ `app/leaderboard/page.tsx` (modified)
- ✅ `components/leaderboard/LeaderboardTable.tsx` (modified)

### Documentation
- ✅ `LEADERBOARD_MIGRATION_INSTRUCTIONS.md` (new)
- ✅ `DUAL_LEADERBOARD_IMPLEMENTATION.md` (new - this file)

## Deployment Checklist

- [ ] Apply database migration (see LEADERBOARD_MIGRATION_INSTRUCTIONS.md)
- [ ] Verify views are created successfully
- [ ] Test Pure leaderboard queries
- [ ] Test Boosted leaderboard queries
- [ ] Deploy updated application code
- [ ] Test score submission (first play)
- [ ] Test score submission (repeat play)
- [ ] Test score submission (with speed adjustment)
- [ ] Verify real-time updates work for both leaderboards
- [ ] Check mobile responsiveness
- [ ] Monitor database query performance

## Rollback Plan

If issues arise, see the "Rollback" section in `LEADERBOARD_MIGRATION_INSTRUCTIONS.md` for steps to revert the migration.
