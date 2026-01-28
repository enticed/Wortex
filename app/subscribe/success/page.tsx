'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Countdown and redirect
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      router.push('/archive');
    }
  }, [countdown, router]);

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          {/* Success Icon */}
          <div className="inline-block p-6 bg-green-100 dark:bg-green-900/20 rounded-full mb-6">
            <svg className="w-20 h-20 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Welcome to Premium! 👑
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Your subscription is now active. Enjoy unlimited access to the puzzle archive and all premium features!
          </p>

          {/* What's Next */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              What's Next?
            </h2>
            <ul className="text-left space-y-3 text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Browse and play any puzzle from the archive</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Your premium badge will appear on leaderboards</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Manage your subscription anytime from account settings</span>
              </li>
            </ul>
          </div>

          {/* Auto-redirect Notice */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Redirecting to archive in {countdown} second{countdown !== 1 ? 's' : ''}...
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/archive')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Browse Archive Now
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Play Today's Puzzle
            </button>
          </div>

          {/* Receipt Notice */}
          {sessionId && (
            <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
              A receipt has been sent to your email.
              <br />
              Session ID: {sessionId.substring(0, 20)}...
            </p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default function SubscribeSuccessPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </AppLayout>
    }>
      <SuccessContent />
    </Suspense>
  );
}
