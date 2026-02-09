'use client';

import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { useRouter } from 'next/navigation';

interface GameErrorBoundaryProps {
  children: React.ReactNode;
}

/**
 * Specialized Error Boundary for the game
 * Provides game-specific error handling and recovery options
 */
export function GameErrorBoundary({ children }: GameErrorBoundaryProps) {
  const router = useRouter();

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('[GameErrorBoundary] Game error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Could send error to analytics service here
  };

  const fallback = (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-red-600 dark:text-red-400 mb-6">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">
          Game Error
        </h2>

        <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
          Something went wrong during the game. Don't worry - your progress has been saved locally.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/')}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Return to Home
          </button>

          <button
            onClick={() => router.refresh()}
            className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-6 text-center">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={fallback} onError={handleError}>
      {children}
    </ErrorBoundary>
  );
}
