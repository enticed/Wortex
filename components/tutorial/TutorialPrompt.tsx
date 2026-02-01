'use client';

import { useRouter } from 'next/navigation';
import { useTutorial } from '@/lib/contexts/TutorialContext';

/**
 * Tutorial Prompt Modal
 *
 * Shown to first-time visitors, asking if they want to play the tutorial.
 * - "Yes" -> Navigate to /tutorial and start tutorial
 * - "No" -> Dismiss prompt (won't show again)
 */
export default function TutorialPrompt() {
  const router = useRouter();
  const { hasSeenTutorialPrompt, dismissTutorialPrompt } = useTutorial();

  // Don't show if user has already seen the prompt
  if (hasSeenTutorialPrompt) {
    return null;
  }

  const handleYes = () => {
    dismissTutorialPrompt();
    router.push('/tutorial');
  };

  const handleNo = () => {
    dismissTutorialPrompt();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md mx-4 border-2 border-purple-400 dark:border-purple-600">
        <div className="text-center">
          {/* Icon */}
          <div className="text-6xl mb-4">🌀</div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Welcome to Wortex!
          </h2>

          {/* Description */}
          <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
            Would you like to play a quick tutorial game to learn how to play?
          </p>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            The tutorial takes about 2-3 minutes and uses a simple practice puzzle.
          </p>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleNo}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold rounded-lg transition-all duration-200"
            >
              No, thanks
            </button>
            <button
              onClick={handleYes}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              Yes, let's go!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
