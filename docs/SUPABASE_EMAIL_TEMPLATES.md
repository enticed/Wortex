# Supabase Email Templates for Wortex

This document contains the recommended email templates to configure in Supabase Dashboard.

## How to Update Templates

1. Go to: https://supabase.com/dashboard
2. Select project: `fkzqvhvqyfuxnwdhpytg`
3. Navigate to: **Authentication** → **Email Templates**
4. Select the template to edit
5. Paste the template below
6. Click **Save**

---

## 1. Reset Password Email

**When to use:** User clicks "Forgot Password" and requests password reset

**Template:**

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #4F46E5; margin: 0;">Wortex</h1>
    <p style="color: #666; margin-top: 5px;">Daily Word Puzzle Game</p>
  </div>

  <div style="background-color: #f9fafb; border-radius: 8px; padding: 30px; border: 1px solid #e5e7eb;">
    <h2 style="color: #111827; margin-top: 0;">Reset Your Password</h2>

    <p style="color: #374151; line-height: 1.6;">
      Hi there!
    </p>

    <p style="color: #374151; line-height: 1.6;">
      You requested to reset your password for your Wortex account. Click the button below to create a new password:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}"
         style="background-color: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
        Reset Password
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
      This link will expire in <strong>1 hour</strong> for security reasons.
    </p>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
      If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
    </p>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
    <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
      This email was sent from <a href="https://wortex.live" style="color: #4F46E5; text-decoration: none;">wortex.live</a>
    </p>
    <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
      Keep puzzling! 🧩
    </p>
  </div>
</div>
```

---

## 2. Confirm Signup Email (If Email Verification Enabled)

**When to use:** New user signs up with email/password

**Template:**

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #4F46E5; margin: 0;">Wortex</h1>
    <p style="color: #666; margin-top: 5px;">Daily Word Puzzle Game</p>
  </div>

  <div style="background-color: #f9fafb; border-radius: 8px; padding: 30px; border: 1px solid #e5e7eb;">
    <h2 style="color: #111827; margin-top: 0;">Welcome to Wortex! 🎉</h2>

    <p style="color: #374151; line-height: 1.6;">
      Thanks for signing up! To get started, please confirm your email address by clicking the button below:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}"
         style="background-color: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
        Confirm Email
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
      Once confirmed, you'll be able to:
    </p>
    <ul style="color: #6b7280; font-size: 14px; line-height: 1.8;">
      <li>Track your progress across devices</li>
      <li>Compete on the leaderboard</li>
      <li>Never lose your stats</li>
    </ul>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
      If you didn't create this account, you can safely ignore this email.
    </p>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
    <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
      This email was sent from <a href="https://wortex.live" style="color: #4F46E5; text-decoration: none;">wortex.live</a>
    </p>
    <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
      Happy puzzling! 🧩
    </p>
  </div>
</div>
```

---

## 3. Magic Link Email (If Using Passwordless Login)

**When to use:** User requests magic link sign-in

**Template:**

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #4F46E5; margin: 0;">Wortex</h1>
    <p style="color: #666; margin-top: 5px;">Daily Word Puzzle Game</p>
  </div>

  <div style="background-color: #f9fafb; border-radius: 8px; padding: 30px; border: 1px solid #e5e7eb;">
    <h2 style="color: #111827; margin-top: 0;">Sign In to Wortex</h2>

    <p style="color: #374151; line-height: 1.6;">
      Click the button below to sign in to your Wortex account:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}"
         style="background-color: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
        Sign In
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
      This link will expire in <strong>1 hour</strong> for security reasons.
    </p>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
      If you didn't request this sign-in link, you can safely ignore this email.
    </p>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
    <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
      This email was sent from <a href="https://wortex.live" style="color: #4F46E5; text-decoration: none;">wortex.live</a>
    </p>
    <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
      Keep puzzling! 🧩
    </p>
  </div>
</div>
```

---

## 4. Email Change Confirmation

**When to use:** User updates their email address

**Template:**

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #4F46E5; margin: 0;">Wortex</h1>
    <p style="color: #666; margin-top: 5px;">Daily Word Puzzle Game</p>
  </div>

  <div style="background-color: #f9fafb; border-radius: 8px; padding: 30px; border: 1px solid #e5e7eb;">
    <h2 style="color: #111827; margin-top: 0;">Confirm Your New Email</h2>

    <p style="color: #374151; line-height: 1.6;">
      You requested to change your email address for your Wortex account. Click the button below to confirm this change:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}"
         style="background-color: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
        Confirm Email Change
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
      If you didn't request this change, please contact support immediately.
    </p>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
    <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
      This email was sent from <a href="https://wortex.live" style="color: #4F46E5; text-decoration: none;">wortex.live</a>
    </p>
  </div>
</div>
```

---

## Templates You DON'T Need (Yet)

These are available in Supabase but not needed for Wortex right now:

- **Invite User** - Only if you add team/multi-user features
- **MFA (Multi-Factor Authentication)** - Only if you enable 2FA

---

## Current Email Sending Status

✅ **SMTP:** Configured with Resend
✅ **Domain:** mail.wortex.live (verified)
✅ **Sender:** noreply@mail.wortex.live
✅ **DNS Records:** SPF, DKIM, DMARC configured
✅ **Deliverability:** Good (emails no longer going to spam)

---

## Testing Email Templates

After updating templates, test by:

1. **Password Reset:**
   - Sign out
   - Click "Forgot Password"
   - Check email appearance

2. **Signup (if email verification enabled):**
   - Create new account
   - Check confirmation email

3. **Check spam score:**
   - Use https://www.mail-tester.com
   - Send a test email to the provided address
   - Should score 8/10 or higher

---

## Customization Tips

- **Colors:** Use your brand colors (currently using Indigo #4F46E5)
- **Logo:** Add logo image URL if you have one
- **Footer:** Add links to privacy policy, terms of service, etc.
- **Unsubscribe:** Not needed for transactional emails like password resets

---

**Last Updated:** 2026-01-29
**Status:** Ready for production use
