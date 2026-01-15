# Daily Puzzle Delivery System & Admin Panel

## Overview
A comprehensive system for managing and delivering daily Wortex puzzles with an administration panel for puzzle management, scheduling, and analytics.

---

## Part 1: Daily Puzzle Delivery System

### Current Implementation
- **Database**: Supabase `puzzles` table with `date` column
- **API**: `/api/puzzle/daily` endpoint fetches puzzle based on user's timezone
- **Storage**: Puzzles stored with these fields:
  - `date` (PRIMARY KEY)
  - `target_phrase` (text)
  - `facsimile_phrase` (text)
  - `difficulty` (integer 1-5)
  - `bonus_question` (JSONB)
  - `created_by_ai` (boolean)
  - `approved` (boolean)
  - `created_at` (timestamp)

### Proposed Enhancements

#### 1. **Puzzle Scheduling System**
```typescript
// Add to puzzles table
interface PuzzleSchedule {
  date: string;              // YYYY-MM-DD
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  publish_time?: string;     // Optional specific time (default: 00:00 UTC)
  created_by: string;        // User ID
  approved_by?: string;      // Admin user ID
  approval_date?: string;
}
```

**Features**:
- Schedule puzzles weeks/months in advance
- Draft mode for work-in-progress puzzles
- Approval workflow before publishing
- Automatic publishing at midnight UTC (or custom time)

#### 2. **Puzzle Queue Management**
- **Queue Table**: Track upcoming puzzles
- **Auto-fill**: Alert when queue drops below 7 days
- **Buffer**: Maintain 30-day buffer of approved puzzles
- **Fallback**: Classic puzzle rotation if queue is empty

#### 3. **Timezone-Aware Delivery**
```typescript
// Current: Uses user's browser timezone
// Enhancement: Support server-side timezone detection
interface UserPreferences {
  timezone?: string;         // IANA timezone (e.g., "America/Los_Angeles")
  puzzle_start_time?: string; // Custom daily reset time
}
```

**Benefits**:
- Consistent experience across devices
- Support for users who travel
- Custom "day start" time (e.g., 3am instead of midnight)

#### 4. **Caching & Performance**
```typescript
// Next.js API Route with ISR (Incremental Static Regeneration)
export const revalidate = 300; // 5 minutes

// Redis cache for high-traffic periods
const cacheKey = `puzzle:${date}:${timezone}`;
```

**Strategy**:
- Static generation of next 7 days
- 5-minute revalidation window
- CDN edge caching
- Redis for real-time updates

---

## Part 2: Admin Panel

### Page Structure

#### **Route**: `/admin`
Protected route requiring admin authentication

### Features

#### 1. **Dashboard** (`/admin`)
- **Today's Stats**:
  - Active players
  - Completion rate
  - Average score
  - Hint usage stats
- **Puzzle Queue Status**:
  - Days until queue empty
  - Draft count
  - Pending approval count
- **Quick Actions**:
  - Create new puzzle
  - Approve pending puzzles
  - View today's puzzle

#### 2. **Puzzle Management** (`/admin/puzzles`)

**List View**:
```
┌────────────┬──────────────────────────────┬────────────┬─────────┬──────────┐
│ Date       │ Target Phrase (Preview)       │ Difficulty │ Status  │ Actions  │
├────────────┼──────────────────────────────┼────────────┼─────────┼──────────┤
│ 2026-01-15 │ Early to bed and early...    │ 2          │ ✓ Pub   │ [E][D]   │
│ 2026-01-16 │ [Draft] The only thing...    │ 3          │ Draft   │ [E][A]   │
│ 2026-01-17 │ [Empty]                      │ -          │ -       │ [+]      │
└────────────┴──────────────────────────────┴────────────┴─────────┴──────────┘
```

**Bulk Actions**:
- Import CSV of puzzles
- Export puzzle archive
- Bulk approve/delete
- Reorder queue (drag-and-drop)

#### 3. **Puzzle Editor** (`/admin/puzzles/new` or `/admin/puzzles/[id]`)

**Form Fields**:
```typescript
interface PuzzleForm {
  targetPhrase: {
    text: string;
    // Auto-generates words array from text
  };
  facsimilePhrase: {
    text: string;
    // Auto-generates words array from text
  };
  difficulty: 1 | 2 | 3 | 4 | 5;
  scheduledDate: string;
  bonusQuestion: {
    type: 'quote' | 'literature';
    question: string;
    options: BonusOption[];
    correctAnswerId: string;
  };
  metadata: {
    source?: string;          // Where quote came from
    theme?: string;           // Category/theme
    tags?: string[];          // Searchable tags
  };
}
```

**Features**:
- Live preview of game
- Word count validation
- Duplicate detection
- AI assistance for facsimile generation
- Difficulty auto-calculation based on:
  - Word count
  - Vocabulary complexity
  - Phrase similarity

**Validation**:
- Target phrase 5-50 words
- Facsimile phrase similar length (±30%)
- No duplicate dates
- All bonus options unique
- Correct answer ID matches option

#### 4. **Analytics Dashboard** (`/admin/analytics`)

**Metrics**:
- **Player Stats**:
  - Daily active users
  - Retention (1-day, 7-day, 30-day)
  - Average session duration
- **Puzzle Performance**:
  - Completion rate by puzzle
  - Average score distribution
  - Hint usage patterns
  - Difficulty rating (user feedback)
- **Engagement**:
  - Bonus question accuracy
  - Phase completion times
  - Word placement patterns

**Visualizations**:
- Line charts: Trend over time
- Bar charts: Puzzle comparison
- Heatmap: Difficulty vs completion
- Funnel: Phase 1 → Phase 2 → Bonus → Complete

#### 5. **User Management** (`/admin/users`)
- View all users
- User statistics
- Ban/unban users
- Reset user progress (support tool)
- View user's game history

#### 6. **Settings** (`/admin/settings`)
- **Puzzle Defaults**:
  - Default difficulty
  - Auto-approval rules
  - Queue buffer size
- **Notifications**:
  - Low queue alerts
  - Daily summary emails
  - Error notifications
- **Integration**:
  - AI API keys
  - Analytics tracking
  - Backup settings

---

## Part 3: Database Schema Updates

### New Tables

#### **`puzzle_metadata`**
```sql
CREATE TABLE puzzle_metadata (
  puzzle_date DATE PRIMARY KEY REFERENCES puzzles(date),
  source TEXT,
  theme TEXT,
  tags TEXT[],
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approval_date TIMESTAMP,
  notes TEXT
);
```

#### **`puzzle_queue`**
```sql
CREATE TABLE puzzle_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_date DATE UNIQUE REFERENCES puzzles(date),
  queue_position INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_queue_position ON puzzle_queue(queue_position);
```

#### **`admin_activity_log`**
```sql
CREATE TABLE admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'approve', 'publish'
  entity_type TEXT NOT NULL, -- 'puzzle', 'user', 'settings'
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admin_log_user ON admin_activity_log(admin_user_id);
CREATE INDEX idx_admin_log_date ON admin_activity_log(created_at);
```

### Updated Tables

#### **`puzzles`** (add columns)
```sql
ALTER TABLE puzzles
  ADD COLUMN status TEXT DEFAULT 'published'
    CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  ADD COLUMN created_by UUID REFERENCES auth.users(id),
  ADD COLUMN approved_by UUID REFERENCES auth.users(id),
  ADD COLUMN approval_date TIMESTAMP,
  ADD COLUMN metadata JSONB;
```

#### **`users`** (add admin flag)
```sql
ALTER TABLE users
  ADD COLUMN is_admin BOOLEAN DEFAULT FALSE,
  ADD COLUMN admin_notes TEXT;
```

---

## Part 4: API Endpoints

### Admin API Routes

#### **Puzzle Management**
- `GET /api/admin/puzzles` - List all puzzles (paginated, filtered)
- `GET /api/admin/puzzles/[date]` - Get specific puzzle
- `POST /api/admin/puzzles` - Create new puzzle
- `PUT /api/admin/puzzles/[date]` - Update puzzle
- `DELETE /api/admin/puzzles/[date]` - Delete puzzle
- `POST /api/admin/puzzles/[date]/approve` - Approve puzzle
- `POST /api/admin/puzzles/bulk-import` - Import CSV

#### **Queue Management**
- `GET /api/admin/queue` - Get puzzle queue
- `PUT /api/admin/queue/reorder` - Reorder queue
- `POST /api/admin/queue/auto-fill` - Generate suggestions

#### **Analytics**
- `GET /api/admin/analytics/overview` - Dashboard stats
- `GET /api/admin/analytics/puzzles` - Puzzle performance
- `GET /api/admin/analytics/users` - User engagement

#### **Users**
- `GET /api/admin/users` - List users (paginated)
- `GET /api/admin/users/[id]` - User details
- `PUT /api/admin/users/[id]` - Update user (ban, admin, etc.)

---

## Part 5: Implementation Phases

### **Phase 1: Core Admin Panel** (Week 1-2)
- [ ] Create `/admin` route with authentication
- [ ] Build puzzle list view
- [ ] Build puzzle editor (create/edit)
- [ ] Implement basic CRUD operations
- [ ] Add status workflow (draft → scheduled → published)

### **Phase 2: Queue Management** (Week 2-3)
- [ ] Create queue visualization
- [ ] Implement drag-and-drop reordering
- [ ] Add queue buffer alerts
- [ ] Build CSV import/export

### **Phase 3: Analytics** (Week 3-4)
- [ ] Set up analytics tracking events
- [ ] Build dashboard with charts
- [ ] Create puzzle performance reports
- [ ] Add user engagement metrics

### **Phase 4: Advanced Features** (Week 4-5)
- [ ] AI-assisted puzzle generation
- [ ] Automated difficulty calculation
- [ ] Duplicate detection
- [ ] Theme/tag system
- [ ] User feedback collection

### **Phase 5: Polish & Deploy** (Week 5-6)
- [ ] Mobile-responsive admin panel
- [ ] Activity logging and audit trail
- [ ] Email notifications
- [ ] Backup and restore tools
- [ ] Documentation and training

---

## Part 6: Security Considerations

### Authentication & Authorization
```typescript
// Middleware for admin routes
export async function requireAdmin(req: NextRequest) {
  const session = await getSession(req);

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { data: user } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', session.userId)
    .single();

  if (!user?.is_admin) {
    return new Response('Forbidden', { status: 403 });
  }

  return session;
}
```

### Row-Level Security (RLS)
```sql
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

-- Everyone can read published puzzles
CREATE POLICY public_read_published ON puzzles
  FOR SELECT
  USING (status = 'published');
```

### Rate Limiting
- Admin endpoints: 100 req/min per user
- Bulk operations: 10 req/min
- Analytics queries: 20 req/min

---

## Part 7: Technology Stack

### Frontend (Admin Panel)
- **Framework**: Next.js 14+ (App Router)
- **UI Library**: Tailwind CSS + shadcn/ui components
- **Forms**: React Hook Form + Zod validation
- **Tables**: TanStack Table (sorting, filtering, pagination)
- **Charts**: Recharts or Chart.js
- **Drag & Drop**: @dnd-kit/core (already used in game)

### Backend
- **Database**: Supabase (PostgreSQL)
- **API**: Next.js API Routes
- **Authentication**: Supabase Auth with custom admin role
- **Caching**: Redis (optional, for high traffic)

### DevOps
- **Hosting**: Vercel (existing)
- **Database**: Supabase (existing)
- **Monitoring**: Vercel Analytics + Sentry
- **Backups**: Daily automated Supabase backups

---

## Part 8: Future Enhancements

### AI Integration
- Auto-generate facsimile phrases from targets
- Suggest bonus questions based on content
- Difficulty auto-calculation
- Quality scoring for puzzle submissions

### Community Features
- User-submitted puzzles (pending admin approval)
- Voting system for favorite puzzles
- Puzzle of the week/month
- Creator credits

### Gamification
- Admin leaderboard (most approved puzzles)
- Quality metrics per creator
- Puzzle creation achievements

### Advanced Analytics
- A/B testing different puzzle types
- Machine learning for difficulty prediction
- Churn prediction and retention optimization
- Personalized puzzle recommendations

---

## Questions for Discussion

1. **Admin Access**: Who should have admin privileges initially?
2. **Approval Workflow**: Should puzzles require approval before scheduling?
3. **Queue Size**: How many days of buffer should we maintain? (Recommend 30)
4. **AI Assistance**: Should we integrate OpenAI for facsimile generation?
5. **User Submissions**: Allow community puzzle submissions in v2?
6. **Pricing**: Any premium features for the admin panel?
7. **Multi-tenancy**: Support multiple admin roles (super admin, editor, viewer)?

---

## Next Steps

1. **Review this plan** - Confirm architecture and features
2. **Prioritize features** - Which phase to start with?
3. **Database migrations** - Update schema for admin features
4. **UI mockups** - Design admin panel screens
5. **Start Phase 1** - Build core admin CRUD functionality
