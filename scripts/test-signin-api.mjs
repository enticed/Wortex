/**
 * Test script to diagnose signin API issues
 */

// Test credentials - UPDATE THESE WITH YOUR ACTUAL CREDENTIALS
const TEST_EMAIL = 'admin@todaysmartsolutions.com'; // REPLACE THIS
const TEST_PASSWORD = '3q&DyJVyirDQo7k8'; // REPLACE THIS

async function testSignIn() {
  console.log('Testing SignIn API...\n');

  try {
    const response = await fetch('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response statusText:', response.statusText);

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✓ Sign in successful!');
      console.log('User ID:', data.userId);
    } else {
      console.log('\n✗ Sign in failed');
      console.log('Error:', data.error);
    }

  } catch (error) {
    console.error('Request failed:', error);
  }
}

// Also test the Supabase connection directly
async function testSupabaseConnection() {
  console.log('\n\nTesting Supabase connection...\n');

  const { createClient } = await import('@supabase/supabase-js');

  const supabaseUrl = 'https://fkzqvhvqyfuxnwdhpytg.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrenF2aHZxeWZ1eG53ZGhweXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5ODQ1MjksImV4cCI6MjA4MzU2MDUyOX0.EkmgbIyP5Xb2velcBv4c8_VzzAfvGsi6Y1-wVvMWzO8';

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (error) {
      console.log('✗ Supabase auth error:', error.message);
      console.log('Error details:', error);
    } else {
      console.log('✓ Supabase auth successful!');
      console.log('User ID:', data.user?.id);
      console.log('Email:', data.user?.email);
    }
  } catch (err) {
    console.error('Supabase connection failed:', err);
  }
}

console.log('='.repeat(60));
console.log('IMPORTANT: Update TEST_EMAIL and TEST_PASSWORD in this script');
console.log('with your actual credentials before running!');
console.log('='.repeat(60));
console.log('');

await testSignIn();
await testSupabaseConnection();
