# Supabase Setup Guide

## Enable Anonymous Authentication

Anonymous authentication is required for users to play without creating an account.

### Steps:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: **fkzqvhvqyfuxnwdhpytg**
3. Navigate to **Authentication** → **Providers**
4. Find **Anonymous Sign-Ins** in the list
5. Toggle it to **Enabled**
6. Click **Save**

### Verification:

After enabling, the game will:
- Automatically create anonymous user accounts
- Track stats and scores for each user
- Maintain user sessions across visits

### Current Status:

The error you're seeing:
```
AuthApiError: Anonymous sign-ins are disabled
```

Will be resolved once you enable this setting in the Supabase dashboard.

## Database Tables

All database tables have been created:
- ✅ `users` - User profiles
- ✅ `puzzles` - Daily puzzles
- ✅ `scores` - User scores
- ✅ `stats` - User statistics
- ✅ `leaderboards` - View for rankings

You can verify these by running:
```bash
node scripts/setup-database.mjs
```

## Environment Variables

Current configuration in `.env.local`:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

## Testing

Once anonymous auth is enabled:
1. Reload the app
2. Check the browser console - the auth error should be gone
3. Play a game and complete it
4. Check Supabase Dashboard → Authentication → Users
5. You should see an anonymous user created
6. Check Database → Table Editor → `scores` and `stats` tables
7. Your score and stats should be recorded
