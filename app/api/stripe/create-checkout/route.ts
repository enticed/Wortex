import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/client-server';
import { getSessionFromRequest } from '@/lib/auth/session';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { priceId } = body;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    const userId = session.userId;

    // Get user from database
    const supabase = createClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, display_name, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let customerId = (user as any).stripe_customer_id as string | null;

    // Create or retrieve Stripe customer
    if (!customerId) {
      console.log('[Checkout] Creating new Stripe customer for user:', userId.substring(0, 12));

      const customer = await stripe.customers.create({
        email: (user as any).email || undefined,
        metadata: {
          user_id: userId,
          display_name: (user as any).display_name || 'Anonymous Player',
        },
      });

      customerId = customer.id;

      // Save customer ID to database
      const { error: updateError } = await (supabase as any)
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);

      if (updateError) {
        console.error('[Checkout] Failed to save Stripe customer ID:', updateError);
      } else {
        console.log('[Checkout] Saved Stripe customer ID:', customerId);
      }
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscribe/cancel`,
      metadata: {
        user_id: userId,
      },
      subscription_data: {
        metadata: {
          user_id: userId,
        },
      },
    });

    console.log('[Checkout] Created checkout session:', checkoutSession.id);
    console.log('[Checkout] User ID:', userId.substring(0, 12));
    console.log('[Checkout] Price ID:', priceId);

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });

  } catch (error) {
    console.error('[Checkout] Error:', error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
