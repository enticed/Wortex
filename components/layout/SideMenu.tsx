'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTutorial } from '@/lib/contexts/TutorialContext';
import ShareModal from '@/components/share/ShareModal';
import { generateInviteText } from '@/lib/utils/shareText';
import { createClient } from '@/lib/supabase/client';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const { resetTutorial } = useTutorial();
  const [showShareModal, setShowShareModal] = useState(false);
  const [inviteText, setInviteText] = useState('');

  // Fetch today's puzzle for invite sharing
  useEffect(() => {
    if (isOpen) {
      const supabase = createClient();
      const fetchPuzzle = async () => {
        try {
          const { getTodaysPuzzle } = await import('@/lib/supabase/puzzles');
          const puzzle = await getTodaysPuzzle(supabase);

          if (puzzle) {
            const text = generateInviteText({
              facsimilePhrase: puzzle.facsimilePhrase.text,
              puzzleDate: puzzle.date,
            });
            setInviteText(text);
          }
        } catch (error) {
          console.error('Error fetching puzzle for invite:', error);
        }
      };
      fetchPuzzle();
    }
  }, [isOpen]);

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

          {/* About and Legal Links */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  onClick={onClose}
                  className="block px-4 py-3 rounded-lg text-gray-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                >
                  About Wortex
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  onClick={onClose}
                  className="block px-4 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors text-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-of-service"
                  onClick={onClose}
                  className="block px-4 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors text-sm"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Share Section */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => {
                    setShowShareModal(true);
                  }}
                  disabled={!inviteText}
                  className="w-full text-left px-4 py-3 rounded-lg text-gray-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share Wortex
                </button>
              </li>
            </ul>
          </div>

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

      {/* Share Modal */}
      <ShareModal
        shareText={inviteText}
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          onClose(); // Also close the side menu after sharing
        }}
        title="Share Wortex"
      />
    </>
  );
}
