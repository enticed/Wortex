# Wortex

A mobile-first word game where players assemble famous quotes by grabbing words from an animated vortex.

## Overview

Wortex presents a daily puzzle where players must reconstruct two phrases:
- A famous quote from history or literature (manual assembly)
- An AI-generated facsimile with similar meaning (auto-assembly)

Words flow into a spiraling vortex, and players drag them to the correct areas. The game ends when both phrases are complete, with scoring based on efficiency.

## Technology Stack

- **Frontend**: Next.js 15, React, TypeScript, TailwindCSS
- **Animations**: GSAP, Konva.js (Canvas)
- **Interactions**: dnd-kit
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Hosting**: Vercel (frontend) + Railway (backend/cron)
- **AI**: Anthropic Claude (Haiku)
- **Payments**: Lemon Squeezy
- **Ads**: Google AdSense

## Project Structure

```
wortex/
├── app/                    # Next.js app router pages
├── components/             # React components
│   ├── game/              # Game-specific components
│   ├── ui/                # Reusable UI components
│   └── layout/            # Layout components
├── lib/                   # Core libraries and utilities
│   ├── supabase/          # Supabase client and schema
│   ├── utils/             # Utility functions
│   └── hooks/             # Custom React hooks
├── types/                 # TypeScript type definitions
└── public/                # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Anthropic API key (for AI phrase generation)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/enticed/Wortex.git
cd Wortex
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your credentials:
- Supabase URL and keys
- Anthropic API key
- Other service credentials

### Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Run the database schema:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `lib/supabase/schema.sql`
   - Execute the query

3. Copy your Supabase credentials to `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (keep secret!)

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Building for Production

```bash
npm run build
npm start
```

## Deployment

### Vercel (Frontend)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Railway (Backend/Cron)

1. Create a new Railway project
2. Connect to your GitHub repository
3. Set up cron jobs for daily puzzle generation
4. Add environment variables

## Features

### Core Gameplay (MVP)
- [x] Animated vortex with word physics
- [x] Drag-and-drop word mechanics
- [x] Manual assembly (target phrase)
- [x] Auto-assembly (facsimile phrase)
- [x] Scoring system
- [x] Daily puzzle system
- [ ] Bonus round (person/year or author/book)

### User Features
- [ ] Anonymous play
- [ ] Optional account creation
- [ ] Stats tracking (streak, average score)
- [ ] Leaderboards
- [ ] Archive/practice mode
- [ ] Light/dark mode

### Monetization
- [ ] Google AdSense integration
- [ ] Ad-free subscription ($2-5/year)

### Content Management
- [ ] AI phrase generation (Claude Haiku)
- [ ] Admin review queue
- [ ] Manual phrase curation

### Future Enhancements
- [ ] React Native mobile apps
- [ ] Difficulty levels
- [ ] Spurious/decoy words
- [ ] 3D vortex effects

## Game Rules

1. Each day features one famous quote and one AI-generated facsimile
2. Words appear in the vortex, spiral inward, and disappear after ~5 rotations
3. Drag words to the top area (manual assembly) or bottom area (auto-assembly)
4. Top area: manually order words to match the target phrase
5. Bottom area: words automatically snap to correct positions
6. Score = (total words seen) / (unique words in both phrases) - lower is better
7. Complete both phrases to unlock the bonus round

## Contributing

This is a personal project, but suggestions and bug reports are welcome via GitHub issues.

## License

TBD

## Contact

Created by [enticed](https://github.com/enticed)
