/**
 * Test script for the puzzle-buffer cron endpoint
 * This helps diagnose why the cron job might not be running
 */

import 'dotenv/config';

const PRODUCTION_URL = 'https://wortex.vercel.app'; // Update with your actual Vercel URL
const LOCAL_URL = 'http://localhost:3000';

async function testCronEndpoint(useProduction = false) {
  const baseUrl = useProduction ? PRODUCTION_URL : LOCAL_URL;
  const url = `${baseUrl}/api/cron/puzzle-buffer`;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing Cron Endpoint: ${url}`);
  console.log(`${'='.repeat(60)}\n`);

  // Test 1: Without Authorization
  console.log('Test 1: Request WITHOUT authorization header');
  try {
    const response = await fetch(url);
    console.log(`  Status: ${response.status} ${response.statusText}`);
    const data = await response.json();
    console.log(`  Response:`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`  Error:`, error.message);
  }

  // Test 2: With CRON_SECRET (if configured)
  if (process.env.CRON_SECRET) {
    console.log('\nTest 2: Request WITH CRON_SECRET header');
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET}`
        }
      });
      console.log(`  Status: ${response.status} ${response.statusText}`);
      const data = await response.json();
      console.log(`  Response:`, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`  Error:`, error.message);
    }
  } else {
    console.log('\nTest 2: SKIPPED (CRON_SECRET not set in .env.local)');
  }

  // Environment check
  console.log('\n' + '='.repeat(60));
  console.log('Environment Variables Check:');
  console.log('='.repeat(60));
  console.log(`  CRON_SECRET: ${process.env.CRON_SECRET ? '✓ Set' : '✗ Not set'}`);
  console.log(`  ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✓ Set' : '✗ Not set'}`);
  console.log(`  NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Not set'}`);
  console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Not set'}`);
}

// Run test
const args = process.argv.slice(2);
const useProduction = args.includes('--production') || args.includes('-p');

testCronEndpoint(useProduction).catch(console.error);
