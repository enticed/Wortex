'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/lib/contexts/UserContext';
import UpgradeAccountDialog from '@/components/auth/UpgradeAccountDialog';
import SignInDialog from '@/components/auth/SignInDialog';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface HeaderProps {
  onMenuToggle: () => void;
  isArchiveMode?: boolean;
}

export default function Header({ onMenuToggle, isArchiveMode = false }: HeaderProps) {
  const { user, userData, loading } = useUser();
  const router = useRouter();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showSignInDialog, setShowSignInDialog] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    }

    if (showAccountMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAccountMenu]);

  const handleSignOut = async () => {
    try {
      console.log('[Header] Signing out...');

      // Call new session-based signout API
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('[Header] Sign out error:', data.error);
        alert('Failed to sign out: ' + data.error);
        return;
      }

      console.log('[Header] Sign out successful');

      // Clear any Supabase Auth sessions from localStorage
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('sb-')) {
            localStorage.removeItem(key);
          }
        });
      }

      // Reload page to reset auth state and create new anonymous session
      window.location.reload();
    } catch (error) {
      console.error('[Header] Unexpected error signing out:', error);
      alert('An unexpected error occurred while signing out');
    }
  };

  const handleUpgradeSuccess = () => {
    // Reload page to refresh user data
    window.location.reload();
  };

  const handleSignInSuccess = () => {
    // Reload page to refresh user data
    window.location.reload();
  };

  // Show loading state while initializing, then determine display name
  const displayName = loading
    ? '...'
    : userData?.username || 'Anonymous';
  const isAnonymous = userData?.isAnonymous ?? true;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50 flex items-center justify-between px-4">
        {/* Logo/Title */}
        <Link id="home-link" href="/" className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
          <svg
            className="w-5 h-5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
          </svg>
          <span>Wortex{isArchiveMode && <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">Archive</span>}</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Account Menu Button */}
          <div className="relative" ref={menuRef}>
            <button
              id="user-menu-button"
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Account menu"
            >
              <div className="w-6 h-6 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                {displayName[0].toUpperCase()}
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:inline">
                {displayName}
              </span>
            </button>

            {/* Dropdown Menu */}
            {showAccountMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                {/* User Info */}
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{displayName}</p>
                  {user?.email && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {isAnonymous ? 'Anonymous Account' : 'Authenticated'}
                  </p>
                </div>

                {/* Menu Items */}
                {isAnonymous ? (
                  <>
                    <button
                      onClick={() => {
                        setShowAccountMenu(false);
                        setShowUpgradeDialog(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Create Account
                    </button>
                    <button
                      onClick={() => {
                        setShowAccountMenu(false);
                        setShowSignInDialog(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Sign In
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setShowAccountMenu(false);
                        router.push('/settings');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Settings
                    </button>
                    <button
                      onClick={() => {
                        setShowAccountMenu(false);
                        handleSignOut();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Sign Out
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Hamburger Menu Icon */}
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Open menu"
          >
            <svg
              className="w-6 h-6 text-gray-700 dark:text-gray-300"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </div>
      </header>

      {/* Auth Dialogs */}
      <UpgradeAccountDialog
        isOpen={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        onSuccess={handleUpgradeSuccess}
      />
      <SignInDialog
        isOpen={showSignInDialog}
        onClose={() => setShowSignInDialog(false)}
        onSuccess={handleSignInSuccess}
        onSwitchToSignUp={() => {
          setShowSignInDialog(false);
          setShowUpgradeDialog(true);
        }}
      />
    </>
  );
}
