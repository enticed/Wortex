'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import StatsCard from '@/components/stats/StatsCard';
import RecentGamesTable from '@/components/stats/RecentGamesTable';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/contexts/UserContext';
import { getUserStats } from '@/lib/supabase/scores';
import type { Database } from '@/types/database';

type StatsRow = Database['public']['Tables']['stats']['Row'];

interface RecentGame {
  puzzle_id: string;
  puzzle_date: string;
  score: number;
  bonus_correct: boolean;
  time_taken_seconds: number;
  speed: number;
  min_speed: number;
  max_speed: number;
  created_at: string;
}

export default function StatsPage() {
  const { userId, user, loading: userLoading } = useUser();
  const [stats, setStats] = useState<StatsRow | null>(null);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const supabase = createClient();

  const loadStats = useCallback(async () => {
    if (!userId) {
      console.warn('[Stats] Cannot load stats - no userId');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      console.log('[Stats] Loading stats for user:', userId.substring(0, 12));

      // Get user stats
      const userStats = await getUserStats(supabase, userId);
      setStats(userStats);

      // Get recent games (last 10)
      const { data: games } = await supabase
        .from('scores')
        .select(`
          puzzle_id,
          score,
          bonus_correct,
          time_taken_seconds,
          speed,
          min_speed,
          max_speed,
          created_at,
          puzzles!inner (
            date
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (games) {
        const formattedGames = games.map((game: any) => ({
          puzzle_id: game.puzzle_id,
          puzzle_date: game.puzzles.date,
          score: game.score,
          bonus_correct: game.bonus_correct,
          time_taken_seconds: game.time_taken_seconds,
          speed: game.speed,
          min_speed: game.min_speed || game.speed,
          max_speed: game.max_speed || game.speed,
          created_at: game.created_at,
        }));
        setRecentGames(formattedGames);
      }

    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

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
              onClick={() => router.back()}
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

          {loading ? (
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
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <StatsCard
                  label="Total Games Played"
                  value={stats.total_games}
                  icon="🎮"
                />
                <StatsCard
                  label="Average Score"
                  value={stats.average_score.toFixed(2)}
                  icon="📊"
                  subtitle="Lower is better"
                />
                <StatsCard
                  label="Current Streak"
                  value={stats.current_streak}
                  icon={getStreakEmoji(stats.current_streak)}
                  subtitle={stats.current_streak === 1 ? 'day' : 'days'}
                />
                <StatsCard
                  label="Best Streak"
                  value={stats.best_streak}
                  icon="🏆"
                  subtitle={stats.best_streak === 1 ? 'day' : 'days'}
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
                    Your last 10 puzzle attempts
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
