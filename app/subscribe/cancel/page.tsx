'use client';

import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';

export default function SubscribeCancelPage() {
  const router = useRouter();

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          {/* Cancel Icon */}
          <div className="inline-block p-6 bg-gray-100 dark:bg-gray-800 rounded-full mb-6">
            <svg className="w-20 h-20 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          {/* Message */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Subscription Cancelled
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            No worries! Your payment was not processed. You can subscribe anytime you're ready.
          </p>

          {/* What You're Missing */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Premium Features You'll Miss:
            </h2>
            <ul className="text-left space-y-2 text-gray-600 dark:text-gray-400 text-sm">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Full archive access - play any past puzzle</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Ad-free experience</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Premium badge on leaderboards</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Support Wortex development</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/subscribe')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Try Again - Subscribe for $1/month
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Continue with Free Account
            </button>
          </div>

          {/* Help Text */}
          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            Questions? Contact us or check out our{' '}
            <button
              onClick={() => router.push('/subscribe')}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              FAQ section
            </button>
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
