# Resend SMTP Setup for Supabase (Recommended Alternative)

## Why Resend Instead of Google Workspace?

Google Workspace has made App Passwords difficult to use, especially for workspace accounts. **Resend is a better solution:**

- ✅ **Purpose-built** for transactional emails (like password resets)
- ✅ **Free tier:** 3,000 emails/month, 100/day (plenty for Wortex)
- ✅ **Better deliverability** than Google SMTP
- ✅ **5-minute setup** - no complex authentication
- ✅ **Professional:** Still sends from @wortex.live
- ✅ **Modern:** Built for developers, great docs
- ✅ **Analytics:** Track delivery, opens, clicks

## Step 1: Create Resend Account

1. **Sign up:**
   - Go to: https://resend.com
   - Click "Get Started"
   - Sign up with your email

2. **Verify your email:**
   - Check inbox for verification email
   - Click verification link

## Step 2: Add Your Domain (wortex.live)

1. **In Resend Dashboard:**
   - Click "Domains" in left sidebar
   - Click "Add Domain"

2. **Enter your domain:**
   - Domain: `wortex.live`
   - Click "Add"

3. **Add DNS Records:**
   - Resend will show you DNS records to add
   - You need to add these to your domain registrar (where you manage wortex.live)

   **Typical records you'll need to add:**
   ```
   Type: TXT
   Name: _resend
   Value: [Resend will provide this]

   Type: TXT
   Name: @
   Value: [SPF record - Resend will provide]

   Type: CNAME
   Name: resend._domainkey
   Value: [DKIM record - Resend will provide]
   ```

4. **Where to add DNS records:**
   - If using **Cloudflare:** DNS → Records → Add record
   - If using **Google Domains:** DNS → Custom records
   - If using **GoDaddy:** DNS → Manage DNS → Add record
   - If using **Namecheap:** Advanced DNS → Add record

5. **Verify domain:**
   - After adding DNS records (may take 5-60 minutes to propagate)
   - Click "Verify" in Resend dashboard
   - Should turn green when verified

## Step 3: Get SMTP Credentials

1. **In Resend Dashboard:**
   - Click "SMTP" in left sidebar (or "API Keys" → "SMTP")
   - You'll see SMTP credentials

2. **Copy these values:**
   ```
   SMTP Host: smtp.resend.com
   Port: 587 (or 465 for SSL)
   Username: resend
   Password: re_xxxxxxxxxxxxx (your API key)
   ```

   **Note:** The password is actually an API key that starts with `re_`

## Step 4: Configure Supabase with Resend SMTP

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project: `fkzqvhvqyfuxnwdhpytg`

2. **Navigate to SMTP Settings:**
   - Go to: **Project Settings** → **Auth** → **SMTP Settings**

3. **Enable Custom SMTP:**
   - Toggle "Enable Custom SMTP" to ON

4. **Enter Resend SMTP Configuration:**
   ```
   SMTP Host: smtp.resend.com
   Port: 587
   Username: resend
   Password: re_xxxxxxxxxxxxx (your Resend API key)
   Sender Email: noreply@wortex.live
   Sender Name: Wortex
   ```

5. **Save Configuration:**
   - Click "Save"

6. **Test Email:**
   - Click "Send test email"
   - Enter your email address
   - Check inbox (and spam) for test email
   - Should arrive within seconds

## Step 5: Update Supabase URL Configuration

Same as before:

1. **In Supabase Dashboard:**
   - Go to: **Authentication** → **URL Configuration**

2. **Set Site URL:**
   - `https://wortex.live`

3. **Add Redirect URLs:**
   - `https://wortex.live/auth/reset-password`

4. **Save Changes**

## Step 6: Update Production Environment

Make sure production environment has:

```bash
NEXT_PUBLIC_APP_URL=https://wortex.live
```

Then redeploy your application.

## Testing

Follow the same testing steps as in [PASSWORD_RESET_PRODUCTION_CHECKLIST.md](PASSWORD_RESET_PRODUCTION_CHECKLIST.md):

1. Request password reset
2. Check email (should come from noreply@wortex.live)
3. Click link
4. Reset password
5. Sign in with new password

## Resend Dashboard Features

Once set up, you can monitor:

- **Emails sent:** See every email in real-time
- **Delivery status:** Delivered, bounced, failed
- **Opens/clicks:** Track user engagement (optional)
- **Logs:** Debug email issues easily

Go to: Resend Dashboard → Emails

## Cost Comparison

| Service | Free Tier | Cost After |
|---------|-----------|------------|
| **Resend** | 3,000/month, 100/day | $20/mo for 50k emails |
| SendGrid | 100/day | $15/mo for 40k emails |
| Amazon SES | 3,000/month* | $0.10 per 1,000 emails |
| Google Workspace SMTP | 2,000/day | Requires workspace subscription |

*with EC2

For Wortex, you'll likely stay in free tier for a long time!

## Advantages Over Google Workspace

1. **No App Password hassle** - Just an API key
2. **Better deliverability** - Purpose-built for transactional email
3. **Analytics** - See exactly what's happening with emails
4. **Easier troubleshooting** - Better logs and debugging
5. **More reliable** - Won't hit unexpected workspace limits
6. **Scalable** - Can grow with your app

## Domain Verification Tips

### DNS Propagation
- DNS changes can take 5-60 minutes
- Sometimes up to 24 hours
- Use https://dnschecker.org to check propagation
- Search for your domain with record type TXT

### Common DNS Issues

**TXT Record Too Long:**
- Some DNS providers require long TXT records to be split
- Resend will show you how to split if needed

**CNAME Conflicts:**
- Remove any existing CNAME records that conflict
- Can't have CNAME and other records on same subdomain

**Wrong @ Symbol:**
- `@` means root domain (wortex.live)
- Some providers use different notation
- Check your provider's documentation

## Alternative: Resend API (Even Simpler)

If you want even more control, you could use Resend's API directly instead of SMTP:

**Pros:**
- Better error messages
- More features (attachments, CC, BCC)
- Easier to debug

**Cons:**
- Requires code changes to Supabase auth flow
- More complex to set up

Stick with SMTP for now - it works great with Supabase out of the box.

## Troubleshooting

### Test Email Fails

**Check:**
1. Is domain verified in Resend? (Should be green checkmark)
2. Is API key correct in Supabase?
3. Is sender email using verified domain (@wortex.live)?
4. DNS records properly added?

### Domain Won't Verify

**Check:**
1. Wait 5-60 minutes for DNS propagation
2. Use https://dnschecker.org to verify records are live
3. Ensure records are exact match (no extra spaces)
4. Check you added records to correct domain

### Email Goes to Spam

**Solutions:**
1. Ensure SPF and DKIM records are added (from domain verification)
2. Warm up your domain (send small volumes first)
3. Use professional email copy
4. Avoid spam trigger words

## Security

✅ **API Keys:** Treat like passwords - never commit to Git
✅ **Rotation:** Can rotate API keys anytime in Resend dashboard
✅ **Monitoring:** Check Resend logs for suspicious activity
✅ **Rate Limits:** Resend automatically rate limits to prevent abuse

## Next Steps After Setup

1. ✅ Verify domain in Resend
2. ✅ Configure SMTP in Supabase
3. ✅ Test password reset flow
4. ✅ Monitor first few emails in Resend dashboard
5. ✅ (Optional) Customize email templates in Supabase
6. ✅ (Optional) Set up email analytics in Resend

## Support

- **Resend Docs:** https://resend.com/docs
- **Resend Discord:** Join for quick help
- **Supabase Docs:** https://supabase.com/docs/guides/auth/auth-smtp

## Summary

**Total setup time:** ~15 minutes (including DNS propagation)

**Steps:**
1. Create Resend account (2 min)
2. Add domain and DNS records (5 min)
3. Wait for DNS verification (5-60 min)
4. Configure Supabase SMTP (2 min)
5. Test (2 min)

**Result:** Professional, reliable email delivery from @wortex.live with no Google Workspace hassles!

---

**Recommended:** Start with Resend's free tier. If you outgrow it later (unlikely), you can switch to AWS SES for cheaper high-volume sending.
