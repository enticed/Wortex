'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { useUserTier } from '@/lib/hooks/useUserTier';

export default function SubscriptionPage() {
  const router = useRouter();
  const { tier, loading: tierLoading } = useUserTier();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  // Fetch subscription details from Stripe
  useEffect(() => {
    if (tier === 'premium') {
      fetchSubscriptionDetails();
    }
  }, [tier]);

  const fetchSubscriptionDetails = async () => {
    try {
      const response = await fetch('/api/stripe/subscription-details');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionData(data);
      }
    } catch (err) {
      console.error('Failed to fetch subscription details:', err);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      const data = await response.json();

      // Refresh subscription details
      await fetchSubscriptionDetails();

      alert('Your subscription has been canceled. You will retain premium access until the end of your billing period.');
    } catch (err) {
      console.error('Cancellation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/reactivate-subscription', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reactivate subscription');
      }

      await fetchSubscriptionDetails();
      alert('Your subscription has been reactivated!');
    } catch (err) {
      console.error('Reactivation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to reactivate subscription');
    } finally {
      setLoading(false);
    }
  };

  if (tierLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="text-blue-600 dark:text-blue-400 hover:underline mb-4 flex items-center"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Subscription Management
            </h1>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Free Tier */}
          {tier === 'free' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="text-center py-8">
                <div className="inline-block p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                  <svg className="w-12 h-12 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  You're on the Free Plan
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Upgrade to Premium to unlock the full puzzle archive and exclusive features.
                </p>
                <button
                  onClick={() => router.push('/subscribe')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors"
                >
                  Upgrade to Premium
                </button>
              </div>
            </div>
          )}

          {/* Premium Tier */}
          {tier === 'premium' && (
            <div className="space-y-6">
              {/* Subscription Status */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        Premium Subscription
                      </h2>
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm font-medium rounded">
                        Active
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      You have access to all premium features
                    </p>
                  </div>
                  <div className="text-4xl">👑</div>
                </div>

                {subscriptionData && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <dl className="space-y-4">
                      <div>
                        <dt className="text-sm text-gray-600 dark:text-gray-400">Plan</dt>
                        <dd className="mt-1 text-lg font-medium text-gray-900 dark:text-gray-100">
                          ${subscriptionData.amount / 100} / {subscriptionData.interval}
                        </dd>
                      </div>
                      {subscriptionData.currentPeriodEnd && (
                        <div>
                          <dt className="text-sm text-gray-600 dark:text-gray-400">
                            {subscriptionData.cancelAtPeriodEnd ? 'Expires' : 'Next billing date'}
                          </dt>
                          <dd className="mt-1 text-lg font-medium text-gray-900 dark:text-gray-100">
                            {new Date(subscriptionData.currentPeriodEnd * 1000).toLocaleDateString()}
                          </dd>
                        </div>
                      )}
                      {subscriptionData.cancelAtPeriodEnd && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                            Your subscription is scheduled to cancel at the end of the billing period. You will retain premium access until then.
                          </p>
                        </div>
                      )}
                    </dl>
                  </div>
                )}
              </div>

              {/* Premium Benefits */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Your Premium Benefits
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">Full access to puzzle archive</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">Ad-free experience</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">Premium badge on leaderboards</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">Support indie development</span>
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Manage Your Subscription
                </h3>

                {subscriptionData?.cancelAtPeriodEnd ? (
                  <button
                    onClick={handleReactivateSubscription}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    {loading ? 'Processing...' : 'Reactivate Subscription'}
                  </button>
                ) : (
                  <button
                    onClick={handleCancelSubscription}
                    disabled={loading}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    {loading ? 'Processing...' : 'Cancel Subscription'}
                  </button>
                )}

                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
                  Need help? Contact us at support@wortex.live
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
