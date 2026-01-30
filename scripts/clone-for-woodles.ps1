# Woodles Project Setup Script for Windows (PowerShell)
# This script clones Wortex and prepares it as a new project called Woodles

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Woodles Project Setup" -ForegroundColor Cyan
Write-Host "  Cloning from Wortex..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$newProjectName = "Woodles"
$newProjectDir = "..\Woodles"

# Check if we're in the Wortex directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: This script must be run from the Wortex root directory" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if target directory already exists
if (Test-Path $newProjectDir) {
    Write-Host "Error: Directory $newProjectDir already exists!" -ForegroundColor Red
    Write-Host "Please remove it first or choose a different location." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Step 1: Creating new project directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $newProjectDir | Out-Null

Write-Host "Step 2: Copying files (excluding git, node_modules, etc.)..." -ForegroundColor Yellow

# Define exclusions
$excludeDirs = @('.git', 'node_modules', '.next', 'out', '.vercel')
$excludeFiles = @('.env.local', '*.log', '.DS_Store')

# Get all items
$items = Get-ChildItem -Path . -Recurse -Force

# Filter and copy
$itemsCopied = 0
foreach ($item in $items) {
    # Check if item is in an excluded directory
    $shouldExclude = $false

    foreach ($excludeDir in $excludeDirs) {
        if ($item.FullName -like "*\$excludeDir\*" -or $item.FullName -like "*\$excludeDir") {
            $shouldExclude = $true
            break
        }
    }

    # Check if item matches excluded file patterns
    if (-not $shouldExclude) {
        foreach ($excludeFile in $excludeFiles) {
            if ($item.Name -like $excludeFile) {
                $shouldExclude = $true
                break
            }
        }
    }

    if (-not $shouldExclude) {
        # Calculate relative path
        $relativePath = $item.FullName.Substring((Get-Location).Path.Length + 1)
        $targetPath = Join-Path $newProjectDir $relativePath

        if ($item.PSIsContainer) {
            # Create directory
            if (-not (Test-Path $targetPath)) {
                New-Item -ItemType Directory -Path $targetPath -Force | Out-Null
            }
        } else {
            # Copy file
            $targetDir = Split-Path $targetPath -Parent
            if (-not (Test-Path $targetDir)) {
                New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
            }
            Copy-Item $item.FullName -Destination $targetPath -Force
            $itemsCopied++
        }
    }
}

Write-Host "  Copied $itemsCopied files" -ForegroundColor Green

Set-Location $newProjectDir

Write-Host "Step 3: Initializing new git repository..." -ForegroundColor Yellow
git init
git add .
git commit -m "Initial commit - cloned from Wortex"

Write-Host "Step 4: Updating package.json..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    (Get-Content package.json) -replace '"name": "wortex"', '"name": "woodles"' | Set-Content package.json
    (Get-Content package.json) -replace '"version": "[^"]*"', '"version": "0.1.0"' | Set-Content package.json
    Write-Host "  package.json updated successfully" -ForegroundColor Green
} else {
    Write-Host "  Warning: package.json not found!" -ForegroundColor Red
}

Write-Host "Step 5: Creating .env.local template..." -ForegroundColor Yellow
@"
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
"@ | Out-File -FilePath .env.local -Encoding utf8

Write-Host "Step 6: Creating setup checklist..." -ForegroundColor Yellow
@"
# Woodles Setup Checklist

This project was cloned from Wortex. Follow this checklist to complete the setup.

## Phase 1: Environment Setup

- [ ] Create new Supabase project at https://app.supabase.com
  - Project name: Woodles
  - Database password: (save securely)
  - Region: Choose closest to your users

- [ ] Update ``.env.local`` with new Supabase credentials:
  - [ ] ``NEXT_PUBLIC_SUPABASE_URL``
  - [ ] ``NEXT_PUBLIC_SUPABASE_ANON_KEY``
  - [ ] ``SUPABASE_SERVICE_ROLE_KEY``

- [ ] Generate SESSION_SECRET:
  ``````bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ``````

- [ ] Run ``npm install``

## Phase 2: Database Setup

- [ ] Export Wortex database schema
- [ ] Review and modify schema for Woodles
- [ ] Import schema to new Supabase project
- [ ] Set up Row Level Security (RLS) policies

## Phase 3: Rebranding

- [ ] Find and replace "Wortex" with "Woodles" in all files
- [ ] Update metadata in app/layout.tsx
- [ ] Update public/ assets (favicon, icons, logos)
- [ ] Update README.md
- [ ] Update colors/theme in tailwind.config.ts

## Phase 4: Remove Wortex-Specific Code

- [ ] Remove/replace game-specific files in app/play/, app/pre-game/
- [ ] Update components/game/* for Woodles
- [ ] Update lib/game/* game logic
- [ ] Update app/how-to-play/page.tsx with Woodles rules

## Phase 5: Build Woodles Game Logic

- [ ] Design Woodles puzzle data structure
- [ ] Create puzzle generation script
- [ ] Build game UI components
- [ ] Implement game logic
- [ ] Update scoring algorithm

## Phase 6: Testing

- [ ] Test authentication flow
- [ ] Test game flow
- [ ] Test admin panel

## Phase 7: Deployment

- [ ] Create new Vercel project
- [ ] Set environment variables
- [ ] Deploy and test

For full details, see the CLONING_TO_NEW_PROJECT.md documentation.
"@ | Out-File -FilePath SETUP_CHECKLIST.md -Encoding utf8

Write-Host "Step 7: Creating quick start guide..." -ForegroundColor Yellow
@"
# Woodles Quick Start

## 1. Install Dependencies
``````bash
npm install
``````

## 2. Create Supabase Project
1. Go to https://app.supabase.com
2. Click "New Project"
3. Name: "Woodles"
4. Set database password

## 3. Configure .env.local
- Get credentials from Supabase Dashboard → Project Settings → API
- Update .env.local file

## 4. Set Up Database
- Export schema from Wortex
- Import to Woodles Supabase project

## 5. Test the App
``````bash
npm run dev
``````

## 6. Follow SETUP_CHECKLIST.md
Complete all items for full setup.

For detailed instructions, see docs/CLONING_TO_NEW_PROJECT.md
"@ | Out-File -FilePath QUICKSTART.md -Encoding utf8

Write-Host "Step 8: Creating database export guide..." -ForegroundColor Yellow
if (-not (Test-Path "scripts")) {
    New-Item -ItemType Directory -Path "scripts" | Out-Null
}
@"
# Exporting Database Schema from Wortex

## Using Supabase Dashboard

1. Go to your Wortex Supabase project
2. Navigate to: SQL Editor
3. Click "..." menu in top right
4. Select "Export as SQL"
5. Save the file

## What to Keep vs Modify

Keep as-is:
- users table
- stats table
- scores table
- sessions table

Modify for Woodles:
- puzzles table - adjust for Woodles format

See docs/CLONING_TO_NEW_PROJECT.md for full details.
"@ | Out-File -FilePath scripts\export-schema-from-wortex.md -Encoding utf8

Write-Host "Step 9: Committing changes..." -ForegroundColor Yellow
git add .
git commit -m "Add setup scripts and documentation for Woodles project"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  Setup Complete! ✓" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Project location: $newProjectDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. cd $newProjectDir"
Write-Host "2. Review: QUICKSTART.md"
Write-Host "3. Complete: SETUP_CHECKLIST.md"
Write-Host "4. Update .env.local with your Supabase credentials"
Write-Host "5. Run: npm install"
Write-Host "6. Run: npm run dev"
Write-Host ""
Write-Host "Happy coding!" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to exit"
