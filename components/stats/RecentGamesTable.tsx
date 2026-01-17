'use client';

interface RecentGame {
  puzzle_id: string;
  puzzle_date: string;
  score: number;
  bonus_correct: boolean;
  time_taken_seconds: number;
  speed: number;
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
                key={game.puzzle_id}
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
                  <div className="text-right">
                    <span className="text-gray-600 dark:text-gray-400">
                      {game.speed.toFixed(2)}x
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
