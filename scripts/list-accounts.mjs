/**
 * List all user accounts
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

async function listAccounts() {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, display_name, is_admin, is_anonymous, password_hash, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    console.log(`\nFound ${users.length} user accounts:\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.display_name || 'No name'}`);
      console.log(`   Email: ${user.email || '(anonymous)'}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Admin: ${user.is_admin ? 'Yes' : 'No'}`);
      console.log(`   Has password: ${user.password_hash ? 'Yes' : 'No'}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

listAccounts();
