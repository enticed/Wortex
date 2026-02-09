'use client';

import React, { useState } from 'react';
import TierBadge from '@/components/admin/TierBadge';
import ShareModal from '@/components/share/ShareModal';
import { generateLeaderboardShareText } from '@/lib/utils/shareText';
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
  puzzleDate?: string;
  rankingType?: 'pure' | 'boosted';
}

export default function LeaderboardTable({
  entries,
  currentUserId,
  loading = false,
  showSpeed = false,
  puzzleDate,
  rankingType = 'pure'
}: LeaderboardTableProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareText, setShareText] = useState('');

  const handleShare = (entry: LeaderboardEntryWithTier) => {
    if (!puzzleDate) return;

    const text = generateLeaderboardShareText({
      rank: entry.rank,
      score: entry.score,
      totalPlayers: entries.length,
      rankingType,
      puzzleDate,
    });

    setShareText(text);
    setShowShareModal(true);
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
    return null; // Let parent handle empty state messaging
  }

  // Group entries by stars (5 to 1)
  const groupedByStars = entries.reduce((groups, entry) => {
    const stars = ('stars' in entry && entry.stars) ? entry.stars : 0;
    if (!groups[stars]) {
      groups[stars] = [];
    }
    groups[stars].push(entry);
    return groups;
  }, {} as Record<number, LeaderboardEntryWithTier[]>);

  // Get star levels that have entries (sorted 5 to 1)
  const starLevels = Object.keys(groupedByStars)
    .map(Number)
    .sort((a, b) => b - a)
    .filter(stars => stars > 0); // Only show groups with stars

  return (
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
              Score
            </th>
            {showSpeed && (
              <th className="text-center py-2 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                Speed
              </th>
            )}
            {puzzleDate && (
              <th className="w-12"></th>
            )}
          </tr>
        </thead>
        <tbody>
          {starLevels.map((starLevel) => (
            <React.Fragment key={`star-group-${starLevel}`}>
              {/* Star group header */}
              <tr key={`star-header-${starLevel}`}>
                <td colSpan={showSpeed ? 4 : (puzzleDate ? 4 : 3)} className="py-3 px-4 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-500 text-lg">
                      {'⭐'.repeat(starLevel)}
                    </span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {starLevel} {starLevel === 1 ? 'Star' : 'Stars'}
                    </span>
                  </div>
                </td>
              </tr>

              {/* Entries for this star level */}
              {groupedByStars[starLevel].map((entry, index) => {
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
                <td className="py-2 px-4">
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
                      {entry.score.toFixed(2)}
                    </span>
                  </div>
                </td>
                {showSpeed && 'min_speed' in entry && 'max_speed' in entry && (
                  <td className="py-2 px-4">
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
                {puzzleDate && isCurrentUser && (
                  <td className="py-2 px-2">
                    <button
                      onClick={() => handleShare(entry)}
                      className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                      title="Share your ranking"
                      aria-label="Share your ranking"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </button>
                  </td>
                )}
                {puzzleDate && !isCurrentUser && (
                  <td className="py-2 px-2"></td>
                )}
              </tr>
            );
          })}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* Share Modal */}
      <ShareModal
        shareText={shareText}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
}
