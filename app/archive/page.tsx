'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import PuzzleCard from '@/components/archive/PuzzleCard';
import TierBadge from '@/components/admin/TierBadge';
import { createClient } from '@/lib/supabase/client';
import { useUserTier } from '@/lib/hooks/useUserTier';
import { useUser } from '@/lib/contexts/UserContext';

interface PuzzleWithScore {
  id: string;
  date: string;
  facsimile_phrase: string; // Show AI hint phrase instead of target
  difficulty: number;
  hasPlayed: boolean;
  score?: number;
  stars?: number;
  playedOnOriginalDate?: boolean; // True if played when it was the daily puzzle
}

export default function ArchivePage() {
  const [puzzles, setPuzzles] = useState<PuzzleWithScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'played' | 'unplayed'>('all');
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const router = useRouter();
  const supabase = createClient();
  const { isPremium, loading: tierLoading } = useUserTier();
  const { userId } = useUser();

  const loadPuzzles = useCallback(async () => {
    try {
      setLoading(true);

      // Get all approved puzzles (excluding today and future)
      const today = new Date().toISOString().split('T')[0];
      const { data: puzzlesData, error: puzzlesError } = await supabase
        .from('puzzles')
        .select('id, date, facsimile_phrase, difficulty')
        .eq('approved', true)
        .lt('date', today)
        .order('date', { ascending: false });

      if (puzzlesError) {
        console.error('Error fetching puzzles:', puzzlesError);
        setLoading(false);
        return;
      }

      if (!puzzlesData || puzzlesData.length === 0) {
        setPuzzles([]);
        setLoading(false);
        return;
      }

      // If user is logged in, get their best scores
      if (userId) {
        const { data: scoresData, error: scoresError } = await supabase
          .from('scores')
          .select('puzzle_id, score, stars, first_play_of_day')
          .eq('user_id', userId)
          .order('score', { ascending: true }); // Lower scores are better

        if (scoresError) {
          console.error('Error fetching scores:', scoresError);
        }

        // Get best score for each puzzle
        const scoresMap = new Map<string, { score: number; stars: number; playedOnOriginalDate: boolean }>();
        scoresData?.forEach((s: any) => {
          const existing = scoresMap.get(s.puzzle_id);
          // Keep the best (lowest) score
          if (!existing || s.score < existing.score) {
            scoresMap.set(s.puzzle_id, {
              score: s.score,
              stars: s.stars || 0,
              playedOnOriginalDate: s.first_play_of_day || false
            });
          }
        });

        const puzzlesWithScores: PuzzleWithScore[] = puzzlesData.map((puzzle: any) => {
          const scoreInfo = scoresMap.get(puzzle.id);
          return {
            id: puzzle.id,
            date: puzzle.date,
            facsimile_phrase: puzzle.facsimile_phrase,
            difficulty: puzzle.difficulty,
            hasPlayed: scoresMap.has(puzzle.id),
            score: scoreInfo?.score,
            stars: scoreInfo?.stars,
            playedOnOriginalDate: scoreInfo?.playedOnOriginalDate,
          };
        });

        setPuzzles(puzzlesWithScores);
      } else {
        // Anonymous user - no scores
        const puzzlesWithScores: PuzzleWithScore[] = puzzlesData.map((puzzle: any) => ({
          id: puzzle.id,
          date: puzzle.date,
          facsimile_phrase: puzzle.facsimile_phrase,
          difficulty: puzzle.difficulty,
          hasPlayed: false,
        }));

        setPuzzles(puzzlesWithScores);
      }

    } catch (error) {
      console.error('Error loading archive:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, userId]);

  // Load puzzles once user tier is loaded
  useEffect(() => {
    if (!tierLoading && isPremium && userId) {
      loadPuzzles();
    }
  }, [tierLoading, isPremium, userId, loadPuzzles]);

  const filteredPuzzles = puzzles.filter(puzzle => {
    if (filter === 'played') return puzzle.hasPlayed;
    if (filter === 'unplayed') return !puzzle.hasPlayed;
    return true;
  });

  // Group puzzles by month
  const puzzlesByMonth = filteredPuzzles.reduce((acc, puzzle) => {
    const date = new Date(puzzle.date + 'T00:00:00');
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

    if (!acc[monthKey]) {
      acc[monthKey] = {
        label: monthLabel,
        puzzles: []
      };
    }
    acc[monthKey].puzzles.push(puzzle);
    return acc;
  }, {} as Record<string, { label: string; puzzles: PuzzleWithScore[] }>);

  const monthKeys = Object.keys(puzzlesByMonth).sort((a, b) => b.localeCompare(a)); // Most recent first

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(monthKey)) {
        newSet.delete(monthKey);
      } else {
        newSet.add(monthKey);
      }
      return newSet;
    });
  };

  // Expand the most recent month by default
  useEffect(() => {
    if (monthKeys.length > 0 && expandedMonths.size === 0) {
      setExpandedMonths(new Set([monthKeys[0]]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKeys.length]);

  // Show loading state while checking tier
  if (tierLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="text-gray-500 dark:text-gray-400">Loading...</div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Show premium gate for free users
  if (!isPremium) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-20">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Puzzle Archive
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Play past puzzles and practice your skills
                </p>
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

            {/* Premium Gate */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-300 dark:border-amber-600 rounded-lg p-8 text-center">
              <div className="mb-4 flex justify-center">
                <TierBadge tier="premium" size="lg" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Premium Feature
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-md mx-auto">
                Access to the puzzle archive is exclusively available to Premium and Admin members.
                Upgrade your account to unlock hundreds of past puzzles!
              </p>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Premium Benefits
                </h3>
                <ul className="text-left text-gray-700 dark:text-gray-300 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                    <span>Access to full puzzle archive</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                    <span>Ad-free experience</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                    <span>Premium badge on leaderboards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                    <span>Support continued development</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => router.push('/subscribe')}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                >
                  Upgrade to Premium - $1/month
                </button>
                <button
                  onClick={() => router.back()}
                  className="px-6 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Go Back
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
                Only $1/month or $10/year
              </p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Puzzle Archive
                </h1>
                <TierBadge tier="premium" size="sm" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Play past puzzles and practice your skills. Scores don't count toward leaderboards or stats.
              </p>
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

          {/* Filters */}
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              All Puzzles
            </button>
            <button
              onClick={() => setFilter('played')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'played'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('unplayed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'unplayed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Not Played
            </button>
          </div>

          {/* Puzzle Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : filteredPuzzles.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                {filter === 'all' && 'No past puzzles available yet'}
                {filter === 'played' && 'You haven\'t completed any puzzles yet'}
                {filter === 'unplayed' && 'You\'ve played all available puzzles!'}
              </p>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View all puzzles
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredPuzzles.length} {filteredPuzzles.length === 1 ? 'puzzle' : 'puzzles'}
              </div>
              <div className="space-y-4">
                {monthKeys.map((monthKey) => {
                  const monthData = puzzlesByMonth[monthKey];
                  const isExpanded = expandedMonths.has(monthKey);

                  return (
                    <div key={monthKey} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                      {/* Month Header - Clickable */}
                      <button
                        onClick={() => toggleMonth(monthKey)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <svg
                            className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${
                              isExpanded ? 'rotate-90' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {monthData.label}
                          </h2>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {monthData.puzzles.length} {monthData.puzzles.length === 1 ? 'puzzle' : 'puzzles'}
                        </span>
                      </button>

                      {/* Month Content - Collapsible */}
                      {isExpanded && (
                        <div className="p-4 pt-0 border-t border-gray-200 dark:border-gray-700">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            {monthData.puzzles.map((puzzle) => (
                              <PuzzleCard
                                key={puzzle.id}
                                date={puzzle.date}
                                difficulty={puzzle.difficulty}
                                facsimilePhrase={puzzle.facsimile_phrase}
                                hasPlayed={puzzle.hasPlayed}
                                score={puzzle.score}
                                stars={puzzle.stars}
                                playedOnOriginalDate={puzzle.playedOnOriginalDate}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
