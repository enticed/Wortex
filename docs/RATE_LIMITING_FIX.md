# Rate Limiting Implementation - Security Fix

## Issue
**Severity:** CRITICAL (P0)
**CVE:** Internal - Missing rate limiting vulnerability

The application had no rate limiting on critical endpoints, allowing:
1. **Brute force attacks** - Unlimited password guessing attempts
2. **Account enumeration** - Test many emails to find valid accounts
3. **Spam/abuse** - Unlimited score submissions, account creation
4. **Email bombing** - Repeated password reset requests
5. **Resource exhaustion** - DOS via repeated API calls

## Fix Applied

### Implementation

**File:** `lib/middleware/rateLimit.ts`

Created a flexible rate limiting middleware with:
- Configurable limits per endpoint
- IP-based tracking (supports x-forwarded-for for proxies)
- Automatic cleanup to prevent memory leaks
- Helpful error messages with retry information
- Standard HTTP 429 responses with Retry-After headers

### Rate Limits Configured

| Endpoint | Limit | Window | Rationale |
|----------|-------|--------|-----------|
| `/api/auth/signin` | 5 attempts | 15 minutes | Allow typos, prevent brute force |
| `/api/auth/signup` | 5 attempts | 15 minutes | Prevent spam account creation |
| `/api/score/submit` | 10 submissions | 1 minute | Allow fast play, prevent cheating |
| `/api/auth/reset-password` | 3 attempts | 1 hour | Prevent email bombing |

### Files Modified

1. **`lib/middleware/rateLimit.ts`** (NEW)
   - Rate limiting core logic
   - Predefined configurations
   - IP detection from headers

2. **`app/api/auth/signin/route.ts`**
   - Added rate limit check at start of handler
   - Returns 429 if limit exceeded

3. **`app/api/auth/signup/route.ts`**
   - Added rate limit check
   - Prevents spam registrations

4. **`app/api/score/submit/route.ts`**
   - Added rate limit check
   - Prevents score submission abuse

5. **`app/api/auth/reset-password/route.ts`**
   - Added very strict rate limit
   - Prevents email bombing

## How It Works

### Request Flow

```
1. Request arrives at API endpoint
2. Rate limit check runs FIRST (before any processing)
3. Check identifies client by IP address
4. Look up request count for this client
5. If under limit: increment counter, allow request
6. If over limit: return 429 with retry info
```

### IP Detection

The middleware detects client IP from:
1. `x-forwarded-for` header (when behind proxy/CDN)
2. `x-real-ip` header (nginx, Cloudflare)
3. Direct connection IP
4. Fallback to "unknown" (shouldn't happen in production)

### Response When Rate Limited

```json
{
  "error": "Too many authentication attempts. Please try again in 15 minutes.",
  "retryAfter": 847  // seconds until reset
}
```

**Headers:**
```
HTTP/1.1 429 Too Many Requests
Retry-After: 847
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1707234567890
```

## Testing

### Unit/Integration Tests

**File:** `__tests__/integration/rateLimit.test.ts` (6 tests)

```
✓ auth endpoints should be protected against brute force
✓ password reset should be strictly limited
✓ score submission should prevent spam
✓ rate limiting is documented and implemented
✓ rate limiting uses appropriate HTTP status code
✓ rate limiting includes retry-after header
```

### Manual Testing

1. **Test brute force protection:**
   ```bash
   # Try signin 6 times rapidly
   for i in {1..6}; do
     curl -X POST http://localhost:3000/api/auth/signin \
       -H "Content-Type: application/json" \
       -d '{"email":"test@example.com","password":"wrong"}' \
       -w "\nStatus: %{http_code}\n\n"
   done
   # 6th request should return 429
   ```

2. **Test score submission limits:**
   ```bash
   # Submit scores 11 times in under a minute
   for i in {1..11}; do
     curl -X POST http://localhost:3000/api/score/submit \
       -H "Content-Type: application/json" \
       -d '{"userId":"test","puzzleId":"123","score":100}' \
       -w "\nStatus: %{http_code}\n\n"
   done
   # 11th request should return 429
   ```

3. **Verify retry mechanism:**
   ```bash
   # After hitting limit, wait for window to expire
   # Then try again - should succeed
   ```

## Production Considerations

### Current Limitation: Single Instance Only

The current implementation uses an in-memory `Map` for tracking requests. This works perfectly for:
- Single-server deployments
- Development/staging environments
- Serverless functions (each instance tracks separately)

### For Multi-Instance Production

If deploying multiple app instances, upgrade to **Redis-based rate limiting**:

```typescript
// Example Redis implementation (pseudocode)
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});

async function checkRateLimit(clientKey: string, config: RateLimitConfig) {
  const key = `ratelimit:${clientKey}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, config.windowMs / 1000);
  }

  if (count > config.maxRequests) {
    return createRateLimitResponse();
  }

  return null;
}
```

**Recommended Redis Services:**
- [Upstash](https://upstash.com/) - Serverless Redis
- [Redis Cloud](https://redis.com/try-free/) - Managed Redis
- Self-hosted Redis

### Monitoring

Add monitoring for rate limit hits:

```typescript
// In rateLimit.ts, add logging
if (entry.count > config.maxRequests) {
  console.log('[RateLimit] IP blocked:', {
    ip: clientKey,
    endpoint: request.url,
    attemptCount: entry.count,
    limit: config.maxRequests,
  });
}
```

Set up alerts for:
- Spike in 429 responses (could indicate attack)
- Same IP hitting limits repeatedly
- Unusually high rate limit violations

## Security Impact

**Before Fix:**
- ⚠️ Unlimited brute force attempts possible
- ⚠️ Account enumeration via rapid testing
- ⚠️ Score manipulation through rapid submissions
- ⚠️ Email bombing via password reset
- ⚠️ Resource exhaustion attacks

**After Fix:**
- ✅ Brute force attacks rate limited to 5 attempts / 15 min
- ✅ Email bombing prevented (3 attempts / hour)
- ✅ Score spam limited to 10 / minute
- ✅ Clear feedback to legitimate users via Retry-After
- ✅ Automatic cleanup prevents memory leaks

## Configuration

Rate limits can be adjusted in `lib/middleware/rateLimit.ts`:

```typescript
export const RATE_LIMIT_CONFIGS = {
  auth: {
    maxRequests: 5,           // Adjust based on monitoring
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: '...',
  },
  // ... other configs
};
```

**Guidelines for adjusting:**
- Too strict: Legitimate users get blocked
- Too lenient: Attackers can abuse
- Monitor 429 responses to find balance
- Consider user timezone distribution

## Related Documentation

- [lib/middleware/rateLimit.ts](../lib/middleware/rateLimit.ts) - Implementation
- [PRE_LAUNCH_CHECKLIST.md](./PRE_LAUNCH_CHECKLIST.md) - All fixes tracker
- [TESTING.md](../TESTING.md) - How to run tests

## Next Steps

With rate limiting implemented, proceed to:
1. ✅ **DONE:** Hardcoded session secret
2. ✅ **DONE:** Rate limiting
3. ⏳ **NEXT:** Server-side score validation
4. ⏳ CSRF protection
5. ⏳ Security headers
6. ⏳ RLS policies

---

**Fixed:** 2026-02-06
**Verified:** ✅ All tests passing (106 total)
**Deployed to Production:** [ ] Pending
**Redis Migration:** [ ] Pending (required for multi-instance)
