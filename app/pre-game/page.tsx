'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { createClient } from '@/lib/supabase/client';
import { getTodaysPuzzle } from '@/lib/supabase/puzzles';
import { useTutorial } from '@/lib/contexts/TutorialContext';
import { useTutorialSteps } from '@/lib/hooks/useTutorialSteps';
import { preGameSteps } from '@/lib/tutorial/tutorialSteps';
import type { Puzzle } from '@/types/game';

// Collection of game tips - randomly select one
const GAME_TIPS = [
  {
    icon: '💡',
    title: 'Start with the Hint Phrase',
    tip: 'The Hint Phrase gives you clues about the Mystery Quote. Look for similar words and themes!'
  },
  {
    title: 'Are you Pure?',
    tip: 'You qualify for the Leaderboard "Pure" rankings only if it is your first attempt and you do not use the speed control!'
  },
  {
    icon: '⚡',
    title: 'Vortex Speed Control',
    tip: 'You can adjust the speed of the vortex using the slider on the left. Try it and see what it does!'
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
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const { hasCompletedTutorial } = useTutorial();

  // Show pre-game tutorial steps if not completed
  useEffect(() => {
    console.log('[PreGame Debug] Tutorial state:', {
      hasCompletedTutorial,
      puzzle: puzzle !== null,
      shouldAutoStart: !hasCompletedTutorial && puzzle !== null,
    });
  }, [hasCompletedTutorial, puzzle]);

  useTutorialSteps({
    phase: 'pre-game',
    steps: preGameSteps,
    autoStart: !hasCompletedTutorial && puzzle !== null,
    delay: 1000, // Increased delay to allow previous tutorial to fully close
  });

  useEffect(() => {
    // Select a random tip when the page loads
    const randomTip = GAME_TIPS[Math.floor(Math.random() * GAME_TIPS.length)];
    setCurrentTip(randomTip);

    // Fetch today's puzzle to get the hint phrase
    async function fetchPuzzle() {
      const supabase = createClient();
      const todaysPuzzle = await getTodaysPuzzle(supabase);
      setPuzzle(todaysPuzzle);
    }
    fetchPuzzle();
  }, []);

  return (
    <AppLayout>
      <div id="pre-game-container" className="min-h-[calc(100vh-2.5rem)] bg-linear-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-950 dark:to-indigo-950 flex flex-col">
        {/* Hint Phrase at Top */}
        {puzzle && (
          <div className="border-b-2 border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950 p-3 overflow-hidden">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 text-center">
              Hint Phrase
            </h2>
            <div className="flex items-center justify-center overflow-hidden">
              <div className="animate-scroll-horizontal whitespace-nowrap">
                <p className="font-serif italic text-lg text-purple-900 dark:text-purple-100 inline-block px-4">
                  &ldquo;{puzzle.facsimilePhrase.text}&rdquo;
                </p>
                {/* Duplicate for seamless loop */}
                <p className="font-serif italic text-lg text-purple-900 dark:text-purple-100 inline-block px-4">
                  &ldquo;{puzzle.facsimilePhrase.text}&rdquo;
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area - Center the tip card */}
        <div className="flex-1 flex items-center justify-center p-4">
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
            </div>
          </div>
        </div>

        {/* Continue Link - Bottom Pegged with safe area padding */}
        <div className="pb-20 text-center">
          <Link
            id="continue-to-game-button"
            href="/play"
            onClick={() => {
              // Clear any saved final results so user can replay
              sessionStorage.removeItem('wortex-final-results');
            }}
            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-lg font-semibold transition-colors inline-flex items-center gap-2"
          >
            Continue to Game <span className="text-xl">→</span>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
