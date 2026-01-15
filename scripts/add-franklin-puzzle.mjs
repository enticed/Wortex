/**
 * Add Benjamin Franklin puzzle for tomorrow
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
  const franklinPuzzle = {
    target_phrase: 'Early to bed and early to rise makes a man healthy, wealthy, and wise',
    facsimile_phrase: 'Going to sleep early and starting the day early helps a person stay fit, prosper, and think clearly',
    difficulty: 2,
    bonus_question: {
      type: 'quote',
      question: 'Who said this famous quote?',
      options: [
        { id: 'franklin', person: 'Benjamin Franklin', year: 1735 },
        { id: 'jefferson', person: 'Thomas Jefferson', year: 1801 },
        { id: 'washington', person: 'George Washington', year: 1789 },
        { id: 'adams', person: 'John Adams', year: 1797 }
      ],
      correctAnswerId: 'franklin'
    },
    created_by_ai: false,
    approved: true,
  };

  // Get tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split('T')[0];

  console.log(`📅 Adding Franklin puzzle for ${tomorrowDate}...`);

  const { error } = await supabase
    .from('puzzles')
    .upsert({ ...franklinPuzzle, date: tomorrowDate }, { onConflict: 'date' })
    .select();

  if (error) {
    console.error(`❌ Error:`, error.message);
  } else {
    console.log(`✅ Franklin puzzle added for ${tomorrowDate}`);
    console.log('\n   Target:', franklinPuzzle.target_phrase);
    console.log('   Facsimile:', franklinPuzzle.facsimile_phrase);
  }
}

main().catch(console.error);
