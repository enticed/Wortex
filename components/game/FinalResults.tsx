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
    <div className="h-full flex items-center justify-center px-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">
          Final Results
        </h2>
        <div className="space-y-3 mb-4">
          <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-3">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Phase 1 Score
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {phase1Score.toFixed(2)}
            </div>
            {totalWordsSeen !== undefined && totalUniqueWords !== undefined && (
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 space-y-0.5">
                <div>Words seen: {totalWordsSeen}</div>
                <div>Total words: {totalUniqueWords}</div>
                <div className="pt-1 border-t border-gray-400 dark:border-gray-600 mt-1">
                  Score: Words seen ÷ Total words
                </div>
              </div>
            )}
          </div>
          <div className="bg-purple-100 dark:bg-purple-900 rounded-lg p-3">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Phase 2 Score (Moves + Hints)
            </div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {phase2Score.toFixed(2)}
            </div>
          </div>
          <div className={`rounded-lg p-3 ${
            bonusCorrect
              ? 'bg-green-100 dark:bg-green-900'
              : 'bg-gray-100 dark:bg-gray-800'
          }`}>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Final Score
            </div>
            <div className={`text-2xl font-bold ${
              bonusCorrect
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {finalScore.toFixed(2)}
            </div>
            {bonusCorrect && (
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                10% bonus reduction applied!
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onPlayAgain}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
        >
          {isArchiveMode ? 'Play Again' : 'Play Again Tomorrow'}
        </button>
      </div>
    </div>
  );
}
