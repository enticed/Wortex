# Password Reset Email Configuration Guide

This guide explains how to configure email sending for the password reset feature in Supabase.

## Overview

The password reset feature has been fully implemented with:
- ✅ Frontend UI in the Sign-In dialog
- ✅ API endpoint at `/api/auth/reset-password`
- ✅ Password reset callback page at `/auth/reset-password`
- ⚠️ Email configuration (needs setup in Supabase Dashboard)

## Email Configuration Options

Supabase offers two options for sending emails:

### Option 1: Use Supabase's Built-in Email Service (Recommended for Production)

This is the easiest option for production deployments.

#### Steps:

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: `fkzqvhvqyfuxnwdhpytg`

2. **Configure Email Settings**
   - Go to: **Authentication** → **Email Templates**
   - You'll see templates for:
     - Confirm signup
     - Magic Link
     - **Reset Password** ← This is what we need
     - Email Change
     - Invite user

3. **Customize the Reset Password Template (Optional)**
   - Click on "Reset Password"
   - You can customize the email subject and body
   - The template uses variables like `{{ .ConfirmationURL }}` for the reset link
   - Default template is usually fine

4. **Configure Site URL**
   - Go to: **Authentication** → **URL Configuration**
   - Set **Site URL** to your production URL (e.g., `https://your-domain.com`)
   - For local testing, use: `http://localhost:3000`
   - Add redirect URLs if needed: `http://localhost:3000/auth/reset-password`

5. **Rate Limiting (Important!)**
   - Go to: **Authentication** → **Rate Limits**
   - Ensure password reset has appropriate rate limits to prevent abuse
   - Default is usually 60 requests per hour per IP, which is reasonable

#### Limitations in Development:

- By default, Supabase **does NOT send actual emails in development**
- Instead, email links are logged to the Supabase Dashboard
- To see them: **Authentication** → **Logs** → Filter by "Email"
- You can copy the magic link from the logs and test it

### Option 2: Configure Custom SMTP Server (For Development & Production)

This allows you to send real emails even in development.

#### Steps:

1. **Get SMTP Credentials**
   - Use a service like:
     - **Gmail** (free, with app passwords)
     - **SendGrid** (generous free tier)
     - **AWS SES** (cheap and reliable)
     - **Mailgun**, **Postmark**, etc.

2. **Configure in Supabase**
   - Go to: **Project Settings** → **Auth** → **SMTP Settings**
   - Enable custom SMTP
   - Enter your SMTP details:
     ```
     Host: smtp.gmail.com (or your provider)
     Port: 587 (or 465 for SSL)
     Username: your-email@gmail.com
     Password: your-app-password
     Sender email: your-email@gmail.com
     Sender name: Wortex
     ```

3. **For Gmail Specifically:**
   - Enable 2-factor authentication on your Google account
   - Generate an "App Password":
     - Go to: https://myaccount.google.com/apppasswords
     - Create a new app password for "Mail"
     - Use this password (not your regular password) in SMTP settings

4. **Test the Configuration**
   - Supabase has a "Send test email" button in SMTP settings
   - Use it to verify emails are being sent

## Testing the Password Reset Flow

### In Development (Without SMTP):

1. **Request Password Reset:**
   ```bash
   # Open the app
   # Click "Sign In" → "Forgot Password?"
   # Enter an email address of an existing user
   # Click "Send Reset Link"
   ```

2. **Get the Reset Link:**
   - Go to Supabase Dashboard
   - Navigate to: **Authentication** → **Logs**
   - Look for recent email events
   - Find the magic link/reset URL
   - Copy it

3. **Test the Reset:**
   - Paste the URL in your browser
   - You'll be redirected to `/auth/reset-password`
   - Enter a new password
   - Submit and verify the password was updated

### In Production (With Email Configured):

1. **Request Password Reset:**
   - Enter email in "Forgot Password" form
   - Click "Send Reset Link"

2. **Check Email:**
   - User should receive an email within seconds
   - Click the reset link in the email

3. **Complete Reset:**
   - User is taken to `/auth/reset-password`
   - Enter new password
   - Submit and sign in with new password

## Security Considerations

### Already Implemented:

✅ **Token Validation** - Reset links contain secure tokens that expire
✅ **Password Requirements** - Minimum 8 characters enforced
✅ **HTTPS Only** - Password reset should only work over HTTPS in production
✅ **Password Confirmation** - Users must enter password twice

### Recommended Additional Security:

1. **Token Expiration:**
   - Supabase tokens expire after 1 hour by default
   - Configure in: **Authentication** → **Email Templates** → Token expiry

2. **Rate Limiting:**
   - Already configured in Supabase
   - Prevents brute force attacks

3. **Email Verification:**
   - Consider requiring email verification on signup
   - Configure in: **Authentication** → **Providers** → Email

## Troubleshooting

### Emails Not Sending

**Check:**
1. Is SMTP configured correctly? (Test in Supabase Dashboard)
2. Is the Site URL correct? (Check URL Configuration)
3. Is the user's email verified? (Check in Users table)
4. Are you in development? (Emails may only be logged, not sent)

### Reset Link Not Working

**Check:**
1. Has the link expired? (Default: 1 hour)
2. Is the Site URL correct in Supabase settings?
3. Is the hash fragment being preserved? (Should have `#access_token=...`)
4. Are there any CORS issues? (Check browser console)

### User Can't Find Email

**Advise to check:**
1. Spam/junk folder
2. Email address spelling
3. Whether they actually have an account with that email

## Email Template Customization

You can customize the password reset email in Supabase Dashboard:

1. Go to: **Authentication** → **Email Templates** → **Reset Password**
2. Available variables:
   - `{{ .Email }}` - User's email
   - `{{ .ConfirmationURL }}` - The reset link (required!)
   - `{{ .Token }}` - The raw token
   - `{{ .TokenHash }}` - The hashed token

Example custom template:
```html
<h2>Reset Your Wortex Password</h2>
<p>Hi there!</p>
<p>You requested to reset your password for Wortex.</p>
<p><a href="{{ .ConfirmationURL }}">Click here to reset your password</a></p>
<p>This link expires in 1 hour.</p>
<p>If you didn't request this, please ignore this email.</p>
<p>Happy puzzling!<br>The Wortex Team</p>
```

## Current Configuration Status

- ✅ Frontend: Password reset form implemented
- ✅ Backend: API endpoint ready
- ✅ Callback Page: Reset password page created
- ⚠️ Email: Needs configuration in Supabase Dashboard
- ⚠️ SMTP: Optional, configure if you want emails in development

## Quick Start Checklist

For a quick setup to test password reset:

- [ ] Set Site URL in Supabase to `http://localhost:3000`
- [ ] Add redirect URL: `http://localhost:3000/auth/reset-password`
- [ ] Test reset flow by checking Dashboard logs for email links
- [ ] (Optional) Configure SMTP for real email sending

For production:

- [ ] Set Site URL to your production domain
- [ ] Configure custom SMTP or use Supabase emails
- [ ] Customize email template (optional)
- [ ] Test password reset flow end-to-end
- [ ] Monitor email delivery rates
- [ ] Set up rate limiting alerts (optional)

## Next Steps

1. **Immediate:** Configure Site URL in Supabase Dashboard
2. **Before Launch:** Set up SMTP or verify Supabase emails work
3. **Optional:** Customize email templates for branding
4. **Optional:** Add email verification on signup for extra security
