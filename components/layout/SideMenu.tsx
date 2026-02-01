'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useTutorial } from '@/lib/contexts/TutorialContext';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const { resetTutorial } = useTutorial();

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Side Menu Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-64 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Menu
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close menu"
          >
            <svg
              className="w-5 h-5 text-gray-700 dark:text-gray-300"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link
                href="/play"
                onClick={() => {
                  // Clear any saved final results so user can replay
                  sessionStorage.removeItem('wortex-final-results');
                  onClose();
                }}
                className="block px-4 py-3 rounded-lg text-gray-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors font-medium"
              >
                Today's Puzzle
              </Link>
            </li>
            <li>
              <Link
                href="/leaderboard"
                onClick={onClose}
                className="block px-4 py-3 rounded-lg text-gray-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
              >
                Leaderboard
              </Link>
            </li>
            <li>
              <Link
                href="/stats"
                onClick={onClose}
                className="block px-4 py-3 rounded-lg text-gray-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
              >
                My Stats
              </Link>
            </li>
            <li>
              <Link
                href="/settings"
                onClick={onClose}
                className="block px-4 py-3 rounded-lg text-gray-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
              >
                Settings
              </Link>
            </li>
            <li>
              <Link
                href="/archive"
                onClick={onClose}
                className="block px-4 py-3 rounded-lg text-gray-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
              >
                Archive
              </Link>
            </li>
            <li>
              <Link
                href="/how-to-play"
                onClick={onClose}
                className="block px-4 py-3 rounded-lg text-gray-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
              >
                How to Play
              </Link>
            </li>
            <li>
              <Link
                href="/tutorial"
                onClick={onClose}
                className="block px-4 py-3 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors font-medium"
              >
                ↻ Replay Tutorial
              </Link>
            </li>
          </ul>

          {/* Subscription Section */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <ul className="space-y-2">
              <li>
                <Link
                  href="/subscribe"
                  onClick={onClose}
                  className="block px-4 py-3 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors font-medium"
                >
                  Subscribe to Premium
                </Link>
              </li>
              <li>
                <Link
                  href="/account/subscription"
                  onClick={onClose}
                  className="block px-4 py-3 rounded-lg text-gray-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                >
                  Manage Subscription
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </>
  );
}
