/**
 * Add a longer test puzzle (Gettysburg Address)
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

  const longPuzzle = {
    target_phrase: 'Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.',
    facsimile_phrase: 'Eighty-seven years in the past, our ancestors established on this land a new country, born from the idea of freedom and committed to the belief that all people are made equal.',
    difficulty: 3,
    bonus_question: {
      type: 'literature',
      question: 'Who delivered this famous speech?',
      options: [
        { id: '1', author: 'Abraham Lincoln', book: 'Gettysburg Address' },
        { id: '2', author: 'Thomas Jefferson', book: 'Declaration of Independence' },
        { id: '3', author: 'George Washington', book: 'Farewell Address' },
        { id: '4', author: 'Martin Luther King Jr.', book: 'I Have a Dream' },
        { id: '5', author: 'Frederick Douglass', book: 'What to the Slave is the Fourth of July?' },
      ],
      correctAnswerId: '1',
    },
    created_by_ai: false,
    approved: true,
  };

  console.log(`📅 Adding long test puzzle for dates: ${dates.join(', ')}...`);

  for (const date of dates) {
    const { error } = await supabase
      .from('puzzles')
      .upsert({ ...longPuzzle, date }, { onConflict: 'date' })
      .select();

    if (error) {
      console.error(`❌ Error for ${date}:`, error.message);
    } else {
      console.log(`✅ Long puzzle added for ${date}`);
    }
  }

  console.log('\n   Target:', longPuzzle.target_phrase);
  console.log('   Facsimile:', longPuzzle.facsimile_phrase);
  console.log('\n   Word counts:');
  console.log('   Target words:', longPuzzle.target_phrase.split(/\s+/).length);
  console.log('   Facsimile words:', longPuzzle.facsimile_phrase.split(/\s+/).length);
  console.log('   Total words:', longPuzzle.target_phrase.split(/\s+/).length + longPuzzle.facsimile_phrase.split(/\s+/).length);
}

main().catch(console.error);
