'use client';

import Link from 'next/link';

interface PuzzleCardProps {
  date: string;
  difficulty: number;
  targetPhrase: string;
  hasPlayed: boolean;
  score?: number;
}

export default function PuzzleCard({
  date,
  difficulty,
  targetPhrase,
  hasPlayed,
  score
}: PuzzleCardProps) {
  const puzzleDate = new Date(date + 'T00:00:00');
  const isToday = puzzleDate.toDateString() === new Date().toDateString();

  // Truncate long phrases for display
  const displayPhrase = targetPhrase.length > 60
    ? targetPhrase.substring(0, 60) + '...'
    : targetPhrase;

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
      href={`/?date=${date}&archive=true`}
      className="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
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
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${difficultyColors[difficulty - 1] || difficultyColors[2]}`}>
            {difficultyLabels[difficulty - 1] || 'Medium'}
          </div>
        </div>

        {/* Phrase Preview */}
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 italic">
          "{displayPhrase}"
        </p>

        {/* Status */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          {hasPlayed ? (
            <div className="flex items-center gap-2">
              <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                ✓ Completed
              </span>
              {score !== undefined && (
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  Score: {score.toFixed(2)}
                </span>
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
