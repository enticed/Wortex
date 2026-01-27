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
  quoteWordCount?: number; // Number of words in target phrase
}

// Helper function to calculate Phase 1 stars
function calculatePhase1Stars(score: number): number {
  if (score <= 1.5) return 5;
  if (score <= 2.5) return 4;
  if (score <= 3.5) return 3;
  if (score <= 4.5) return 2;
  return 1;
}

// Helper function to calculate Phase 2 stars
function calculatePhase2Stars(score: number, quoteWordCount: number): number {
  // Calculate thresholds based on quote length
  // 5 stars: up to 1 move per word (0.25 points per move)
  const fiveStarMax = quoteWordCount * 0.25;
  // 4 stars: up to 1.5 moves per word (50% more than 5 stars)
  const fourStarMax = fiveStarMax * 1.5;
  // 3 stars: up to 2 moves per word (50% more than 4 stars)
  const threeStarMax = fourStarMax * 1.5;
  // 2 stars: up to 2.5 moves per word (50% more than 3 stars)
  const twoStarMax = threeStarMax * 1.5;

  if (score <= fiveStarMax) return 5;
  if (score <= fourStarMax) return 4;
  if (score <= threeStarMax) return 3;
  if (score <= twoStarMax) return 2;
  return 1;
}

// Star display component
function Stars({ count, size = 'sm', color = 'yellow' }: { count: number; size?: 'sm' | 'lg'; color?: 'yellow' | 'blue' | 'purple' | 'green' }) {
  // Use pixel values for precise control - matching score size
  const starSize = size === 'sm' ? 20 : 28;

  const filledColorClass =
    color === 'blue' ? 'text-blue-500 dark:text-blue-400' :
    color === 'purple' ? 'text-purple-500 dark:text-purple-400' :
    color === 'green' ? 'text-green-500 dark:text-green-400' :
    'text-yellow-500 dark:text-yellow-400';

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={star <= count ? filledColorClass : 'text-gray-400 dark:text-gray-600'}
          fill="currentColor"
          viewBox="0 0 20 20"
          width={starSize}
          height={starSize}
          style={{ width: `${starSize}px`, height: `${starSize}px` }}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
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
  quoteWordCount = 10, // Default to middle value
}: FinalResultsProps) {
  // Calculate star ratings
  const phase1Stars = calculatePhase1Stars(phase1Score);
  const phase2Stars = calculatePhase2Stars(phase2Score, quoteWordCount);
  const finalStars = Math.round((phase1Stars + phase2Stars) / 2);
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
            <div className="grid grid-cols-3 items-center gap-2">
              <div className="justify-self-start">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Phase 1
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 leading-tight" style={{ maxWidth: '60px' }}>
                  Word Collection
                </div>
              </div>
              <div className="justify-self-center">
                <Stars count={phase1Stars} size="sm" color="blue" />
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 justify-self-end">
                {phase1Score.toFixed(2)}
              </div>
            </div>
            {totalWordsSeen !== undefined && totalUniqueWords !== undefined && (
              <div className="text-xs text-gray-600 dark:text-gray-400 text-center mt-1">
                {totalWordsSeen} / {totalUniqueWords} words
              </div>
            )}
          </div>

          {/* Phase 2 Score - Compact */}
          <div className="bg-purple-100 dark:bg-purple-900 rounded-lg p-2">
            <div className="grid grid-cols-3 items-center gap-2">
              <div className="justify-self-start">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Phase 2
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 leading-tight" style={{ maxWidth: '60px' }}>
                  Word Arrangement
                </div>
              </div>
              <div className="justify-self-center">
                <Stars count={phase2Stars} size="sm" color="purple" />
              </div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 justify-self-end">
                {phase2Score.toFixed(2)}
              </div>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 text-center mt-1">
              {reorderMoves} moves, {hintsUsed} hints
            </div>
          </div>

          {/* Final Score - Compact */}
          <div className="rounded-lg p-2 bg-green-100 dark:bg-green-900">
            <div className="grid grid-cols-3 items-center gap-2">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 justify-self-start">
                Final Score
              </div>
              <div className="justify-self-center">
                <Stars count={finalStars} size="lg" color="green" />
              </div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 justify-self-end">
                {finalScore.toFixed(2)}
              </div>
            </div>
            <div className="text-xs text-green-700 dark:text-green-300 text-center font-semibold mt-1" style={{ minHeight: '16px' }}>
              {bonusCorrect && '✓ 10% bonus applied'}
            </div>
          </div>

          {/* Buttons - Half-width side by side */}
          <div className="flex gap-2 mt-2">
            <Link
              href="/stats"
              className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm text-center"
            >
              Compare to Your Previous Results...
            </Link>
            <Link
              href="/leaderboard"
              className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm text-center"
            >
              Compare to Today's Best Scores...
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
