'use client';

import Link from 'next/link';

interface FinalResultsProps {
  phase1Score: number;
  phase2Score: number;
  finalScore: number;
  bonusCorrect: boolean | null;
  onPlayAgain: () => void;
  totalWordsSeen?: number;
  totalUniqueWords?: number;
  isArchiveMode?: boolean;
  reorderMoves?: number;
  hintsUsed?: number;
}

export default function FinalResults({
  phase1Score,
  phase2Score,
  finalScore,
  bonusCorrect,
  onPlayAgain,
  totalWordsSeen,
  totalUniqueWords,
  isArchiveMode = false,
  reorderMoves = 0,
  hintsUsed = 0,
}: FinalResultsProps) {
  return (
    <div className="h-full w-full flex flex-col overflow-y-auto">
      {/* Header - Match Mystery Quote header style */}
      <div className="flex items-center justify-center py-2 px-3 bg-gray-200 dark:bg-gray-800">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Final Results
        </h2>
      </div>

      {/* Scrollable Content - Compact for mobile */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="max-w-2xl mx-auto space-y-2">
          {/* Phase 1 Score - Compact */}
          <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Phase 1
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {phase1Score.toFixed(2)}
              </div>
            </div>
            {totalWordsSeen !== undefined && totalUniqueWords !== undefined && (
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
                {totalWordsSeen} / {totalUniqueWords} words
              </div>
            )}
          </div>

          {/* Phase 2 Score - Compact */}
          <div className="bg-purple-100 dark:bg-purple-900 rounded-lg p-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Phase 2
              </div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {phase2Score.toFixed(2)}
              </div>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
              {reorderMoves} moves, {hintsUsed} hints
            </div>
          </div>

          {/* Final Score - Compact */}
          <div className={`rounded-lg p-2 ${
            bonusCorrect
              ? 'bg-green-100 dark:bg-green-900'
              : 'bg-gray-200 dark:bg-gray-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Final Score
              </div>
              <div className={`text-3xl font-bold ${
                bonusCorrect
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                {finalScore.toFixed(2)}
              </div>
            </div>
            {bonusCorrect && (
              <div className="text-xs text-green-700 dark:text-green-300 mt-1 text-center font-semibold">
                ✓ 10% bonus applied
              </div>
            )}
          </div>

          {/* Buttons - Half-width side by side */}
          <div className="flex gap-2 mt-2">
            <Link
              href="/leaderboard"
              className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm text-center"
            >
              Leaderboard
            </Link>
            <button
              onClick={onPlayAgain}
              className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
