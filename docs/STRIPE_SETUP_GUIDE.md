# Stripe Setup Guide

This guide walks you through setting up Stripe for Wortex subscriptions.

---

## Step 1: Create Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Click "Sign up" or "Start now"
3. Complete account creation
4. You'll start in **Test Mode** (toggle in top-right) - perfect for development!

---

## Step 2: Get API Keys

### Development (Test Mode) Keys

1. In Stripe Dashboard, click **Developers** → **API keys**
2. You'll see two keys:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`) - Click "Reveal test key"

3. Copy these to your `.env.local`:
   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

**IMPORTANT:** Never commit these keys to git! They're in `.gitignore`.

---

## Step 3: Create Product and Pricing

### Create Product

1. In Stripe Dashboard, go to **Products** → **Add product**
2. Fill in:
   - **Name:** Wortex Premium
   - **Description:** Premium features including archive access, ad-free experience, and exclusive badges
   - **Upload image:** (Optional) Add a logo or icon

### Create Price (Monthly Subscription)

1. Under pricing:
   - **Pricing model:** Standard pricing
   - **Price:** $1.00
   - **Billing period:** Monthly
   - **Currency:** USD

2. Click **Save product**

3. **Copy the Price ID:**
   - After saving, click on the price you just created
   - Copy the **API ID** (starts with `price_...`)
   - Add to `.env.local`:
     ```bash
     STRIPE_PRICE_ID_MONTHLY=price_...
     ```

### (Optional) Create Annual Price

1. On the same product page, click **Add another price**
2. Fill in:
   - **Price:** $10.00
   - **Billing period:** Yearly
3. Copy the Price ID and add to `.env.local`:
   ```bash
   STRIPE_PRICE_ID_ANNUAL=price_...
   ```

---

## Step 4: Set Up Webhook Endpoint

Webhooks allow Stripe to notify your app about subscription events (payments, cancellations, etc.).

### Development (Local Testing with Stripe CLI)

1. **Install Stripe CLI:**
   ```bash
   # Windows (using Scoop)
   scoop install stripe

   # macOS
   brew install stripe/stripe-cli/stripe

   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe CLI:**
   ```bash
   stripe login
   ```
   This opens a browser to authorize the CLI.

3. **Forward webhooks to local server:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. **Copy the webhook signing secret:**
   The CLI will display: `Your webhook signing secret is whsec_...`

   Add to `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

5. **Keep the CLI running** while testing locally!

### Production (Vercel/Server)

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Fill in:
   - **Endpoint URL:** `https://yourdomain.com/api/stripe/webhook`
   - **Description:** Wortex Production Webhook
   - **Events to send:** Select these:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

4. Click **Add endpoint**
5. Click **Reveal** under "Signing secret"
6. Copy to your production environment variables (Vercel dashboard)

---

## Step 5: Configure Environment Variables

Create or update your `.env.local` file:

```bash
# Supabase (you should already have these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe (add these new ones)
STRIPE_SECRET_KEY=sk_test_51...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MONTHLY=price_...

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**For production on Vercel:**
1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add each variable above
3. Use **production** Stripe keys (starts with `sk_live_` and `pk_live_`)
4. Redeploy after adding variables

---

## Step 6: Test Your Setup

### 1. Start Development Server

```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start Stripe webhook forwarding
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 2. Test Stripe Keys Are Loaded

Visit your app and check browser console. If any Stripe errors appear, verify your keys are set correctly.

### 3. Test Checkout Flow

1. Navigate to `/subscribe` (once we create this page)
2. Click "Subscribe" button
3. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)

4. Complete checkout
5. Check:
   - Terminal 2 (Stripe CLI) should show webhook received
   - Your user tier should be upgraded to "premium" in database
   - Premium features should unlock

### 4. Test Subscription Cancellation

1. In Stripe Dashboard, go to **Customers**
2. Find the test customer
3. Click on their subscription
4. Click **Actions** → **Cancel subscription**
5. Check:
   - Webhook received in CLI
   - User tier downgraded to "free"
   - Premium features locked again

---

## Stripe Test Cards

Use these for testing different scenarios:

| Card Number | Scenario |
|-------------|----------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 0341 | Requires authentication (3D Secure) |
| 4000 0000 0000 9995 | Card declined (insufficient funds) |
| 4000 0000 0000 0002 | Card declined (generic) |

**All test cards:**
- Use any future expiration date
- Use any 3-digit CVC
- Use any 5-digit ZIP code

---

## Troubleshooting

### "No such price" error
- Verify STRIPE_PRICE_ID_MONTHLY is correct
- Make sure you're using test mode price ID in development

### Webhook not receiving events
- Check Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Verify STRIPE_WEBHOOK_SECRET is set correctly
- Check webhook signature matches

### User tier not updating
- Check webhook logs in terminal
- Check Supabase logs for database errors
- Verify user_tier column exists in users table

### "Invalid API key" error
- Check you're using the correct key for your environment
- Test mode: `sk_test_...` and `pk_test_...`
- Production: `sk_live_...` and `pk_live_...`
- Verify keys are in `.env.local` (not `.env.local.example`)

---

## Going to Production

When ready to accept real payments:

1. **Complete Stripe Account Setup:**
   - Add business details
   - Add bank account for payouts
   - Complete identity verification

2. **Switch to Live Mode:**
   - Toggle from "Test mode" to "Live mode" in Stripe Dashboard
   - Get new live API keys (starts with `sk_live_` and `pk_live_`)

3. **Update Production Environment:**
   - Update Vercel environment variables with live keys
   - Set up production webhook endpoint
   - Test with a real $1 payment (you can refund it)

4. **Monitor:**
   - Set up email notifications in Stripe Dashboard
   - Monitor webhook delivery
   - Check for failed payments

---

## Summary of What You Need

To complete Stripe setup, collect these values:

- [ ] `STRIPE_SECRET_KEY` (from Stripe Dashboard → Developers → API keys)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (same location)
- [ ] `STRIPE_WEBHOOK_SECRET` (from Stripe CLI or Dashboard → Webhooks)
- [ ] `STRIPE_PRICE_ID_MONTHLY` (from Stripe Dashboard → Products → Your product → Price API ID)

Add all four to your `.env.local` file and restart your dev server!

---

## Next Steps

After Stripe is configured:

1. ✅ API routes are created (done)
2. ✅ Webhook handler is ready (done)
3. 🔲 Create subscription page UI (`/app/subscribe/page.tsx`)
4. 🔲 Update archive page to use real checkout (replace alert with API call)
5. 🔲 Test end-to-end flow
6. 🔲 Add subscription management page (`/app/account/subscription/page.tsx`)

---

## Support

- **Stripe Documentation:** https://stripe.com/docs
- **Stripe Testing:** https://stripe.com/docs/testing
- **Stripe CLI:** https://stripe.com/docs/stripe-cli
- **Stripe Dashboard:** https://dashboard.stripe.com
