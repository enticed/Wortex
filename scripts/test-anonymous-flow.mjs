/**
 * Test anonymous user creation and session flow
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAnonymousFlow() {
  try {
    console.log('\n=== Testing Anonymous User Flow ===\n');

    // Get recent anonymous users
    const { data: anonUsers, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_anonymous', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching anonymous users:', error);
      return;
    }

    console.log(`Found ${anonUsers.length} recent anonymous users:\n`);

    anonUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.display_name}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email || '(none)'}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log(`   Has password: ${user.password_hash ? 'Yes' : 'No'}`);
      console.log('');
    });

    // Check if any have scores
    if (anonUsers.length > 0) {
      console.log('Checking scores for most recent anonymous user...\n');
      const recentUser = anonUsers[0];

      const { data: scores, error: scoresError } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', recentUser.id);

      if (scoresError) {
        console.error('Error fetching scores:', scoresError);
      } else {
        console.log(`User has ${scores.length} scores saved`);
        if (scores.length > 0) {
          console.log('Most recent score:', scores[0]);
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testAnonymousFlow();
