'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FinalResults from './FinalResults';
import AssemblyArea from './AssemblyArea';
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
    phase1Score: number;
    phase2Score: number;
    finalScore: number;
    bonusCorrect: boolean;
    stars: number | null;
  } | null>(null);

  useEffect(() => {
    async function loadResults() {
      if (!userId) {
        console.log('[ResultsViewer] Waiting for userId...');
        return; // Don't set error, just wait for userId
      }

      try {
        setLoading(true);
        setError(null);

        console.log('[ResultsViewer] Fetching puzzle for date:', puzzleDate);

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
        console.log('[ResultsViewer] Puzzle loaded:', puzzleData.puzzle.id);

        // Fetch score data
        const supabase = createClient();
        console.log('[ResultsViewer] Fetching score for puzzle:', puzzleData.puzzle.id, 'user:', userId.substring(0, 12));

        const score = await getUserPuzzleScore(supabase, userId, puzzleData.puzzle.id);

        if (!score) {
          console.error('[ResultsViewer] No score found - this should not happen from Recent Games');
          setError('Unable to load your score for this puzzle. Please try again.');
          setLoading(false);
          return;
        }

        console.log('[ResultsViewer] Score loaded:', score.score, 'stars:', score.stars);

        // Since we don't store phase1/phase2 breakdown, approximate it
        // Distribute the final score evenly between phases
        const approximatePhase1 = score.score / 2;
        const approximatePhase2 = score.score / 2;

        setScoreData({
          phase1Score: approximatePhase1,
          phase2Score: approximatePhase2,
          finalScore: score.score,
          bonusCorrect: score.bonus_correct,
          stars: score.stars,
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

  // Create word objects from the completed phrase for AssemblyArea
  const completedWords = puzzle.targetPhrase.words.map((word, index) => ({
    id: `completed-${index}`,
    word: word,
    belongsTo: 'target' as const,
    position: index,
    sourceIndex: index,
  }));

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Mystery Quote Section - 40% height, matching GameBoard layout */}
      <div className="h-[40%] border-b-2 border-gray-300 dark:border-gray-700 p-3 bg-blue-50 dark:bg-blue-950">
        <AssemblyArea
          id="target"
          title="Mystery Quote"
          placedWords={completedWords}
          expectedLength={puzzle.targetPhrase.words.length}
          expectedWords={puzzle.targetPhrase.words}
          bgColor="bg-blue-50 dark:bg-blue-950"
          borderColor="border-blue-300 dark:border-blue-700"
          isAutoAssembly={false}
          isComplete={true}
          completedText={puzzle.targetPhrase.text}
          phase={2}
          showCompletionAnimation={false}
          totalWordsSeen={0}
          totalUniqueWords={puzzle.targetPhrase.words.length + puzzle.facsimilePhrase.words.length}
          speed={1.0}
          showFinalResults={true}
          bonusAnswer={puzzle.bonusQuestion.options.find(opt => opt.id === puzzle.bonusQuestion.correctAnswerId)}
        />
      </div>

      {/* Final Results Section - 60% height, matching GameBoard layout */}
      <div className="h-[60%] bg-gray-100 dark:bg-gray-900">
        <FinalResults
          phase1Score={scoreData.phase1Score}
          phase2Score={scoreData.phase2Score}
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
    </div>
  );
}
