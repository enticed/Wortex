'use client';

interface FinalResultsProps {
  phase1Score: number;
  phase2Score: number;
  finalScore: number;
  bonusCorrect: boolean | null;
  onPlayAgain: () => void;
  totalWordsSeen?: number;
  totalUniqueWords?: number;
  isArchiveMode?: boolean;
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
}: FinalResultsProps) {
  return (
    <div className="h-full w-full flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 dark:from-gray-800 dark:to-gray-900 py-3 px-4">
        <h2 className="text-xl font-bold text-white text-center">
          Final Results
        </h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {/* Phase 1 Score */}
          <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Phase 1 Score
              </div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {phase1Score.toFixed(2)}
              </div>
            </div>
            {totalWordsSeen !== undefined && totalUniqueWords !== undefined && (
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 pt-2 border-t border-blue-200 dark:border-blue-800">
                <div className="flex justify-between">
                  <span>Words seen:</span>
                  <span className="font-semibold">{totalWordsSeen}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total words:</span>
                  <span className="font-semibold">{totalUniqueWords}</span>
                </div>
                <div className="text-center pt-1 italic">
                  Score: Words seen ÷ Total words
                </div>
              </div>
            )}
          </div>

          {/* Phase 2 Score */}
          <div className="bg-purple-100 dark:bg-purple-900 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Phase 2 Score
              </div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {phase2Score.toFixed(2)}
              </div>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center italic">
              Moves + Hints
            </div>
          </div>

          {/* Final Score */}
          <div className={`rounded-lg p-4 ${
            bonusCorrect
              ? 'bg-green-100 dark:bg-green-900'
              : 'bg-gray-200 dark:bg-gray-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Final Score
              </div>
              <div className={`text-4xl font-bold ${
                bonusCorrect
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                {finalScore.toFixed(2)}
              </div>
            </div>
            {bonusCorrect && (
              <div className="text-xs text-green-700 dark:text-green-300 mt-2 text-center font-semibold">
                ✓ 10% bonus reduction applied!
              </div>
            )}
          </div>

          {/* Play Again Button */}
          <button
            onClick={onPlayAgain}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-base mt-4"
          >
            {isArchiveMode ? 'Play Again' : 'Play Again Tomorrow'}
          </button>
        </div>
      </div>
    </div>
  );
}
