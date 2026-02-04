'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable';
import GlobalLeaderboardTable from '@/components/leaderboard/GlobalLeaderboardTable';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/contexts/UserContext';
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
  const { userId, loading: userLoading } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>('daily');
  const [dailyEntriesPure, setDailyEntriesPure] = useState<LeaderboardPureRow[]>([]);
  const [dailyEntriesBoosted, setDailyEntriesBoosted] = useState<LeaderboardBoostedRow[]>([]);
  const [globalEntriesPure, setGlobalEntriesPure] = useState<GlobalLeaderboardPureRow[]>([]);
  const [globalEntriesBoosted, setGlobalEntriesBoosted] = useState<GlobalLeaderboardBoostedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [puzzleDate, setPuzzleDate] = useState<string | null>(null);
  const [isArchiveMode, setIsArchiveMode] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const loadLeaderboards = useCallback(async () => {
    try {
      console.log('[Leaderboard] Starting to load data...');
      console.log('[Leaderboard] Using userId from UserContext:', userId?.substring(0, 12) || 'none');
      setLoading(true);

      // Check for date in URL parameter first (for archive mode)
      let targetPuzzleDate: string | null = null;
      const urlDate = searchParams.get('date');
      if (urlDate) {
        targetPuzzleDate = urlDate;
        setIsArchiveMode(true);
        console.log('[Leaderboard] Using URL date parameter (archive mode):', targetPuzzleDate);
      } else {
        // Check if there's a saved puzzle date from a completed game (for cases where user finished after midnight)
        const savedResults = sessionStorage.getItem('wortex-final-results');
        if (savedResults) {
          try {
            const results = JSON.parse(savedResults);
            if (results.puzzleDate) {
              targetPuzzleDate = results.puzzleDate;
              console.log('[Leaderboard] Using saved puzzle date:', targetPuzzleDate);
            }
          } catch (e) {
            console.warn('[Leaderboard] Failed to parse saved results:', e);
          }
        }
      }

      // Get today's puzzle
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const calculatedDate = new Date().toLocaleDateString('en-CA', {
        timeZone: userTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      console.log('[Leaderboard] Step 1 complete - TZ:', userTimezone, 'Date:', calculatedDate);

      // If we have a saved puzzle date, fetch that specific puzzle, otherwise get today's
      console.log('[Leaderboard] Step 2: Fetching puzzle...');
      let puzzle;
      if (targetPuzzleDate) {
        const { getPuzzleByDate } = await import('@/lib/supabase/puzzles');
        puzzle = await getPuzzleByDate(supabase, targetPuzzleDate);
        console.log('[Leaderboard] Step 2 complete - Saved puzzle:', puzzle?.date || 'NOT FOUND');
      } else {
        puzzle = await getTodaysPuzzle(supabase);
        console.log('[Leaderboard] Step 2 complete - Today\'s puzzle:', puzzle?.date || 'NOT FOUND');
      }

      if (puzzle) {
        setPuzzleDate(puzzle.date);

        // Load daily leaderboards (Pure and Boosted)
        const dailyPure = await getPuzzleLeaderboardPure(supabase, puzzle.id, 100);
        const dailyBoosted = await getPuzzleLeaderboardBoosted(supabase, puzzle.id, 100);
        console.log('[Leaderboard] Daily Pure entries:', dailyPure.length);
        console.log('[Leaderboard] Daily Boosted entries:', dailyBoosted.length);
        setDailyEntriesPure(dailyPure);
        setDailyEntriesBoosted(dailyBoosted);
      } else {
        console.warn('[Leaderboard] No puzzle found for today!');
      }

      // Load global leaderboards (Pure and Boosted)
      const globalPure = await getGlobalLeaderboardPure(supabase, 100);
      const globalBoosted = await getGlobalLeaderboardBoosted(supabase, 100);
      console.log('[Leaderboard] Global Pure entries:', globalPure.length);
      console.log('[Leaderboard] Global Boosted entries:', globalBoosted.length);
      setGlobalEntriesPure(globalPure);
      setGlobalEntriesBoosted(globalBoosted);

      console.log('[Leaderboard] Loading complete');
    } catch (error) {
      console.error('[Leaderboard] Error loading leaderboards:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, supabase, searchParams]); // Memoize function, only recreate if userId, supabase, or searchParams changes

  // Load leaderboards once UserContext is ready
  useEffect(() => {
    if (!userLoading) {
      console.log('[Leaderboard] UserContext ready, userId:', userId?.substring(0, 12) || 'none');
      loadLeaderboards();
    }
  }, [userLoading, loadLeaderboards]); // Include loadLeaderboards in dependencies

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
                {isArchiveMode ? 'Past Leaderboard' : 'Leaderboard'}
              </h1>
              {puzzleDate && activeTab === 'daily' && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isArchiveMode ? 'Puzzle from: ' : 'Today\'s Puzzle: '}{new Date(puzzleDate + 'T00:00:00').toLocaleDateString('en-US', {
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
                {isArchiveMode ? 'Past Puzzle' : 'Today\'s Puzzle'}
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
                        First play of the puzzle with no speed adjustments
                      </p>
                    </div>
                    <LeaderboardTable
                      entries={dailyEntriesPure}
                      currentUserId={userId || undefined}
                      loading={loading}
                      puzzleDate={puzzleDate || undefined}
                      rankingType="pure"
                    />
                    {!loading && dailyEntriesPure.length === 0 && (
                      <div className="mt-4 text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <p className="text-gray-600 dark:text-gray-400">
                          No Pure scores yet for {isArchiveMode ? 'this puzzle' : 'today\'s puzzle'}
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
                      currentUserId={userId || undefined}
                      loading={loading}
                      puzzleDate={puzzleDate || undefined}
                      rankingType="boosted"
                    />
                    {!loading && dailyEntriesBoosted.length === 0 && (
                      <div className="mt-4 text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <p className="text-gray-600 dark:text-gray-400">
                          No Boosted scores yet for {isArchiveMode ? 'this puzzle' : 'today\'s puzzle'}
                        </p>
                      </div>
                    )}
                  </div>

                  {!loading && dailyEntriesPure.length === 0 && dailyEntriesBoosted.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {isArchiveMode ? 'No one has played this puzzle yet!' : 'No one has played today\'s puzzle yet!'}
                      </p>
                      {!isArchiveMode && (
                        <a
                          href="/"
                          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                        >
                          Play Today's Puzzle
                        </a>
                      )}
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
                      currentUserId={userId || undefined}
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
                      currentUserId={userId || undefined}
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
