/**
 * Test script to manually trigger the puzzle buffer cron job
 * This helps diagnose why the cron job might not be running
 */

import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testPuzzleBuffer() {
  console.log('\n=== Testing Puzzle Buffer Cron Job ===\n');

  // Check required environment variables
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ANTHROPIC_API_KEY',
  ];

  console.log('Checking environment variables:');
  const missingVars = [];
  for (const varName of requiredVars) {
    const exists = !!process.env[varName];
    console.log(`  ${varName}: ${exists ? '✓ Set' : '✗ Missing'}`);
    if (!exists) missingVars.push(varName);
  }

  if (missingVars.length > 0) {
    console.log('\n❌ Missing required environment variables:', missingVars.join(', '));
    console.log('   Please add these to .env.local and Vercel environment variables');
    return;
  }

  console.log('\n✓ All required environment variables are set\n');

  // Try to call the local endpoint
  console.log('Calling local cron endpoint...');
  const localUrl = 'http://localhost:3000/api/cron/puzzle-buffer';

  try {
    const response = await fetch(localUrl);
    const data = await response.json();

    console.log('\nResponse status:', response.status);
    console.log('Response body:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✓ Cron job executed successfully!');
    } else {
      console.log('\n❌ Cron job failed');
    }
  } catch (error) {
    console.log('\n❌ Error calling cron endpoint:', error.message);
    console.log('   Make sure your dev server is running (npm run dev)');
  }

  console.log('\n=== Test Complete ===\n');
}

testPuzzleBuffer().catch(console.error);
