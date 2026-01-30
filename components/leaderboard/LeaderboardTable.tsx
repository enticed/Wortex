'use client';

import { useEffect, useState } from 'react';
import TierBadge from '@/components/admin/TierBadge';
import type { Database } from '@/types/database';

type LeaderboardRow = Database['public']['Views']['leaderboards']['Row'];
type LeaderboardPureRow = Database['public']['Views']['leaderboards_pure']['Row'];
type LeaderboardBoostedRow = Database['public']['Views']['leaderboards_boosted']['Row'];

// Extended types with user_tier
export type LeaderboardEntryWithTier = (LeaderboardRow | LeaderboardPureRow | LeaderboardBoostedRow) & {
  user_tier?: 'free' | 'premium' | 'admin';
};

interface LeaderboardTableProps {
  entries: LeaderboardEntryWithTier[];
  currentUserId?: string;
  loading?: boolean;
  showSpeed?: boolean;
}

export default function LeaderboardTable({
  entries,
  currentUserId,
  loading = false,
  showSpeed = false
}: LeaderboardTableProps) {
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
    return null; // Let parent handle empty state messaging
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
              Rank
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
              Player
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
              Score
            </th>
            {showSpeed && (
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                Speed
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => {
            const isCurrentUser = entry.user_id === currentUserId;
            const isTopThree = entry.rank <= 3;

            return (
              <tr
                key={entry.user_id}
                className={`
                  border-b border-gray-100 dark:border-gray-800
                  hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
                  ${isCurrentUser ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                `}
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    {isTopThree ? (
                      <span className="text-2xl">
                        {entry.rank === 1 && '🥇'}
                        {entry.rank === 2 && '🥈'}
                        {entry.rank === 3 && '🥉'}
                      </span>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[2ch] text-center">
                        {entry.rank}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4">
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
                <td className="py-4 px-4">
                  <div className="text-right">
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {entry.score.toFixed(2)}
                    </span>
                  </div>
                </td>
                {showSpeed && 'min_speed' in entry && 'max_speed' in entry && (
                  <td className="py-4 px-4">
                    <div className="text-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {entry.min_speed === entry.max_speed
                          ? `${entry.min_speed.toFixed(2)}x`
                          : `${entry.min_speed.toFixed(2)}-${entry.max_speed.toFixed(2)}x`
                        }
                      </span>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
