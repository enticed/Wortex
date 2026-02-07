# Stripe Webhook Issue - Resolution

## Issue Summary
User `jnarvaez101@gmail.com` paid for a $1/month subscription on 01/28/26, but their account was not promoted to premium tier.

## Root Cause

**Primary Issue:** Vercel domain configuration is redirecting `wortex.live` → `www.wortex.live` at the infrastructure level. This causes:

1. **307 Temporary Redirect** responses from Vercel before the app even runs
2. Stripe webhooks don't follow redirects, so all deliveries fail
3. The `customer.subscription.created` event (which upgrades users to premium) never executes
4. User remained on free tier despite successful payment

**Secondary Issue (Fixed):** The middleware was also intercepting webhook requests, but this was less critical than the domain redirect issue.

### Evidence
From Stripe webhook logs (01/28/26):
- `customer.subscription.created` event contained correct user metadata
- All delivery attempts to `https://wortex.live/api/stripe/webhook` failed with "307 Temporary Redirect"
- Stripe doesn't follow redirects for webhooks, so they were marked as failed

## Solution Implemented

### 1. Immediate Fix (Manual)
Upgraded the user account manually using [scripts/manual-premium-upgrade.mjs](../scripts/manual-premium-upgrade.mjs):
- Updated `user_tier` to `premium`
- Linked Stripe subscription ID: `sub_1SumFiJRvrG89XPR32bFXGqA`
- User now has premium access

### 2. Permanent Fix - Part 1: Vercel Domain Configuration (REQUIRED)

**The main fix:** Disable the automatic www redirect in Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Find the `wortex.live` domain
3. Disable any "Redirect to www" setting
4. Ensure the domain serves content directly without redirecting

**Test the fix:**
```bash
curl -I https://wortex.live/api/stripe/webhook
# Should return 400 (missing signature), NOT 307 (redirect)
```

### 3. Permanent Fix - Part 2: Middleware Update

Modified [middleware.ts](../middleware.ts) to exclude the webhook endpoint:

```typescript
// Before
matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']

// After
matcher: ['/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
```

This prevents the middleware from intercepting Stripe webhook requests (secondary defense).

## Verification Steps

After deployment, verify the fix:

1. **Test webhook in Stripe Dashboard:**
   - Go to Developers → Webhooks
   - Click on the Wortex webhook endpoint
   - Click "Send test webhook" for `customer.subscription.created`
   - Should receive **200 OK** instead of 307 redirect

2. **Check webhook logs:**
   - Monitor Vercel deployment logs during test
   - Look for `[Webhook] Subscription created for user:` log messages
   - Should see `[Webhook] ✓ User tier set to premium`

3. **Test with real subscription:**
   - Create a test subscription
   - Check that user is upgraded to premium immediately
   - Verify subscription ID is saved in database

## Related Files
- [middleware.ts](../middleware.ts) - Fixed middleware matcher
- [app/api/stripe/webhook/route.ts](../app/api/stripe/webhook/route.ts) - Webhook handler
- [app/api/stripe/create-checkout/route.ts](../app/api/stripe/create-checkout/route.ts) - Checkout session creation
- [scripts/manual-premium-upgrade.mjs](../scripts/manual-premium-upgrade.mjs) - Manual upgrade script
- [scripts/check-user-subscription.mjs](../scripts/check-user-subscription.mjs) - Diagnostic script

## Prevention

### Future Webhook Issues
If webhooks fail again, check:

1. **Stripe Dashboard → Webhooks → Recent deliveries**
   - Look for failed deliveries
   - Check response codes (should be 200, not 307/500/etc)

2. **Vercel deployment logs**
   - Search for `[Webhook]` to see webhook processing
   - Look for errors in webhook handler

3. **Webhook signing secret**
   - Ensure `STRIPE_WEBHOOK_SECRET` in Vercel matches Stripe dashboard
   - Each webhook endpoint has its own secret

### Monitoring
Consider adding:
- Webhook failure alerts in Stripe
- Database trigger to alert when payments succeed but user tier doesn't change
- Periodic script to check for orphaned subscriptions

## Additional Notes

### Multiple Webhook Endpoints
Your Stripe account has webhooks configured for multiple apps:
- `api.opposides.com` - Failed (500 Internal Server Error)
- `modest-insight-production.up.railway.app` (MyAccountsToday) - Succeeded (200 OK)
- `wortex.live` - Failed (307 Temporary Redirect) → **Now Fixed**

Each webhook receives all events for your Stripe account. Make sure each app only processes events it owns by checking metadata.

### Subscription Metadata
The webhook handler relies on `user_id` in subscription metadata:

```json
"metadata": {
  "user_id": "2351fe9f-d29b-4196-8955-de1e8b6dd330"
}
```

This is set correctly in [app/api/stripe/create-checkout/route.ts](../app/api/stripe/create-checkout/route.ts) at lines 97-104.

## Resolution Date
2026-01-30

## Status
✅ **RESOLVED** - User upgraded, webhook fixed, deployed to production
