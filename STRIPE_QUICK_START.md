# Stripe Quick Start Checklist

## ✅ What's Already Done

- [x] Stripe packages installed
- [x] Checkout API route created
- [x] Webhook handler implemented
- [x] Subscribe page with UI
- [x] Success/cancel pages
- [x] Archive page updated to use real checkout
- [x] Documentation written

## 🎯 What YOU Need To Do

### 1. Create Stripe Account (5 minutes)

1. Go to https://stripe.com
2. Click "Sign up"
3. Complete registration
4. You'll start in **Test Mode** (perfect!)

### 2. Get API Keys (2 minutes)

1. In Stripe Dashboard: **Developers** → **API keys**
2. Copy both keys:
   - Publishable key (starts with `pk_test_...`)
   - Secret key (starts with `sk_test_...` - click "Reveal")

### 3. Create Product & Price (3 minutes)

1. In Stripe Dashboard: **Products** → **Add product**
2. Name: **Wortex Premium**
3. Price: **$1.00/month**, recurring
4. Save and **copy the Price ID** (starts with `price_...`)

### 4. Set Up Environment Variables (2 minutes)

Create or update `.env.local` with these 4 values:

```bash
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=price_your_price_id_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**For local testing**, get webhook secret from Stripe CLI:

```bash
# Install Stripe CLI (one time)
# Windows: scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe

# Login
stripe login

# Start webhook forwarding (keep running in separate terminal)
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copy the webhook secret it displays (whsec_...)
```

### 5. Restart Dev Server (1 minute)

```bash
# Stop current server (Ctrl+C)
# Start again to load new environment variables
npm run dev
```

### 6. Test It! (5 minutes)

1. Open http://localhost:3000/subscribe
2. Click "Subscribe Now"
3. Use test card: **4242 4242 4242 4242**
   - Expiry: any future date (12/25)
   - CVC: any 3 digits (123)
   - ZIP: any 5 digits (12345)
4. Complete checkout
5. Check:
   - Should redirect to success page
   - Check database: your user_tier should be 'premium'
   - Try accessing /archive - should work now!

## 🐛 Troubleshooting

**"No such price" error:**
- Check `NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY` is correct price ID
- Make sure you're using test mode price ID

**Webhook not working:**
- Is Stripe CLI running? (`stripe listen --forward-to localhost:3000/api/stripe/webhook`)
- Check terminal for webhook events
- Verify STRIPE_WEBHOOK_SECRET is set

**User tier not updating:**
- Check Stripe CLI terminal for webhook logs
- Check browser console for errors
- Verify user_tier column exists in database

## 📚 Full Documentation

For detailed setup instructions, see:
- [docs/STRIPE_SETUP_GUIDE.md](docs/STRIPE_SETUP_GUIDE.md) - Complete setup guide
- [docs/SUBSCRIPTION_IMPLEMENTATION_STATUS.md](docs/SUBSCRIPTION_IMPLEMENTATION_STATUS.md) - Implementation status

## 🚀 Ready for Production?

When you're ready to accept real payments:

1. Complete Stripe account setup (business details, bank account)
2. Switch to Live Mode in Stripe Dashboard
3. Get live API keys (`sk_live_...` and `pk_live_...`)
4. Update production environment variables (Vercel dashboard)
5. Set up production webhook endpoint in Stripe Dashboard
6. Test with real $1 payment (you can refund it)

## 💡 What's Next After Testing Works?

Optional enhancements (not required for launch):

1. **Email Notifications** - Welcome emails, receipts, cancellation confirmations
2. **Subscription Management UI** - Let users cancel/reactivate from app
3. **Annual Plan** - Add $10/year pricing option
4. **Grace Period** - Keep premium for 7 days after failed payment
5. **Analytics** - Track conversion rates and churn

---

## Summary

**Required from you:**
1. Stripe account → API keys
2. Create product → Price ID
3. Add 4 values to .env.local
4. Install & run Stripe CLI for local testing
5. Test with card 4242 4242 4242 4242

**Time needed:** ~20 minutes

**Then it works!** 🎉
