# Admin Panel Setup Instructions

## What Has Been Built

The admin panel core infrastructure is now complete:

### ✅ Completed Components

1. **Admin Authentication System** ([lib/supabase/admin.ts](lib/supabase/admin.ts))
   - `requireAdmin()` - Check if user is admin
   - `getAdminUser()` - Get admin user or throw error
   - `isAdmin()` - Boolean admin check

2. **Admin Layout** ([app/admin/layout.tsx](app/admin/layout.tsx))
   - Protected route requiring admin access
   - Navigation header with links to Dashboard, Puzzles, New Puzzle
   - Auto-redirects non-admins to home page

3. **Admin Dashboard** ([app/admin/page.tsx](app/admin/page.tsx))
   - Stats overview (total puzzles, queue buffer, drafts, published)
   - Today's puzzle display
   - Quick action buttons
   - Low buffer warning when queue < 7 days

4. **Puzzle Editor** ([app/admin/puzzles/new/page.tsx](app/admin/puzzles/new/page.tsx))
   - Full form for creating new puzzles
   - Date and difficulty selection
   - Target phrase and facsimile phrase inputs with word counts
   - Bonus question configuration (quote or literature type)
   - Multiple answer options with correct answer selection
   - Metadata fields (source, theme)
   - Status selection (draft/scheduled/published)
   - Form validation

5. **Puzzle List View** ([app/admin/puzzles/page.tsx](app/admin/puzzles/page.tsx))
   - Table view of all puzzles
   - Grouped by: Drafts, Upcoming, Past
   - Shows date, target phrase preview, difficulty, status
   - Edit and delete actions

6. **Admin API Endpoints** ([app/api/admin/puzzles/route.ts](app/api/admin/puzzles/route.ts))
   - `POST /api/admin/puzzles` - Create new puzzle
   - `GET /api/admin/puzzles` - List puzzles with filters
   - Admin authentication verification
   - Activity logging for all actions

7. **Database Migration Script** ([scripts/migrate-admin-features.mjs](scripts/migrate-admin-features.mjs))
   - SQL commands for schema updates
   - Ready to run in Supabase dashboard

8. **Admin Privilege Script** ([scripts/set-admin.mjs](scripts/set-admin.mjs))
   - Sets user as admin by email
   - Verifies admin status after update

---

## Next Steps to Get It Working

### Step 1: Run Database Migrations

You need to run the SQL commands in your Supabase dashboard. These add the necessary columns and tables for admin features.

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your Wortex project
3. Navigate to **SQL Editor**
4. Run each SQL block below **one at a time**:

#### 1️⃣ Add Admin Columns to Users Table

```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;
```

#### 2️⃣ Add Status Tracking to Puzzles Table

```sql
ALTER TABLE puzzles
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP;
```

#### 3️⃣ Create Puzzle Metadata Table

```sql
CREATE TABLE IF NOT EXISTS puzzle_metadata (
  puzzle_date DATE PRIMARY KEY REFERENCES puzzles(date),
  source TEXT,
  theme TEXT,
  tags TEXT[],
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approval_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 4️⃣ Create Admin Activity Log Table

```sql
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_log_user ON admin_activity_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_log_date ON admin_activity_log(created_at);
```

#### 5️⃣ Set Up Row Level Security Policies

```sql
-- Enable RLS on new tables
ALTER TABLE puzzle_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Drop existing puzzle policies if they exist
DROP POLICY IF EXISTS admin_only_write ON puzzles;
DROP POLICY IF EXISTS public_read_published ON puzzles;

-- Only admins can insert/update/delete puzzles
CREATE POLICY admin_only_write ON puzzles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- Everyone can read published puzzles (or null status for backward compatibility)
CREATE POLICY public_read_published ON puzzles
  FOR SELECT
  USING (status = 'published' OR status IS NULL);

-- Admin activity log: only admins can read/write
CREATE POLICY admin_log_admin_only ON admin_activity_log
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- Puzzle metadata: admins can read/write
CREATE POLICY metadata_admin_only ON puzzle_metadata
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );
```

### Step 2: Set Your Account as Admin

After running the migrations, set yourself as the first admin:

```bash
node scripts/set-admin.mjs your-email@example.com
```

Replace `your-email@example.com` with the email address associated with your Wortex account.

**Note:** If you're using anonymous authentication, you'll need to first find your user ID:

1. Go to Supabase Dashboard → Table Editor → users table
2. Find your row (look for your display name)
3. Copy your user ID
4. Then in SQL Editor, run:
```sql
UPDATE users SET is_admin = TRUE WHERE id = 'your-user-id-here';
```

### Step 3: Access the Admin Panel

Once you're set as admin:

1. Visit [http://localhost:3000/admin](http://localhost:3000/admin)
2. If not admin, you'll be redirected to home
3. If admin, you'll see the dashboard

---

## Admin Panel Features

### Dashboard (`/admin`)
- View stats: total puzzles, queue buffer, drafts, published
- See today's puzzle
- Quick actions: Create puzzle, View all puzzles, Play game
- Warning when queue buffer is low (< 7 days)

### Create Puzzle (`/admin/puzzles/new`)
- **Date Selection** - Choose puzzle date
- **Difficulty** - 1-5 star rating
- **Target Phrase** - Original quote (with word count)
- **Facsimile Phrase** - Spin-off version (with word count)
- **Bonus Question**:
  - Type: Quote (person/year) or Literature (author/book)
  - Question text
  - 2+ answer options (add/remove options)
  - Select correct answer
- **Metadata** (optional):
  - Source (e.g., "Poor Richard's Almanack")
  - Theme (e.g., "wisdom")
- **Status**:
  - Draft - Not visible, work in progress
  - Scheduled - Will publish on date
  - Published - Immediately available

### Puzzle List (`/admin/puzzles`)
- View all puzzles organized by:
  - Drafts (pending work)
  - Upcoming (scheduled for future)
  - Past (already published)
- Table view with:
  - Date
  - Target phrase preview
  - Difficulty stars
  - Status badge
  - Edit/Delete actions

---

## Security Features

- **Admin-Only Access**: All admin routes protected by `requireAdmin()` middleware
- **Row Level Security**: Database policies prevent non-admins from modifying puzzles
- **Activity Logging**: All admin actions logged to `admin_activity_log` table
- **Service Role Key**: Admin API uses service role key for elevated permissions

---

## Current Limitations & Future Enhancements

### Not Yet Implemented
- [ ] AI assistance for facsimile generation (Anthropic + OpenAI integration)
- [ ] Puzzle editing (`/admin/puzzles/[date]` page)
- [ ] Puzzle deletion endpoint
- [ ] CSV import/export
- [ ] Drag-and-drop queue reordering
- [ ] Analytics dashboard
- [ ] User management
- [ ] Live game preview in editor
- [ ] Duplicate detection
- [ ] Difficulty auto-calculation

### Planned Features (from docs/DAILY_PUZZLE_SYSTEM.md)
- Phase 2: Queue management with drag-and-drop
- Phase 3: Analytics dashboard
- Phase 4: AI-assisted puzzle generation
- Phase 5: Mobile-responsive improvements

---

## Architecture Notes

### Tech Stack
- **Frontend**: Next.js 14+ App Router (React Server Components)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (custom `is_admin` flag)
- **API**: Next.js API Routes

### File Structure
```
app/
├── admin/
│   ├── layout.tsx          # Admin layout with auth check
│   ├── page.tsx            # Dashboard
│   └── puzzles/
│       ├── page.tsx        # Puzzle list
│       └── new/
│           └── page.tsx    # Puzzle editor form
├── api/
│   └── admin/
│       └── puzzles/
│           └── route.ts    # Admin API endpoints
lib/
└── supabase/
    └── admin.ts            # Admin auth utilities
scripts/
├── migrate-admin-features.mjs  # Database migration SQL
└── set-admin.mjs              # Set user as admin
docs/
├── DAILY_PUZZLE_SYSTEM.md     # Full system design doc
└── ADMIN_SETUP_INSTRUCTIONS.md # This file
```

---

## Troubleshooting

### "Unauthorized: Admin access required"
- Make sure you ran the database migrations
- Verify your account is set as admin: Check `users` table in Supabase, `is_admin` should be `true`
- Clear browser cache and refresh

### "A puzzle already exists for [date]"
- Each date can only have one puzzle
- Check existing puzzles in `/admin/puzzles`
- Choose a different date or edit the existing puzzle

### Puzzle not showing on home page
- Check puzzle status (must be "published" or null)
- Verify date matches your timezone
- Check browser console for errors

### Admin panel not accessible
1. Ensure migrations ran successfully
2. Verify admin status in database
3. Check `.env.local` has correct Supabase credentials
4. Restart dev server: `npm run dev`

---

## Quick Reference: Scripts

```bash
# Set user as admin
node scripts/set-admin.mjs user@example.com

# Add sample puzzle
node scripts/add-sample-puzzle.mjs

# Add Franklin puzzle (already run for 2026-01-15)
node scripts/add-franklin-puzzle.mjs
```

---

## Next Development Priorities

Based on our conversation, the priorities are:

1. ✅ **Puzzle Editor** (COMPLETE)
2. ⏳ **AI Integration** (Anthropic Haiku + OpenAI) - Both for evaluation
3. ⏳ **Puzzle Editing** - Edit existing puzzles
4. ⏳ **Live Preview** - Preview game while editing
5. ⏳ **Queue Management** - Drag-and-drop scheduling

---

## Testing Checklist

Before considering admin panel v1 complete:

- [ ] Run all database migrations
- [ ] Set your account as admin
- [ ] Access `/admin` dashboard
- [ ] Create a new puzzle via form
- [ ] Verify puzzle appears in list
- [ ] Check puzzle is playable on home page
- [ ] Test draft vs published status
- [ ] Verify admin activity logs in database

---

## Questions?

Refer to [DAILY_PUZZLE_SYSTEM.md](DAILY_PUZZLE_SYSTEM.md) for the full system design and future roadmap.
