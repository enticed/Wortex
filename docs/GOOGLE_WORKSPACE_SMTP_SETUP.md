# Google Workspace SMTP Setup for Supabase

This guide shows you how to configure Supabase to send emails through your Google Workspace account (wortex.live).

## Why Use Google Workspace SMTP?

- ✅ Better email deliverability than Supabase's built-in service
- ✅ Emails come from your @wortex.live domain
- ✅ No rate limits (within Google's limits: 2,000 emails/day)
- ✅ Professional appearance
- ✅ Better spam/inbox placement

## Prerequisites

- Google Workspace account with wortex.live domain
- Admin access to your Google Workspace account
- Access to Supabase Dashboard

## Step 1: Create an App Password in Google Workspace

Since Google Workspace uses 2-factor authentication, you need to create an "App Password" for Supabase.

### Instructions:

1. **Go to your Google Account:**
   - Visit: https://myaccount.google.com/

2. **Navigate to Security:**
   - Click "Security" in the left sidebar

3. **Enable 2-Step Verification (if not already enabled):**
   - Under "Signing in to Google", find "2-Step Verification"
   - Click and follow the setup process
   - **Important:** You must have 2-Step Verification enabled to create App Passwords

4. **Create App Password:**
   - Go back to Security page
   - Under "Signing in to Google", click "App passwords"
   - Alternative direct link: https://myaccount.google.com/apppasswords

5. **Generate Password:**
   - Click "Select app" → Choose "Mail"
   - Click "Select device" → Choose "Other (Custom name)"
   - Enter name: "Supabase Email Service"
   - Click "Generate"

6. **Save the Password:**
   - Google will show a 16-character password (example: `abcd efgh ijkl mnop`)
   - **COPY THIS IMMEDIATELY** - you won't be able to see it again
   - Remove spaces when using it: `abcdefghijklmnop`

## Step 2: Configure SMTP in Supabase Dashboard

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project: `fkzqvhvqyfuxnwdhpytg`

2. **Navigate to SMTP Settings:**
   - Go to: **Project Settings** → **Auth** → **SMTP Settings**
   - Or direct link: Settings → Authentication → Email Provider

3. **Enable Custom SMTP:**
   - Toggle "Enable Custom SMTP" to ON

4. **Enter SMTP Configuration:**

   ```
   SMTP Host: smtp.gmail.com
   Port: 587
   Username: noreply@wortex.live (or any email you want to send from)
   Password: [paste the 16-character app password without spaces]
   Sender Email: noreply@wortex.live
   Sender Name: Wortex
   ```

   **Field Details:**
   - **SMTP Host:** `smtp.gmail.com` (Google's SMTP server)
   - **Port:** `587` (TLS - recommended) or `465` (SSL)
   - **Username:** Your Google Workspace email (e.g., `noreply@wortex.live`)
   - **Password:** The app password you generated (remove spaces)
   - **Sender Email:** What recipients will see as "From:" address
   - **Sender Name:** Friendly name (e.g., "Wortex", "Wortex Team")

5. **Save Configuration:**
   - Click "Save"

6. **Test Email:**
   - Supabase should show a "Send test email" button
   - Enter your email address
   - Click send
   - Check your inbox (and spam folder) for the test email

## Step 3: Update Supabase URL Configuration

This is critical for password reset links to work!

1. **Still in Supabase Dashboard:**
   - Go to: **Authentication** → **URL Configuration**

2. **Set Site URL:**
   - Change from `http://localhost:3000`
   - To: `https://wortex.live`

3. **Add Redirect URLs:**
   - Click "Add redirect URL"
   - Add: `https://wortex.live/auth/reset-password`
   - (Optional) Keep `http://localhost:3000/auth/reset-password` for local testing

4. **Save Changes**

## Step 4: Update Production Environment Variables

In your **production environment** (Vercel, etc.), set:

```bash
NEXT_PUBLIC_APP_URL=https://wortex.live
```

**Where to set this:**

### If using Vercel:
1. Go to your Vercel project dashboard
2. Navigate to: **Settings** → **Environment Variables**
3. Find `NEXT_PUBLIC_APP_URL`
4. Edit and change to: `https://wortex.live`
5. Choose scope: **Production** (not Preview or Development)
6. Save
7. Redeploy your application

### If using another platform:
- Set the environment variable wherever your production environment is configured
- Make sure it's set to `https://wortex.live` (not localhost)

## Step 5: Redeploy Your Application

After updating the environment variable, you must redeploy:

```bash
# If using Vercel and CLI:
vercel --prod

# Or trigger a redeploy from your dashboard
```

## Email Configuration Summary

After setup, your password reset emails will:
- ✅ Come from: `noreply@wortex.live` (or whatever email you chose)
- ✅ Use sender name: "Wortex"
- ✅ Be delivered through Google's reliable SMTP servers
- ✅ Contain reset links pointing to: `https://wortex.live/auth/reset-password`

## Testing the Full Flow

1. **Request Password Reset:**
   - Go to: https://wortex.live
   - Click "Sign In"
   - Click "Forgot Password?"
   - Enter a valid user email
   - Click "Send Reset Link"

2. **Check Email:**
   - Open your inbox
   - Look for email from "Wortex <noreply@wortex.live>"
   - Subject should be related to password reset
   - Check spam folder if not in inbox

3. **Click Reset Link:**
   - Should redirect to: `https://wortex.live/auth/reset-password`
   - Should see password reset form
   - URL should contain hash parameters: `#access_token=...&type=recovery`

4. **Reset Password:**
   - Enter new password (min 8 characters)
   - Confirm password
   - Click "Reset Password"
   - Should see success message
   - Should be redirected to homepage

5. **Verify:**
   - Sign out (if signed in)
   - Sign in with NEW password
   - Should work successfully

## Troubleshooting

### Test Email Fails

**Check:**
1. Is the app password correct? (No spaces, 16 characters)
2. Is 2-Step Verification enabled on Google account?
3. Are you using the correct email address?
4. Try regenerating the app password

### Password Reset Email Not Received

**Check:**
1. Spam/junk folder
2. Is SMTP configured and test email working?
3. Check Supabase Dashboard → Authentication → Logs for errors
4. Verify Site URL is set to `https://wortex.live`
5. Verify user account exists with that email

### Reset Link Goes to Homepage

**This was the issue you reported! Check:**
1. ✅ Code has been updated to use `NEXT_PUBLIC_APP_URL`
2. ✅ Environment variable set to `https://wortex.live` in production
3. ✅ Application has been redeployed after environment variable change
4. ✅ Supabase redirect URLs include `https://wortex.live/auth/reset-password`

### "Invalid Token" Error on Reset Page

**Check:**
1. Link hasn't expired (tokens expire after 1 hour)
2. URL contains hash parameters: `#access_token=...&type=recovery`
3. Link wasn't modified or truncated
4. User hasn't already used this link (tokens are single-use)

## Google Workspace Limits

- **Daily sending limit:** 2,000 emails/day per account
- **Rate limit:** ~100 emails/hour
- **Recipients per message:** 2,000
- More info: https://support.google.com/a/answer/166852

For a game like Wortex, 2,000 emails/day should be plenty for:
- Password resets
- Account notifications
- Welcome emails
- etc.

If you need more, consider:
- Multiple sending accounts
- Dedicated email service (SendGrid, AWS SES, Postmark)
- Google Workspace with increased limits (enterprise)

## Alternative: Create a Dedicated Email Account

Instead of using your main email, you could create a dedicated account:

1. **Create email:** `noreply@wortex.live` in Google Workspace
2. **Set up app password** for that account
3. **Use it in SMTP settings**

Benefits:
- Keeps email traffic separate
- Better monitoring
- Can set up email forwarding for bounces
- Professional appearance

## Security Best Practices

✅ **Use App Password** - Never use your main account password
✅ **Restrict Access** - Only share app password with necessary services
✅ **Monitor Usage** - Check Google Workspace email logs periodically
✅ **Revoke if Needed** - Can revoke app passwords anytime in Google settings
✅ **Use TLS** - Port 587 with TLS (already configured)

## Next Steps

After configuring:

1. ✅ Test password reset flow end-to-end
2. ✅ Monitor first few password resets in production
3. ✅ Customize email templates in Supabase (optional)
4. ✅ Set up email monitoring/alerting (optional)
5. ✅ Document the SMTP configuration in your team docs

## Related Documentation

- [PASSWORD_RESET_SETUP.md](PASSWORD_RESET_SETUP.md) - General password reset guide
- [PASSWORD_RESET_IMPLEMENTATION_STATUS.md](PASSWORD_RESET_IMPLEMENTATION_STATUS.md) - Implementation details
- [SUPABASE_SETUP.md](SUPABASE_SETUP.md) - General Supabase setup

## Questions?

If you encounter issues:
1. Check Supabase Dashboard → Authentication → Logs
2. Check Google Workspace → Reports → Email log search
3. Verify all environment variables are correct
4. Ensure application was redeployed after changes
