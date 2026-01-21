# User Accounts Implementation Plan

## Executive Summary

This document outlines the implementation plan for adding optional authenticated user accounts to Wortex while maintaining support for anonymous play. The system will allow players to:

1. **Continue playing anonymously** (current behavior - no changes required)
2. **Upgrade to an authenticated account** with email/password
3. **Set custom display names** (visible on leaderboards)
4. **Preserve all game history and stats** during account upgrade

---

## 🎯 Goals and Principles

### Core Principles
1. **Frictionless Anonymous Play:** Default experience remains unchanged - no sign-up required
2. **Seamless Account Upgrade:** Anonymous users can upgrade without losing progress
3. **Data Persistence:** All scores, stats, and streaks carry over to authenticated accounts
4. **Security First:** Authenticated accounts use industry-standard password security
5. **Privacy Focused:** Minimal data collection, GDPR-compliant

### User Benefits
- **Anonymous Users:** Play immediately, no barriers
- **Registered Users:**
  - Permanent account (won't be lost if cookies clear)
  - Access games from multiple devices
  - Custom display name on leaderboards
  - Future features (email notifications, password recovery, etc.)

---

## 📊 Current State Analysis

### Existing Architecture

**Authentication Method:** Supabase Anonymous Auth
- Users auto-created on first visit via `supabase.auth.signInAnonymously()`
- Each user gets a unique UUID from Supabase Auth
- User record created in `users` table with `is_anonymous = TRUE`

**User Data Structure:**
```typescript
users {
  id: UUID                    // Supabase auth user ID
  created_at: TIMESTAMP
  display_name: TEXT | NULL   // Currently optional for all users
  timezone: TEXT
  is_anonymous: BOOLEAN       // TRUE for anonymous, FALSE for authenticated
  subscription_status: TEXT
  subscription_expires_at: TIMESTAMP | NULL
}
```

**Key Files:**
- `lib/contexts/UserContext.tsx` - User state management
- `lib/supabase/auth.ts` - Authentication utilities
- `lib/supabase/client.ts` & `server.ts` - Supabase clients

---

## 🏗️ Implementation Plan

### Phase 1: Database Schema Updates ✅

**Required Changes:**
```sql
-- Add email column to users table
ALTER TABLE users
ADD COLUMN email TEXT;

-- Create unique index for email (excluding NULL values)
CREATE UNIQUE INDEX users_email_unique ON users(email)
WHERE email IS NOT NULL;

-- Add password_changed_at timestamp
ALTER TABLE users
ADD COLUMN password_changed_at TIMESTAMPTZ;

-- Add last_login timestamp
ALTER TABLE users
ADD COLUMN last_login TIMESTAMPTZ;
```

**Updated User Schema:**
```typescript
users: {
  Row: {
    id: string;
    created_at: string;
    display_name: string | null;
    email: string | null;              // NEW
    timezone: string;
    is_anonymous: boolean;
    password_changed_at: string | null; // NEW
    last_login: string | null;          // NEW
    subscription_status: 'none' | 'active' | 'expired';
    subscription_expires_at: string | null;
  };
}
```

**Database Migration File:**
`lib/supabase/migrations/add_user_accounts_support.sql`

---

### Phase 2: Backend Authentication Functions

**File:** `lib/supabase/auth.ts` (expand existing)

#### 2.1 Account Upgrade Function

```typescript
/**
 * Upgrade an anonymous user to an authenticated account
 * Preserves all user data, scores, and stats
 */
export async function upgradeToAuthenticatedAccount(
  supabase: any,
  currentUserId: string,
  email: string,
  password: string,
  displayName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Verify current user is anonymous
    const { data: user } = await supabase
      .from('users')
      .select('is_anonymous')
      .eq('id', currentUserId)
      .single();

    if (!user?.is_anonymous) {
      return { success: false, error: 'User is already authenticated' };
    }

    // 2. Check if email is already in use
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return { success: false, error: 'Email already in use' };
    }

    // 3. Update Supabase Auth to convert anonymous → authenticated
    const { error: authError } = await supabase.auth.updateUser({
      email,
      password,
    });

    if (authError) {
      return { success: false, error: authError.message };
    }

    // 4. Update user record in database
    const updateData: any = {
      email,
      is_anonymous: false,
      password_changed_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    };

    if (displayName) {
      updateData.display_name = displayName;
    }

    const { error: dbError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', currentUserId);

    if (dbError) {
      return { success: false, error: 'Failed to update user record' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

#### 2.2 Sign Up Function (New Users)

```typescript
/**
 * Create a new authenticated account directly
 * For users who choose not to play anonymously first
 */
export async function signUpWithEmail(
  supabase: any,
  email: string,
  password: string,
  displayName?: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // 1. Create Supabase Auth user
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return { success: false, error: authError.message };
    }

    if (!data.user) {
      return { success: false, error: 'Failed to create user' };
    }

    // 2. Create user record
    const { error: dbError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email,
        display_name: displayName || null,
        is_anonymous: false,
        last_login: new Date().toISOString(),
      });

    if (dbError && dbError.code !== '23505') {
      return { success: false, error: 'Failed to create user record' };
    }

    return { success: true, userId: data.user.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

#### 2.3 Sign In Function

```typescript
/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  supabase: any,
  email: string,
  password: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return { success: false, error: authError.message };
    }

    if (!data.user) {
      return { success: false, error: 'Failed to sign in' };
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id);

    return { success: true, userId: data.user.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

#### 2.4 Sign Out Function

```typescript
/**
 * Sign out current user
 */
export async function signOut(supabase: any): Promise<boolean> {
  const { error } = await supabase.auth.signOut();
  return !error;
}
```

#### 2.5 Password Reset

```typescript
/**
 * Send password reset email
 */
export async function resetPassword(
  supabase: any,
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Update password with reset token
 */
export async function updatePassword(
  supabase: any,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Update password_changed_at timestamp
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('users')
        .update({ password_changed_at: new Date().toISOString() })
        .eq('id', user.id);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

---

### Phase 3: API Routes

Create new API routes for authentication actions:

#### 3.1 Account Upgrade API
**File:** `app/api/auth/upgrade/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { upgradeToAuthenticatedAccount } from '@/lib/supabase/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Upgrade account
    const result = await upgradeToAuthenticatedAccount(
      supabase,
      user.id,
      email,
      password,
      displayName
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

#### 3.2 Sign Up API
**File:** `app/api/auth/signup/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { signUpWithEmail } from '@/lib/supabase/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const result = await signUpWithEmail(supabase, email, password, displayName);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, userId: result.userId });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

#### 3.3 Sign In API
**File:** `app/api/auth/signin/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { signInWithEmail } from '@/lib/supabase/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const result = await signInWithEmail(supabase, email, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, userId: result.userId });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

---

### Phase 4: Frontend UI Components

#### 4.1 Account Upgrade Dialog
**File:** `components/auth/UpgradeAccountDialog.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useUser } from '@/lib/contexts/UserContext';
import { useRouter } from 'next/navigation';

interface UpgradeAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeAccountDialog({ isOpen, onClose }: UpgradeAccountDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, refreshStats } = useUser();
  const router = useRouter();

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          displayName: displayName || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to upgrade account');
        setLoading(false);
        return;
      }

      // Refresh user data
      await refreshStats();

      // Close dialog and redirect
      onClose();
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Create Your Account
        </h2>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Upgrade to a permanent account to secure your progress and play from any device.
        </p>

        <form onSubmit={handleUpgrade} className="space-y-4">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Display Name (optional)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How you'll appear on leaderboards"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              maxLength={50}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm Password *
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Benefits */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">
              Benefits of creating an account:
            </p>
            <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
              <li>✓ Keep your progress safe (won't lose it if you clear cookies)</li>
              <li>✓ Play from any device</li>
              <li>✓ Custom display name on leaderboards</li>
              <li>✓ All your {user?.stats?.total_games || 0} games and stats preserved</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
```

#### 4.2 Sign In Dialog
**File:** `components/auth/SignInDialog.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SignInDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSignUpClick?: () => void;
}

export default function SignInDialog({ isOpen, onClose, onSignUpClick }: SignInDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to sign in');
        setLoading(false);
        return;
      }

      // Success - reload page to update auth state
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send reset email');
        setLoading(false);
        return;
      }

      setResetSent(true);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Sign In
        </h2>

        {resetSent ? (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-800 dark:text-green-300">
                Password reset email sent! Check your inbox and follow the link to reset your password.
              </p>
            </div>
            <button
              onClick={() => {
                setResetSent(false);
                onClose();
              }}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSignIn} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Forgot Password */}
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={loading}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Forgot password?
            </button>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>
        )}

        {!resetSent && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <button
                onClick={onSignUpClick}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Sign up
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

#### 4.3 Account Menu in Header
**File:** `components/layout/Header.tsx` (update existing)

Add account menu button to existing header:

```typescript
// Add to Header component
const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
const [showSignInDialog, setShowSignInDialog] = useState(false);
const [showAccountMenu, setShowAccountMenu] = useState(false);
const { user } = useUser();

// In render, add account button after other header elements:
<div className="relative">
  <button
    onClick={() => setShowAccountMenu(!showAccountMenu)}
    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
  >
    <svg className="w-5 h-5" /* User icon SVG *//>
    <span className="text-sm">
      {user?.display_name || (user?.is_anonymous ? 'Anonymous' : 'Account')}
    </span>
  </button>

  {showAccountMenu && (
    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      {user?.is_anonymous ? (
        <>
          <button
            onClick={() => {
              setShowAccountMenu(false);
              setShowUpgradeDialog(true);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Create Account
          </button>
          <button
            onClick={() => {
              setShowAccountMenu(false);
              setShowSignInDialog(true);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Sign In
          </button>
        </>
      ) : (
        <>
          <Link href="/settings" className="block px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">
            Settings
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Sign Out
          </button>
        </>
      )}
    </div>
  )}
</div>

{/* Dialogs */}
<UpgradeAccountDialog
  isOpen={showUpgradeDialog}
  onClose={() => setShowUpgradeDialog(false)}
/>
<SignInDialog
  isOpen={showSignInDialog}
  onClose={() => setShowSignInDialog(false)}
  onSignUpClick={() => {
    setShowSignInDialog(false);
    setShowUpgradeDialog(true);
  }}
/>
```

---

### Phase 5: Settings Page

**File:** `app/settings/page.tsx` (new)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { useUser } from '@/lib/contexts/UserContext';
import { createClient } from '@/lib/supabase/client';

export default function SettingsPage() {
  const { user, refreshStats } = useUser();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('users')
        .update({ display_name: displayName || null })
        .eq('id', user?.id);

      if (error) throw error;

      await refreshStats();
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      // Update password_changed_at
      await supabase
        .from('users')
        .update({ password_changed_at: new Date().toISOString() })
        .eq('id', user?.id);

      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.is_anonymous) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create an account to access settings
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Go Home
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-20">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Account Settings
          </h1>

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <p className={`text-sm ${
                message.type === 'success'
                  ? 'text-green-800 dark:text-green-300'
                  : 'text-red-800 dark:text-red-300'
              }`}>
                {message.text}
              </p>
            </div>
          )}

          {/* Profile Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Profile
            </h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How you appear on leaderboards"
                  maxLength={50}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Contact support to change your email address
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>

          {/* Password Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Change Password
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  minLength={8}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
```

---

### Phase 6: Supabase Configuration

#### 6.1 Enable Email Authentication

In **Supabase Dashboard → Authentication → Providers:**

1. **Email** provider should already be enabled
2. Configure **Email Templates** (optional):
   - Confirmation email
   - Password reset email
   - Magic link email

#### 6.2 Update RLS Policies

Ensure Row Level Security policies allow authenticated users:

```sql
-- Users can view their own data (already exists, but verify)
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own data (already exists)
CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

#### 6.3 Email Verification (Optional)

For production, consider enabling email verification:
- Supabase Dashboard → Authentication → Settings
- Enable "Confirm email" under Email Auth

---

### Phase 7: Update UserContext

**File:** `lib/contexts/UserContext.tsx` (update)

Update the initialization logic to handle both anonymous and authenticated users:

```typescript
useEffect(() => {
  async function initializeUser() {
    try {
      // Check for existing session
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // User already authenticated (could be anonymous or email/password)
        await loadUserData(session.user.id);
      } else {
        // Create anonymous user (existing behavior)
        const { data, error } = await supabase.auth.signInAnonymously();

        if (error) {
          console.error('Error creating anonymous user:', error);
          setLoading(false);
          return;
        }

        if (data.user) {
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              is_anonymous: true,
            })
            .select()
            .single();

          if (insertError && insertError.code !== '23505') {
            console.error('Error creating user record:', insertError);
          }

          await loadUserData(data.user.id);
        }
      }
    } catch (error) {
      console.error('Error initializing user:', error);
    } finally {
      setLoading(false);
    }
  }

  initializeUser();

  // Listen for auth state changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (session?.user) {
          await loadUserData(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        // Create new anonymous user
        const { data } = await supabase.auth.signInAnonymously();
        if (data?.user) {
          await supabase.from('users').insert({
            id: data.user.id,
            is_anonymous: true,
          });
          await loadUserData(data.user.id);
        }
      }
    }
  );

  return () => {
    subscription?.unsubscribe();
  };
}, []);
```

---

## 📋 Implementation Checklist

### Database (1-2 hours)
- [ ] Run migration to add email, password_changed_at, last_login columns
- [ ] Create unique index on email column
- [ ] Update TypeScript types in `types/database.ts`
- [ ] Test migration in development environment
- [ ] Verify RLS policies work with authenticated users

### Backend (3-4 hours)
- [ ] Implement `upgradeToAuthenticatedAccount()` function
- [ ] Implement `signUpWithEmail()` function
- [ ] Implement `signInWithEmail()` function
- [ ] Implement `signOut()` function
- [ ] Implement password reset functions
- [ ] Create API routes for all auth actions
- [ ] Add input validation and error handling
- [ ] Test all auth flows in development

### Frontend (5-6 hours)
- [ ] Create `UpgradeAccountDialog` component
- [ ] Create `SignInDialog` component
- [ ] Create `PasswordResetPage` component
- [ ] Update Header with account menu
- [ ] Create Settings page
- [ ] Update `UserContext` to handle auth state changes
- [ ] Add loading states and error messages
- [ ] Test UI flows end-to-end

### Supabase Configuration (30 minutes)
- [ ] Enable Email provider in Supabase Dashboard
- [ ] Configure email templates (optional)
- [ ] Set up email verification (optional for production)
- [ ] Test authentication in Supabase Dashboard
- [ ] Configure redirect URLs for password reset

### Testing (2-3 hours)
- [ ] Test anonymous → authenticated upgrade flow
- [ ] Test new user sign-up flow
- [ ] Test sign-in flow
- [ ] Test password reset flow
- [ ] Test sign-out flow
- [ ] Verify data persists after account upgrade
- [ ] Test leaderboard display names
- [ ] Test settings page functionality
- [ ] Test cross-device login
- [ ] Test edge cases (duplicate emails, invalid passwords, etc.)

### Documentation (1 hour)
- [ ] Update README with authentication information
- [ ] Document environment variables needed
- [ ] Add user guide for account creation
- [ ] Document database schema changes
- [ ] Add troubleshooting guide

---

## 🎨 UX Considerations

### Onboarding Flow

**For New Users:**
1. Visit site → Auto-create anonymous account → Play immediately
2. After playing a few games, show subtle prompt: "Create account to save your progress"
3. Prompt appears in:
   - After completing first game
   - In settings area
   - Before clearing cookies warning

**Prompt Triggers:**
- After 3 games played
- When viewing stats page
- When appearing on leaderboard
- Before cookie expiration (if detectable)

### Visual Indicators

**Anonymous Users:**
- Small badge in header: "Anonymous Player"
- Leaderboard entry: "Anonymous #abc123"
- Subtle banner: "Create account to secure your progress"

**Authenticated Users:**
- Display name or email in header
- Custom leaderboard name
- Access to settings
- No upgrade prompts

### Error Handling

**Common Errors:**
- Email already in use
- Invalid password format
- Network errors
- Session expired

**User-Friendly Messages:**
- "This email is already registered. Try signing in instead?"
- "Password must be at least 8 characters with a mix of letters and numbers"
- "Connection issue. Please check your internet and try again"
- "Your session expired. Please sign in again"

---

## 🔒 Security Considerations

### Password Requirements
- Minimum 8 characters
- Consider adding complexity requirements (uppercase, numbers, symbols)
- Use Supabase's built-in password hashing

### Email Verification
- **Development:** Disable for faster testing
- **Production:** Enable to prevent fake accounts

### Rate Limiting
- Implement rate limiting on auth endpoints
- Prevent brute force password attempts
- Use Supabase's built-in rate limiting features

### Session Management
- Sessions expire after inactivity (Supabase default: 1 hour)
- Refresh tokens used for long-term sessions
- Sign out clears all session data

### Data Privacy
- Store only necessary user data
- Hash passwords securely (handled by Supabase)
- GDPR-compliant data handling
- Allow users to delete accounts (future feature)

---

## 🚀 Launch Strategy

### Soft Launch (Development)
1. Deploy to staging environment
2. Test with internal users
3. Monitor for bugs and edge cases
4. Iterate based on feedback

### Public Release
1. Announce feature in-app
2. Add banner prompting account creation
3. Send email to existing players (if emails collected)
4. Monitor support requests
5. Track conversion rate (anonymous → authenticated)

### Success Metrics
- % of users creating accounts
- Account upgrade completion rate
- Sign-in success rate
- Password reset usage
- User retention after account creation

---

## 🔮 Future Enhancements

### Phase 2 Features
1. **Social Authentication:**
   - Google OAuth
   - GitHub OAuth
   - Discord OAuth

2. **Account Linking:**
   - Link multiple anonymous sessions to one account
   - Merge game history from different devices

3. **Profile Customization:**
   - Avatar selection
   - Bio/description
   - Achievement badges
   - Preferred timezone setting

4. **Email Notifications:**
   - Daily puzzle reminders
   - Leaderboard position updates
   - Streak maintenance alerts
   - New puzzle announcements

5. **Account Management:**
   - Download personal data (GDPR)
   - Delete account permanently
   - Export game history
   - Account recovery options

6. **Premium Features:**
   - Ad-free experience
   - Early access to new puzzles
   - Exclusive themes
   - Advanced statistics

---

## 📞 Support and Troubleshooting

### Common Issues

**Issue:** Users can't sign in after upgrading
**Solution:** Check email verification status, verify password was set correctly

**Issue:** Leaderboard shows old anonymous name
**Solution:** Refresh user data in UserContext, clear cache

**Issue:** Password reset email not received
**Solution:** Check spam folder, verify email provider settings in Supabase

**Issue:** Session expires too quickly
**Solution:** Adjust session timeout in Supabase Auth settings

### Support Documentation

Create help articles for:
- How to create an account
- How to reset password
- How to change display name
- What happens to anonymous data
- How to sign out and sign back in

---

## Summary

This implementation plan provides a complete roadmap for adding authenticated user accounts to Wortex while maintaining the frictionless anonymous play experience. The system is designed to be:

- **User-Friendly:** Minimal friction for both anonymous and authenticated users
- **Secure:** Industry-standard authentication with Supabase
- **Scalable:** Ready for future features like social auth and premium accounts
- **Privacy-Focused:** Only collects necessary data with user consent

**Estimated Total Implementation Time:** 15-20 hours

**Priority Order:**
1. Database migration (required first)
2. Backend auth functions (core functionality)
3. Account upgrade UI (most important user flow)
4. Settings page (secondary but important)
5. Sign in/up from scratch (less common flow)

Begin with Phase 1 (database) and Phase 2 (backend), then move to Phase 4 (UI) for the account upgrade flow, which will be the most commonly used feature.
