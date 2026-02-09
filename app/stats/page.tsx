'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import StatsCard from '@/components/stats/StatsCard';
import RecentGamesTable from '@/components/stats/RecentGamesTable';
import StarsHistogram from '@/components/stats/StarsHistogram';
import { useUser } from '@/lib/contexts/UserContext';
import type { Database } from '@/types/database';

type StatsRow = Database['public']['Tables']['stats']['Row'];

interface RecentGame {
  id: string;
  puzzle_id: string;
  puzzle_date: string;
  score: number;
  bonus_correct: boolean;
  time_taken_seconds: number;
  speed: number;
  min_speed: number;
  max_speed: number;
  stars: number | null;
  created_at: string;
}

interface StarDistribution {
  [key: number]: number; // Maps star rating (0-5) to count
}

export default function StatsPage() {
  const { userId, user, loading: userLoading } = useUser();
  const [stats, setStats] = useState<StatsRow | null>(null);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [pureStarDistribution, setPureStarDistribution] = useState<StarDistribution>({});
  const [boostedStarDistribution, setBoostedStarDistribution] = useState<StarDistribution>({});
  const [todayPureStars, setTodayPureStars] = useState<number | null>(null);
  const [todayBoostedStars, setTodayBoostedStars] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  // Check if we're showing expired (not today's) stats
  const isExpired = () => {
    if (!stats?.last_played_date) return false;
    const today = new Date().toISOString().split('T')[0];
    return stats.last_played_date !== today;
  };

  // Handle close button - redirect to homepage if on expired data
  const handleClose = () => {
    // Check if last played date is from a previous day
    if (stats?.last_played_date) {
      const today = new Date().toISOString().split('T')[0];
      if (stats.last_played_date < today) {
        console.log('[Stats] Expired data detected, redirecting to homepage');
        router.push('/');
        return;
      }
    }
    router.back();
  };

  const loadStats = useCallback(async () => {
    if (!userId) {
      console.warn('[Stats] Cannot load stats - no userId');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[Stats] Loading stats for user:', userId.substring(0, 12));

      // Get user stats from API
      const statsResponse = await fetch('/api/user/stats', {
        credentials: 'include',
      });
      if (statsResponse.ok) {
        const userStats = await statsResponse.json();
        setStats(userStats);
      } else {
        console.error('[Stats] Error loading user stats:', statsResponse.status);
      }

      // Get recent games (last 30) from API
      const recentResponse = await fetch('/api/user/scores?type=recent&limit=30', {
        credentials: 'include',
      });

      if (recentResponse.ok) {
        const games = await recentResponse.json();
        const formattedGames = games.map((game: any) => ({
          id: game.id,
          puzzle_id: game.puzzle_id,
          puzzle_date: game.puzzles.date,
          score: game.score,
          bonus_correct: game.bonus_correct,
          time_taken_seconds: game.time_taken_seconds,
          speed: game.speed,
          min_speed: game.min_speed || game.speed,
          max_speed: game.max_speed || game.speed,
          stars: game.stars,
          created_at: game.created_at,
        }));
        setRecentGames(formattedGames);
      } else {
        console.error('[Stats] Error loading recent games:', recentResponse.status);
      }

      // Get today's date in user's timezone
      const userTimezone = typeof window !== 'undefined'
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : 'America/Los_Angeles';
      const today = new Date().toLocaleDateString('en-CA', {
        timeZone: userTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });

      // Get star distribution for Pure games (first play, 1.0x speed only) from API
      const pureResponse = await fetch('/api/user/scores?type=pure', {
        credentials: 'include',
      });

      if (pureResponse.ok) {
        const pureGames = await pureResponse.json();
        const pureDistribution: StarDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let todayPure: number | null = null;

        pureGames.forEach((game: any) => {
          const stars = game.stars;
          if (stars && stars >= 1 && stars <= 5) {
            pureDistribution[stars] = (pureDistribution[stars] || 0) + 1;

            // Check if this is today's game
            if (game.puzzles?.date === today) {
              todayPure = stars;
            }
          }
        });

        setPureStarDistribution(pureDistribution);
        setTodayPureStars(todayPure);
      } else {
        console.error('[Stats] Error loading pure games:', pureResponse.status);
      }

      // Get star distribution for Boosted games (repeat plays or speed adjustments) from API
      const boostedResponse = await fetch('/api/user/scores?type=boosted', {
        credentials: 'include',
      });

      if (boostedResponse.ok) {
        const boostedGames = await boostedResponse.json();
        const boostedDistribution: StarDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let todayBoosted: number | null = null;

        boostedGames.forEach((game: any) => {
          const stars = game.stars;
          if (stars && stars >= 1 && stars <= 5) {
            boostedDistribution[stars] = (boostedDistribution[stars] || 0) + 1;

            // Check if this is today's game
            if (game.puzzles?.date === today) {
              todayBoosted = stars;
            }
          }
        });

        setBoostedStarDistribution(boostedDistribution);
        setTodayBoostedStars(todayBoosted);
      } else {
        console.error('[Stats] Error loading boosted games:', boostedResponse.status);
      }

    } catch (error) {
      console.error('[Stats] Error loading stats:', error);
      setError(error instanceof Error ? error.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load stats once UserContext is ready
  useEffect(() => {
    if (!userLoading && userId) {
      console.log('[Stats] UserContext ready, loading stats for:', userId.substring(0, 12));
      loadStats();
    } else if (!userLoading && !userId) {
      console.warn('[Stats] UserContext ready but no userId');
      setLoading(false);
    }
  }, [userLoading, userId, loadStats]);

  function getStreakEmoji(streak: number): string {
    if (streak === 0) return '💤';
    if (streak < 3) return '🔥';
    if (streak < 7) return '🔥🔥';
    if (streak < 30) return '🔥🔥🔥';
    return '🔥🔥🔥🔥';
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                My Stats
              </h1>
              {user?.display_name && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {user.display_name}
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6 text-gray-600 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
              <p className="text-red-900 dark:text-red-300 text-lg mb-4">
                Unable to load stats
              </p>
              <p className="text-red-700 dark:text-red-400 text-sm mb-6">
                {error}
              </p>
              <button
                onClick={() => loadStats()}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : loading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            </div>
          ) : !stats ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                No stats yet. Start playing to track your progress!
              </p>
              <a
                href="/"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Play Today's Puzzle
              </a>
            </div>
          ) : (
            <>
              {/* Compact Stats Grid */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
                <div className="grid grid-cols-2 divide-x divide-y divide-gray-200 dark:divide-gray-700">
                  <div className="p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Games Played</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total_games}</p>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Score</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.average_score.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Lower is better</p>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Streak</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stats.current_streak} {getStreakEmoji(stats.current_streak)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">{stats.current_streak === 1 ? 'day' : 'days'}</p>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Best Streak</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.best_streak}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">{stats.best_streak === 1 ? 'day' : 'days'}</p>
                  </div>
                </div>
              </div>

              {/* Star Distribution Histograms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <StarsHistogram
                  title="Pure Games"
                  starCounts={pureStarDistribution}
                  color="emerald"
                  loading={loading}
                  todayStars={todayPureStars}
                />
                <StarsHistogram
                  title="Boosted Games"
                  starCounts={boostedStarDistribution}
                  color="purple"
                  loading={loading}
                  todayStars={todayBoostedStars}
                />
              </div>

              {/* Last Played */}
              {stats.last_played_date && (
                <div className="mb-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-900 dark:text-blue-300">
                    <span className="font-semibold">Last played:</span>{' '}
                    {new Date(stats.last_played_date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}

              {/* Recent Games */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Recent Games
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Your last 30 puzzle attempts
                  </p>
                </div>
                <div className="p-6">
                  <RecentGamesTable games={recentGames} loading={loading} />
                </div>
              </div>

              {/* Achievements Section (Future) */}
              <div className="mt-6 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Achievements Coming Soon
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Badges and milestones will be added in a future update
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
