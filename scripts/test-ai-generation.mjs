/**
 * Test AI Puzzle Generation
 *
 * Usage:
 *   node scripts/test-ai-generation.mjs [startDate] [count]
 *
 * Examples:
 *   node scripts/test-ai-generation.mjs                  # Generate 1 puzzle for tomorrow
 *   node scripts/test-ai-generation.mjs 2026-02-01      # Generate 1 puzzle for Feb 1
 *   node scripts/test-ai-generation.mjs 2026-02-01 5   # Generate 5 puzzles starting Feb 1
 */

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testGeneration() {
  const args = process.argv.slice(2);

  // Parse arguments
  let startDate = args[0];
  const count = parseInt(args[1]) || 1;

  if (!startDate) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    startDate = tomorrow.toISOString().split('T')[0];
  }

  console.log('\n🧪 Testing AI Puzzle Generation');
  console.log('━'.repeat(50));
  console.log(`📅 Start Date: ${startDate}`);
  console.log(`🔢 Count: ${count}`);
  console.log('━'.repeat(50));
  console.log('');

  try {
    console.log('⏳ Generating puzzles...\n');

    const response = await fetch(`${API_URL}/api/admin/puzzles/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate,
        count,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error:', data.error);
      if (data.details) {
        console.error('   Details:', data.details);
      }
      process.exit(1);
    }

    console.log('✅ Success!\n');
    console.log(`Generated: ${data.generated} puzzle(s)`);
    console.log(`Saved: ${data.saved} puzzle(s)`);

    if (data.errors && data.errors.length > 0) {
      console.log(`\n⚠️  Errors: ${data.errors.length}`);
      data.errors.forEach(err => {
        console.log(`   ${err.date}: ${err.error}`);
      });
    }

    if (data.puzzles && data.puzzles.length > 0) {
      console.log('\n📋 Generated Puzzles:\n');
      data.puzzles.forEach(puzzle => {
        console.log(`   Date: ${puzzle.date}`);
        console.log(`   Difficulty: ${puzzle.difficulty}/5`);
        console.log(`   Target: "${puzzle.target_phrase}"`);
        console.log(`   Facsimile: "${puzzle.facsimile_phrase}"`);
        console.log(`   Source: ${puzzle.metadata?.source || 'Unknown'}`);
        console.log(`   Approved: ${puzzle.approved ? '✓' : '✗'}`);
        console.log('');
      });
    }

    console.log('━'.repeat(50));
    console.log(`\n✨ View at: ${API_URL}/admin/puzzles\n`);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testGeneration();
