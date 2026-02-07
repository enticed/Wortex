# Row Level Security (RLS) Analysis

## Current Status

**RLS is DISABLED** on the following tables:
- `users`
- `scores`
- `stats`
- Other tables (need verification)

## Why RLS Was Disabled

Based on [scripts/update-rls-policies.sql](../scripts/update-rls-policies.sql), RLS was disabled because:

1. **Custom Session Authentication** - The application uses custom session-based auth with HTTP-only cookies, not Supabase Auth
2. **Server-Side Validation** - All sensitive operations go through API routes with proper authentication checks
3. **Complexity** - Syncing RLS policies with custom session tokens is complex
4. **Direct Database Access** - Some operations (like client-side reads) need direct database access

## Architecture Overview

### Database Client Types

1. **lib/supabase/client.ts** - Browser client (ANON_KEY)
   - Used in React components (client-side)
   - Can directly query database
   - Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **lib/supabase/server.ts** - Server client (ANON_KEY)
   - Used in API routes and Server Components
   - Can directly query database
   - Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **lib/supabase/client-server.ts** - Service role client (SERVICE_ROLE_KEY)
   - Used for admin operations requiring auth bypass
   - Full database access, bypasses RLS
   - Uses `SUPABASE_SERVICE_ROLE_KEY`

### Current Data Access Patterns

#### Client-Side (Browser)
- **Read access:**
  - Leaderboard data (public)
  - Puzzle data (public)
  - User stats (via direct query)
  - User profile (via direct query)
- **Write access:**
  - None (all writes go through API routes)

#### Server-Side (API Routes)
- **Authentication routes:**
  - Direct database access for user creation, login
  - Uses service role client to bypass RLS
- **Score submission:**
  - Validates via server logic, not RLS
  - Direct database insert
- **Admin routes:**
  - Uses service role client

## Security Analysis

### Current Security Model

**Protection Layers:**
1. ✅ **API Route Authentication** - Session tokens validated server-side
2. ✅ **CSRF Protection** - Double-submit cookies prevent forgery
3. ✅ **Rate Limiting** - Prevents abuse
4. ✅ **Server-Side Validation** - Score validation, input sanitization
5. ❌ **RLS** - NOT ENABLED (database-level protection missing)

### Vulnerabilities Without RLS

#### 1. Direct Database Access from Browser ⚠️ CRITICAL

**Risk:** Anyone with the ANON_KEY can query the database directly.

**Example Attack:**
```javascript
// In browser console
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_ANON_KEY' // Available in client-side code
);

// Read all user emails
const { data } = await supabase
  .from('users')
  .select('email, password_hash')
  .limit(1000);

// Read all scores
const { data: scores } = await supabase
  .from('scores')
  .select('*');
```

**Impact:**
- ⚠️ Anyone can read ALL user data (emails, password hashes, stats)
- ⚠️ Anyone can read ALL scores
- ⚠️ Anyone can potentially write to tables if not protected

#### 2. Data Leakage 🔴 HIGH

**What Can Be Accessed:**
- All user emails
- All display names
- All user statistics
- All scores (including user_id associations)
- All puzzle data

**Privacy Violations:**
- User emails exposed
- Play patterns trackable
- User identification possible

#### 3. Potential Write Access 🔴 HIGH

**Risk:** Without RLS, database relies solely on Supabase's default permissions.

**Questions to verify:**
- Can browser client INSERT into users table?
- Can browser client UPDATE scores?
- Can browser client DELETE records?

## Why RLS + Custom Auth Is Complex

### The Challenge

1. **Supabase RLS expects Supabase Auth**
   - RLS policies typically check `auth.uid()`
   - This only works with Supabase Auth JWTs

2. **Custom sessions don't integrate with RLS**
   - HTTP-only cookies aren't visible to database
   - No way to pass session token to RLS policies

3. **Workarounds are complex:**
   - Generate custom JWTs that Supabase can verify
   - Set up custom JWT verification in RLS policies
   - Requires HMAC-SHA256 signature verification in Postgres

### Why Custom Auth Was Chosen

From conversation context, custom auth was likely chosen for:
- Full control over session management
- HTTP-only cookies (better security than Supabase Auth localStorage)
- Flexibility in session expiration and rotation
- Integration with existing auth flows

## Options for Improving Security

### Option 1: Keep RLS Disabled + Strengthen API-Only Access ⭐ RECOMMENDED

**Approach:** Ensure ALL database access goes through authenticated API routes.

**Steps:**
1. Remove all client-side database queries
2. Create API endpoints for all data access
3. Authenticate every API request
4. Use service role key only in API routes (never exposed)

**Pros:**
- Works with current custom auth
- Clear security boundary (API routes)
- No RLS complexity
- Easier to audit (all access through code)

**Cons:**
- More API routes to maintain
- Slightly more latency (extra hop)

**Implementation:**
```typescript
// BEFORE (vulnerable)
// components/stats/StatsCard.tsx
const supabase = createClient();
const { data } = await supabase.from('stats').select('*').eq('user_id', userId);

// AFTER (secure)
// app/api/stats/route.ts
export async function GET(request: NextRequest) {
  const session = await validateSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceClient(); // Service role, server-side only
  const { data } = await supabase.from('stats').select('*').eq('user_id', session.userId);
  return NextResponse.json(data);
}

// components/stats/StatsCard.tsx
const response = await fetch('/api/stats');
const data = await response.json();
```

### Option 2: Enable RLS with Custom JWT Integration

**Approach:** Generate JWTs that Supabase RLS can verify.

**Steps:**
1. Generate RS256 or HS256 JWTs in session creation
2. Configure Supabase to verify these JWTs
3. Create RLS policies that check custom JWT claims
4. Pass JWT to Supabase client

**Pros:**
- Database-level security
- Defense in depth

**Cons:**
- Complex implementation
- JWT signature verification in Postgres
- Need to manage signing keys
- More moving parts to maintain

**Complexity:** HIGH

### Option 3: Hybrid Approach

**Approach:** RLS for sensitive tables + API routes for mutations.

**Steps:**
1. Enable RLS on critical tables (users, scores)
2. Create policies for read-only access
3. All writes go through API routes

**Pros:**
- Protects against read attacks
- Simpler than full RLS

**Cons:**
- Still requires JWT integration
- Complex middle ground

### Option 4: Use Supabase Auth Instead

**Approach:** Replace custom session auth with Supabase Auth.

**Pros:**
- RLS works out of the box
- Less code to maintain
- Battle-tested auth system

**Cons:**
- Major refactor required
- Lose HTTP-only cookie benefits
- Lose custom session control

**Feasibility:** LOW (too much work)

## Recommended Implementation Plan

### Phase 1: Audit Current Database Access ✅

**Task:** Find all places where database is accessed from client-side.

**Files to check:**
- `app/**/*.tsx` (page components)
- `components/**/*.tsx` (React components)
- Look for `supabase.from(` calls

**Current findings:**
- `app/settings/page.tsx:48` - Updates user settings
- `app/api/auth/update-password/route.ts:59` - Updates password (server-side, OK)
- Other locations need verification

### Phase 2: Create API Endpoints for All Client Reads

**New endpoints needed:**
```
GET  /api/user/profile      - Get user profile
GET  /api/user/stats        - Get user stats
GET  /api/leaderboard       - Get leaderboard (already exists?)
GET  /api/scores/history    - Get user's score history
GET  /api/puzzles/[id]      - Get specific puzzle
```

### Phase 3: Update Client Components

**Pattern:**
```typescript
// Remove direct database access
// const supabase = createClient();
// const { data } = await supabase.from('table').select('*');

// Use API endpoints
const response = await fetch('/api/endpoint');
const data = await response.json();
```

### Phase 4: Verify No Client-Side Database Access

**Steps:**
1. Search codebase for `createClient` usage in components
2. Verify only API routes use database clients
3. Remove `NEXT_PUBLIC_SUPABASE_ANON_KEY` from client (optional, for extra security)

### Phase 5: Enable RLS as Defense in Depth (Optional)

**Even with API-only access, RLS provides backup:**

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;

-- Deny all direct access (since all should go through API)
-- This provides defense if ANON_KEY is compromised
CREATE POLICY "Deny all direct access" ON users FOR ALL USING (false);
CREATE POLICY "Deny all direct access" ON scores FOR ALL USING (false);
CREATE POLICY "Deny all direct access" ON stats FOR ALL USING (false);

-- Allow read-only for public data
CREATE POLICY "Allow public read" ON puzzles FOR SELECT USING (true);
```

## Cost-Benefit Analysis

### Current State (RLS Disabled)
**Security:** ⚠️ **MEDIUM**
- API routes provide authentication
- CSRF protection prevents forgery
- Rate limiting prevents abuse
- ❌ **BUT:** Anyone with ANON_KEY can read all data

**Complexity:** ✅ **LOW**
- Simple architecture
- Direct database queries from client
- Easy to understand

**Maintainability:** ✅ **GOOD**
- Less code to maintain
- No JWT complexity

### Proposed State (API-Only + Optional RLS)
**Security:** ✅ **HIGH**
- All access authenticated through API
- ANON_KEY exposed but useless (RLS blocks direct access)
- Defense in depth

**Complexity:** ⚠️ **MEDIUM**
- More API routes
- Client code needs updating
- But: cleaner separation of concerns

**Maintainability:** ✅ **GOOD**
- Clear security boundary
- All logic in API routes (easier to audit)
- Optional RLS as backup

## Immediate Risks to Address

### 1. PASSWORD HASHES IN DATABASE 🔴 CRITICAL

**Current risk:** Password hashes can be read by anyone with ANON_KEY.

**Mitigation:**
- ✅ **ALREADY DONE:** Hashes use bcrypt with 12 salt rounds
- ✅ **GOOD:** Still difficult to crack
- ⚠️ **BUT:** Should not be readable at all

**Recommendation:** HIGHEST PRIORITY to move user queries to API routes.

### 2. EMAIL ADDRESSES 🔴 HIGH

**Current risk:** All user emails readable.

**Impact:**
- Privacy violation
- Email harvesting
- Spam targeting

**Recommendation:** HIGH PRIORITY to protect.

### 3. SCORE MANIPULATION 🟡 LOW (Already Mitigated)

**Current risk:** Direct database writes could fake scores.

**Mitigation:**
- ✅ **DONE:** Score validation on API route
- ✅ **DONE:** Client submits through /api/score/submit
- ⚠️ **BUT:** If direct INSERT is possible, could bypass

**Test needed:** Verify browser cannot INSERT directly.

## Testing RLS Status

### Test 1: Can Browser Read User Emails?
```javascript
// In browser console
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const { data, error } = await supabase
  .from('users')
  .select('email')
  .limit(1);

console.log('Can read emails:', !error, data);
```

**Expected with RLS disabled:** ✅ Returns emails
**Expected with RLS enabled:** ❌ Returns error or empty

### Test 2: Can Browser Insert Scores?
```javascript
const { data, error } = await supabase
  .from('scores')
  .insert({
    user_id: 'some-user-id',
    puzzle_id: 'some-puzzle-id',
    score: 999,
    // ... other fields
  });

console.log('Can insert scores:', !error);
```

**Expected with RLS disabled:** Depends on table permissions
**Expected with RLS enabled:** ❌ Blocked by policy

## Recommendations

### Short Term (Before Launch) 🚨 CRITICAL

1. **Audit all client-side database queries** (1-2 hours)
   - Find every `supabase.from(` in client code
   - Document what data is accessed

2. **Move sensitive queries to API routes** (4-8 hours)
   - Start with user profile/email queries
   - Create `/api/user/profile` endpoint
   - Update components to use API

3. **Test direct database access** (30 minutes)
   - Run browser console tests
   - Verify what can be read/written
   - Document findings

### Medium Term (After Launch)

1. **Complete API migration** (2-3 days)
   - All client queries through API
   - Remove ANON_KEY from client builds (optional)

2. **Enable RLS as defense in depth** (1 day)
   - Simple "DENY ALL" policies
   - Backup protection if API is bypassed

### Long Term (Future Enhancement)

1. **Consider Supabase Auth migration** (2-4 weeks)
   - If custom auth limitations become problematic
   - Or implement custom JWT integration

## Conclusion

**Current Risk Level:** 🔴 **HIGH**
- Password hashes and emails exposed via direct database access
- RLS disabled provides no database-level protection

**Recommendation:**
- **Option 1 (API-Only Access)** is the best fit for current architecture
- Maintain custom session auth (it's good!)
- Move all database queries to API routes
- Optionally enable RLS with DENY ALL policies as backup

**Timeline:**
- Audit: 2 hours
- Critical fixes: 1 day (user data protection)
- Complete migration: 3-5 days
- RLS enablement: 1 day (optional)

**Priority:** 🚨 **Address before public launch**
