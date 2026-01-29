import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/client-server';
import { getSessionFromRequest } from '@/lib/auth/session';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  });
}

export async function GET(request: NextRequest) {
  const stripe = getStripe();

  try {
    // Get user session
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = session.userId;

    // Get user from database
    const supabase = createClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('stripe_subscription_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const subscriptionId = (user as any).stripe_subscription_id;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription' },
        { status: 404 }
      );
    }

    // Fetch subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    return NextResponse.json({
      id: subscription.id,
      status: subscription.status,
      currentPeriodEnd: (subscription as any).current_period_end,
      cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
      amount: (subscription as any).items.data[0]?.price.unit_amount || 0,
      interval: (subscription as any).items.data[0]?.price.recurring?.interval || 'month',
    });

  } catch (error) {
    console.error('[Subscription Details] Error:', error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch subscription details' },
      { status: 500 }
    );
  }
}
