/**
 * Add a sample puzzle for today
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  // Add puzzles for today in both UTC and LA timezone
  const utcToday = new Date().toISOString().split('T')[0];

  // Get LA timezone date
  const laDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const dates = [utcToday, laDate].filter((v, i, a) => a.indexOf(v) === i); // unique dates

  const samplePuzzle = {
    target_phrase: 'To be, or not to be, that is the question',
    facsimile_phrase: 'To exist or to cease—this is what we must decide',
    difficulty: 1,
    bonus_question: {
      type: 'literature',
      question: 'Who wrote this famous line?',
      options: [
        { id: '1', author: 'William Shakespeare', book: 'Hamlet' },
        { id: '2', author: 'Charles Dickens', book: 'Great Expectations' },
        { id: '3', author: 'Jane Austen', book: 'Pride and Prejudice' },
        { id: '4', author: 'Mark Twain', book: 'Huckleberry Finn' },
        { id: '5', author: 'Ernest Hemingway', book: 'The Old Man and the Sea' },
      ],
      correctAnswerId: '1',
    },
    created_by_ai: false,
    approved: true,
  };

  console.log(`📅 Adding sample puzzle for dates: ${dates.join(', ')}...`);

  for (const date of dates) {
    const { error } = await supabase
      .from('puzzles')
      .upsert({ ...samplePuzzle, date }, { onConflict: 'date' })
      .select();

    if (error) {
      console.error(`❌ Error for ${date}:`, error.message);
    } else {
      console.log(`✅ Puzzle added for ${date}`);
    }
  }

  console.log('\n   Target:', samplePuzzle.target_phrase);
  console.log('   Facsimile:', samplePuzzle.facsimile_phrase);
}

main().catch(console.error);
