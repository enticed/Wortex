# Vercel Cron Job Troubleshooting Guide

## Current Configuration

**Cron Schedule:** Daily at 2:00 AM UTC (`0 2 * * *`)
**Endpoint:** `/api/cron/puzzle-buffer`
**Purpose:** Maintain 30-day puzzle buffer

## Common Issues and Solutions

### 1. CRON_SECRET Authentication Issue ⚠️

**Problem:** The endpoint checks for a `CRON_SECRET` but Vercel cron jobs do NOT automatically send this header.

**Location:** [route.ts:17-22](../app/api/cron/puzzle-buffer/route.ts#L17-L22)

```typescript
const authHeader = request.headers.get('authorization');
const cronSecret = process.env.CRON_SECRET;

if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Solution Options:**

#### Option A: Remove CRON_SECRET requirement (Recommended for Vercel Cron)
Vercel's cron jobs have built-in authentication and come from Vercel's infrastructure. The `CRON_SECRET` check is redundant and will BLOCK Vercel's automated cron calls.

**Recommended Fix:**
```typescript
// Only check CRON_SECRET if it's a manual trigger (has auth header)
const authHeader = request.headers.get('authorization');
if (authHeader) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

#### Option B: Use Vercel's built-in cron authentication
Check for Vercel's cron-specific headers instead:
```typescript
// Vercel adds this header to cron requests
const isCronRequest = request.headers.get('user-agent')?.includes('vercel-cron');
```

### 2. Production-Only Execution

Cron jobs **ONLY run on Production deployments**, not Preview deployments.

**Checklist:**
- ✓ Deploy to production: `git push origin master`
- ✓ Verify deployment completed successfully
- ✓ Check Vercel dashboard shows "Production" deployment

### 3. Cron Job Registration

After updating `vercel.json`, Vercel needs to re-register the cron jobs.

**Steps:**
1. Make any small change to `vercel.json` (add a comment or space)
2. Deploy to production
3. Verify in Vercel Dashboard → Project → Settings → Cron Jobs

### 4. Check Vercel Dashboard

**Where to look:**
1. Go to Vercel Dashboard
2. Select your project
3. Navigate to "Settings" → "Cron Jobs"
4. Verify the cron job appears with:
   - Path: `/api/cron/puzzle-buffer`
   - Schedule: `0 2 * * *`
5. Click "View Logs" to see execution history

### 5. Environment Variables

Ensure all required environment variables are set in **Production**:

**Required Variables:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`

**Optional Variables:**
- `CRON_SECRET` (currently blocking execution - see Issue #1)

**Verification:**
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Ensure all variables are set for "Production"
3. Redeploy if you added new variables

### 6. Route Configuration

The route appears correctly configured:
- ✓ `export const dynamic = 'force-dynamic'` prevents caching
- ✓ `export const maxDuration = 300` allows 5 minutes for puzzle generation
- ✓ Both GET and POST methods supported

### 7. Function Timeout

With `maxDuration = 300`, the function can run for 5 minutes. If generating 30 puzzles takes longer, consider:
- Generating fewer puzzles per cron run
- Splitting into multiple batches
- Using background processing

## Testing the Endpoint

### Local Testing

```bash
# Test locally (requires dev server running)
node scripts/test-cron-endpoint.mjs
```

### Production Testing

```bash
# Test production endpoint
node scripts/test-cron-endpoint.mjs --production
```

### Manual Trigger (with authentication)

```bash
# Using curl with CRON_SECRET
curl -X GET https://wortex.vercel.app/api/cron/puzzle-buffer \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Manual Trigger (without authentication)
If you remove the CRON_SECRET check:

```bash
curl -X GET https://wortex.vercel.app/api/cron/puzzle-buffer
```

## Recommended Actions

### Immediate Fix

1. **Remove or modify CRON_SECRET check** - This is likely blocking Vercel's cron requests
2. **Deploy to production**
3. **Verify cron job appears in Vercel Dashboard**
4. **Check logs after 2:00 AM UTC**

### Alternative: Manual Scheduling

If Vercel cron continues to have issues, consider:
- Using an external service (e.g., cron-job.org, EasyCron)
- Setting up GitHub Actions to call the endpoint
- Using Vercel's API to trigger deployments with cron

## Monitoring

After deploying the fix:

1. **Wait for next scheduled run** (2:00 AM UTC)
2. **Check Vercel logs** (Dashboard → Project → Cron Jobs → View Logs)
3. **Verify puzzle buffer** in Supabase database
4. **Set up alerts** if cron fails (via Vercel integrations)

## Additional Resources

- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Vercel Cron Job Troubleshooting Guide](https://vercel.com/guides/troubleshooting-vercel-cron-jobs)
- [Managing Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
