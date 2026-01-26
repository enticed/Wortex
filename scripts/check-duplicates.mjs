import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get all puzzles
const { data: allPuzzles } = await supabase
  .from('puzzles')
  .select('date, target_phrase')
  .order('date', { ascending: true });

console.log('Checking for the specific quotes you mentioned:\n');

const targetDates = ['2026-02-16', '2026-02-19', '2026-02-23'];
const targetPuzzles = allPuzzles?.filter(p => targetDates.includes(p.date));

targetPuzzles?.forEach(target => {
  console.log(`${target.date}: ${target.target_phrase}`);

  // Look for similar quotes in other dates
  const similar = allPuzzles?.filter(p =>
    p.date !== target.date &&
    (p.target_phrase.toLowerCase().includes(target.target_phrase.toLowerCase().substring(0, 30)) ||
     target.target_phrase.toLowerCase().includes(p.target_phrase.toLowerCase().substring(0, 30)))
  );

  if (similar && similar.length > 0) {
    console.log('  Similar to:');
    similar.forEach(s => console.log(`    ${s.date}: ${s.target_phrase}`));
  }
  console.log('');
});

// Check the year field issue for specific dates
const problemDates = ['2026-02-06', '2026-02-12', '2026-02-14', '2026-02-20'];
console.log('\nChecking bonus questions for dates with year field issues:\n');

for (const date of problemDates) {
  const { data } = await supabase
    .from('puzzles')
    .select('date, target_phrase, bonus_question')
    .eq('date', date)
    .single();

  if (data) {
    console.log(`${date}: ${data.target_phrase.substring(0, 60)}...`);
    console.log('Bonus options:', JSON.stringify(data.bonus_question.options, null, 2));
    console.log('');
  }
}
