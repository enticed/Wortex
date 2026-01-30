# Cloning Wortex to Create a New Word Game

This guide explains how to use the Wortex codebase as a starting point for a new word game project (like Woodles).

## Quick Start

### For Windows Users:
```bash
cd C:\Users\jn120\Wortex
scripts\clone-for-woodles.bat
```

### For Mac/Linux Users:
```bash
cd /path/to/Wortex
chmod +x scripts/clone-for-woodles.sh
./scripts/clone-for-woodles.sh
```

This will:
1. Create a new `../Woodles` directory
2. Copy all files (excluding node_modules, .git, etc.)
3. Initialize a new git repository
4. Create setup documentation
5. Generate .env.local template

## What Gets Cloned

### Infrastructure (Keep & Configure)
These are ready to use with minimal changes:

```
✓ Authentication system
  - app/api/auth/*
  - lib/auth/*
  - components/auth/*

✓ User management
  - app/account/*
  - app/settings/*
  - app/admin/*

✓ Database utilities
  - lib/supabase/*
  - Database schema (users, stats, scores)

✓ Subscription system
  - app/api/stripe/*
  - app/subscribe/*

✓ Layout & UI
  - components/layout/*
  - components/ui/*
  - Tailwind configuration
```

### Game-Specific (Replace)
These need to be replaced with Woodles logic:

```
✗ Game components
  - app/play/* → Replace with Woodles game UI
  - app/pre-game/* → Update for Woodles intro
  - components/game/* → Woodles-specific components

✗ Game logic
  - lib/game/* → Woodles game rules/logic

✗ Puzzle system
  - app/api/puzzle/daily/* → Adjust for Woodles puzzles
  - scripts/add-sample-puzzle.mjs → Woodles puzzle generator
  - Database: puzzles table → Woodles puzzle structure

✗ Content pages
  - app/how-to-play/* → Woodles rules
  - README.md → Woodles description
```

## Step-by-Step Setup Process

### Phase 1: Clone & Initialize (5 minutes)

1. **Run the clone script:**
   ```bash
   # Windows
   scripts\clone-for-woodles.bat

   # Mac/Linux
   ./scripts/clone-for-woodles.sh
   ```

2. **Navigate to new project:**
   ```bash
   cd ../Woodles
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

### Phase 2: Database Setup (15-30 minutes)

1. **Create new Supabase project:**
   - Go to https://app.supabase.com
   - Click "New Project"
   - Name: "Woodles"
   - Choose region
   - Set strong database password (save it!)
   - Wait for initialization (~2 minutes)

2. **Export Wortex schema:**
   - Open Wortex Supabase Dashboard
   - Go to SQL Editor
   - Create new query:
   ```sql
   -- Export all table definitions
   SELECT
     table_name,
     column_name,
     data_type,
     is_nullable,
     column_default
   FROM information_schema.columns
   WHERE table_schema = 'public'
   ORDER BY table_name, ordinal_position;
   ```
   - Save results for reference

3. **Create Woodles database schema:**

   You'll want to modify the `puzzles` table for Woodles format. Here's a template:

   ```sql
   -- Core tables (keep as-is from Wortex)

   -- Users table
   CREATE TABLE users (
     id UUID PRIMARY KEY,
     email TEXT UNIQUE,
     password_hash TEXT,
     display_name TEXT,
     is_anonymous BOOLEAN DEFAULT true,
     is_admin BOOLEAN DEFAULT false,
     user_tier TEXT DEFAULT 'free',
     last_login TIMESTAMP,
     password_changed_at TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Stats table
   CREATE TABLE stats (
     user_id UUID PRIMARY KEY REFERENCES users(id),
     total_games INTEGER DEFAULT 0,
     average_score NUMERIC(10, 2),
     best_streak INTEGER DEFAULT 0,
     current_streak INTEGER DEFAULT 0,
     last_played_date DATE,
     updated_at TIMESTAMP DEFAULT NOW()
   );

   -- Scores table
   CREATE TABLE scores (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id),
     puzzle_id UUID REFERENCES puzzles(id),
     score INTEGER NOT NULL,
     bonus_correct BOOLEAN DEFAULT false,
     time_taken_seconds INTEGER,
     speed NUMERIC(3, 2) DEFAULT 1.0,
     min_speed NUMERIC(3, 2) DEFAULT 1.0,
     max_speed NUMERIC(3, 2) DEFAULT 1.0,
     stars INTEGER,
     first_play_of_day BOOLEAN DEFAULT true,
     created_at TIMESTAMP DEFAULT NOW(),
     UNIQUE(user_id, puzzle_id)
   );

   -- Sessions table
   CREATE TABLE sessions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id),
     token TEXT UNIQUE NOT NULL,
     expires_at TIMESTAMP NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Puzzles table (MODIFY THIS FOR WOODLES)
   CREATE TABLE puzzles (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     date DATE UNIQUE NOT NULL,

     -- TODO: Add Woodles-specific fields here
     -- Example fields (adjust for your game):
     -- word TEXT NOT NULL,
     -- clue TEXT,
     -- difficulty INTEGER,
     -- category TEXT,

     created_at TIMESTAMP DEFAULT NOW(),
     published BOOLEAN DEFAULT true
   );

   -- Add indexes
   CREATE INDEX idx_scores_user_id ON scores(user_id);
   CREATE INDEX idx_scores_puzzle_id ON scores(puzzle_id);
   CREATE INDEX idx_scores_created_at ON scores(created_at);
   CREATE INDEX idx_puzzles_date ON puzzles(date);
   ```

4. **Set up Row Level Security:**
   ```sql
   -- Enable RLS
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE stats ENABLE ROW LEVEL SECURITY;
   ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
   ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;

   -- Users can read their own data
   CREATE POLICY "Users can read own data" ON users
     FOR SELECT USING (auth.uid() = id);

   CREATE POLICY "Users can update own data" ON users
     FOR UPDATE USING (auth.uid() = id);

   -- Stats policies
   CREATE POLICY "Users can read own stats" ON stats
     FOR SELECT USING (auth.uid() = user_id);

   -- Scores policies
   CREATE POLICY "Users can read own scores" ON scores
     FOR SELECT USING (auth.uid() = user_id);

   CREATE POLICY "Users can insert own scores" ON scores
     FOR INSERT WITH CHECK (auth.uid() = user_id);

   -- Puzzles are public (everyone can read)
   CREATE POLICY "Puzzles are public" ON puzzles
     FOR SELECT USING (true);
   ```

5. **Get Supabase credentials:**
   - Supabase Dashboard → Project Settings → API
   - Copy:
     - Project URL
     - `anon` `public` key
     - `service_role` `secret` key

6. **Update .env.local:**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   SESSION_SECRET=<generate using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
   ```

### Phase 3: Rebranding (30-60 minutes)

1. **Find and replace text:**

   **Windows (PowerShell):**
   ```powershell
   # Replace "Wortex" with "Woodles"
   Get-ChildItem -Recurse -Include *.tsx,*.ts,*.json,*.md |
     ForEach-Object {
       (Get-Content $_.FullName) -replace 'Wortex','Woodles' |
       Set-Content $_.FullName
     }

   # Replace "wortex" with "woodles"
   Get-ChildItem -Recurse -Include *.tsx,*.ts,*.json,*.md |
     ForEach-Object {
       (Get-Content $_.FullName) -replace 'wortex','woodles' |
       Set-Content $_.FullName
     }
   ```

   **Mac/Linux:**
   ```bash
   # Replace "Wortex" with "Woodles"
   find . -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.json" -o -name "*.md" \) \
     -exec sed -i '' 's/Wortex/Woodles/g' {} +

   # Replace "wortex" with "woodles"
   find . -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.json" -o -name "*.md" \) \
     -exec sed -i '' 's/wortex/woodles/g' {} +
   ```

2. **Update metadata in [app/layout.tsx](../app/layout.tsx):**
   ```typescript
   export const metadata: Metadata = {
     title: 'Woodles - Daily Word Game',
     description: 'Play Woodles, the daily word puzzle game...',
     // ... update all metadata
   }
   ```

3. **Update assets in `public/`:**
   - Replace `favicon.ico`
   - Replace `apple-touch-icon.png`
   - Replace `icon-192.png`, `icon-512.png`
   - Add Woodles logo if needed

4. **Update colors in [tailwind.config.ts](../tailwind.config.ts):**
   ```typescript
   theme: {
     extend: {
       colors: {
         // Update to Woodles brand colors
         primary: {...},
         secondary: {...},
       }
     }
   }
   ```

5. **Update README.md** with Woodles information

### Phase 4: Remove/Replace Game Code (1-2 hours)

Files to modify or replace:

1. **Game pages:**
   - `app/play/page.tsx` → Woodles game UI
   - `app/pre-game/page.tsx` → Woodles intro screen
   - `app/how-to-play/page.tsx` → Woodles rules

2. **Game components:**
   - `components/game/*` → Create Woodles components

3. **Game logic:**
   - `lib/game/*` → Woodles game logic

4. **API routes:**
   - `app/api/puzzle/daily/route.ts` → Adjust for Woodles puzzles
   - `app/api/score/submit/route.ts` → May need updates for Woodles scoring

5. **Scripts:**
   - `scripts/add-sample-puzzle.mjs` → Create Woodles puzzle generator

### Phase 5: Build Woodles Game (Time varies)

This is where you implement your actual game! The infrastructure is ready, now build:

1. **Design puzzle data structure**
2. **Create puzzle generation logic**
3. **Build game UI components**
4. **Implement game mechanics**
5. **Set up scoring system**
6. **Create first test puzzles**

### Phase 6: Test Everything (1-2 hours)

```bash
# Start dev server
npm run dev
```

Test checklist:
- [ ] App loads without errors
- [ ] Can play as anonymous user
- [ ] Can create account
- [ ] Can sign in/out
- [ ] Can play game
- [ ] Scores save correctly
- [ ] Stats update
- [ ] Leaderboard works
- [ ] Admin panel accessible (set is_admin=true in database)

### Phase 7: Deploy (30 minutes)

1. **Push to GitHub:**
   ```bash
   git remote add origin https://github.com/yourusername/Woodles.git
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to vercel.com
   - Click "New Project"
   - Import from GitHub
   - Select Woodles repository
   - Add environment variables (from .env.local)
   - Deploy!

3. **Update production URL:**
   - Update `NEXT_PUBLIC_APP_URL` in Vercel env vars
   - Update Supabase redirect URLs in Auth settings

## Key Files Reference

### Must Configure
- `.env.local` - All environment variables
- `app/layout.tsx` - Metadata, SEO
- `tailwind.config.ts` - Colors, theme
- `public/*` - Icons, images

### Can Keep As-Is
- `lib/auth/*` - Authentication logic
- `lib/supabase/client.ts` - Supabase client
- `app/api/auth/*` - Auth API routes
- `components/auth/*` - Auth UI components
- `components/layout/*` - Layout components

### Must Replace
- `app/play/page.tsx` - Main game page
- `components/game/*` - Game components
- `lib/game/*` - Game logic
- `app/how-to-play/page.tsx` - Game rules

## Troubleshooting

### Build fails with TypeScript errors
- Run `npm run build` to see specific errors
- Check that all references to Wortex types are updated

### Database connection fails
- Verify .env.local credentials
- Check Supabase project is active
- Verify RLS policies don't block access

### Authentication doesn't work
- Check SESSION_SECRET is set
- Verify Supabase Auth is enabled
- Check redirect URLs in Supabase settings

### Game doesn't load
- Check console for errors
- Verify puzzle data structure matches database schema
- Check API routes are returning data

## Next Steps After Setup

1. **Create your first Woodles puzzle** manually in Supabase
2. **Test the complete flow** end-to-end
3. **Build puzzle generation script**
4. **Customize UI/UX** for Woodles
5. **Add unique Woodles features**
6. **Set up monitoring** (optional)
7. **Launch!**

## Resources

- **Wortex Docs**: See `docs/` folder for authentication system details
- **Supabase**: https://supabase.com/docs
- **Next.js**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

## Getting Help

If you run into issues:
1. Check error messages carefully
2. Review Wortex authentication docs
3. Check Supabase logs
4. Review this guide's troubleshooting section
5. Check Supabase/Next.js documentation

---

**Good luck with Woodles!**
