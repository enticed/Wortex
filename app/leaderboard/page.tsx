'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable';
import GlobalLeaderboardTable from '@/components/leaderboard/GlobalLeaderboardTable';
import RankingSubTabs from '@/components/leaderboard/RankingSubTabs';
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

type RankingSubTabType = 'pure' | 'boosted';
type GlobalMetricType = 'average_score' | 'total_stars';

function LeaderboardContent() {
  const { userId, loading: userLoading } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>('daily');
  const [activeSubTab, setActiveSubTab] = useState<RankingSubTabType>('pure');
  const [globalMetric, setGlobalMetric] = useState<GlobalMetricType>('average_score');

  const [dailyEntriesPure, setDailyEntriesPure] = useState<LeaderboardPureRow[]>([]);
  const [dailyEntriesBoosted, setDailyEntriesBoosted] = useState<LeaderboardBoostedRow[]>([]);
  const [globalEntriesPure, setGlobalEntriesPure] = useState<GlobalLeaderboardPureRow[]>([]);
  const [globalEntriesBoosted, setGlobalEntriesBoosted] = useState<GlobalLeaderboardBoostedRow[]>([]);

  // Pagination state
  const [dailyPureOffset, setDailyPureOffset] = useState(0);
  const [dailyBoostedOffset, setDailyBoostedOffset] = useState(0);
  const [globalPureOffset, setGlobalPureOffset] = useState(0);
  const [globalBoostedOffset, setGlobalBoostedOffset] = useState(0);
  const [hasMoreDailyPure, setHasMoreDailyPure] = useState(true);
  const [hasMoreDailyBoosted, setHasMoreDailyBoosted] = useState(true);
  const [hasMoreGlobalPure, setHasMoreGlobalPure] = useState(true);
  const [hasMoreGlobalBoosted, setHasMoreGlobalBoosted] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

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

        // Load daily leaderboards (Pure and Boosted) - initial 20 entries
        const dailyPure = await getPuzzleLeaderboardPure(supabase, puzzle.id, 20, 0);
        const dailyBoosted = await getPuzzleLeaderboardBoosted(supabase, puzzle.id, 20, 0);
        console.log('[Leaderboard] Daily Pure entries:', dailyPure.length);
        console.log('[Leaderboard] Daily Boosted entries:', dailyBoosted.length);
        setDailyEntriesPure(dailyPure);
        setDailyEntriesBoosted(dailyBoosted);
        setHasMoreDailyPure(dailyPure.length === 20);
        setHasMoreDailyBoosted(dailyBoosted.length === 20);
        setDailyPureOffset(20);
        setDailyBoostedOffset(20);
      } else {
        console.warn('[Leaderboard] No puzzle found for today!');
      }

      // Load global leaderboards (Pure and Boosted) - initial 20 entries
      const globalPure = await getGlobalLeaderboardPure(supabase, 20, 0, globalMetric);
      const globalBoosted = await getGlobalLeaderboardBoosted(supabase, 20, 0, globalMetric);
      console.log('[Leaderboard] Global Pure entries:', globalPure.length);
      console.log('[Leaderboard] Global Boosted entries:', globalBoosted.length);
      setGlobalEntriesPure(globalPure);
      setGlobalEntriesBoosted(globalBoosted);
      setHasMoreGlobalPure(globalPure.length === 20);
      setHasMoreGlobalBoosted(globalBoosted.length === 20);
      setGlobalPureOffset(20);
      setGlobalBoostedOffset(20);

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

  // Load More functions
  const loadMoreDailyPure = async () => {
    if (!puzzleDate || loadingMore || !hasMoreDailyPure) return;
    setLoadingMore(true);
    try {
      const puzzle = await getTodaysPuzzle(supabase);
      if (puzzle) {
        const moreEntries = await getPuzzleLeaderboardPure(supabase, puzzle.id, 20, dailyPureOffset);
        setDailyEntriesPure(prev => [...prev, ...moreEntries]);
        setHasMoreDailyPure(moreEntries.length === 20);
        setDailyPureOffset(prev => prev + moreEntries.length);
      }
    } catch (error) {
      console.error('[Leaderboard] Error loading more daily pure:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const loadMoreDailyBoosted = async () => {
    if (!puzzleDate || loadingMore || !hasMoreDailyBoosted) return;
    setLoadingMore(true);
    try {
      const puzzle = await getTodaysPuzzle(supabase);
      if (puzzle) {
        const moreEntries = await getPuzzleLeaderboardBoosted(supabase, puzzle.id, 20, dailyBoostedOffset);
        setDailyEntriesBoosted(prev => [...prev, ...moreEntries]);
        setHasMoreDailyBoosted(moreEntries.length === 20);
        setDailyBoostedOffset(prev => prev + moreEntries.length);
      }
    } catch (error) {
      console.error('[Leaderboard] Error loading more daily boosted:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const loadMoreGlobalPure = async () => {
    if (loadingMore || !hasMoreGlobalPure) return;
    setLoadingMore(true);
    try {
      const moreEntries = await getGlobalLeaderboardPure(supabase, 20, globalPureOffset, globalMetric);
      setGlobalEntriesPure(prev => [...prev, ...moreEntries]);
      setHasMoreGlobalPure(moreEntries.length === 20);
      setGlobalPureOffset(prev => prev + moreEntries.length);
    } catch (error) {
      console.error('[Leaderboard] Error loading more global pure:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const loadMoreGlobalBoosted = async () => {
    if (loadingMore || !hasMoreGlobalBoosted) return;
    setLoadingMore(true);
    try {
      const moreEntries = await getGlobalLeaderboardBoosted(supabase, 20, globalBoostedOffset, globalMetric);
      setGlobalEntriesBoosted(prev => [...prev, ...moreEntries]);
      setHasMoreGlobalBoosted(moreEntries.length === 20);
      setGlobalBoostedOffset(prev => prev + moreEntries.length);
    } catch (error) {
      console.error('[Leaderboard] Error loading more global boosted:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle metric change for global leaderboards
  const handleGlobalMetricChange = async (metric: GlobalMetricType) => {
    setGlobalMetric(metric);
    setLoading(true);
    try {
      // Reload global leaderboards with new metric
      const globalPure = await getGlobalLeaderboardPure(supabase, 20, 0, metric);
      const globalBoosted = await getGlobalLeaderboardBoosted(supabase, 20, 0, metric);
      setGlobalEntriesPure(globalPure);
      setGlobalEntriesBoosted(globalBoosted);
      setHasMoreGlobalPure(globalPure.length === 20);
      setHasMoreGlobalBoosted(globalBoosted.length === 20);
      setGlobalPureOffset(20);
      setGlobalBoostedOffset(20);
    } catch (error) {
      console.error('[Leaderboard] Error changing metric:', error);
    } finally {
      setLoading(false);
    }
  };

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
                <div>
                  {/* Sub-tabs for Pure/Boosted */}
                  <RankingSubTabs
                    activeSubTab={activeSubTab}
                    onSubTabChange={setActiveSubTab}
                  />

                  {/* Pure Rankings Content */}
                  {activeSubTab === 'pure' && (
                    <div>
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
                      {!loading && hasMoreDailyPure && dailyEntriesPure.length > 0 && (
                        <div className="mt-4 text-center">
                          <button
                            onClick={loadMoreDailyPure}
                            disabled={loadingMore}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                          >
                            {loadingMore ? 'Loading...' : 'Load More'}
                          </button>
                        </div>
                      )}
                      {/* Pure explanation card */}
                      <div className="mt-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-300 mb-2">
                          Pure Rankings
                        </h3>
                        <p className="text-xs text-emerald-800 dark:text-emerald-400">
                          Your first play of each puzzle at standard speed (1.0x). Compete on equal footing!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Boosted Rankings Content */}
                  {activeSubTab === 'boosted' && (
                    <div>
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
                      {!loading && hasMoreDailyBoosted && dailyEntriesBoosted.length > 0 && (
                        <div className="mt-4 text-center">
                          <button
                            onClick={loadMoreDailyBoosted}
                            disabled={loadingMore}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                          >
                            {loadingMore ? 'Loading...' : 'Load More'}
                          </button>
                        </div>
                      )}
                      {/* Boosted explanation card */}
                      <div className="mt-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2">
                          Boosted Rankings
                        </h3>
                        <p className="text-xs text-purple-800 dark:text-purple-400">
                          Repeat plays and/or games using the speed slider. Perfect your score and experiment!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'global' && (
                <div>
                  {/* Sub-tabs for Pure/Boosted */}
                  <RankingSubTabs
                    activeSubTab={activeSubTab}
                    onSubTabChange={setActiveSubTab}
                  />

                  {/* Pure Rankings Content */}
                  {activeSubTab === 'pure' && (
                    <div>
                      <GlobalLeaderboardTable
                        entries={globalEntriesPure}
                        currentUserId={userId || undefined}
                        loading={loading}
                        onMetricChange={handleGlobalMetricChange}
                      />
                      {!loading && globalEntriesPure.length === 0 && (
                        <div className="mt-4 text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <p className="text-gray-600 dark:text-gray-400">
                            No Pure scores recorded yet
                          </p>
                        </div>
                      )}
                      {!loading && hasMoreGlobalPure && globalEntriesPure.length > 0 && (
                        <div className="mt-4 text-center">
                          <button
                            onClick={loadMoreGlobalPure}
                            disabled={loadingMore}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                          >
                            {loadingMore ? 'Loading...' : 'Load More'}
                          </button>
                        </div>
                      )}
                      {/* Pure explanation card */}
                      <div className="mt-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-300 mb-2">
                          Pure Rankings
                        </h3>
                        <p className="text-xs text-emerald-800 dark:text-emerald-400">
                          Rankings from Pure games only (first plays with no speed adjustments). Switch between average score and total stars earned.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Boosted Rankings Content */}
                  {activeSubTab === 'boosted' && (
                    <div>
                      <GlobalLeaderboardTable
                        entries={globalEntriesBoosted}
                        currentUserId={userId || undefined}
                        loading={loading}
                        onMetricChange={handleGlobalMetricChange}
                      />
                      {!loading && globalEntriesBoosted.length === 0 && (
                        <div className="mt-4 text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <p className="text-gray-600 dark:text-gray-400">
                            No Boosted scores recorded yet
                          </p>
                        </div>
                      )}
                      {!loading && hasMoreGlobalBoosted && globalEntriesBoosted.length > 0 && (
                        <div className="mt-4 text-center">
                          <button
                            onClick={loadMoreGlobalBoosted}
                            disabled={loadingMore}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                          >
                            {loadingMore ? 'Loading...' : 'Load More'}
                          </button>
                        </div>
                      )}
                      {/* Boosted explanation card */}
                      <div className="mt-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2">
                          Boosted Rankings
                        </h3>
                        <p className="text-xs text-purple-800 dark:text-purple-400">
                          Rankings from Boosted games (repeat plays and/or speed adjustments). Switch between average score and total stars earned.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">Loading leaderboard...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    }>
      <LeaderboardContent />
    </Suspense>
  );
}
