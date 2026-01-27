# Troubleshooting Score Submission Issue

## Problem
Scores are not being saved to the database when playing games on production (wortex.app), even though the database insert functionality works correctly.

## Diagnosis Results

### Database Status
✅ **Database is working correctly**
- Today's puzzle exists (2026-01-27, ID: 39507ffa-c82c-450d-aec9-95195964b97c)
- Test insert with service role key succeeded
- No RLS policy issues blocking inserts

### Code Status
✅ **Code changes have been committed and pushed**
- Latest commit: eaa27c2 "Add TypeScript suppression for insert operation"
- All changes include:
  - Changed from `.upsert()` to `.insert()` to allow multiple scores
  - Added speed tracking (min_speed, max_speed)
  - Fixed replay functionality (sessionStorage clearing)

### Current Issue
❌ **No scores are being recorded for today's puzzle**
- User Anon-c14362ab played games but no scores in database
- Last recorded score was from 2026-01-26
- Database shows 0 scores for today's puzzle from ANY user

## Possible Causes

### 1. Vercel Deployment Not Complete (Most Likely)
The code changes may not have been deployed to production yet.

**How to Check:**
1. Go to https://vercel.com/dashboard
2. Check the deployment status for the Wortex project
3. Look for commit eaa27c2 or later
4. Verify deployment shows "Ready" status

**How to Fix:**
- Wait for deployment to complete (usually 2-3 minutes)
- If deployment failed, check build logs
- If stuck, trigger manual redeploy from Vercel dashboard

### 2. Browser Cache
Production site may be serving cached JavaScript with old code.

**How to Fix:**
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Check "Disable cache"
4. Hard refresh the page (Ctrl+Shift+R on Windows, Cmd+Shift+R on Mac)
5. Or: Right-click refresh button → "Empty Cache and Hard Reload"

### 3. JavaScript Runtime Error
An error may be preventing the score submission code from running.

**How to Check:**
1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Play a game and look for errors (red text)
4. Look specifically for errors around "GameBoard" or "score submission"

**What to Look For:**
- Type errors
- Network errors (failed API calls)
- Console logs like "[GameBoard] Error submitting score:"

## Recommended Testing Steps

### Step 1: Verify Deployment
1. Check Vercel dashboard for latest deployment
2. Confirm commit eaa27c2 or later is deployed
3. Wait for "Ready" status if still deploying

### Step 2: Clear Browser Cache
1. Open production site (wortex.app) in Chrome
2. Open DevTools (F12)
3. Network tab → Check "Disable cache"
4. Hard refresh (Ctrl+Shift+R)

### Step 3: Test Score Submission
1. Keep DevTools Console tab open
2. Play a complete game
3. Watch for console logs:
   - Should see: "[GameBoard] Score submitted successfully"
   - Should NOT see: "[GameBoard] Error submitting score:"
4. Check database after completing game

### Step 4: If Still Failing
1. Take screenshot of Console tab showing any errors
2. Share the error messages
3. Check Network tab for failed POST requests to Supabase

## Quick Database Check Command

Run this in your local terminal to check if scores are being saved:

```bash
node -e "const { createClient } = require('@supabase/supabase-js'); const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); (async () => { const { data: scores } = await supabase.from('scores').select('id, score, created_at, users!inner(display_name)').eq('puzzle_id', '39507ffa-c82c-450d-aec9-95195964b97c').order('created_at', { ascending: false }); console.log('Scores for today:', JSON.stringify(scores, null, 2)); })();"
```

## Expected Behavior After Fix

When the issue is resolved:
1. Playing a game should show console log: "[GameBoard] Score submitted successfully"
2. Database query should show new scores for today's puzzle
3. Leaderboard should update with new scores
4. Multiple plays should create multiple score records (not replace existing ones)

## Notes

- The database migration for speed tracking still needs to be run in production
- Run [UPDATE_LEADERBOARD_VIEWS.sql](docs/UPDATE_LEADERBOARD_VIEWS.sql) in Supabase SQL Editor
- This will fix the leaderboard views to show only best scores per user
