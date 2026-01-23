'use client';

import { useUser } from '@/lib/contexts/UserContext';
import AppLayout from '@/components/layout/AppLayout';
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
  const { user, stats, loading } = useUser();
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    // Format date on client side to avoid hydration mismatch
    const today = new Date();
    const formatted = today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    setCurrentDate(formatted);
  }, []);

  return (
    <AppLayout>
      <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-950 dark:to-indigo-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
            Wortex
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            {currentDate || 'Daily Word Puzzle Challenge'}
          </p>
        </div>

        {/* User Stats Card */}
        {!loading && user && stats && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-6">
            {/* Welcome Message */}
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                Welcome back{user.display_name ? `, ${user.display_name}` : ''}!
              </p>
            </div>

            {/* Streak Highlight */}
            {stats.current_streak > 0 && (
              <div className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-xl p-6 text-center border-2 border-orange-300 dark:border-orange-700">
                <div className="text-6xl mb-2">
                  {getStreakEmoji(stats.current_streak)}
                </div>
                <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                  {stats.current_streak}
                </div>
                <div className="text-lg text-gray-700 dark:text-gray-300 mb-1">
                  Day Streak
                </div>
                <div className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                  {getStreakMessage(stats.current_streak)}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.total_games}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Total Games
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.average_score?.toFixed(2) || '0.00'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Avg Score
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Anonymous User Message */}
        {!loading && (!user || user.is_anonymous) && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 text-center space-y-4">
            <div className="text-5xl">👋</div>
            <p className="text-xl text-gray-700 dark:text-gray-300">
              Welcome to Wortex!
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create an account to track your progress, build streaks, and compete on the leaderboard!
            </p>
          </div>
        )}

        {/* Play Button */}
        <div className="text-center">
          <Link
            href="/play"
            className="inline-block px-12 py-5 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-2xl font-bold rounded-2xl shadow-2xl transform transition-all duration-200 hover:scale-105 active:scale-95"
          >
            Play Today&apos;s Puzzle
          </Link>
        </div>

        {/* Quick Links */}
        <div className="flex justify-center gap-4 text-sm">
          <Link
            href="/how-to-play"
            className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            How to Play
          </Link>
          <span className="text-gray-400 dark:text-gray-600">•</span>
          <Link
            href="/stats"
            className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            Your Stats
          </Link>
          <span className="text-gray-400 dark:text-gray-600">•</span>
          <Link
            href="/leaderboard"
            className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            Leaderboard
          </Link>
        </div>

        {/* Announcements Section (Optional - for future use) */}
        {/* You can add announcements here later */}
      </div>
    </div>
    </AppLayout>
  );
}
