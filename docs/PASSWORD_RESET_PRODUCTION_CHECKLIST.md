# Password Reset Production Deployment Checklist

## Issue You Encountered

When clicking the password reset link in email, users were redirected to the homepage instead of the password reset page.

## Root Cause

The `NEXT_PUBLIC_APP_URL` environment variable was set to `http://localhost:3000` in production, causing the reset link to be malformed.

## Fix Applied

Updated [lib/supabase/auth.ts](lib/supabase/auth.ts) to properly use the `NEXT_PUBLIC_APP_URL` environment variable for generating the reset redirect URL.

## Deployment Checklist

Follow these steps **in order** to fix the password reset issue in production:

### 1. Update Code (Already Done ✅)

- [x] Updated `lib/supabase/auth.ts` to use `NEXT_PUBLIC_APP_URL`
- [x] Code uses `https://wortex.live` as fallback if env var not set

### 2. Configure Supabase Dashboard

#### A. URL Configuration

- [ ] Go to: https://supabase.com/dashboard
- [ ] Select project: `fkzqvhvqyfuxnwdhpytg`
- [ ] Navigate to: **Authentication** → **URL Configuration**
- [ ] Set **Site URL** to: `https://wortex.live`
- [ ] Add redirect URL: `https://wortex.live/auth/reset-password`
- [ ] (Optional) Keep `http://localhost:3000/auth/reset-password` for local dev
- [ ] Click **Save**

#### B. SMTP Configuration (Fixes the Rate Limit Warning)

- [ ] Go to: **Project Settings** → **Auth** → **SMTP Settings**
- [ ] Toggle **Enable Custom SMTP** to ON
- [ ] Enter configuration:
  ```
  SMTP Host: smtp.gmail.com
  Port: 587
  Username: noreply@wortex.live (or your chosen email)
  Password: [Google App Password - see guide below]
  Sender Email: noreply@wortex.live
  Sender Name: Wortex
  ```
- [ ] Click **Save**
- [ ] Click **Send test email** and verify it arrives

**For App Password setup:** See [GOOGLE_WORKSPACE_SMTP_SETUP.md](GOOGLE_WORKSPACE_SMTP_SETUP.md)

### 3. Update Production Environment Variables

#### If using Vercel:

- [ ] Go to Vercel Dashboard: https://vercel.com
- [ ] Select your Wortex project
- [ ] Navigate to: **Settings** → **Environment Variables**
- [ ] Find or add: `NEXT_PUBLIC_APP_URL`
- [ ] Set value to: `https://wortex.live`
- [ ] Set environment to: **Production** (not Preview/Development)
- [ ] Click **Save**

#### If using another platform:

- [ ] Set `NEXT_PUBLIC_APP_URL=https://wortex.live` in production environment
- [ ] Ensure it's not set to `localhost`

### 4. Deploy Updated Code

You need to deploy the code changes made to `lib/supabase/auth.ts`:

#### Option A: Git Push (Recommended)

```bash
# Commit the changes
git add lib/supabase/auth.ts
git commit -m "Fix password reset redirect URL for production"
git push origin main

# Vercel will auto-deploy if connected to your repo
```

#### Option B: Manual Redeploy

- [ ] Trigger a new deployment in your hosting platform
- [ ] Ensure it's deploying to **production** (not preview)
- [ ] Wait for deployment to complete

### 5. Verify Deployment

- [ ] Check that the new deployment is live
- [ ] Visit: `https://wortex.live`
- [ ] Verify site loads correctly

### 6. Test Password Reset Flow End-to-End

#### A. Request Password Reset

- [ ] Go to: `https://wortex.live`
- [ ] Click **Sign In** button
- [ ] Click **Forgot Password?** link
- [ ] Enter a valid user email (one that exists in your system)
- [ ] Click **Send Reset Link**
- [ ] Verify success message appears

#### B. Check Email

- [ ] Open email inbox for the test account
- [ ] Look for email from "Wortex <noreply@wortex.live>"
- [ ] Check spam folder if not in inbox
- [ ] Email should arrive within seconds

#### C. Click Reset Link

- [ ] Click the "Reset Password" link in email
- [ ] Should redirect to: `https://wortex.live/auth/reset-password`
- [ ] **Verify URL contains:** `#access_token=...&type=recovery`
- [ ] Should see the password reset form (NOT the homepage!)

#### D. Reset Password

- [ ] Enter a new password (min 8 characters)
- [ ] Re-enter password in confirmation field
- [ ] Click **Reset Password** button
- [ ] Should see success message
- [ ] Should auto-redirect to homepage after 2 seconds

#### E. Verify New Password Works

- [ ] Sign out (if signed in)
- [ ] Click **Sign In**
- [ ] Enter the email and **new password**
- [ ] Should successfully sign in

### 7. Monitor for Issues

First 24 hours after deployment:

- [ ] Check Supabase Dashboard → **Authentication** → **Logs** for errors
- [ ] Monitor user reports of password reset issues
- [ ] Check email delivery rates in Google Workspace
- [ ] Verify no unusual error rates in your application logs

## Quick Reference

### What Changed

**File:** [lib/supabase/auth.ts:283-284](lib/supabase/auth.ts#L283-L284)

**Before:**
```typescript
redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/reset-password`
```

**After:**
```typescript
const appUrl = process.env.NEXT_PUBLIC_APP_URL ||
               (typeof window !== 'undefined' ? window.location.origin : 'https://wortex.live');

redirectTo: `${appUrl}/auth/reset-password`
```

### Critical Environment Variables

| Variable | Local | Production |
|----------|-------|------------|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://wortex.live` |

### Critical Supabase Settings

| Setting | Value |
|---------|-------|
| Site URL | `https://wortex.live` |
| Redirect URLs | `https://wortex.live/auth/reset-password` |

## Common Issues After Deployment

### Still redirecting to homepage?

**Check:**
1. Did you redeploy after updating environment variable?
2. Is `NEXT_PUBLIC_APP_URL` set to `https://wortex.live` in production?
3. Did you clear browser cache?
4. Are you testing on production URL (not preview/staging)?

**Debug:**
```bash
# Check what URL is being used in production
# Look at Network tab in browser DevTools when requesting reset
# Should see redirectTo: "https://wortex.live/auth/reset-password"
```

### Email not arriving?

**Check:**
1. SMTP configuration in Supabase
2. Test email works from Supabase dashboard
3. Check spam folder
4. Verify user email exists in database
5. Check Supabase Auth logs for errors

### "Invalid token" error?

**Check:**
1. URL contains `#access_token=...&type=recovery`
2. Link hasn't expired (1 hour limit)
3. Link hasn't been used already (single-use)
4. No URL encoding issues

## Rollback Plan

If issues occur:

1. **Immediate:** Revert to previous deployment in Vercel
2. **Or:** Set `NEXT_PUBLIC_APP_URL` back to previous value
3. **Then:** Investigate issue before redeploying

## Success Criteria

✅ Password reset link redirects to `/auth/reset-password` (not homepage)
✅ Password reset form displays correctly
✅ Users can successfully reset their password
✅ New password works for signing in
✅ Emails arrive promptly (within seconds)
✅ No errors in Supabase logs

## Additional Resources

- [GOOGLE_WORKSPACE_SMTP_SETUP.md](GOOGLE_WORKSPACE_SMTP_SETUP.md) - SMTP configuration
- [PASSWORD_RESET_SETUP.md](PASSWORD_RESET_SETUP.md) - General setup guide
- [PASSWORD_RESET_IMPLEMENTATION_STATUS.md](PASSWORD_RESET_IMPLEMENTATION_STATUS.md) - Technical details

## Timeline

**Estimated time to complete:** 30-45 minutes

- Supabase configuration: 10 minutes
- Google App Password setup: 10 minutes
- Environment variable update: 5 minutes
- Deployment: 5-10 minutes
- Testing: 10 minutes

## Next Steps After Success

1. ✅ Document SMTP credentials securely (password manager)
2. ✅ Set up monitoring for email delivery rates
3. ✅ Customize email templates (optional)
4. ✅ Consider adding email verification on signup
5. ✅ Update user documentation about password reset

---

**Last Updated:** Based on fix applied on 2026-01-28
**Status:** Ready for production deployment
