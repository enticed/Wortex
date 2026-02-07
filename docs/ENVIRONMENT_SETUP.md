# Environment Setup Guide

This document explains how to properly configure environment variables for the Wortex application.

## Critical Security Configuration

### SESSION_SECRET (REQUIRED)

**Purpose:** Used to sign and verify session JWT tokens.

**Security Requirements:**
- MUST be set (no default fallback)
- MUST be at least 32 characters long
- MUST be cryptographically random
- MUST be different in production vs development
- MUST be kept secret (never commit to git)

**How to generate a secure secret:**

```bash
# Using OpenSSL (recommended)
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Using Python
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Example output:**
```
5vZ8X3mK9pL2nQ7rT4wY6uH1jG0fD8aS9bV3cN5mR7x=
```

### Setting Up Environment Files

1. **Copy the example file:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Generate and set SESSION_SECRET:**
   ```bash
   # Generate a secret
   SECRET=$(openssl rand -base64 32)

   # Add to .env.local
   echo "SESSION_SECRET=$SECRET" >> .env.local
   ```

3. **Fill in other required variables** (see `.env.local.example`)

## Environment Files

### .env.local (Development - DO NOT COMMIT)
Contains actual secrets for local development. Add to `.gitignore`.

### .env.local.example (Committed)
Template showing required variables without actual secrets.

### .env.production (Production - DO NOT COMMIT)
Production secrets. Use environment variables in your hosting platform instead.

## Required Variables by Feature

### Core Application
```bash
SESSION_SECRET=<strong-random-secret-32+chars>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database (Supabase)
```bash
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-key>
```

### Payments (Stripe)
```bash
STRIPE_SECRET_KEY=sk_test_<your-test-key>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_<your-pub-key>
STRIPE_WEBHOOK_SECRET=whsec_<your-webhook-secret>
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=price_<your-price-id>
```

### AI Features (Anthropic)
```bash
ANTHROPIC_API_KEY=<your-api-key>
```

### Ads (Optional)
```bash
NEXT_PUBLIC_ADSENSE_CLIENT_ID=<your-client-id>
```

## Validation on Startup

The application validates critical environment variables on startup:

- **SESSION_SECRET**: Checks existence and minimum length (32 chars)
- If validation fails, the app will crash with a clear error message
- This prevents running with insecure defaults

## Production Deployment

### Vercel / Netlify / Similar
Set environment variables in the dashboard:
1. Go to Project Settings → Environment Variables
2. Add each variable with its production value
3. Mark sensitive variables as "Secret"

### Docker
Use environment variables or secrets:
```dockerfile
# docker-compose.yml
environment:
  SESSION_SECRET: ${SESSION_SECRET}
```

### Kubernetes
Use Secrets:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: wortex-secrets
type: Opaque
data:
  SESSION_SECRET: <base64-encoded-secret>
```

## Security Best Practices

1. ✅ **DO:**
   - Generate cryptographically random secrets
   - Use different secrets for dev/staging/production
   - Rotate secrets periodically (every 90 days)
   - Store production secrets in a secure vault
   - Use environment-specific secret management (AWS Secrets Manager, etc.)

2. ❌ **DON'T:**
   - Commit `.env.local` to git
   - Use weak/predictable secrets
   - Share secrets via email/chat
   - Reuse secrets across environments
   - Use default/example values in production

## Troubleshooting

### Error: "SESSION_SECRET environment variable is required"
**Solution:** Add SESSION_SECRET to your `.env.local` file

### Error: "SESSION_SECRET must be at least 32 characters"
**Solution:** Generate a longer secret using one of the commands above

### Sessions not persisting
**Check:**
1. SESSION_SECRET is set correctly
2. Cookies are enabled in browser
3. HTTPS is used in production (`secure` flag requires it)

### "Cannot read environment variables"
**Solution:** Restart development server after changing `.env.local`

## Testing Environment

For running tests, `jest.setup.ts` sets mock environment variables automatically. You don't need a separate `.env.test` file unless running E2E tests against a real backend.

## Additional Resources

- [Next.js Environment Variables Docs](https://nextjs.org/docs/basic-features/environment-variables)
- [OWASP Secret Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [12 Factor App Config](https://12factor.net/config)
