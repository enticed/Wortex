import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Check the user from the logs
const userId = '80fde1b5-81f8-47b2-a67a-03d1c91c56a1';

const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();

if (error) {
  console.error('Error:', error);
  process.exit(1);
}

console.log('\n=== User Details ===\n');
console.log('Display Name:', data.display_name || 'Anonymous');
console.log('User Tier:', data.user_tier);
console.log('Stripe Customer ID:', data.stripe_customer_id);
console.log('Stripe Subscription ID:', data.stripe_subscription_id);
console.log('Is Admin:', data.is_admin);
console.log('Created:', new Date(data.created_at).toLocaleString());
console.log('\n');
