'use client';

interface StarsHistogramProps {
  title: string;
  starCounts: { [key: number]: number }; // Maps star rating (0-5) to count
  color?: 'emerald' | 'purple';
  loading?: boolean;
  todayStars?: number | null; // Today's star rating to highlight
}

export default function StarsHistogram({
  title,
  starCounts,
  color = 'emerald',
  loading = false,
  todayStars = null
}: StarsHistogramProps) {
  // Calculate total games and max count for scaling
  const totalGames = Object.values(starCounts).reduce((sum, count) => sum + count, 0);
  const maxCount = Math.max(...Object.values(starCounts), 1); // Avoid division by zero

  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-500 dark:bg-emerald-600',
      text: 'text-emerald-700 dark:text-emerald-400',
      bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800'
    },
    purple: {
      bg: 'bg-purple-500 dark:bg-purple-600',
      text: 'text-purple-700 dark:text-purple-400',
      bgLight: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800'
    }
  };

  const colors = colorClasses[color];

  if (loading) {
    return (
      <div className={`${colors.bgLight} ${colors.border} border rounded-lg p-4`}>
        <h3 className={`text-sm font-semibold ${colors.text} mb-3`}>{title}</h3>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (totalGames === 0) {
    return (
      <div className={`${colors.bgLight} ${colors.border} border rounded-lg p-4`}>
        <h3 className={`text-sm font-semibold ${colors.text} mb-3`}>{title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-8">
          No games in this category yet
        </p>
      </div>
    );
  }

  return (
    <div className={`${colors.bgLight} ${colors.border} border rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-sm font-semibold ${colors.text}`}>{title}</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {totalGames} {totalGames === 1 ? 'game' : 'games'}
        </span>
      </div>

      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = starCounts[stars] || 0;
          const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const displayPercentage = totalGames > 0 ? ((count / totalGames) * 100).toFixed(0) : 0;
          const isToday = todayStars !== null && todayStars === stars;

          return (
            <div key={stars} className="flex items-center gap-2">
              {/* Star label */}
              <div className="flex items-center justify-end w-16 gap-0.5">
                <span className={`text-xs font-medium ${isToday ? 'font-bold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                  {stars}
                </span>
                <svg
                  className={isToday ? 'text-yellow-400 dark:text-yellow-300' : 'text-yellow-500 dark:text-yellow-400'}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  width={14}
                  height={14}
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>

              {/* Bar */}
              <div className={`flex-1 h-6 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden ${isToday ? 'ring-2 ring-offset-1 ring-blue-500 dark:ring-blue-400' : ''}`}>
                <div
                  className={`h-full ${colors.bg} transition-all duration-300 flex items-center justify-end pr-2 ${isToday ? 'brightness-110' : ''}`}
                  style={{ width: `${percentage}%` }}
                >
                  {count > 0 && (
                    <span className="text-xs font-medium text-white">
                      {count}
                    </span>
                  )}
                </div>
              </div>

              {/* Percentage */}
              <div className="w-10 text-right">
                <span className={`text-xs ${isToday ? 'font-bold text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                  {displayPercentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
