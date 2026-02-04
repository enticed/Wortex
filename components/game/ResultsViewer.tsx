'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FinalResults from './FinalResults';
import { createClient } from '@/lib/supabase/client';
import { getUserPuzzleScore } from '@/lib/supabase/scores';
import { useUser } from '@/lib/contexts/UserContext';
import type { Puzzle } from '@/types/game';

interface ResultsViewerProps {
  puzzleDate: string;
}

export default function ResultsViewer({ puzzleDate }: ResultsViewerProps) {
  const { userId } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [scoreData, setScoreData] = useState<{
    finalScore: number;
    bonusCorrect: boolean;
  } | null>(null);

  useEffect(() => {
    async function loadResults() {
      if (!userId) {
        setError('Please sign in to view your results');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch puzzle data
        const timezone = typeof window !== 'undefined'
          ? Intl.DateTimeFormat().resolvedOptions().timeZone
          : 'America/Los_Angeles';

        const puzzleResponse = await fetch(
          `/api/puzzle/daily?timezone=${encodeURIComponent(timezone)}&date=${puzzleDate}`
        );

        if (!puzzleResponse.ok) {
          throw new Error('Failed to load puzzle');
        }

        const puzzleData = await puzzleResponse.json();
        if (!puzzleData.puzzle) {
          throw new Error('Puzzle not found');
        }

        setPuzzle(puzzleData.puzzle);

        // Fetch score data
        const supabase = createClient();
        const score = await getUserPuzzleScore(supabase, userId, puzzleData.puzzle.id);

        if (!score) {
          setError('No score found for this puzzle. You may not have played it yet.');
          setLoading(false);
          return;
        }

        setScoreData({
          finalScore: score.score,
          bonusCorrect: score.bonus_correct,
        });

      } catch (err) {
        console.error('[ResultsViewer] Error loading results:', err);
        setError(err instanceof Error ? err.message : 'Failed to load results');
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, [userId, puzzleDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error || !puzzle || !scoreData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md p-8">
          <div className="text-red-500 dark:text-red-400 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Unable to Load Results
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'Something went wrong'}
          </p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <FinalResults
        phase1Score={scoreData.finalScore}
        phase2Score={0}
        finalScore={scoreData.finalScore}
        bonusCorrect={scoreData.bonusCorrect}
        onPlayAgain={() => {
          router.push(`/play?date=${puzzleDate}&archive=true`);
        }}
        totalWordsSeen={0}
        totalUniqueWords={puzzle.targetPhrase.words.length + puzzle.facsimilePhrase.words.length}
        isArchiveMode={true}
        reorderMoves={0}
        hintsUsed={0}
        quoteWordCount={puzzle.targetPhrase.words.length}
        puzzleDate={puzzle.date}
        facsimilePhrase={puzzle.facsimilePhrase.text}
      />
    </div>
  );
}
