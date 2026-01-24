# Auth Migration to Simple Session-Based Auth

## Status: IN PROGRESS

### Completed:
1. ✅ Installed dependencies (bcryptjs, jose, uuid)
2. ✅ Created session management utilities (`lib/auth/session.ts`)
3. ✅ Created password hashing utilities (`lib/auth/password.ts`)
4. ✅ Updated signup API route (`app/api/auth/signup/route.ts`)
5. ✅ Updated signin API route (`app/api/auth/signin/route.ts`)
6. ✅ Updated signout API route (`app/api/auth/signout/route.ts`)
7. ✅ Created database client for direct access (`lib/supabase/client-server.ts`)
8. ✅ Added SESSION_SECRET to `.env.local`
9. ✅ Created database migration SQL script

### Remaining Tasks:

#### 1. Run Database Migration
Run `scripts/add-password-hash-column.sql` in Supabase SQL Editor to add the `password_hash` column to the users table.

#### 2. Update Middleware (`middleware.ts`)
Replace Supabase auth middleware with simple session checking:
- Check for valid session cookie
- Create anonymous session if none exists
- Don't call Supabase Auth APIs

#### 3. Update UserContext (`lib/contexts/UserContext.tsx`)
- Remove all Supabase Auth calls
- Read session from server API route
- Simplify to just load user data based on session

#### 4. Create Session API Route
Create `app/api/auth/session/route.ts`:
- GET: Return current session user data
- Used by client to get current user

#### 5. Update Auth Dialogs
- `components/auth/SignInDialog.tsx`: Call new `/api/auth/signin`
- `components/auth/UpgradeAccountDialog.tsx`: Call new `/api/auth/signup`
- Remove Supabase client imports

#### 6. Update Admin Check
- `lib/supabase/admin.ts`: Use session instead of Supabase auth

### Key Changes:
- **Session Storage**: HTTP-only cookies (works everywhere, no localStorage issues)
- **Anonymous Users**: Still supported, created automatically in middleware
- **Password Storage**: Bcrypt hashed in database
- **No External Auth**: Direct database queries, full control

### Testing Checklist:
- [ ] Anonymous user creation on first visit
- [ ] Sign up with email/password
- [ ] Sign in with email/password
- [ ] Sign out
- [ ] Admin access with session
- [ ] Test on Chrome/Firefox/Safari (desktop + mobile)

### Migration Path to NextAuth.js (if needed later):
This implementation uses the same patterns as NextAuth.js:
- HTTP-only session cookies
- Server-side validation
- Can easily swap session management for NextAuth's implementation
