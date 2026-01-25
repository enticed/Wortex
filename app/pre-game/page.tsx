'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';

// Collection of game tips - randomly select one
const GAME_TIPS = [
  {
    icon: '💡',
    title: 'Start with the Hint Phrase',
    tip: 'The Hint Phrase gives you clues about the Mystery Quote. Look for similar words and themes!'
  },
  {
    icon: '⚡',
    title: 'Speed Matters',
    tip: 'Words spin faster as the game progresses. Adjust your Vortex speed using the slider on the left!'
  },
  {
    icon: '🎯',
    title: 'Dismiss Wisely',
    tip: 'Not all words belong to the quotes. Dismiss spurious words to keep your Vortex clean.'
  },
  {
    icon: '🔄',
    title: 'Phase 2 Reordering',
    tip: 'Once you complete Phase 1, you can reorder words in Phase 2 to perfect the Mystery Quote.'
  },
  {
    icon: '🏆',
    title: 'Bonus Round',
    tip: 'Answer the bonus question correctly for a 10% score boost. Every point counts on the leaderboard!'
  },
  {
    icon: '🔥',
    title: 'Build Your Streak',
    tip: 'Play daily to build your streak and climb the leaderboard. Consistency is key!'
  },
  {
    icon: '💎',
    title: 'Fewer Words = Better Score',
    tip: 'Your score improves when you see fewer words. Be decisive and accurate!'
  },
  {
    icon: '🎨',
    title: 'Use Hints Strategically',
    tip: 'Hints can help when you\'re stuck, but they increase your move count. Use them wisely!'
  },
];

export default function PreGamePage() {
  const [currentTip, setCurrentTip] = useState(GAME_TIPS[0]);

  useEffect(() => {
    // Select a random tip when the page loads
    const randomTip = GAME_TIPS[Math.floor(Math.random() * GAME_TIPS.length)];
    setCurrentTip(randomTip);
  }, []);

  return (
    <AppLayout>
      <div className="min-h-[calc(100vh-2.5rem)] bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-950 dark:to-indigo-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Tip Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 space-y-6">
            {/* Header */}
            <div className="text-center">
              <div className="text-6xl mb-3">{currentTip.icon}</div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                Game Tip
              </h2>
              <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                {currentTip.title}
              </h3>
            </div>

            {/* Tip Content */}
            <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed text-center">
                {currentTip.tip}
              </p>
            </div>

            {/* Ad Placeholder - Hidden until ready for monetization */}
            {/* Uncomment this section when ready to add ads:
            <div className="bg-gray-100 dark:bg-gray-700/30 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center italic">
                Ad space - Coming soon
              </p>
            </div>
            */}

            {/* Continue Button */}
            <div className="pt-2">
              <Link
                href="/play"
                className="block w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-lg font-bold rounded-xl shadow-lg text-center transform transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Continue to Game
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
