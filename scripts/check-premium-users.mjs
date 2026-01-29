import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data, error } = await supabase
  .from('users')
  .select('id, display_name, user_tier, stripe_customer_id, stripe_subscription_id, created_at')
  .order('created_at', { ascending: false })
  .limit(10);

if (error) {
  console.error('Error:', error);
  process.exit(1);
}

console.log('\n=== Recent Users ===\n');
data.forEach(u => {
  const name = u.display_name || 'Anonymous';
  const tier = u.user_tier || 'free';
  const badge = tier === 'premium' ? '👑' : '  ';

  console.log(`${badge} ${name.padEnd(20)} (${tier})`);

  if (u.stripe_subscription_id) {
    console.log(`   Subscription: ${u.stripe_subscription_id}`);
  }
  if (u.stripe_customer_id) {
    console.log(`   Customer ID: ${u.stripe_customer_id}`);
  }
});

const premiumCount = data.filter(u => u.user_tier === 'premium').length;
console.log(`\n${premiumCount} premium user(s) in recent 10\n`);
