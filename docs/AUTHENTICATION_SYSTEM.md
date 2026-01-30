# Wortex Authentication System Documentation

## Overview

Wortex uses a **hybrid authentication system** that combines Supabase Auth with custom password storage. This document explains why and how this works.

---

## Why Hybrid Authentication?

The system evolved to handle multiple authentication scenarios:

1. **Anonymous users** - Can play without signing up (tracked via Supabase anonymous auth)
2. **Email/Password users** - Traditional signup with custom password validation
3. **Account upgrades** - Anonymous users can upgrade to email accounts
4. **Password resets** - Uses both Supabase Auth and custom password storage

---

## Architecture

### Two Password Systems Running in Parallel

#### 1. Supabase Auth Password (auth.users table)
- **Managed by:** Supabase Auth service
- **Used for:** Password reset flow, OAuth, magic links
- **Storage:** Supabase's internal auth.users table
- **Updates via:** `supabase.auth.updateUser({ password })`

#### 2. Custom Password Hash (public.users table)
- **Managed by:** Application code
- **Used for:** Email/password sign-in
- **Storage:** `users.password_hash` column (bcrypt hashed)
- **Updates via:** `/api/auth/update-password` endpoint

### Why Both?

**Historical reason:** The app started with custom password authentication for more control over the sign-in flow, but also uses Supabase Auth for anonymous users and OAuth. This created a hybrid system where:

- **Sign-in checks:** Custom `password_hash` in database
- **Password reset uses:** Supabase Auth's email flow
- **Both must stay in sync** for password reset to work

---

## Authentication Flows

### 1. Anonymous User Flow

```
User visits site
  ↓
Auto-create anonymous Supabase Auth user
  ↓
Store in users table with is_anonymous=true
  ↓
User plays games, stats tracked
```

**Code:** [lib/supabase/auth.ts:getOrCreateAnonymousUser](lib/supabase/auth.ts#L14-L75)

---

### 2. Email/Password Sign-Up Flow

```
User clicks "Create Account"
  ↓
Enter email, password, display name
  ↓
POST /api/auth/signup
  ↓
Create Supabase Auth user (if upgrading from anonymous)
  ↓
Hash password with bcrypt
  ↓
Store password_hash in users table
  ↓
User signed in
```

**Code:**
- Frontend: [components/auth/SignUpDialog.tsx](components/auth/SignUpDialog.tsx)
- API: [app/api/auth/signup/route.ts](app/api/auth/signup/route.ts)
- Auth helper: [lib/supabase/auth.ts:signUpWithEmail](lib/supabase/auth.ts#L191-L231)

---

### 3. Email/Password Sign-In Flow

```
User enters email & password
  ↓
POST /api/auth/signin
  ↓
Query users table by email
  ↓
Verify password_hash with bcrypt.compare()
  ↓
Create custom session token
  ↓
Set wortex-session cookie
  ↓
User signed in
```

**Important:** This flow does NOT use Supabase Auth's `signInWithPassword()`. It checks the custom `password_hash` column.

**Code:**
- Frontend: [components/auth/SignInDialog.tsx](components/auth/SignInDialog.tsx)
- API: [app/api/auth/signin/route.ts](app/api/auth/signin/route.ts)
- Password verification: [lib/auth/password.ts](lib/auth/password.ts)

---

### 4. Password Reset Flow ⚠️ COMPLEX

This is the most complex flow because it must update BOTH password systems:

```
User clicks "Forgot Password"
  ↓
Enter email
  ↓
POST /api/auth/reset-password
  ↓
Supabase sends email with code
  ↓
User clicks link → /auth/callback?code=xxx
  ↓
/auth/callback exchanges code for session
  ↓
Redirects to /auth/reset-password
  ↓
User enters new password
  ↓
Update Supabase Auth password ← System 1
  ↓
POST /api/auth/update-password ← System 2
  ↓
Update users.password_hash
  ↓
Sign out user
  ↓
User can sign in with new password
```

**Code:**
- Request reset: [app/api/auth/reset-password/route.ts](app/api/auth/reset-password/route.ts)
- Callback handler: [app/auth/callback/route.ts](app/auth/callback/route.ts)
- Reset page: [app/auth/reset-password/page.tsx](app/auth/reset-password/page.tsx)
- Update password: [app/api/auth/update-password/route.ts](app/api/auth/update-password/route.ts)

**Critical:** If only one system is updated, sign-in will fail!

---

## Database Schema

### users table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,           -- Matches Supabase Auth user ID
  email TEXT UNIQUE,             -- User's email
  password_hash TEXT,            -- bcrypt hash (custom system)
  display_name TEXT,             -- User's chosen name
  is_anonymous BOOLEAN DEFAULT true,
  is_admin BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  last_login TIMESTAMP,
  password_changed_at TIMESTAMP, -- Tracks password updates
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Important fields:**
- `id` - Must match Supabase Auth user ID
- `password_hash` - Used for sign-in verification
- `is_anonymous` - Tracks if user has upgraded to email account

---

## Session Management

### Custom Session System

The app uses **custom session cookies**, not Supabase Auth sessions for email/password users.

**Session Cookie:**
- Name: `wortex-session`
- Contains: Encrypted session token
- Duration: 30 days
- Verified by: [lib/auth/session.ts:getSession](lib/auth/session.ts)

**Why custom sessions?**
- More control over session lifetime
- Can add custom claims (is_admin, is_premium)
- Independent from Supabase Auth session management

---

## Critical Code Locations

### Sign-In
- **Check:** [app/api/auth/signin/route.ts](app/api/auth/signin/route.ts)
- Queries `users` table, verifies `password_hash`

### Sign-Up
- **Create:** [app/api/auth/signup/route.ts](app/api/auth/signup/route.ts)
- Creates Supabase Auth user + stores `password_hash`

### Password Reset
- **Request:** [app/api/auth/reset-password/route.ts](app/api/auth/reset-password/route.ts)
- **Callback:** [app/auth/callback/route.ts](app/auth/callback/route.ts)
- **Update:** [app/auth/reset-password/page.tsx](app/auth/reset-password/page.tsx)
- **Hash Update:** [app/api/auth/update-password/route.ts](app/api/auth/update-password/route.ts)

### Password Utilities
- **Hashing:** [lib/auth/password.ts](lib/auth/password.ts)
- Uses bcrypt with 12 salt rounds

### Session Management
- **Creation/Verification:** [lib/auth/session.ts](lib/auth/session.ts)
- Custom encrypted sessions

---

## Common Pitfalls for AI Agents

### ⚠️ Password Reset Must Update Both Systems

**Wrong:**
```typescript
// Only updates Supabase Auth - sign-in will fail!
await supabase.auth.updateUser({ password: newPassword });
```

**Correct:**
```typescript
// Update Supabase Auth
await supabase.auth.updateUser({ password: newPassword });

// ALSO update custom password_hash
await fetch('/api/auth/update-password', {
  method: 'POST',
  body: JSON.stringify({ userId, newPassword })
});
```

### ⚠️ Sign-In Uses Custom Password, Not Supabase Auth

**Wrong:**
```typescript
// This won't work for email/password users!
await supabase.auth.signInWithPassword({ email, password });
```

**Correct:**
```typescript
// Use the custom sign-in API
await fetch('/api/auth/signin', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});
```

### ⚠️ Session Management is Custom

**Wrong:**
```typescript
// Supabase session won't exist for email/password users
const { data: { session } } = await supabase.auth.getSession();
```

**Correct:**
```typescript
// Use custom session management
const session = await getSession(); // from lib/auth/session.ts
```

---

## Future Improvements

### Option 1: Unify on Supabase Auth Only

**Pros:**
- Simpler codebase
- Leverage Supabase features (OAuth, magic links, etc.)
- One source of truth
- Better security (Supabase handles it)

**Cons:**
- Need to migrate existing users
- Less control over sign-in flow
- Would require code refactor

**Migration Path:**
1. Add `supabase.auth.signInWithPassword()` support
2. Update all sign-ins to use Supabase Auth
3. Migrate existing `password_hash` users to Supabase Auth
4. Remove custom password system
5. Remove custom session management

### Option 2: Unify on Custom Auth Only

**Pros:**
- Full control over authentication
- Can customize everything
- No Supabase Auth dependency

**Cons:**
- Lose OAuth support (or have to implement it)
- Lose anonymous auth (or have to implement it)
- More maintenance burden
- Security responsibility on us

**Not recommended** - Supabase Auth provides too much value.

---

## Testing Authentication

### Test Sign-Up
```bash
# Create new account
# Should create both Supabase Auth user and users table record
```

### Test Sign-In
```bash
# Sign in with email/password
# Should verify password_hash and create session
```

### Test Password Reset
```bash
# Request password reset
# Check email
# Click link
# Enter new password
# Verify both systems updated:
node scripts/diagnose-password-reset.mjs <email>
# Try signing in with new password
```

### Test Anonymous Upgrade
```bash
# Play as anonymous
# Click "Create Account"
# Should preserve user data
```

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App
NEXT_PUBLIC_APP_URL=https://wortex.live  # Used for password reset redirect
SESSION_SECRET=xxx  # For custom session encryption
```

---

## Security Considerations

### Password Storage
- ✅ bcrypt hashing with 12 salt rounds
- ✅ Never log passwords
- ✅ Password requirements: minimum 8 characters

### Session Security
- ✅ HttpOnly cookies (prevents XSS)
- ✅ Secure flag in production (HTTPS only)
- ✅ SameSite=lax (CSRF protection)
- ✅ 30-day expiration

### Password Reset
- ✅ One-time use tokens
- ✅ 1-hour expiration
- ✅ Tokens in URL (not exposed in logs)
- ✅ Sign out after reset (forces fresh login)

---

## Recommended Reading

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [bcrypt.js Documentation](https://github.com/dcodeIO/bcrypt.js)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**Document Version:** 1.0
**Last Updated:** 2026-01-29
**Maintained By:** Development Team
**Status:** Production - Critical Documentation
