import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Use ANON key like the frontend does
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('Testing getTodaysPuzzle logic with ANON key...\n');

// Calculate today's date exactly as getTodaysPuzzle does
const userTimezone = 'America/Los_Angeles';
const today = new Date().toLocaleDateString('en-CA', {
  timeZone: userTimezone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

console.log('Timezone:', userTimezone);
console.log('Calculated date:', today);
console.log('');

// Try to fetch the puzzle
const { data, error } = await supabase
  .from('puzzles')
  .select('*')
  .eq('date', today)
  .eq('approved', true)
  .single();

if (error) {
  console.log('❌ Error:', error.message);
  console.log('Error details:', JSON.stringify(error, null, 2));
} else if (!data) {
  console.log('❌ No data returned');
} else {
  console.log('✅ Found puzzle:', data.id.substring(0, 12));
  console.log('   Date:', data.date);
  console.log('   Approved:', data.approved);
  console.log('   Target:', data.target_phrase.substring(0, 50) + '...');
}

// Also check what puzzles exist around this date
console.log('\n--- Checking puzzles around', today, '---');
const { data: allPuzzles } = await supabase
  .from('puzzles')
  .select('date, approved')
  .order('date', { ascending: false })
  .limit(10);

if (allPuzzles) {
  allPuzzles.forEach(p => {
    console.log(`  ${p.date} - ${p.approved ? '✅ approved' : '❌ not approved'}`);
  });
}
