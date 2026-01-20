'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable';
import GlobalLeaderboardTable from '@/components/leaderboard/GlobalLeaderboardTable';
import { createClient } from '@/lib/supabase/client';
import {
  getPuzzleLeaderboard,
  getGlobalLeaderboard,
  getPuzzleLeaderboardPure,
  getPuzzleLeaderboardBoosted,
  getGlobalLeaderboardPure,
  getGlobalLeaderboardBoosted
} from '@/lib/supabase/scores';
import { getTodaysPuzzle } from '@/lib/supabase/puzzles';
import type { Database } from '@/types/database';

type LeaderboardRow = Database['public']['Views']['leaderboards']['Row'];
type LeaderboardPureRow = Database['public']['Views']['leaderboards_pure']['Row'];
type LeaderboardBoostedRow = Database['public']['Views']['leaderboards_boosted']['Row'];
type GlobalLeaderboardPureRow = Database['public']['Views']['global_leaderboards_pure']['Row'];
type GlobalLeaderboardBoostedRow = Database['public']['Views']['global_leaderboards_boosted']['Row'];

type TabType = 'daily' | 'global';

interface GlobalLeaderboardEntry {
  user_id: string;
  display_name: string | null;
  average_score: number;
  total_games: number;
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('daily');
  const [dailyEntriesPure, setDailyEntriesPure] = useState<LeaderboardPureRow[]>([]);
  const [dailyEntriesBoosted, setDailyEntriesBoosted] = useState<LeaderboardBoostedRow[]>([]);
  const [globalEntriesPure, setGlobalEntriesPure] = useState<GlobalLeaderboardPureRow[]>([]);
  const [globalEntriesBoosted, setGlobalEntriesBoosted] = useState<GlobalLeaderboardBoostedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [puzzleDate, setPuzzleDate] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadLeaderboards();
  }, []);

  async function loadLeaderboards() {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // Get today's puzzle
      const puzzle = await getTodaysPuzzle(supabase);

      if (puzzle) {
        setPuzzleDate(puzzle.date);

        // Load daily leaderboards (Pure and Boosted)
        const dailyPure = await getPuzzleLeaderboardPure(supabase, puzzle.id, 100);
        const dailyBoosted = await getPuzzleLeaderboardBoosted(supabase, puzzle.id, 100);

        console.log('Daily leaderboard data:', {
          puzzleId: puzzle.id,
          puzzleDate: puzzle.date,
          dailyPure: dailyPure.length,
          dailyBoosted: dailyBoosted.length,
          dailyPureData: dailyPure,
          dailyBoostedData: dailyBoosted
        });

        setDailyEntriesPure(dailyPure);
        setDailyEntriesBoosted(dailyBoosted);
      }

      // Load global leaderboards (Pure and Boosted)
      const globalPure = await getGlobalLeaderboardPure(supabase, 100);
      const globalBoosted = await getGlobalLeaderboardBoosted(supabase, 100);

      console.log('Global leaderboard data:', {
        globalPure: globalPure.length,
        globalBoosted: globalBoosted.length,
        globalPureData: globalPure,
        globalBoostedData: globalBoosted
      });

      setGlobalEntriesPure(globalPure);
      setGlobalEntriesBoosted(globalBoosted);

    } catch (error) {
      console.error('Error loading leaderboards:', error);
    } finally {
      setLoading(false);
    }
  }

  // Set up realtime subscription for daily leaderboard updates
  useEffect(() => {
    if (!dailyEntriesPure.length && !dailyEntriesBoosted.length) return;

    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scores',
        },
        async () => {
          // Reload daily leaderboards when scores change
          const puzzle = await getTodaysPuzzle(supabase);
          if (puzzle) {
            const dailyPure = await getPuzzleLeaderboardPure(supabase, puzzle.id, 100);
            const dailyBoosted = await getPuzzleLeaderboardBoosted(supabase, puzzle.id, 100);
            setDailyEntriesPure(dailyPure);
            setDailyEntriesBoosted(dailyBoosted);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dailyEntriesPure.length, dailyEntriesBoosted.length]);

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Leaderboard
              </h1>
              {puzzleDate && activeTab === 'daily' && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Today's Puzzle: {new Date(puzzleDate + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
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

          {/* Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('daily')}
                className={`
                  flex-1 py-3 px-4 text-sm font-medium transition-colors
                  ${activeTab === 'daily'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }
                `}
              >
                Today's Puzzle
              </button>
              <button
                onClick={() => setActiveTab('global')}
                className={`
                  flex-1 py-3 px-4 text-sm font-medium transition-colors
                  ${activeTab === 'global'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }
                `}
              >
                All-Time Best
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'daily' && (
                <div className="space-y-8">
                  {/* Pure Leaderboard */}
                  <div>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                          Pure Rankings
                        </h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {dailyEntriesPure.length} {dailyEntriesPure.length === 1 ? 'player' : 'players'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        First play of the puzzle with no speed adjustments (1.0x speed only)
                      </p>
                    </div>
                    <LeaderboardTable
                      entries={dailyEntriesPure}
                      currentUserId={currentUserId || undefined}
                      loading={loading}
                    />
                    {!loading && dailyEntriesPure.length === 0 && (
                      <div className="mt-4 text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <p className="text-gray-600 dark:text-gray-400">
                          No Pure scores yet for today's puzzle
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Boosted Leaderboard */}
                  <div>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-semibold text-purple-700 dark:text-purple-400">
                          Boosted Rankings
                        </h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {dailyEntriesBoosted.length} {dailyEntriesBoosted.length === 1 ? 'player' : 'players'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Repeat plays and/or games with speed adjustments
                      </p>
                    </div>
                    <LeaderboardTable
                      entries={dailyEntriesBoosted}
                      currentUserId={currentUserId || undefined}
                      loading={loading}
                      showSpeed={true}
                    />
                    {!loading && dailyEntriesBoosted.length === 0 && (
                      <div className="mt-4 text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <p className="text-gray-600 dark:text-gray-400">
                          No Boosted scores yet for today's puzzle
                        </p>
                      </div>
                    )}
                  </div>

                  {!loading && dailyEntriesPure.length === 0 && dailyEntriesBoosted.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        No one has played today's puzzle yet!
                      </p>
                      <a
                        href="/"
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                      >
                        Play Today's Puzzle
                      </a>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'global' && (
                <div className="space-y-8">
                  {/* Pure Global Leaderboard */}
                  <div>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                          Pure Rankings - Best Averages
                        </h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Top 100 players
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        Average scores from Pure games only (first plays with no speed adjustments)
                      </p>
                    </div>
                    <GlobalLeaderboardTable
                      entries={globalEntriesPure}
                      currentUserId={currentUserId || undefined}
                      loading={loading}
                    />
                    {!loading && globalEntriesPure.length === 0 && (
                      <div className="mt-4 text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <p className="text-gray-600 dark:text-gray-400">
                          No Pure scores recorded yet
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Boosted Global Leaderboard */}
                  <div>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-semibold text-purple-700 dark:text-purple-400">
                          Boosted Rankings - Best Averages
                        </h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Top 100 players
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        Average scores from Boosted games (repeat plays and/or speed adjustments)
                      </p>
                    </div>
                    <GlobalLeaderboardTable
                      entries={globalEntriesBoosted}
                      currentUserId={currentUserId || undefined}
                      loading={loading}
                    />
                    {!loading && globalEntriesBoosted.length === 0 && (
                      <div className="mt-4 text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <p className="text-gray-600 dark:text-gray-400">
                          No Boosted scores recorded yet
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-6 space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                How Scoring Works
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                <li>• Lower scores are better</li>
                <li>• Score = (Words Seen / Unique Words) + Reorder Moves + Hints Used</li>
                <li>• Correct bonus answers reduce your final score by 10%</li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-emerald-50 to-purple-50 dark:from-emerald-900/20 dark:to-purple-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Ranking Categories
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">Pure Rankings</span>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    Your first play of each puzzle at standard speed (1.0x). Compete on equal footing!
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-purple-600 dark:text-purple-400 font-semibold text-sm">Boosted Rankings</span>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    Repeat plays and/or games using the speed slider. Perfect your score and experiment!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
