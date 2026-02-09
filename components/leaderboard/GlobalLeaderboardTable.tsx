'use client';

import { useState } from 'react';
import TierBadge from '@/components/admin/TierBadge';

export interface GlobalLeaderboardEntry {
  user_id: string;
  display_name: string | null;
  average_score: number;
  total_games: number;
  total_stars: number;
  user_tier?: 'free' | 'premium' | 'admin';
}

interface GlobalLeaderboardTableProps {
  entries: GlobalLeaderboardEntry[];
  currentUserId?: string;
  loading?: boolean;
  onMetricChange?: (metric: 'average_score' | 'total_stars') => void;
}

export default function GlobalLeaderboardTable({
  entries,
  currentUserId,
  loading = false,
  onMetricChange
}: GlobalLeaderboardTableProps) {
  const [sortMetric, setSortMetric] = useState<'average_score' | 'total_stars'>('average_score');

  const handleMetricChange = (metric: 'average_score' | 'total_stars') => {
    setSortMetric(metric);
    if (onMetricChange) {
      onMetricChange(metric);
    }
  };

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

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          No scores yet. Be the first to play!
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Metric Toggle */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
          <button
            onClick={() => handleMetricChange('average_score')}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${sortMetric === 'average_score'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
              }
            `}
          >
            Avg Score
          </button>
          <button
            onClick={() => handleMetricChange('total_stars')}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${sortMetric === 'total_stars'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
              }
            `}
          >
            Total Stars
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
              Rank
            </th>
            <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
              Player
            </th>
            <th className="text-right py-2 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
              {sortMetric === 'average_score' ? 'Avg Score' : 'Total Stars'}
            </th>
            <th className="text-right py-2 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
              Games
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => {
            const isCurrentUser = entry.user_id === currentUserId;
            const rank = index + 1;
            const isTopThree = rank <= 3;

            return (
              <tr
                key={entry.user_id}
                className={`
                  border-b border-gray-100 dark:border-gray-800
                  hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
                  ${isCurrentUser ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                `}
              >
                <td className="py-2 px-4">
                  <div className="flex items-center gap-2">
                    {isTopThree ? (
                      <span className="text-2xl">
                        {rank === 1 && '🥇'}
                        {rank === 2 && '🥈'}
                        {rank === 3 && '🥉'}
                      </span>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[2ch] text-center">
                        {rank}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2 px-4">
                  <div className="flex items-center gap-2">
                    <span className={`
                      font-medium
                      ${isCurrentUser
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-900 dark:text-gray-100'
                      }
                    `}>
                      {entry.display_name || 'Anonymous Player'}
                    </span>
                    {entry.user_tier && (entry.user_tier === 'premium' || entry.user_tier === 'admin') && (
                      <TierBadge tier={entry.user_tier} size="sm" showLabel={false} />
                    )}
                    {isCurrentUser && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2 px-4">
                  <div className="text-right">
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {sortMetric === 'average_score'
                        ? entry.average_score.toFixed(2)
                        : entry.total_stars
                      }
                    </span>
                  </div>
                </td>
                <td className="py-2 px-4">
                  <div className="text-right">
                    <span className="text-gray-600 dark:text-gray-400">
                      {entry.total_games}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}
