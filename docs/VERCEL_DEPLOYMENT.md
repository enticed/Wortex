# Vercel Deployment Guide

## Prerequisites
- GitHub account with the Wortex repository
- Vercel account (sign up at https://vercel.com)

## Step 1: Deploy to Vercel

### Option A: Using Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your GitHub account and find the **Wortex** repository
4. Click **"Import"**
5. Configure project settings:
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `.next` (auto-filled)
   - **Install Command**: `npm install` (auto-filled)

6. **DO NOT CLICK DEPLOY YET** - we need to add environment variables first!

## Step 2: Add Environment Variables

In the Vercel project settings, scroll down to **"Environment Variables"** section:

Add the following variables (get values from your `.env.local` file):

### Required Variables:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://fkzqvhvqyfuxnwdhpytg.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://your-app-preview.vercel.app` | Preview |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Development |

**Important Notes:**
- Check all three environment checkboxes (Production, Preview, Development) for Supabase variables
- `NEXT_PUBLIC_APP_URL` should be different for each environment
- You'll update the Production URL after first deployment

## Step 3: Deploy

1. After adding all environment variables, click **"Deploy"**
2. Wait 2-3 minutes for the build to complete
3. You'll see a success screen with your deployment URL (e.g., `https://wortex-xyz.vercel.app`)

## Step 4: Update Production URL

1. Copy your production URL from the deployment success screen
2. Go to **Settings** → **Environment Variables**
3. Find `NEXT_PUBLIC_APP_URL` for **Production**
4. Click **Edit** and update it to your actual URL (e.g., `https://wortex-xyz.vercel.app`)
5. Click **Save**
6. Redeploy: Go to **Deployments** → click the three dots on latest deployment → **Redeploy**

## Step 5: Test on Your Phone

1. Open your phone's browser
2. Go to your Vercel URL (e.g., `https://wortex-xyz.vercel.app`)
3. The game should load and work perfectly!
4. Anonymous authentication will create a user account
5. Your scores will be saved to Supabase

## Troubleshooting

### Build Fails
- Check the build logs in Vercel dashboard
- Common issues:
  - Missing environment variables
  - TypeScript errors (run `npm run build` locally to catch these)

### Authentication Errors
- Verify all Supabase environment variables are correct
- Make sure anonymous sign-ins are enabled in Supabase dashboard
- Check Supabase logs: Dashboard → Logs → API

### Puzzle Not Loading
- Run the sample puzzle script to ensure today's puzzle exists:
  ```bash
  node scripts/add-sample-puzzle.mjs
  ```
- Check Supabase Table Editor → puzzles table

### Environment Variables Not Working
- Make sure you checked the right environment (Production/Preview/Development)
- After updating env vars, redeploy the application
- Verify variable names match exactly (case-sensitive)

## Custom Domain (Optional)

To use a custom domain like `wortex.com`:

1. Go to Vercel project → **Settings** → **Domains**
2. Click **Add Domain**
3. Enter your domain name
4. Follow DNS configuration instructions
5. Update `NEXT_PUBLIC_APP_URL` to your custom domain
6. Redeploy

## Automatic Deployments

Vercel automatically deploys when you push to GitHub:
- Push to `master` → Production deployment
- Push to other branches → Preview deployment
- Pull requests → Preview deployment with unique URL

## Daily Puzzle Updates

For now, you'll need to manually add puzzles using the script:
```bash
node scripts/add-sample-puzzle.mjs
```

Later, we'll set up:
1. Railway cron job for AI-generated puzzles
2. Admin interface for puzzle review and approval
