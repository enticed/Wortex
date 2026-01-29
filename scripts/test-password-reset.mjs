/**
 * Test password reset API endpoint
 *
 * This script tests if the password reset endpoint is working correctly.
 * Note: In development, Supabase may not actually send emails unless SMTP is configured.
 * Check Supabase Dashboard → Authentication → Logs for email links.
 */

async function testPasswordReset() {
  console.log('Testing password reset API endpoint...\n');

  // Test with a sample email
  const testEmail = 'test@example.com';

  console.log(`Requesting password reset for: ${testEmail}`);

  try {
    const response = await fetch('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail }),
    });

    const data = await response.json();

    console.log('\n--- Response ---');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ API endpoint is working!');
      console.log('\n📧 Email status:');
      console.log('   - In development: Check Supabase Dashboard → Authentication → Logs');
      console.log('   - The email link will be logged there (not actually sent)');
      console.log('   - OR configure SMTP in Supabase to send real emails');
      console.log('\n📝 Next steps:');
      console.log('   1. Go to https://supabase.com/dashboard');
      console.log('   2. Select your project');
      console.log('   3. Navigate to Authentication → Logs');
      console.log('   4. Look for email events with the reset link');
      console.log('   5. Copy the link and test it in your browser');
    } else {
      console.log('\n❌ API endpoint returned an error');
      if (data.error) {
        console.log('Error:', data.error);
      }
    }

    // Test validation
    console.log('\n\n--- Testing Input Validation ---');

    // Test without email
    console.log('\nTest 1: Missing email field');
    const response1 = await fetch('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const data1 = await response1.json();
    console.log('Status:', response1.status, data1.error ? `✅ Correctly rejected: ${data1.error}` : '❌ Should have failed');

    // Test with invalid email
    console.log('\nTest 2: Invalid email format');
    const response2 = await fetch('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'not-an-email' }),
    });
    const data2 = await response2.json();
    console.log('Status:', response2.status, data2.error ? `✅ Correctly rejected: ${data2.error}` : '❌ Should have failed');

    console.log('\n--- Test Complete ---');

  } catch (error) {
    console.error('\n❌ Error testing password reset:', error.message);
    console.log('\nMake sure:');
    console.log('1. The dev server is running (npm run dev)');
    console.log('2. Supabase credentials are configured in .env.local');
  }
}

testPasswordReset();
