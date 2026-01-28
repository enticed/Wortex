'use client';

interface RecentGame {
  id: string;
  puzzle_id: string;
  puzzle_date: string;
  score: number;
  bonus_correct: boolean;
  time_taken_seconds: number;
  speed: number;
  min_speed: number;
  max_speed: number;
  stars: number | null;
  created_at: string;
}

interface RecentGamesTableProps {
  games: RecentGame[];
  loading?: boolean;
}

export default function RecentGamesTable({ games, loading = false }: RecentGamesTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          No games played yet
        </p>
        <a
          href="/"
          className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Play Your First Game
        </a>
      </div>
    );
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
              Date
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
              Score
            </th>
            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
              Stars
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
              Speed
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
              Time
            </th>
            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
              Bonus
            </th>
          </tr>
        </thead>
        <tbody>
          {games.map((game) => {
            const gameDate = new Date(game.puzzle_date + 'T00:00:00');
            const isToday = gameDate.toDateString() === new Date().toDateString();

            return (
              <tr
                key={game.id}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {gameDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    {isToday && (
                      <span className="text-xs text-blue-600 dark:text-blue-400">
                        Today
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-right">
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {game.score.toFixed(2)}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-center gap-0.5">
                    {game.stars ? (
                      <>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={star <= game.stars! ? 'text-yellow-500 dark:text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            width={16}
                            height={16}
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-600">-</span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-right">
                    <span className="text-gray-600 dark:text-gray-400">
                      {game.min_speed === game.max_speed
                        ? `${game.min_speed.toFixed(2)}x`
                        : `${game.min_speed.toFixed(2)}-${game.max_speed.toFixed(2)}x`
                      }
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-right">
                    <span className="text-gray-600 dark:text-gray-400">
                      {formatTime(game.time_taken_seconds)}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-center">
                    {game.bonus_correct ? (
                      <span className="text-green-600 dark:text-green-400 text-xl">
                        ✓
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600 text-xl">
                        ✗
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
