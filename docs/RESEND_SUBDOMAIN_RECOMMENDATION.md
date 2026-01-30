# Resend Subdomain Setup for Wortex

## Recommended Configuration

**Domain to add in Resend:** `mail.wortex.live`

**Email addresses you can use:**
- `noreply@mail.wortex.live` (recommended for password resets)
- `hello@mail.wortex.live` (for support/welcome emails)
- `team@mail.wortex.live` (for team communications)
- `notifications@mail.wortex.live` (for game notifications)

## Step-by-Step Setup

### 1. In Resend Dashboard

When adding your domain:
- **Instead of:** `wortex.live`
- **Enter:** `mail.wortex.live`
- Click "Add"

### 2. DNS Records

Resend will give you DNS records like:

```
Type: TXT
Name: _resend.mail
Value: [Resend provides this]

Type: TXT
Name: mail
Value: [SPF record]

Type: CNAME
Name: resend._domainkey.mail
Value: [DKIM record]
```

**Where to add these:**
- Go to your DNS provider (where wortex.live is managed)
- Add all three records
- Wait 5-60 minutes for propagation
- Verify in Resend dashboard

### 3. In Supabase SMTP Settings

Use these sender details:

```
SMTP Host: smtp.resend.com
Port: 587
Username: resend
Password: re_xxxxxxxxxxxxx (your Resend API key)
Sender Email: noreply@mail.wortex.live
Sender Name: Wortex
```

### 4. What Users Will See

**Email from:** Wortex <noreply@mail.wortex.live>

**They'll see:**
- Sender: "Wortex"
- Email address: noreply@mail.wortex.live
- Subject: "Reset your password" (or whatever Supabase template says)

## Does It Look Professional?

**Yes!** This is exactly what professional apps do:

- **Stripe:** receipts@stripe.com (subdomain: stripe.email)
- **GitHub:** notifications@github.com
- **Notion:** team@mail.notion.so
- **Vercel:** updates@mail.vercel.com

Users are very familiar with this pattern and it actually **increases trust**.

## Benefits for Wortex

✅ **Protects main domain** - wortex.live reputation stays pristine
✅ **Better deliverability** - Email providers recognize transactional patterns
✅ **Professional** - Industry standard approach
✅ **Flexible** - Can add more email purposes later
✅ **Secure** - Isolated from your main website infrastructure

## Common Questions

### Q: Will users trust emails from mail.wortex.live?

**A:** Yes! Users are very familiar with this pattern. As long as:
1. Sender name is clear: "Wortex"
2. Email content is professional
3. SPF/DKIM are properly configured (Resend handles this)

### Q: Can I still use wortex.live for business email?

**A:** Yes! This is separate:
- **Business email:** you@wortex.live (Google Workspace)
- **Automated email:** noreply@mail.wortex.live (Resend)

They don't conflict.

### Q: What if I want to use the root domain later?

**A:** You can add wortex.live to Resend later if needed, but you probably won't want to. Subdomain is better.

### Q: Should I use "mail" or "email" or something else?

**A:** Common options:
- `mail.wortex.live` ✅ (recommended - short, clear)
- `email.wortex.live` ✅ (also good)
- `notifications.wortex.live` (bit long)
- `no-reply.wortex.live` (hyphen can cause issues)

**Stick with:** `mail.wortex.live` - it's simple and professional.

## Supabase Email Template Customization

Since you're using a subdomain, you might want to customize the email template in Supabase to make it clear it's from Wortex:

### In Supabase Dashboard:
1. Go to: **Authentication** → **Email Templates** → **Reset Password**
2. Customize the template (optional):

```html
<h2>Reset Your Wortex Password</h2>

<p>Hi there!</p>

<p>You requested to reset your password for your Wortex account.</p>

<p><a href="{{ .ConfirmationURL }}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>

<p>This link expires in 1 hour.</p>

<p>If you didn't request this, you can safely ignore this email.</p>

<p>Keep puzzling!<br>
The Wortex Team</p>

<hr>
<p style="color: #666; font-size: 12px;">
This email was sent from noreply@mail.wortex.live. This is an automated message, please do not reply.
</p>
```

This makes it very clear the email is legitimate and from Wortex.

## DNS Setup Example

If your DNS provider is **Cloudflare**, **Google Domains**, or **Namecheap**:

### Example DNS Records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| TXT | `_resend.mail` | `re_xxxxxxxxxxxx` | Auto |
| TXT | `mail` | `v=spf1 include:_spf.resend.com ~all` | Auto |
| CNAME | `resend._domainkey.mail` | `resend1._domainkey.resend.com` | Auto |

**Note:** Exact record names will be provided by Resend - copy them exactly!

## Testing After Setup

Once DNS is verified and Supabase is configured:

1. **Test in Supabase:**
   - SMTP Settings → "Send test email"
   - Should arrive from: Wortex <noreply@mail.wortex.live>

2. **Check email headers:**
   - Open email
   - View source/headers
   - Should see SPF: PASS, DKIM: PASS
   - From: mail.wortex.live

3. **Test password reset:**
   - Request reset on wortex.live
   - Email should arrive quickly
   - Click link, reset password
   - Verify it works

## Summary

**Use:** `mail.wortex.live` as your Resend domain

**Benefits:**
- Industry best practice
- Protects your main domain
- Better deliverability
- Professional appearance
- Future flexibility

**Users will see:** Wortex <noreply@mail.wortex.live>

**They'll think:** "This is a legitimate automated email from Wortex" ✅

---

**Bottom line:** Resend's recommendation is correct. Use the subdomain!
