import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Search for the Stripe customer from logs
const customerId = 'cus_TsUiiapctKTyw7';

console.log('\n=== Searching for Stripe customer:', customerId, '===\n');

const { data: customerUser, error: custError } = await supabase
  .from('users')
  .select('*')
  .eq('stripe_customer_id', customerId)
  .maybeSingle();

if (custError) {
  console.error('Customer search error:', custError);
} else if (customerUser) {
  console.log('Found user by customer ID:');
  console.log('- ID:', customerUser.id);
  console.log('- Display Name:', customerUser.display_name || 'Anonymous');
  console.log('- User Tier:', customerUser.user_tier);
  console.log('- Stripe Subscription ID:', customerUser.stripe_subscription_id);
  console.log('');
} else {
  console.log('No user found with that customer ID');
}

// Also check for any premium users
console.log('=== All Premium Users ===\n');

const { data: premiumUsers, error: premError } = await supabase
  .from('users')
  .select('id, display_name, user_tier, stripe_customer_id, stripe_subscription_id')
  .eq('user_tier', 'premium');

if (premError) {
  console.error('Premium search error:', premError);
} else {
  if (premiumUsers.length === 0) {
    console.log('No premium users found');
  } else {
    premiumUsers.forEach(u => {
      console.log(`👑 ${u.display_name || 'Anonymous'}`);
      console.log(`   ID: ${u.id.substring(0, 12)}...`);
      console.log(`   Subscription: ${u.stripe_subscription_id}`);
      console.log('');
    });
  }
}
