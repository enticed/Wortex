'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import PuzzleCard from '@/components/archive/PuzzleCard';
import TierBadge from '@/components/admin/TierBadge';
import { createClient } from '@/lib/supabase/client';
import { useUserTier } from '@/lib/hooks/useUserTier';

interface PuzzleWithScore {
  id: string;
  date: string;
  facsimile_phrase: string; // Show AI hint phrase instead of target
  difficulty: number;
  hasPlayed: boolean;
  score?: number;
}

export default function ArchivePage() {
  const [puzzles, setPuzzles] = useState<PuzzleWithScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'played' | 'unplayed'>('all');
  const [authReady, setAuthReady] = useState(false);

  const router = useRouter();
  const supabase = createClient();
  const { isPremium, loading: tierLoading } = useUserTier();

  const loadPuzzles = useCallback(async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

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

      // If user is logged in, get their scores
      if (user) {
        const { data: scoresData } = await supabase
          .from('scores')
          .select('puzzle_id, score')
          .eq('user_id', user.id);

        const scoresMap = new Map<string, number>(
          scoresData?.map((s: any) => [s.puzzle_id, s.score]) || []
        );

        const puzzlesWithScores: PuzzleWithScore[] = puzzlesData.map((puzzle: any) => ({
          id: puzzle.id,
          date: puzzle.date,
          facsimile_phrase: puzzle.facsimile_phrase,
          difficulty: puzzle.difficulty,
          hasPlayed: scoresMap.has(puzzle.id),
          score: scoresMap.get(puzzle.id),
        }));

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
  }, [supabase]);

  // Wait for auth to be ready
  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      await supabase.auth.getSession();
      if (mounted) {
        setAuthReady(true);
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  // Load puzzles once auth is ready
  useEffect(() => {
    if (authReady && isPremium) {
      loadPuzzles();
    }
  }, [authReady, isPremium, loadPuzzles]);

  const filteredPuzzles = puzzles.filter(puzzle => {
    if (filter === 'played') return puzzle.hasPlayed;
    if (filter === 'unplayed') return !puzzle.hasPlayed;
    return true;
  });

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
                  onClick={() => alert('Stripe payment integration coming soon!')}
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

          {/* Premium Member Badge */}
          <div className="mb-6 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-amber-600 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <TierBadge tier="premium" size="sm" />
              <p className="text-sm text-gray-800 dark:text-gray-200">
                You have access to the full puzzle archive! Thank you for supporting Wortex.
              </p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-900 dark:text-yellow-300">
              <span className="font-semibold">Note:</span> Archive mode is for practice only.
              Scores from past puzzles don't count toward leaderboards or stats.
            </p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPuzzles.map((puzzle) => (
                  <PuzzleCard
                    key={puzzle.id}
                    date={puzzle.date}
                    difficulty={puzzle.difficulty}
                    facsimilePhrase={puzzle.facsimile_phrase}
                    hasPlayed={puzzle.hasPlayed}
                    score={puzzle.score}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
