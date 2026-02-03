'use client';

import Link from 'next/link';

interface PuzzleCardProps {
  date: string;
  difficulty: number;
  facsimilePhrase: string; // Show AI hint phrase instead of target answer
  hasPlayed: boolean;
  score?: number;
  stars?: number;
  playedOnOriginalDate?: boolean; // True if played when it was the daily puzzle
}

// Star display component
function Stars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={star <= count ? 'text-yellow-500 dark:text-yellow-400' : 'text-gray-400 dark:text-gray-600'}
          fill="currentColor"
          viewBox="0 0 20 20"
          width={14}
          height={14}
          style={{ width: '14px', height: '14px' }}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function PuzzleCard({
  date,
  difficulty,
  facsimilePhrase,
  hasPlayed,
  score,
  stars,
  playedOnOriginalDate = false
}: PuzzleCardProps) {
  const puzzleDate = new Date(date + 'T00:00:00');
  const isToday = puzzleDate.toDateString() === new Date().toDateString();

  // Truncate long phrases adaptively for mobile
  // Target ~50 chars which typically fits one line on mobile
  const displayPhrase = facsimilePhrase.length > 50
    ? facsimilePhrase.substring(0, 50) + '...'
    : facsimilePhrase;

  const difficultyColors = [
    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  ];

  const difficultyLabels = ['Easy', 'Medium', 'Hard', 'Very Hard', 'Expert'];

  return (
    <Link
      href={`/play?date=${date}&archive=true`}
      className="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div className="p-3">
        {/* Header - More compact */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {puzzleDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </h3>
            {isToday && (
              <span className="inline-block mt-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                Today's Puzzle
              </span>
            )}
          </div>
          <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColors[difficulty - 1] || difficultyColors[2]}`}>
            {difficultyLabels[difficulty - 1] || 'Medium'}
          </div>
        </div>

        {/* Hint Phrase Preview (AI-generated facsimile) - More compact */}
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 italic line-clamp-1">
          "{displayPhrase}"
        </p>

        {/* Status - More compact */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          {hasPlayed ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-sm font-medium ${
                playedOnOriginalDate
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}>
                ✓ {playedOnOriginalDate ? 'Completed' : 'Played'}
              </span>
              {score !== undefined && (
                <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                  {score.toFixed(2)}
                </span>
              )}
              {stars !== undefined && stars > 0 && (
                <Stars count={stars} />
              )}
            </div>
          ) : (
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              Not played yet
            </span>
          )}
          <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
            Play →
          </span>
        </div>
      </div>
    </Link>
  );
}
