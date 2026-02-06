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
  target_phrase: string; // Mystery quote (for search purposes)
  difficulty: number;
  hasPlayed: boolean;
  score?: number;
  stars?: number;
  playedOnOriginalDate?: boolean; // True if played when it was the daily puzzle
  theme?: string;
  metadata?: {
    tags?: string[];
    source?: string;
    theme?: string;
  };
}

export default function ArchivePage() {
  const [puzzles, setPuzzles] = useState<PuzzleWithScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'played' | 'unplayed'>('all');
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulties, setSelectedDifficulties] = useState<Set<number>>(new Set());
  const [difficultyDropdownOpen, setDifficultyDropdownOpen] = useState(false);

  // Difficulty mapping
  const difficultyLabels: Record<number, string> = {
    1: 'Easy',
    2: 'Medium',
    3: 'Hard',
    4: 'Very Hard',
    5: 'Expert',
  };

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
        .select('id, date, facsimile_phrase, target_phrase, difficulty, theme, metadata')
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
        // IMPORTANT: Prioritize original-day plays (first_play_of_day: true) over replays
        const scoresMap = new Map<string, { score: number; stars: number; playedOnOriginalDate: boolean }>();
        scoresData?.forEach((s: any) => {
          const existing = scoresMap.get(s.puzzle_id);
          const isOriginalDay = s.first_play_of_day || false;

          if (!existing) {
            // First score entry for this puzzle
            scoresMap.set(s.puzzle_id, {
              score: s.score,
              stars: s.stars || 0,
              playedOnOriginalDate: isOriginalDay
            });
          } else if (existing.playedOnOriginalDate) {
            // Already have an original-day score - keep it, don't replace with replays
            // This ensures "Completed" status is never replaced by "Played"
          } else if (isOriginalDay) {
            // Found an original-day score - prioritize it over any replay
            scoresMap.set(s.puzzle_id, {
              score: s.score,
              stars: s.stars || 0,
              playedOnOriginalDate: true
            });
          } else if (s.score < existing.score) {
            // Both are replays - keep the better score
            scoresMap.set(s.puzzle_id, {
              score: s.score,
              stars: s.stars || 0,
              playedOnOriginalDate: false
            });
          }
        });

        const puzzlesWithScores: PuzzleWithScore[] = puzzlesData.map((puzzle: any) => {
          const scoreInfo = scoresMap.get(puzzle.id);
          return {
            id: puzzle.id,
            date: puzzle.date,
            facsimile_phrase: puzzle.facsimile_phrase,
            target_phrase: puzzle.target_phrase,
            difficulty: puzzle.difficulty,
            hasPlayed: scoresMap.has(puzzle.id),
            score: scoreInfo?.score,
            stars: scoreInfo?.stars,
            playedOnOriginalDate: scoreInfo?.playedOnOriginalDate,
            theme: puzzle.theme,
            metadata: puzzle.metadata,
          };
        });

        setPuzzles(puzzlesWithScores);
      } else {
        // Anonymous user - no scores
        const puzzlesWithScores: PuzzleWithScore[] = puzzlesData.map((puzzle: any) => ({
          id: puzzle.id,
          date: puzzle.date,
          facsimile_phrase: puzzle.facsimile_phrase,
          target_phrase: puzzle.target_phrase,
          difficulty: puzzle.difficulty,
          hasPlayed: false,
          theme: puzzle.theme,
          metadata: puzzle.metadata,
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
    // Filter by played/unplayed status
    if (filter === 'played' && !puzzle.hasPlayed) return false;
    if (filter === 'unplayed' && puzzle.hasPlayed) return false;

    // Filter by difficulty
    if (selectedDifficulties.size > 0 && !selectedDifficulties.has(puzzle.difficulty)) {
      return false;
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const mysteryQuoteMatch = puzzle.target_phrase.toLowerCase().includes(query);
      const hintPhraseMatch = puzzle.facsimile_phrase.toLowerCase().includes(query);
      const themeMatch = puzzle.theme?.toLowerCase().includes(query) || puzzle.metadata?.theme?.toLowerCase().includes(query);
      const sourceMatch = puzzle.metadata?.source?.toLowerCase().includes(query);
      const tagsMatch = puzzle.metadata?.tags?.some(tag => tag.toLowerCase().includes(query));

      if (!mysteryQuoteMatch && !hintPhraseMatch && !themeMatch && !sourceMatch && !tagsMatch) {
        return false;
      }
    }

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

  const toggleDifficulty = (difficulty: number) => {
    setSelectedDifficulties(prev => {
      const newSet = new Set(prev);
      if (newSet.has(difficulty)) {
        newSet.delete(difficulty);
      } else {
        newSet.add(difficulty);
      }
      return newSet;
    });
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedDifficulties(new Set());
    setFilter('all');
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedDifficulties.size > 0 || filter !== 'all';

  // Expand the most recent month by default
  useEffect(() => {
    if (monthKeys.length > 0 && expandedMonths.size === 0) {
      setExpandedMonths(new Set([monthKeys[0]]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKeys.length]);

  // Close difficulty dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        setDifficultyDropdownOpen(false);
      }
    };

    if (difficultyDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [difficultyDropdownOpen]);

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

          {/* Search and Filters */}
          <div className="mb-4 space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by quote, theme, tags, or source..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-2 items-center">
              {/* Status Filters */}
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('played')}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  filter === 'played'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setFilter('unplayed')}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  filter === 'unplayed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Not Played
              </button>

              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

              {/* Difficulty Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDifficultyDropdownOpen(!difficultyDropdownOpen)}
                  className="px-3 py-1.5 text-sm rounded-lg font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  Difficulty
                  {selectedDifficulties.size > 0 && (
                    <span className="px-1.5 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                      {selectedDifficulties.size}
                    </span>
                  )}
                  <svg
                    className={`w-4 h-4 transition-transform ${difficultyDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {difficultyDropdownOpen && (
                  <div className="absolute top-full mt-1 left-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-[140px]">
                    {[1, 2, 3, 4, 5].map((diff) => (
                      <button
                        key={diff}
                        onClick={() => {
                          toggleDifficulty(diff);
                        }}
                        className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                      >
                        <span className={selectedDifficulties.has(diff) ? 'font-semibold' : ''}>
                          {difficultyLabels[diff]}
                        </span>
                        {selectedDifficulties.has(diff) && (
                          <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <>
                  <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />
                  <button
                    onClick={clearAllFilters}
                    className="px-3 py-1.5 text-sm rounded-lg font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  >
                    Clear All
                  </button>
                </>
              )}
            </div>
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
