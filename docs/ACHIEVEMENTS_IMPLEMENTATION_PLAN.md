# Achievements & Badges Implementation Plan

## Overview
This document outlines a comprehensive plan for implementing an achievements and badges system for Wortex. The system will track player milestones, reward progression, and encourage engagement through various challenge categories.

---

## 1. Database Schema

### 1.1 Achievements Table
Defines all available achievements in the system.

```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL, -- e.g., 'first_win', 'streak_7'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'streak', 'performance', 'collection', 'speed', 'special'
  tier TEXT NOT NULL, -- 'bronze', 'silver', 'gold', 'platinum', 'diamond'
  icon_name TEXT NOT NULL, -- For displaying appropriate emoji/icon
  requirement_value INTEGER, -- Numeric threshold (e.g., 7 for 7-day streak)
  requirement_type TEXT, -- 'count', 'threshold', 'special'
  is_secret BOOLEAN DEFAULT FALSE, -- Hidden until unlocked
  points INTEGER DEFAULT 0, -- Achievement points for gamification
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX idx_achievements_category ON achievements(category);
CREATE INDEX idx_achievements_tier ON achievements(tier);
```

### 1.2 User Achievements Table
Tracks which achievements each user has unlocked.

```sql
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress_value INTEGER DEFAULT 0, -- For tracking partial progress
  notified BOOLEAN DEFAULT FALSE, -- Whether user has seen unlock notification

  UNIQUE(user_id, achievement_id)
);

-- Indexes for efficient querying
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_unlocked_at ON user_achievements(unlocked_at DESC);
CREATE INDEX idx_user_achievements_notified ON user_achievements(user_id, notified) WHERE notified = FALSE;
```

### 1.3 Achievement Progress View
A view to show progress toward locked achievements.

```sql
CREATE VIEW achievement_progress AS
SELECT
  u.id as user_id,
  a.id as achievement_id,
  a.key,
  a.name,
  a.description,
  a.category,
  a.tier,
  a.icon_name,
  a.requirement_value,
  a.is_secret,
  a.points,
  COALESCE(ua.progress_value, 0) as current_progress,
  CASE
    WHEN ua.id IS NOT NULL THEN TRUE
    ELSE FALSE
  END as is_unlocked,
  ua.unlocked_at
FROM
  auth.users u
CROSS JOIN
  achievements a
LEFT JOIN
  user_achievements ua ON ua.user_id = u.id AND ua.achievement_id = a.id;
```

---

## 2. Achievement Categories & Examples

### 2.1 Streak Achievements
Reward consecutive daily play.

| Key | Name | Description | Requirement | Tier | Icon |
|-----|------|-------------|-------------|------|------|
| `first_play` | Getting Started | Complete your first puzzle | 1 game | Bronze | 🎯 |
| `streak_3` | Hot Streak | Play 3 days in a row | 3-day streak | Bronze | 🔥 |
| `streak_7` | Week Warrior | Play 7 days in a row | 7-day streak | Silver | 🔥🔥 |
| `streak_14` | Two Week Champion | Play 14 days in a row | 14-day streak | Gold | 🔥🔥🔥 |
| `streak_30` | Monthly Master | Play 30 days in a row | 30-day streak | Platinum | 🔥🔥🔥🔥 |
| `streak_100` | Century Club | Play 100 days in a row | 100-day streak | Diamond | 👑 |

### 2.2 Performance Achievements
Based on scoring excellence.

| Key | Name | Description | Requirement | Tier | Icon |
|-----|------|-------------|-------------|------|------|
| `perfect_game` | Perfection | Score 1.00 on a puzzle | Score ≤ 1.00 | Gold | ⭐ |
| `five_stars_1` | Star Collector | Earn your first 5-star rating | 1x 5-star | Bronze | ⭐⭐⭐⭐⭐ |
| `five_stars_10` | Rising Star | Earn 10 five-star ratings | 10x 5-star | Silver | ⭐⭐⭐⭐⭐ |
| `five_stars_50` | Star Master | Earn 50 five-star ratings | 50x 5-star | Gold | ⭐⭐⭐⭐⭐ |
| `five_stars_100` | Stellar | Earn 100 five-star ratings | 100x 5-star | Platinum | ⭐⭐⭐⭐⭐ |
| `avg_score_low` | Efficiency Expert | Achieve average score below 2.00 | Avg ≤ 2.00 (20+ games) | Gold | 📊 |

### 2.3 Collection Achievements
Reward total games played.

| Key | Name | Description | Requirement | Tier | Icon |
|-----|------|-------------|-------------|------|------|
| `games_10` | Novice Player | Complete 10 puzzles | 10 games | Bronze | 🎮 |
| `games_50` | Regular Player | Complete 50 puzzles | 50 games | Silver | 🎮 |
| `games_100` | Dedicated Player | Complete 100 puzzles | 100 games | Gold | 🎮 |
| `games_250` | Veteran Player | Complete 250 puzzles | 250 games | Platinum | 🎮 |
| `games_500` | Master Player | Complete 500 puzzles | 500 games | Diamond | 🎮 |

### 2.4 Speed Achievements
Reward fast completion times.

| Key | Name | Description | Requirement | Tier | Icon |
|-----|------|-------------|-------------|------|------|
| `speed_60s` | Speed Demon | Complete a puzzle in under 60 seconds | Time < 60s | Silver | ⚡ |
| `speed_45s` | Lightning Fast | Complete a puzzle in under 45 seconds | Time < 45s | Gold | ⚡⚡ |
| `speed_30s` | Unstoppable | Complete a puzzle in under 30 seconds | Time < 30s | Platinum | ⚡⚡⚡ |

### 2.5 Bonus Round Achievements
Related to bonus question performance.

| Key | Name | Description | Requirement | Tier | Icon |
|-----|------|-------------|-------------|------|------|
| `bonus_first` | Bonus Hunter | Answer your first bonus question correctly | 1 correct | Bronze | 🎁 |
| `bonus_streak_5` | Bonus Expert | Answer 5 bonus questions correctly in a row | 5-streak | Silver | 🎁 |
| `bonus_streak_10` | Bonus Master | Answer 10 bonus questions correctly in a row | 10-streak | Gold | 🎁 |
| `bonus_100` | Trivia King | Answer 100 bonus questions correctly | 100 correct | Platinum | 👑 |

### 2.6 Leaderboard Achievements
Competitive achievements.

| Key | Name | Description | Requirement | Tier | Icon |
|-----|------|-------------|-------------|------|------|
| `leaderboard_top10` | Top Contender | Reach top 10 on daily Pure leaderboard | Top 10 Pure | Silver | 🏆 |
| `leaderboard_top3` | Podium Finish | Reach top 3 on daily Pure leaderboard | Top 3 Pure | Gold | 🥉 |
| `leaderboard_1st` | Champion | Reach #1 on daily Pure leaderboard | #1 Pure | Platinum | 🥇 |
| `global_top100` | Global Elite | Reach top 100 on global Pure leaderboard | Top 100 Global | Gold | 🌍 |
| `global_top10` | World Class | Reach top 10 on global Pure leaderboard | Top 10 Global | Diamond | 🌟 |

### 2.7 Special Achievements
Unique, secret, or event-based achievements.

| Key | Name | Description | Requirement | Tier | Icon |
|-----|------|-------------|-------------|------|------|
| `beta_tester` | Beta Pioneer | Played during beta period | Special | Platinum | 🚀 |
| `early_adopter` | Early Bird | One of the first 100 players | Special | Gold | 🐦 |
| `night_owl` | Night Owl | Complete a puzzle between 2-4 AM | Special (secret) | Bronze | 🦉 |
| `speed_explorer` | Speed Explorer | Try all speed settings (0.25x to 2.0x) | Special | Silver | 🎛️ |
| `comeback_kid` | Comeback Kid | Return after 30+ day absence | Special (secret) | Silver | 🔄 |

---

## 3. Backend Implementation

### 3.1 Achievement Checking System
Create a server-side function to check and award achievements after each game.

**File:** `lib/achievements/checker.ts`

```typescript
import { SupabaseClient } from '@supabase/supabase-js';

export interface AchievementCheck {
  key: string;
  condition: (data: GameData, stats: UserStats) => boolean;
  progressValue?: (data: GameData, stats: UserStats) => number;
}

export interface GameData {
  score: number;
  stars: number;
  timeTaken: number;
  bonusCorrect: boolean;
  minSpeed: number;
  maxSpeed: number;
  firstPlay: boolean;
}

export interface UserStats {
  totalGames: number;
  currentStreak: number;
  bestStreak: number;
  averageScore: number;
  fiveStarCount: number;
  totalBonusCorrect: number;
  consecutiveBonusCorrect: number;
}

export async function checkAndAwardAchievements(
  supabase: SupabaseClient,
  userId: string,
  gameData: GameData,
  stats: UserStats
): Promise<string[]> {
  const unlockedAchievements: string[] = [];

  // Get all achievements user doesn't have
  const { data: unlockedKeys } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId);

  const unlockedIds = new Set(unlockedKeys?.map(a => a.achievement_id) || []);

  const { data: allAchievements } = await supabase
    .from('achievements')
    .select('*')
    .order('sort_order');

  if (!allAchievements) return [];

  // Check each achievement
  for (const achievement of allAchievements) {
    if (unlockedIds.has(achievement.id)) continue;

    const checker = achievementCheckers[achievement.key];
    if (!checker) continue;

    if (checker.condition(gameData, stats)) {
      // Award achievement
      await supabase.from('user_achievements').insert({
        user_id: userId,
        achievement_id: achievement.id,
        progress_value: checker.progressValue?.(gameData, stats) || 0,
        notified: false
      });

      unlockedAchievements.push(achievement.key);
    }
  }

  return unlockedAchievements;
}

// Achievement condition definitions
const achievementCheckers: Record<string, AchievementCheck> = {
  first_play: {
    condition: (_, stats) => stats.totalGames >= 1
  },
  streak_3: {
    condition: (_, stats) => stats.currentStreak >= 3
  },
  streak_7: {
    condition: (_, stats) => stats.currentStreak >= 7
  },
  // ... add all achievement conditions
  perfect_game: {
    condition: (game) => game.score <= 1.00
  },
  five_stars_1: {
    condition: (_, stats) => stats.fiveStarCount >= 1
  },
  speed_60s: {
    condition: (game) => game.timeTaken < 60 && game.firstPlay
  },
  // ... etc
};
```

### 3.2 Database Trigger for Auto-Checking
Create a database trigger to automatically check achievements after score insertion.

```sql
CREATE OR REPLACE FUNCTION check_achievements_after_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Call achievement checking function
  -- This would be implemented as a Supabase Edge Function
  PERFORM net.http_post(
    url := current_setting('app.achievement_check_url'),
    body := json_build_object(
      'userId', NEW.user_id,
      'scoreId', NEW.id
    )::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_score_insert_check_achievements
AFTER INSERT ON scores
FOR EACH ROW
EXECUTE FUNCTION check_achievements_after_score();
```

### 3.3 Supabase Edge Function
Create an edge function to handle achievement checking.

**File:** `supabase/functions/check-achievements/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

serve(async (req) => {
  const { userId, scoreId } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Fetch game data
  const { data: score } = await supabase
    .from('scores')
    .select('*')
    .eq('id', scoreId)
    .single();

  // Fetch user stats
  const { data: stats } = await supabase
    .from('stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!score || !stats) {
    return new Response(JSON.stringify({ error: 'Data not found' }), {
      status: 404
    });
  }

  // Check achievements
  const unlocked = await checkAndAwardAchievements(
    supabase,
    userId,
    {
      score: score.score,
      stars: score.stars,
      timeTaken: score.time_taken_seconds,
      bonusCorrect: score.bonus_correct,
      minSpeed: score.min_speed,
      maxSpeed: score.max_speed,
      firstPlay: score.first_play_of_day
    },
    stats
  );

  return new Response(JSON.stringify({ unlocked }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

---

## 4. Frontend Implementation

### 4.1 Achievements Page Component
**File:** `app/achievements/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/lib/contexts/UserContext';
import { createClient } from '@/lib/supabase/client';
import AchievementCard from '@/components/achievements/AchievementCard';
import AchievementProgress from '@/components/achievements/AchievementProgress';

export default function AchievementsPage() {
  const { userId } = useUser();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unlocked', 'locked'
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    async function loadAchievements() {
      const supabase = createClient();

      const { data } = await supabase
        .from('achievement_progress')
        .select('*')
        .eq('user_id', userId)
        .order('category')
        .order('tier');

      setAchievements(data || []);
      setLoading(false);
    }

    if (userId) loadAchievements();
  }, [userId]);

  // Filter achievements
  const filteredAchievements = achievements.filter(a => {
    if (filter === 'unlocked' && !a.is_unlocked) return false;
    if (filter === 'locked' && a.is_unlocked) return false;
    if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
    if (a.is_secret && !a.is_unlocked) return false; // Hide secret achievements
    return true;
  });

  const unlockedCount = achievements.filter(a => a.is_unlocked).length;
  const totalPoints = achievements
    .filter(a => a.is_unlocked)
    .reduce((sum, a) => sum + a.points, 0);

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-20">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Achievements
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {unlockedCount} / {achievements.length} unlocked · {totalPoints} points
            </p>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-2">
            <FilterButton
              active={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              All
            </FilterButton>
            <FilterButton
              active={filter === 'unlocked'}
              onClick={() => setFilter('unlocked')}
            >
              Unlocked
            </FilterButton>
            <FilterButton
              active={filter === 'locked'}
              onClick={() => setFilter('locked')}
            >
              Locked
            </FilterButton>
          </div>

          {/* Category Filters */}
          <div className="mb-6 flex flex-wrap gap-2">
            {['all', 'streak', 'performance', 'collection', 'speed', 'special'].map(cat => (
              <CategoryButton
                key={cat}
                active={categoryFilter === cat}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </CategoryButton>
            ))}
          </div>

          {/* Achievement Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map(achievement => (
              <AchievementCard
                key={achievement.achievement_id}
                achievement={achievement}
              />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
```

### 4.2 Achievement Card Component
**File:** `components/achievements/AchievementCard.tsx`

```typescript
'use client';

interface AchievementCardProps {
  achievement: {
    name: string;
    description: string;
    tier: string;
    icon_name: string;
    is_unlocked: boolean;
    unlocked_at?: string;
    current_progress?: number;
    requirement_value?: number;
    points: number;
  };
}

const tierColors = {
  bronze: 'bg-orange-100 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700',
  silver: 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600',
  gold: 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-700',
  platinum: 'bg-cyan-100 dark:bg-cyan-900/20 border-cyan-400 dark:border-cyan-700',
  diamond: 'bg-purple-100 dark:bg-purple-900/20 border-purple-400 dark:border-purple-700',
};

export default function AchievementCard({ achievement }: AchievementCardProps) {
  const tierColor = tierColors[achievement.tier] || tierColors.bronze;
  const isLocked = !achievement.is_unlocked;

  return (
    <div className={`
      border-2 rounded-lg p-4 transition-all
      ${tierColor}
      ${isLocked ? 'opacity-50 grayscale' : 'hover:scale-105'}
    `}>
      {/* Icon */}
      <div className="text-4xl mb-2 text-center">
        {achievement.icon_name}
      </div>

      {/* Tier Badge */}
      <div className="text-xs font-semibold text-center mb-2 uppercase tracking-wide text-gray-600 dark:text-gray-400">
        {achievement.tier}
      </div>

      {/* Name */}
      <h3 className="font-bold text-lg text-center mb-2 text-gray-900 dark:text-gray-100">
        {achievement.name}
      </h3>

      {/* Description */}
      <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-3">
        {achievement.description}
      </p>

      {/* Progress Bar (if locked) */}
      {isLocked && achievement.requirement_value && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>Progress</span>
            <span>{achievement.current_progress} / {achievement.requirement_value}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
              style={{
                width: `${Math.min(100, (achievement.current_progress / achievement.requirement_value) * 100)}%`
              }}
            />
          </div>
        </div>
      )}

      {/* Unlocked Date */}
      {!isLocked && achievement.unlocked_at && (
        <div className="mt-3 text-center text-xs text-green-600 dark:text-green-400">
          ✓ Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
        </div>
      )}

      {/* Points */}
      <div className="mt-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
        {achievement.points} pts
      </div>
    </div>
  );
}
```

### 4.3 Achievement Notification Component
**File:** `components/achievements/AchievementNotification.tsx`

Display toast notifications when achievements are unlocked.

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/lib/contexts/UserContext';
import { createClient } from '@/lib/supabase/client';

export default function AchievementNotifications() {
  const { userId } = useUser();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    // Check for unnotified achievements
    async function checkNotifications() {
      const { data } = await supabase
        .from('user_achievements')
        .select('*, achievements(*)')
        .eq('user_id', userId)
        .eq('notified', false);

      if (data && data.length > 0) {
        setNotifications(data);

        // Mark as notified
        await supabase
          .from('user_achievements')
          .update({ notified: true })
          .eq('user_id', userId)
          .eq('notified', false);
      }
    }

    checkNotifications();

    // Subscribe to new achievements
    const channel = supabase
      .channel('achievement-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_achievements',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        // Fetch full achievement data
        supabase
          .from('achievements')
          .select('*')
          .eq('id', payload.new.achievement_id)
          .single()
          .then(({ data }) => {
            if (data) {
              setNotifications(prev => [...prev, { achievements: data }]);
            }
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      {notifications.map((notif, index) => (
        <div
          key={index}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg shadow-lg animate-slide-in-right max-w-sm"
        >
          <div className="flex items-center gap-3">
            <div className="text-3xl">{notif.achievements.icon_name}</div>
            <div className="flex-1">
              <div className="font-bold">Achievement Unlocked!</div>
              <div className="text-sm">{notif.achievements.name}</div>
              <div className="text-xs opacity-90">{notif.achievements.description}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 5. Integration Points

### 5.1 Add Achievements Link to Navigation
Update `components/layout/SideMenu.tsx` to include achievements link.

### 5.2 Add Achievement Notifications to Layout
Update `components/layout/AppLayout.tsx` to include `<AchievementNotifications />`.

### 5.3 Update Stats Page
Add a preview section showing recently unlocked achievements.

### 5.4 Show Achievement Count in Profile
Display total achievements and points in user profile/settings.

---

## 6. Migration & Seeding

### 6.1 Initial Migration
Create migration file with all tables and seed data.

**File:** `supabase/migrations/YYYYMMDDHHMMSS_create_achievements_system.sql`

### 6.2 Seed Achievements
Insert all predefined achievements into the database.

```sql
INSERT INTO achievements (key, name, description, category, tier, icon_name, requirement_value, requirement_type, points, sort_order) VALUES
  ('first_play', 'Getting Started', 'Complete your first puzzle', 'collection', 'bronze', '🎯', 1, 'count', 10, 1),
  ('streak_3', 'Hot Streak', 'Play 3 days in a row', 'streak', 'bronze', '🔥', 3, 'threshold', 25, 10),
  -- ... etc
;
```

---

## 7. Future Enhancements

### 7.1 Seasonal Achievements
Add limited-time achievements for holidays and special events.

### 7.2 Social Features
- Share achievement unlocks on social media
- Compare achievements with friends
- Achievement leaderboard (most points)

### 7.3 Rewards System
- Unlock special themes/avatars with achievements
- Premium tier gets bonus achievement points
- Achievement milestones unlock special puzzles

### 7.4 Meta Achievements
Achievements for unlocking other achievements:
- "Completionist" - Unlock all achievements in a category
- "Achievement Hunter" - Unlock 50% of all achievements
- "Perfectionist" - Unlock all non-secret achievements

---

## 8. Implementation Timeline

### Phase 1 (Week 1)
- Create database schema and migrations
- Seed initial achievements
- Implement achievement checker backend

### Phase 2 (Week 2)
- Build achievements page UI
- Create achievement card components
- Implement filtering and sorting

### Phase 3 (Week 3)
- Add achievement notifications
- Integrate with existing game flow
- Test achievement unlocking

### Phase 4 (Week 4)
- Add achievement previews to stats page
- Polish UI/UX
- Testing and bug fixes
- Launch!

---

## 9. Testing Checklist

- [ ] All achievement conditions trigger correctly
- [ ] Progress tracking works for partial achievements
- [ ] Secret achievements stay hidden until unlocked
- [ ] Notifications display properly
- [ ] Achievements persist across sessions
- [ ] No duplicate achievement unlocks
- [ ] Edge function performs well under load
- [ ] Mobile UI displays properly
- [ ] Dark mode styling looks good
- [ ] Accessibility features work (screen readers, keyboard nav)

---

## 10. Metrics to Track

- Achievement unlock rate by achievement
- Most popular achievements
- Average time to unlock each achievement
- User engagement before/after achievements launch
- Achievement notification click-through rate

---

This implementation plan provides a comprehensive, production-ready achievements system for Wortex!
