'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { useUser } from '@/lib/contexts/UserContext';
import { useUserTier } from '@/lib/hooks/useUserTier';

export default function SubscribePage() {
  const router = useRouter();
  const { userId } = useUser();
  const { tier, isPremium, loading: tierLoading } = useUserTier();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    if (!userId) {
      setError('Please sign in to subscribe');
      return;
    }

    if (isPremium) {
      setError('You already have an active subscription!');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY;

      if (!priceId) {
        throw new Error('Stripe price ID not configured');
      }

      // Call checkout API
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }

    } catch (err) {
      console.error('Subscription error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setLoading(false);
    }
  };

  if (tierLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isPremium) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="inline-block p-4 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
                <svg className="w-16 h-16 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                You're Already Premium! 👑
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                You have an active premium subscription. Enjoy all the premium features!
              </p>
              <div className="space-x-4">
                <button
                  onClick={() => router.push('/archive')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  Browse Archive
                </button>
                <button
                  onClick={() => router.push('/account/subscription')}
                  className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  Manage Subscription
                </button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Upgrade to Premium
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Unlock exclusive features for just $1/month
            </p>
          </div>

          {/* Pricing Card */}
          <div className="max-w-md mx-auto mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl shadow-xl border-2 border-blue-200 dark:border-blue-700 p-8">
              {/* Badge */}
              <div className="inline-block bg-blue-600 text-white text-sm font-semibold px-4 py-1 rounded-full mb-4">
                BEST VALUE
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold text-gray-900 dark:text-gray-100">$1</span>
                  <span className="text-2xl text-gray-600 dark:text-gray-400 ml-2">/month</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Cancel anytime • No hidden fees
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Full Archive Access</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Play any past puzzle, anytime</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Ad-Free Experience</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Play without interruptions</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Premium Badge</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Show off your 👑 on leaderboards</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Support Development</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Help keep Wortex running</p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {/* Subscribe Button */}
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg transition-colors text-lg disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Subscribe Now'
                )}
              </button>

              {/* Trust Badges */}
              <div className="mt-6 flex items-center justify-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Secure Payment
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Cancel Anytime
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
              Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              <details className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <summary className="font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
                  Can I cancel anytime?
                </summary>
                <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                  Yes! Cancel anytime from your account settings. You'll keep premium access until the end of your billing period.
                </p>
              </details>

              <details className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <summary className="font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
                  What payment methods do you accept?
                </summary>
                <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                  We accept all major credit and debit cards through Stripe, our secure payment processor.
                </p>
              </details>

              <details className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <summary className="font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
                  Will my subscription auto-renew?
                </summary>
                <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                  Yes, your subscription automatically renews each month. You can cancel anytime to stop future billing.
                </p>
              </details>

              <details className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <summary className="font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
                  What happens if I cancel?
                </summary>
                <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                  You'll keep premium features until the end of your current billing period. After that, you'll return to the free tier.
                </p>
              </details>
            </div>
          </div>

          {/* Back Button */}
          <div className="text-center mt-8">
            <button
              onClick={() => router.back()}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              ← Back to Wortex
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
