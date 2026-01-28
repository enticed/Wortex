import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/client-server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('[Webhook] Missing Stripe signature');
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('[Webhook] Signature verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  console.log('[Webhook] Received event:', event.type);

  const supabase = createClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const subscriptionId = session.subscription as string;

        if (!userId) {
          console.error('[Webhook] No user_id in session metadata');
          break;
        }

        console.log('[Webhook] Checkout completed for user:', userId.substring(0, 12));
        console.log('[Webhook] Subscription ID:', subscriptionId);

        // Update user tier and subscription ID
        const { error } = await (supabase as any)
          .from('users')
          .update({
            user_tier: 'premium',
            stripe_subscription_id: subscriptionId,
          })
          .eq('id', userId);

        if (error) {
          console.error('[Webhook] Failed to update user tier:', error);
        } else {
          console.log('[Webhook] ✓ User upgraded to premium');
        }

        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        if (!userId) {
          console.error('[Webhook] No user_id in subscription metadata');
          break;
        }

        console.log('[Webhook] Subscription created for user:', userId.substring(0, 12));

        const { error } = await (supabase as any)
          .from('users')
          .update({
            user_tier: 'premium',
            stripe_subscription_id: subscription.id,
          })
          .eq('id', userId);

        if (error) {
          console.error('[Webhook] Failed to update user:', error);
        } else {
          console.log('[Webhook] ✓ User tier set to premium');
        }

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        if (!userId) {
          // Try to find user by subscription ID
          const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('stripe_subscription_id', subscription.id)
            .single();

          if (!user) {
            console.error('[Webhook] Cannot find user for subscription:', subscription.id);
            break;
          }
        }

        console.log('[Webhook] Subscription updated:', subscription.id);
        console.log('[Webhook] Status:', subscription.status);

        // Handle subscription status changes
        let tier: 'free' | 'premium' = 'premium';

        if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
          tier = 'free';
        }

        const updateData: any = {
          user_tier: tier,
        };

        // Clear subscription ID if cancelled
        if (subscription.status === 'canceled') {
          updateData.stripe_subscription_id = null;
        }

        const { error } = await (supabase as any)
          .from('users')
          .update(updateData)
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('[Webhook] Failed to update user tier:', error);
        } else {
          console.log(`[Webhook] ✓ User tier updated to ${tier}`);
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        console.log('[Webhook] Subscription deleted:', subscription.id);

        // Downgrade user to free tier
        const { error } = await (supabase as any)
          .from('users')
          .update({
            user_tier: 'free',
            stripe_subscription_id: null,
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('[Webhook] Failed to downgrade user:', error);
        } else {
          console.log('[Webhook] ✓ User downgraded to free tier');
        }

        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string;

        console.log('[Webhook] Payment succeeded for subscription:', subscriptionId);

        // Ensure user still has premium tier
        const { error } = await (supabase as any)
          .from('users')
          .update({ user_tier: 'premium' })
          .eq('stripe_subscription_id', subscriptionId);

        if (error) {
          console.error('[Webhook] Failed to confirm premium tier:', error);
        } else {
          console.log('[Webhook] ✓ Premium tier confirmed');
        }

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string;

        console.log('[Webhook] Payment failed for subscription:', subscriptionId);
        console.log('[Webhook] Attempt:', invoice.attempt_count);

        // TODO: Implement grace period logic
        // For now, we'll let Stripe handle retries
        // After final failure, customer.subscription.updated with status 'unpaid' will fire

        break;
      }

      default:
        console.log('[Webhook] Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('[Webhook] Error processing event:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
