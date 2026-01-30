#!/bin/bash

# Woodles Project Setup Script
# This script clones Wortex and prepares it as a new project called Woodles

set -e  # Exit on error

echo "=========================================="
echo "  Woodles Project Setup"
echo "  Cloning from Wortex..."
echo "=========================================="
echo ""

# Configuration
NEW_PROJECT_NAME="Woodles"
NEW_PROJECT_SLUG="woodles"
NEW_PROJECT_DIR="../${NEW_PROJECT_NAME}"
SOURCE_DIR="."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the Wortex directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: This script must be run from the Wortex root directory${NC}"
    exit 1
fi

# Check if target directory already exists
if [ -d "$NEW_PROJECT_DIR" ]; then
    echo -e "${RED}Error: Directory $NEW_PROJECT_DIR already exists!${NC}"
    echo "Please remove it first or choose a different location."
    exit 1
fi

echo -e "${YELLOW}Step 1: Creating new project directory...${NC}"
mkdir -p "$NEW_PROJECT_DIR"

echo -e "${YELLOW}Step 2: Copying files (excluding git, node_modules, etc.)...${NC}"
# Copy all files except git, node_modules, and build artifacts
rsync -av \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='out' \
  --exclude='.env.local' \
  --exclude='.vercel' \
  --exclude='*.log' \
  --exclude='.DS_Store' \
  "$SOURCE_DIR/" "$NEW_PROJECT_DIR/"

cd "$NEW_PROJECT_DIR"

echo -e "${YELLOW}Step 3: Initializing new git repository...${NC}"
git init
git add .
git commit -m "Initial commit - cloned from Wortex"

echo -e "${YELLOW}Step 4: Updating package.json...${NC}"
# Update package.json name
sed -i.bak 's/"name": "wortex"/"name": "woodles"/' package.json
sed -i.bak 's/"version": "[^"]*"/"version": "0.1.0"/' package.json
rm package.json.bak

echo -e "${YELLOW}Step 5: Creating .env.local template...${NC}"
cat > .env.local << 'EOF'
# Supabase Configuration
# TODO: Create new Supabase project for Woodles
# Get these values from: https://app.supabase.com/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
SESSION_SECRET=generate_a_random_secret_key_here

# Stripe Configuration (optional - for subscriptions)
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
# STRIPE_PRICE_ID=price_...
EOF

echo -e "${YELLOW}Step 6: Creating setup checklist...${NC}"
cat > SETUP_CHECKLIST.md << 'EOF'
# Woodles Setup Checklist

This project was cloned from Wortex. Follow this checklist to complete the setup.

## Phase 1: Environment Setup

- [ ] Create new Supabase project at https://app.supabase.com
  - Project name: Woodles
  - Database password: (save securely)
  - Region: Choose closest to your users

- [ ] Update `.env.local` with new Supabase credentials:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`

- [ ] Generate SESSION_SECRET:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

- [ ] Run `npm install`

## Phase 2: Database Setup

- [ ] Export Wortex database schema:
  - Go to Wortex Supabase → SQL Editor
  - Run: Click "..." → Export as SQL
  - Save to `scripts/database-schema.sql`

- [ ] Review and modify schema for Woodles:
  - [ ] Update `puzzles` table structure for Woodles game format
  - [ ] Keep core tables: users, stats, scores, sessions
  - [ ] Remove Wortex-specific views/functions if needed

- [ ] Import schema to new Supabase project:
  - Go to Woodles Supabase → SQL Editor
  - Paste and run the schema

- [ ] Set up Row Level Security (RLS) policies
  - Review and apply RLS from Wortex
  - Test that users can only access their own data

## Phase 3: Rebranding

- [ ] Find and replace "Wortex" → "Woodles":
  ```bash
  # On macOS/Linux:
  find . -type f -name "*.tsx" -o -name "*.ts" -o -name "*.json" | xargs sed -i '' 's/Wortex/Woodles/g'

  # On Windows (Git Bash):
  find . -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.json" \) -exec sed -i 's/Wortex/Woodles/g' {} +
  ```

- [ ] Find and replace "wortex" → "woodles" (lowercase):
  ```bash
  # On macOS/Linux:
  find . -type f -name "*.tsx" -o -name "*.ts" -o -name "*.json" | xargs sed -i '' 's/wortex/woodles/g'

  # On Windows (Git Bash):
  find . -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.json" \) -exec sed -i 's/wortex/woodles/g' {} +
  ```

- [ ] Update metadata in `app/layout.tsx`:
  - [ ] Title
  - [ ] Description
  - [ ] Open Graph tags

- [ ] Update `public/` assets:
  - [ ] `favicon.ico`
  - [ ] `apple-touch-icon.png`
  - [ ] `icon-192.png`
  - [ ] `icon-512.png`
  - [ ] Any logos

- [ ] Update `README.md` with Woodles information

- [ ] Update colors/theme:
  - [ ] `tailwind.config.ts` - color palette
  - [ ] CSS variables if any

## Phase 4: Remove Wortex-Specific Code

- [ ] Remove/replace game-specific files:
  - [ ] `app/play/page.tsx` - Game UI
  - [ ] `app/pre-game/page.tsx` - Game intro
  - [ ] `components/game/*` - Game components
  - [ ] `lib/game/*` - Game logic
  - [ ] `app/how-to-play/page.tsx` - Update rules

- [ ] Update API routes for new game:
  - [ ] `app/api/puzzle/daily/route.ts` - Puzzle fetching
  - [ ] `app/api/score/submit/route.ts` - Score submission (if different)

- [ ] Remove Wortex puzzle generation scripts:
  - [ ] `scripts/add-sample-puzzle.mjs`
  - [ ] Any other Wortex-specific scripts

## Phase 5: Build Woodles Game Logic

- [ ] Design Woodles puzzle data structure
- [ ] Create puzzle generation script
- [ ] Build game UI components
- [ ] Implement game logic
- [ ] Update scoring algorithm
- [ ] Create "How to Play" page
- [ ] Test game flow end-to-end

## Phase 6: Testing

- [ ] Test authentication flow:
  - [ ] Anonymous user creation
  - [ ] Sign up with email/password
  - [ ] Sign in
  - [ ] Password reset
  - [ ] Account upgrade (anonymous → email)

- [ ] Test game flow:
  - [ ] Play puzzle
  - [ ] Submit score
  - [ ] View stats
  - [ ] View leaderboard

- [ ] Test admin panel:
  - [ ] Create admin user (update is_admin in database)
  - [ ] Access `/admin`
  - [ ] Manage puzzles
  - [ ] Manage users

## Phase 7: Deployment

- [ ] Create new Vercel project
- [ ] Connect to GitHub repository
- [ ] Set environment variables in Vercel
- [ ] Configure custom domain (optional)
- [ ] Test production deployment

## Phase 8: Stripe Setup (Optional)

- [ ] Create Stripe account (or use existing)
- [ ] Create product and pricing
- [ ] Set up webhook endpoint
- [ ] Update environment variables
- [ ] Test subscription flow

## Phase 9: Final Polish

- [ ] Update email templates in Supabase
- [ ] Set up monitoring/analytics
- [ ] Create privacy policy
- [ ] Create terms of service
- [ ] Add social media meta tags

---

## Quick Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production build locally
npm start

# Generate database types
npm run generate-types  # (if this script exists)
```

## Useful Resources

- **Wortex Docs**: Reference original authentication system docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Stripe Docs**: https://stripe.com/docs (if using subscriptions)

---

**Created**: $(date)
**Status**: Setup in progress
EOF

echo -e "${YELLOW}Step 7: Creating quick start guide...${NC}"
cat > QUICKSTART.md << 'EOF'
# Woodles Quick Start

## Prerequisites

1. Node.js 18+ installed
2. GitHub account
3. Supabase account
4. (Optional) Stripe account for subscriptions

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Supabase Project
1. Go to https://app.supabase.com
2. Click "New Project"
3. Name: "Woodles"
4. Set database password (save it!)
5. Choose region
6. Wait for project to initialize (~2 minutes)

### 3. Configure Environment Variables
1. Get Supabase credentials from: Project Settings → API
2. Copy the following to `.env.local`:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`

3. Generate SESSION_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Set Up Database
1. In Wortex project, export schema:
   - Supabase Dashboard → SQL Editor
   - Run a query to get schema or use Supabase CLI

2. In Woodles Supabase project:
   - SQL Editor → New query
   - Paste schema
   - Click "Run"

### 5. Test the App
```bash
npm run dev
```
Visit http://localhost:3000

### 6. Follow SETUP_CHECKLIST.md
Complete all items in the checklist for full setup.

## Next Steps

- Replace Wortex branding with Woodles
- Build Woodles game logic
- Update "How to Play" page
- Deploy to Vercel

## Need Help?

- Check `SETUP_CHECKLIST.md` for detailed steps
- Review `docs/AUTHENTICATION_SYSTEM.md` from Wortex
- Supabase docs: https://supabase.com/docs
EOF

echo -e "${YELLOW}Step 8: Creating database export helper script...${NC}"
cat > scripts/export-schema-from-wortex.md << 'EOF'
# Exporting Database Schema from Wortex

## Option 1: Using Supabase Dashboard

1. Go to your Wortex Supabase project
2. Navigate to: SQL Editor
3. Click on any existing query (or create new)
4. In the top right, click the "..." menu
5. Select "Export as SQL"
6. Save the file

## Option 2: Using pg_dump (if you have PostgreSQL client)

```bash
# Get connection string from Supabase Dashboard → Project Settings → Database
pg_dump "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" \
  --schema=public \
  --no-owner \
  --no-acl \
  > wortex-schema.sql
```

## Option 3: Manual Export (Most Control)

Copy this SQL and run in Wortex Supabase to generate schema:

```sql
-- This will show you all table definitions
SELECT
    'CREATE TABLE ' || table_name || ' (' ||
    string_agg(
        column_name || ' ' || data_type ||
        CASE WHEN character_maximum_length IS NOT NULL
            THEN '(' || character_maximum_length || ')'
            ELSE ''
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
        ', '
    ) || ');'
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name;
```

## What to Keep vs Modify

### Keep as-is:
- `users` table
- `stats` table
- `scores` table
- `sessions` table

### Modify for Woodles:
- `puzzles` table - adjust columns for Woodles puzzle format
- Views (leaderboards, etc.) - keep structure, may need tweaks
- Functions/triggers - review and keep relevant ones

### Remove:
- Any Wortex-specific data
- Test/sample data
EOF

echo -e "${YELLOW}Step 9: Committing changes...${NC}"
git add .
git commit -m "Add setup scripts and documentation for Woodles project"

echo ""
echo -e "${GREEN}=========================================="
echo -e "  Setup Complete! ✓"
echo -e "==========================================${NC}"
echo ""
echo "Project location: $NEW_PROJECT_DIR"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. cd $NEW_PROJECT_DIR"
echo "2. Review and follow: QUICKSTART.md"
echo "3. Complete items in: SETUP_CHECKLIST.md"
echo "4. Update .env.local with your Supabase credentials"
echo "5. Run: npm install"
echo "6. Run: npm run dev"
echo ""
echo -e "${GREEN}Happy coding!${NC}"
