# Investigating Score Categorization Issue

## Step 1: Check Your Recent Score

Run this query in the Supabase SQL Editor to see the details of your recent score:

```sql
-- Check your most recent scores
SELECT
  u.display_name,
  p.date as puzzle_date,
  s.score,
  s.speed,
  s.first_play_of_day,
  s.created_at,
  CASE
    WHEN s.first_play_of_day = TRUE AND s.speed >= 0.99 AND s.speed <= 1.01 THEN '✅ Pure'
    WHEN s.first_play_of_day = FALSE THEN '❌ Boosted (Repeat Play)'
    WHEN s.speed < 0.99 OR s.speed > 1.01 THEN '❌ Boosted (Speed Adjustment)'
    ELSE '❓ Unknown'
  END as category,
  s.id as score_id
FROM scores s
JOIN users u ON s.user_id = u.id
JOIN puzzles p ON s.puzzle_id = p.id
ORDER BY s.created_at DESC
LIMIT 10;
```

This will show you:
- The actual `speed` value stored (check if it's exactly 1.0 or close to it)
- The `first_play_of_day` value (TRUE or FALSE)
- Which category it should be in based on the new view logic

## Step 2: Understanding Why It's in Boosted

Your score could be in Boosted Rankings for one of these reasons:

### Reason 1: Repeat Play Detection
If `first_play_of_day = FALSE`, it means:
- You (or someone using your user account) have played this puzzle before
- The database found an existing score for this user + puzzle combination
- Even if it was your "first play" from your perspective, the system detected a previous attempt

**How to check:**
```sql
-- Check all scores for today's puzzle by your user
SELECT
  u.display_name,
  s.score,
  s.speed,
  s.first_play_of_day,
  s.created_at
FROM scores s
JOIN users u ON s.user_id = u.id
WHERE s.puzzle_id = (SELECT id FROM puzzles WHERE date = CURRENT_DATE)
  AND u.display_name = 'YOUR_USERNAME_HERE'  -- Replace with your username
ORDER BY s.created_at;
```

### Reason 2: Speed Value Slightly Off
If `speed` is stored as something like `1.0000000000000002` instead of exactly `1.0`:
- This is a floating-point precision issue
- The tolerance fix (0.99 to 1.01) should handle this
- If your speed is within this range and `first_play_of_day = TRUE`, it should appear in Pure

**How to check:**
```sql
SELECT
  score,
  speed,
  first_play_of_day,
  speed >= 0.99 AND speed <= 1.01 as speed_in_range
FROM scores
WHERE id = 'YOUR_SCORE_ID_HERE'  -- Replace with score_id from Step 1
```

## Step 3: Fix Options

### Option A: Manual Update (One Score)
If this was truly your first play but got marked wrong, you can manually update it:

```sql
-- Update a specific score to mark it as first play
UPDATE scores
SET first_play_of_day = TRUE
WHERE id = 'YOUR_SCORE_ID_HERE'  -- Replace with the score ID from Step 1
  AND speed >= 0.99
  AND speed <= 1.01;
```

After running this, refresh the leaderboard page and it should appear in Pure Rankings.

### Option B: System-Wide Fix (All Similar Scores)
If you want to fix ALL scores that have speed ~1.0 but were marked as repeat plays:

```sql
-- This will mark as first_play_of_day any score where:
-- 1. Speed is within tolerance of 1.0
-- 2. It's the OLDEST score for that user+puzzle combination
WITH ranked_scores AS (
  SELECT
    id,
    user_id,
    puzzle_id,
    speed,
    first_play_of_day,
    ROW_NUMBER() OVER (PARTITION BY user_id, puzzle_id ORDER BY created_at ASC) as play_number
  FROM scores
)
UPDATE scores s
SET first_play_of_day = TRUE
FROM ranked_scores rs
WHERE s.id = rs.id
  AND rs.play_number = 1  -- First play chronologically
  AND rs.speed >= 0.99
  AND rs.speed <= 1.01
  AND rs.first_play_of_day = FALSE;  -- Only update if currently marked as repeat
```

⚠️ **Warning:** This is more aggressive and will reclassify many scores. Only use if you understand the implications.

## Step 4: Verify the Fix

After applying any updates, verify the score moved to Pure:

```sql
-- Check which leaderboard view includes your score
SELECT
  'Pure Leaderboard' as leaderboard,
  display_name,
  score,
  rank
FROM leaderboards_pure
WHERE puzzle_id = (SELECT id FROM puzzles WHERE date = CURRENT_DATE)
  AND display_name = 'YOUR_USERNAME_HERE'

UNION ALL

SELECT
  'Boosted Leaderboard' as leaderboard,
  display_name,
  score,
  rank
FROM leaderboards_boosted
WHERE puzzle_id = (SELECT id FROM puzzles WHERE date = CURRENT_DATE)
  AND display_name = 'YOUR_USERNAME_HERE';
```

## Understanding the System Behavior

Going forward, here's how scores are categorized:

**First Play Detection Logic** (in `app/api/score/submit/route.ts`):
```typescript
// Check if this is the user's first play of this puzzle
const { data: existingScore } = await supabase
  .from('scores')
  .select('id')
  .eq('user_id', userId)
  .eq('puzzle_id', puzzleId)
  .single();

const isFirstPlay = !existingScore;  // TRUE if no existing score found
```

**Pure Rankings Criteria** (in database view):
- `first_play_of_day = TRUE` (no previous score for this user+puzzle)
- AND `speed >= 0.99 AND speed <= 1.01` (within tolerance of 1.0x)

**Boosted Rankings Criteria** (anything not Pure):
- `first_play_of_day = FALSE` (replay)
- OR `speed < 0.99 OR speed > 1.01` (speed adjustment used)

## Common Scenarios

### Scenario 1: Playing on Multiple Devices
- You play on phone → marked as `first_play_of_day = TRUE` → goes to Pure
- You play same puzzle on desktop → marked as `first_play_of_day = FALSE` → goes to Boosted
- This is **by design** - only the first play counts as Pure

### Scenario 2: Replaying After Initial Play
- You play puzzle and score poorly
- You replay to improve → marked as `first_play_of_day = FALSE` → goes to Boosted
- This is **by design** - replays always go to Boosted

### Scenario 3: Using Speed Slider (Even Once)
- You adjust speed slider even slightly during game
- Speed is stored as something other than 1.0
- Goes to Boosted even if `first_play_of_day = TRUE`
- This is **by design** - Pure requires both conditions

### Scenario 4: Database Migration Timing
- All scores from **before the migration** were marked `first_play_of_day = TRUE`
- All scores **after the migration** have accurate first-play detection
- If you played before migration and again after, the second one is correctly marked as repeat
