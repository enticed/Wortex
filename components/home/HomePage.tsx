'use client';

import { useUser } from '@/lib/contexts/UserContext';
import AppLayout from '@/components/layout/AppLayout';
import TutorialPrompt from '@/components/tutorial/TutorialPrompt';
import Link from 'next/link';
import { useEffect, useState } from 'react';

function getStreakEmoji(streak: number): string {
  if (streak >= 365) return '🏆';
  if (streak >= 180) return '💎';
  if (streak >= 90) return '🔥';
  if (streak >= 30) return '⚡';
  if (streak >= 7) return '✨';
  if (streak >= 3) return '🌟';
  return '⭐';
}

function getStreakMessage(streak: number): string {
  if (streak >= 365) return 'Legendary Champion!';
  if (streak >= 180) return 'Diamond Player!';
  if (streak >= 90) return 'On Fire!';
  if (streak >= 30) return 'Power Player!';
  if (streak >= 7) return 'Week Warrior!';
  if (streak >= 3) return 'Building Momentum!';
  if (streak >= 1) return 'Keep Going!';
  return 'Start Your Streak Today!';
}

export default function HomePage() {
  const { userData, stats, loading } = useUser();
  const [currentDate, setCurrentDate] = useState('');

  // Note: Tutorial is now triggered only when user clicks "Yes" on the tutorial prompt
  // which navigates to /tutorial page where the tutorial actually starts

  useEffect(() => {
    // Function to update the date
    const updateDate = () => {
      const today = new Date();
      const formatted = today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      setCurrentDate(formatted);
    };

    // Set initial date
    updateDate();

    // Calculate milliseconds until midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0); // Set to midnight
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    // Set timeout to update at midnight
    const midnightTimeout = setTimeout(() => {
      updateDate();

      // After first midnight update, check every hour for date changes
      // (in case user's device was asleep at midnight)
      const hourlyInterval = setInterval(updateDate, 60 * 60 * 1000); // Every hour

      return () => clearInterval(hourlyInterval);
    }, msUntilMidnight);

    // Cleanup timeout on unmount
    return () => clearTimeout(midnightTimeout);
  }, []);

  return (
    <AppLayout>
      {/* Tutorial Prompt Modal - shown to first-time visitors */}
      <TutorialPrompt />

      <div id="app-container" className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-950 dark:to-indigo-950 flex items-center justify-center p-3">
      <div className="max-w-2xl w-full space-y-4">
        {/* Hero Section - Compact */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {currentDate || 'Daily Word Puzzle Challenge'}
          </p>
        </div>

        {/* User Stats Card - Compact */}
        {!loading && userData && stats && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 space-y-3">
            {/* Welcome Message */}
            <div className="text-center">
              <p className="text-base font-semibold text-gray-800 dark:text-gray-100">
                Welcome back{userData.username ? `, ${userData.username}` : ''}!
              </p>
            </div>

            {/* Streak Highlight */}
            {stats.current_streak > 0 && (
              <div className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-lg p-3 text-center border-2 border-orange-300 dark:border-orange-700">
                <div className="text-3xl mb-1">
                  {getStreakEmoji(stats.current_streak)}
                </div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-0.5">
                  {stats.current_streak}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 mb-0.5">
                  Day Streak
                </div>
                <div className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                  {getStreakMessage(stats.current_streak)}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2 text-center">
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.total_games}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  Total Games
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-2 text-center">
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.average_score?.toFixed(2) || '0.00'}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  Avg Score
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Anonymous User Message - Compact */}
        {!loading && (!userData || userData.isAnonymous) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 text-center space-y-2">
            <div className="text-3xl">👋</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create an account to track your progress, build streaks, and compete on the leaderboard!
            </p>
          </div>
        )}

        {/* Play Button - Compact */}
        <div className="text-center">
          <Link
            id="play-button"
            href="/pre-game"
            className="inline-block px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-lg font-bold rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95"
          >
            Play Today&apos;s Puzzle
          </Link>
        </div>

        {/* Quick Links - Compact */}
        <div className="flex justify-center gap-3 text-xs">
          <Link
            href="/how-to-play"
            className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            How to Play
          </Link>
          <span className="text-gray-400 dark:text-gray-600">•</span>
          <Link
            href="/privacy-policy"
            className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            Privacy Policy
          </Link>
          <span className="text-gray-400 dark:text-gray-600">•</span>
          <Link
            href="/terms-of-service"
            className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            Terms of Service
          </Link>
        </div>

        {/* Announcements Section (Optional - for future use) */}
        {/* You can add announcements here later */}
      </div>
    </div>
    </AppLayout>
  );
}
