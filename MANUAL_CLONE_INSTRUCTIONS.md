# Manual Woodles Setup Instructions

Since the automated script is having issues, here's how to do it manually:

## Step 1: Create New Project Directory

```bash
mkdir ..\Woodles
```

## Step 2: Copy Files Using robocopy (Windows)

```bash
robocopy . ..\Woodles /E /XD .git node_modules .next out .vercel /XF .env.local *.log
```

This will copy all files except the excluded directories and files.

## Step 3: Initialize Git

```bash
cd ..\Woodles
git init
git add .
git commit -m "Initial commit - cloned from Wortex"
```

## Step 4: Update package.json

Open `..\Woodles\package.json` in your editor and change:
- `"name": "wortex"` to `"name": "woodles"`
- `"version": "..."` to `"version": "0.1.0"`

## Step 5: Create .env.local

Create `..\Woodles\.env.local` with:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
SESSION_SECRET=generate_a_random_secret_key_here

# Stripe Configuration (optional)
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
# STRIPE_PRICE_ID=price_...
```

## Step 6: Install Dependencies

```bash
npm install
```

## Next Steps

1. Create new Supabase project
2. Update .env.local with credentials
3. Set up database (see docs/CLONING_TO_NEW_PROJECT.md)
4. Run `npm run dev` to test

## Full Documentation

See [docs/CLONING_TO_NEW_PROJECT.md](docs/CLONING_TO_NEW_PROJECT.md) for complete setup guide.
