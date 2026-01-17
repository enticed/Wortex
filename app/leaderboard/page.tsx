'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable';
import GlobalLeaderboardTable from '@/components/leaderboard/GlobalLeaderboardTable';
import { createClient } from '@/lib/supabase/client';
import { getPuzzleLeaderboard, getGlobalLeaderboard } from '@/lib/supabase/scores';
import { getTodaysPuzzle } from '@/lib/supabase/puzzles';
import type { Database } from '@/types/database';

type LeaderboardRow = Database['public']['Views']['leaderboards']['Row'];

type TabType = 'daily' | 'global';

interface GlobalLeaderboardEntry {
  user_id: string;
  display_name: string | null;
  average_score: number;
  total_games: number;
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('daily');
  const [dailyEntries, setDailyEntries] = useState<LeaderboardRow[]>([]);
  const [globalEntries, setGlobalEntries] = useState<GlobalLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [puzzleDate, setPuzzleDate] = useState<string | null>(null);

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

        // Load daily leaderboard
        const daily = await getPuzzleLeaderboard(supabase, puzzle.id, 100);
        setDailyEntries(daily);
      }

      // Load global leaderboard
      const global = await getGlobalLeaderboard(supabase, 100);
      setGlobalEntries(global);

    } catch (error) {
      console.error('Error loading leaderboards:', error);
    } finally {
      setLoading(false);
    }
  }

  // Set up realtime subscription for daily leaderboard updates
  useEffect(() => {
    if (!dailyEntries.length) return;

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
          // Reload daily leaderboard when scores change
          const puzzle = await getTodaysPuzzle(supabase);
          if (puzzle) {
            const daily = await getPuzzleLeaderboard(supabase, puzzle.id, 100);
            setDailyEntries(daily);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dailyEntries.length]);

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
              onClick={() => window.history.back()}
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
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Daily Rankings
                    </h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {dailyEntries.length} {dailyEntries.length === 1 ? 'player' : 'players'}
                    </span>
                  </div>
                  <LeaderboardTable
                    entries={dailyEntries}
                    currentUserId={currentUserId || undefined}
                    loading={loading}
                  />
                  {!loading && dailyEntries.length === 0 && (
                    <div className="mt-4 text-center">
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
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Best Average Scores
                    </h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Top 100 players
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Players ranked by their average score across all puzzles (lower is better)
                  </p>
                  <GlobalLeaderboardTable
                    entries={globalEntries}
                    currentUserId={currentUserId || undefined}
                    loading={loading}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
              How Scoring Works
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
              <li>• Lower scores are better</li>
              <li>• Score = (Words Seen / Unique Words) / Speed + Reorder Moves + Hints Used</li>
              <li>• Playing at faster speeds improves your score</li>
              <li>• Correct bonus answers reduce your final score by 10%</li>
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
