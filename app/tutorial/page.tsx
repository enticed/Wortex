'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import GameBoard from '@/components/game/GameBoard';
import { tutorialPuzzle } from '@/lib/data/tutorialPuzzle';
import { useTutorial } from '@/lib/contexts/TutorialContext';
import { useTutorialSteps } from '@/lib/hooks/useTutorialSteps';
import { welcomeSteps, preGameSteps } from '@/lib/tutorial/tutorialSteps';
import AppLayout from '@/components/layout/AppLayout';

/**
 * Tutorial Page - Multi-stage tutorial flow
 *
 * Stages:
 * 1. Welcome (with tutorial steps 1-2)
 * 2. Pre-game (with tutorial step 3)
 * 3. Game (with tutorial steps 4-18)
 */
export default function TutorialPage() {
  const { resetTutorial, hasCompletedTutorial } = useTutorial();
  const [stage, setStage] = useState<'welcome' | 'pre-game' | 'game'>('welcome');
  const [tutorialReady, setTutorialReady] = useState(false);

  // Reset tutorial state when page loads to ensure it starts fresh
  useEffect(() => {
    // Clear any saved game results from previous tutorial runs
    // This prevents the tutorial from skipping to final results
    sessionStorage.removeItem('wortex-final-results');

    resetTutorial();
    // Small delay to ensure state is fully reset before starting
    setTimeout(() => setTutorialReady(true), 100);
  }, [resetTutorial]);

  // Welcome stage tutorial
  useTutorialSteps({
    phase: 'welcome',
    steps: welcomeSteps,
    autoStart: tutorialReady && stage === 'welcome' && !hasCompletedTutorial,
    delay: 1000,
  });

  // Pre-game stage tutorial
  useTutorialSteps({
    phase: 'pre-game',
    steps: preGameSteps,
    autoStart: tutorialReady && stage === 'pre-game' && !hasCompletedTutorial,
    delay: 500,
  });

  if (stage === 'game') {
    return (
      <AppLayout>
        <div className="h-[calc(100vh-5rem)] w-full">
          <GameBoard puzzle={tutorialPuzzle} isArchiveMode={false} />
        </div>
      </AppLayout>
    );
  }

  if (stage === 'pre-game') {
    return (
      <AppLayout>
        <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-950 dark:to-indigo-950 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full space-y-6">
            {/* Pre-game info card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Tutorial Puzzle
              </h2>

              {/* Hint Phrase Display */}
              <div id="hint-phrase-explanation" className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg border-2 border-purple-300 dark:border-purple-700">
                <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">
                  Today's Hint Phrase:
                </h3>
                <p className="text-lg font-medium text-purple-700 dark:text-purple-300" style={{ fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>
                  &ldquo;{tutorialPuzzle.facsimilePhrase.text}&rdquo;
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                  Use this as a clue, but remember it's not the answer!
                </p>
              </div>

              {/* Game Info */}
              <div id="game-info" className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <p>
                  <strong className="text-gray-900 dark:text-gray-100">Your goal:</strong> Collect the correct words from the vortex and arrange them to reveal a famous quote.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-gray-100">Remember:</strong> Lower scores are better! The fewer words you see and the fewer moves you make, the better your score.
                </p>
              </div>
            </div>

            {/* Continue Button */}
            <div className="text-center">
              <button
                id="continue-to-game-button"
                onClick={() => setStage('game')}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-lg font-bold rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Continue to Game
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Welcome stage
  return (
    <AppLayout>
      <div id="app-container" className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-950 dark:to-indigo-950 flex items-center justify-center p-3">
        <div className="max-w-2xl w-full space-y-4">
          {/* Hero Section */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Welcome to Wortex!
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Tutorial Puzzle
            </p>
          </div>

          {/* Tutorial Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center space-y-4">
            <div className="text-6xl">🌀</div>
            <p className="text-lg text-gray-700 dark:text-gray-300">
              Let's learn how to play Wortex with a simple practice puzzle!
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This tutorial uses the quote <strong>"Less is more"</strong> to teach you the game mechanics.
            </p>
          </div>

          {/* Play Button */}
          <div className="text-center">
            <button
              id="play-button"
              onClick={() => setStage('pre-game')}
              className="inline-block px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-lg font-bold rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Start Tutorial
            </button>
          </div>

          {/* Back Link */}
          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
