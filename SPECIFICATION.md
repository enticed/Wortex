# Wortex - Complete Development Specification

## Executive Summary

Wortex is a mobile-first web word game where players assemble famous quotes and literary passages by grabbing words from an animated vortex. The game features daily puzzles, competitive scoring, leaderboards, and optional ad-free subscription.

## Game Concept

### Core Mechanics

**Game Board Layout (Mobile-First)**:
- **Top 25%**: Target phrase assembly area (manual)
- **Middle 50%**: Animated vortex (tornado/cyclone view from above)
- **Bottom 25%**: Facsimile phrase assembly area (auto-assembly)

**Daily Puzzle Structure**:
- One famous quote from history or literature (5-25 words)
- One AI-generated facsimile with similar meaning but different wording (5-25 words)
- Both phrases approximately equal in length
- New puzzle each day based on user's local timezone

**Word Vortex Behavior**:
- Words flow into vortex from either side
- Spiral motion: ~5 rotations before disappearing into center
- Multiple words visible simultaneously
- Continuous spiral physics (realistic motion)
- Words get smaller and faster as they approach center
- All words from both phrases mixed together randomly

### Player Interaction

**Word Grabbing**:
- Tap/click a word to grab it (always succeeds if word is tapped)
- Vortex continues spinning while grabbing
- Drag word to top or bottom area
- Cannot move words between top and bottom after placement

**Top Area (Target Phrase - Manual Assembly)**:
- Player manually drags words into position
- Can reorder words at any time
- Can discard words by throwing back into vortex
- Must match exact wording and order of famous quote

**Bottom Area (Facsimile - Auto Assembly)**:
- Player drags word into the area
- App automatically places word in correct position
- Incorrect words rejected back to vortex
- No manual reordering needed

### Scoring and Completion

**Scoring Formula**:
```
Score = Total Words Seen / Number of Unique Words in Both Phrases
Lower score = better performance
```

**Game End Condition**:
- Both phrases must be completely and correctly assembled
- Every player gets satisfaction of completing the puzzle
- Words continue cycling in vortex even after correct placement

**Difficulty Handicaps** (future consideration):
- Faster vortex speed
- Show generic/less recognizable words first
- Add spurious words (decoys that don't belong to either phrase)
- Limit total appearances of each word
- Ratio of spurious to real words: maximum 1:1
- More decoys added as player approaches completion

### Bonus Round

**Format**:
- Mandatory but no penalty for wrong answer
- 5 multiple choice options
- For quotes: Identify person and year
- For literature: Identify author and book
- Contributes to daily score (method TBD)

### Pause Functionality

**Behavior**:
- Lower priority feature (may not be needed)
- If implemented: vortex concealed by fog
- Already-placed words remain visible
- No maximum pause duration
- Puzzle expires at end of day in user's timezone

## Technical Architecture

### Frontend Stack

**Core Framework**:
- Next.js 15 (App Router)
- React 18+
- TypeScript
- Tailwind CSS

**Animation & Interaction**:
- GSAP (GreenSock) - main animation engine
- Konva.js - canvas rendering for vortex
- dnd-kit - drag and drop interactions

**Key Features**:
- Mobile-first responsive design
- Light and dark modes
- Progressive Web App (PWA) capabilities

### Backend Stack

**MVP Approach**:
- Next.js API Routes (serverless)
- Simple and fast deployment

**Production Approach**:
- Railway-hosted Node.js/Express
- Dedicated service for:
  - Scheduled cron jobs
  - AI phrase generation
  - Heavy computations
  - Persistent connections

### Database

**Supabase (PostgreSQL)**:

**Tables**:
1. `users` - User profiles and settings
2. `puzzles` - Daily puzzles and phrases
3. `scores` - Individual game scores
4. `stats` - Aggregated user statistics

**Views**:
1. `leaderboards` - Ranked scores per puzzle

**Key Features**:
- Row Level Security (RLS)
- Realtime subscriptions (for leaderboards)
- Timezone-aware date handling
- Automatic stats updating via triggers

### Authentication

**Supabase Auth**:
- Anonymous users by default
- Generate anonymous user on first visit
- Optional account creation
- Merge anonymous data on account creation
- Social logins (future)

**User Progression**:
```
1. User visits site → Anonymous user created
2. User plays games → Progress tracked
3. User creates account (optional) → Anonymous data merged
4. User continues playing with persistent account
```

### AI Integration

**Anthropic Claude (Haiku)**:
- Generate facsimile phrases daily
- Run via Railway cron job
- Schedule: Daily at 00:00 UTC
- Generate 1 week ahead (7 phrases)
- Maintain 30-day buffer minimum

**Phrase Generation Workflow**:
```
1. Cron job triggers daily
2. Pull target phrase from online databases
3. Call Claude Haiku API with prompt:
   "Rewrite this famous quote in a different tone but with similar meaning and length"
4. Store in database with approved=false
5. Admin reviews and approves
6. Approved phrases become available to users
```

**Variable Tones**:
- Modern casual
- Academic
- Humorous
- Formal
- Poetic

### Hosting & Deployment

**Vercel (Frontend)**:
- Automatic deployments from GitHub
- Edge network for global performance
- Environment variables management
- Preview deployments for PRs

**Railway (Backend/Cron)**:
- PostgreSQL database (Supabase-compatible)
- Scheduled jobs for phrase generation
- Private network for DB connections
- No cold starts for persistent tasks

### Monetization

**Ad Integration**:
- Google AdSense for web (initial)
- Vignette/interstitial ad before each daily game
- Production-only loading
- Mobile-optimized ad formats

**Subscription System**:
- Lemon Squeezy payment processing
- Ad-free tier: $2-5/year
- Simple tier structure
- Tax compliance handled by Lemon Squeezy (Merchant of Record)

### Analytics (Future)

**Metrics to Track**:
- Completion rates
- Average scores
- Drop-off points
- Time to complete
- Most difficult puzzles
- User retention

## Database Schema

### Users Table
```sql
- id: UUID (primary key, foreign key to auth.users)
- created_at: TIMESTAMPTZ
- display_name: TEXT (nullable)
- timezone: TEXT (default 'UTC')
- is_anonymous: BOOLEAN (default true)
- subscription_status: TEXT ('none' | 'active' | 'expired')
- subscription_expires_at: TIMESTAMPTZ (nullable)
```

### Puzzles Table
```sql
- id: UUID (primary key)
- date: DATE (unique)
- target_phrase: TEXT (the famous quote)
- facsimile_phrase: TEXT (AI-generated)
- difficulty: INTEGER (1-5)
- bonus_question: JSONB
- created_at: TIMESTAMPTZ
- created_by_ai: BOOLEAN
- approved: BOOLEAN
```

### Scores Table
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key)
- puzzle_id: UUID (foreign key)
- score: NUMERIC(10, 2)
- bonus_correct: BOOLEAN
- time_taken_seconds: INTEGER
- created_at: TIMESTAMPTZ
- UNIQUE(user_id, puzzle_id)
```

### Stats Table
```sql
- user_id: UUID (primary key)
- total_games: INTEGER
- average_score: NUMERIC(10, 2)
- current_streak: INTEGER
- best_streak: INTEGER
- last_played_date: DATE
- updated_at: TIMESTAMPTZ
```

### Leaderboards View
```sql
SELECT
  scores.puzzle_id,
  scores.user_id,
  users.display_name,
  scores.score,
  RANK() OVER (PARTITION BY puzzle_id ORDER BY score ASC) as rank,
  puzzles.date as puzzle_date
FROM scores
JOIN users ON scores.user_id = users.id
JOIN puzzles ON scores.puzzle_id = puzzles.id
```

## User Experience

### First-Time User Flow

```
1. Visit wortex.com
2. (Optional) See interstitial ad
3. View simple tutorial example
   - "To be or not to be, that is the question"
   - vs. "To exist or to cease, this is what we must decide"
   - Can repeat as many times as needed
4. Start today's puzzle
5. Play anonymously
6. See score and leaderboard
7. (Optional) Create account to save progress
```

### Daily User Flow

```
1. Visit site
2. (If ads enabled) See interstitial ad
3. Start today's puzzle
4. Play game
5. Complete both phrases
6. Answer bonus question
7. See final score
8. View leaderboard ranking
9. Share score (optional)
```

### Archive/Practice Mode

- Access to past puzzles only (not current day)
- No official scoring
- No leaderboard integration
- Results not saved
- Perfect for practice and exploration

### Stats Tracked

**Per User**:
- Total games played
- Average score
- Current streak (consecutive days)
- Best streak (all time)
- Last played date

**Per Puzzle**:
- Completion time
- Final score
- Bonus round result

### Leaderboards

**Global Leaderboard**:
- Top scores for today's puzzle
- Updated in realtime
- Show rank, username, score
- Refresh automatically

**Personal Stats**:
- User's best scores
- Streak history
- Average performance

### Social Features

**Score Sharing**:
- Share to social media
- Format: "I scored X on today's Wortex! Can you beat it?"
- Link to game

**Friend Comparison** (future):
- Compare scores with friends
- Private leaderboards

## Visual Design

### Theme System

**Light Mode**:
- Clean, comfortable colors
- High contrast for readability
- Minimal eye strain

**Dark Mode**:
- Dark background
- Reduced blue light
- Comfortable for night play

### Vortex Visualization

**Initial Version (MVP)**:
- Simple, functional design
- CSS/Canvas-based animation
- Clear word visibility
- Smooth spiral motion

**Enhanced Version (Future)**:
- 3D-like effects with Pixi.js
- Particle systems
- Dynamic lighting
- More dramatic visuals

### Color Palette

- Comfortable for extended play
- Accessible (WCAG AA compliance)
- Distinct colors for word states:
  - In vortex: neutral
  - Grabbed: highlighted
  - Placed correctly: success
  - Rejected: error

### Typography

- Highly readable fonts
- Scalable for accessibility
- Distinct word boundaries
- Clear letter spacing

## Accessibility

**MVP Considerations**:
- Keyboard navigation
- Screen reader support (basic)
- Sufficient color contrast
- Text resizing support

**Future Enhancements**:
- Colorblind modes
- Reduced motion option
- Voice control
- Enhanced screen reader support

## Development Phases

### Phase 1: MVP - Core Gameplay (Weeks 1-3)

**Deliverables**:
- Project setup and infrastructure
- Database schema and Supabase connection
- Anonymous authentication
- Vortex animation prototype
- Drag-and-drop mechanics
- Manual assembly area (top)
- Auto-assembly area (bottom)
- Core game logic
- Scoring system
- Daily puzzle system (timezone-based)
- Basic UI (light/dark modes)

**Success Criteria**:
- Smooth vortex animations on mobile
- Intuitive drag-and-drop
- Both phrases completable
- Accurate scoring
- Game is fun to play

### Phase 2: Polish & Features (Weeks 4-5)

**Deliverables**:
- Bonus round implementation
- Stats tracking
- Leaderboards (realtime)
- Archive/practice mode
- Tutorial example game
- Social sharing
- UI polish and refinements

**Success Criteria**:
- Complete game experience
- Engaging bonus questions
- Competitive leaderboards
- Smooth user flow

### Phase 3: Monetization (Week 6)

**Deliverables**:
- Google AdSense integration
- Lemon Squeezy subscription
- Payment flow
- Ad-free mode
- Subscription management

**Success Criteria**:
- Non-intrusive ads
- Smooth payment experience
- Reliable ad-free delivery

### Phase 4: AI & Automation (Week 7)

**Deliverables**:
- Railway cron job setup
- Claude Haiku integration
- Phrase generation pipeline
- Admin review queue
- Automated daily puzzles
- Phrase approval workflow

**Success Criteria**:
- Quality AI-generated phrases
- Reliable daily puzzle delivery
- 30-day buffer maintained
- Easy admin review process

### Phase 5: Enhancement (Week 8+)

**Deliverables**:
- Visual polish (3D vortex)
- Advanced animations
- Difficulty levels
- Spurious words
- Analytics implementation
- Performance optimizations

**Success Criteria**:
- Beautiful, polished visuals
- Engaging advanced features
- Data-driven improvements

### Phase 6: Mobile Apps (Future)

**Deliverables**:
- React Native app with Expo
- Shared game logic
- AdMob integration
- iOS App Store deployment
- Android Play Store deployment

**Success Criteria**:
- Native app performance
- Feature parity with web
- Successful store approvals

## Content Strategy

### Phrase Sources

**Target Phrases (Famous Quotes/Literature)**:
- Online quote databases:
  - Wikiquote
  - BrainyQuote
  - Goodreads
  - Project Gutenberg
  - Poetry Foundation
- Criteria:
  - 5-25 words
  - Widely recognizable
  - Clear attribution
  - Public domain or fair use

**Facsimile Phrases (AI-Generated)**:
- Generated by Claude Haiku
- Similar length to target
- Similar meaning
- Different wording and tone
- Variable tones for variety

### Quality Control

**Review Process**:
1. AI generates facsimile phrase
2. Stored with approved=false
3. Admin reviews:
   - Length matches target
   - Meaning preserved
   - Tone appropriate
   - No offensive content
   - Playable difficulty
4. Admin approves or regenerates
5. Approved phrases go live

**Difficulty Balancing**:
- Start with difficulty=1 for all puzzles
- Adjust based on completion data
- Consider word recognition
- Balance challenge and satisfaction

## Success Metrics

### MVP Goals

- Playable, fun core game
- Smooth animations (60 FPS on mobile)
- Complete puzzle flow
- Accurate scoring
- Working daily puzzle system

### Launch Goals (Month 1)

- 1,000+ daily active users
- 70%+ completion rate
- Average session: 5-10 minutes
- 1% ad click-through rate
- 0.5% subscription conversion

### Growth Goals (Month 3)

- 10,000+ daily active users
- Active community sharing
- Positive reviews
- Growing word-of-mouth
- Sustainable revenue

### Long-Term Goals (Year 1)

- 100,000+ registered users
- Native mobile apps launched
- Profitable operation
- Strong user retention
- Established daily habit for players

## Risk Mitigation

### Technical Risks

**Animation Performance**:
- Mitigation: Start with Konva, upgrade to Pixi.js if needed
- Fallback: Simplified CSS animations

**Database Scaling**:
- Mitigation: PostgreSQL indexes, materialized views
- Fallback: Caching layer with Redis

**AI Phrase Quality**:
- Mitigation: Admin review queue, regeneration option
- Fallback: Manually curated phrase library

### Business Risks

**Ad Approval**:
- Mitigation: Multiple ad network options
- Fallback: Start with easier approval networks

**Payment Processing**:
- Mitigation: Lemon Squeezy (easier than Stripe)
- Fallback: Manual payment processing initially

**User Acquisition**:
- Mitigation: Word-of-mouth, social sharing, SEO
- Fallback: Small ad budget for testing

## Future Enhancements

### Gameplay

- Difficulty levels
- Timed challenges
- Multiplayer modes
- Custom puzzles
- User-submitted quotes
- Themed puzzle weeks
- Special event puzzles

### Social

- Friend challenges
- Private groups
- Global tournaments
- Achievement system
- Badges and rewards

### Content

- Multiple puzzle types
- Different languages
- Historical themes
- Literary genres
- Educational focus

### Monetization

- Premium subscription tiers
- Cosmetic customization
- Power-ups (controversial, needs consideration)
- Merchandise
- API access for developers

## Conclusion

Wortex combines engaging word gameplay with modern web technologies to create a daily puzzle game that's accessible, challenging, and fun. The phased development approach ensures a solid MVP while leaving room for growth and enhancement based on user feedback and market response.

---

**Document Version**: 1.0
**Last Updated**: 2026-01-08
**Status**: Development In Progress
