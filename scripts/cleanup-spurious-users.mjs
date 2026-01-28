import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupSpuriousUsers() {
  console.log('🧹 Starting cleanup of spurious anonymous users...\n');

  try {
    // Find anonymous users with no activity
    // "Spurious" = anonymous users created recently with no scores, no games played
    const { data: spuriousUsers, error: queryError } = await supabase
      .from('users')
      .select(`
        id,
        display_name,
        created_at,
        is_anonymous,
        scores:scores(count)
      `)
      .eq('is_anonymous', true)
      .order('created_at', { ascending: false });

    if (queryError) {
      console.error('❌ Error querying users:', queryError);
      return;
    }

    console.log(`📊 Found ${spuriousUsers.length} anonymous users total\n`);

    // Filter to users with no activity
    const usersWithNoActivity = spuriousUsers.filter(user => {
      const scoreCount = user.scores?.[0]?.count || 0;
      return scoreCount === 0;
    });

    console.log(`🎯 Identified ${usersWithNoActivity.length} users with no activity\n`);

    if (usersWithNoActivity.length === 0) {
      console.log('✓ No spurious users to clean up!');
      return;
    }

    // Group by creation date for analysis
    const today = new Date();
    const byDate = {
      today: 0,
      last7days: 0,
      last30days: 0,
      older: 0
    };

    usersWithNoActivity.forEach(user => {
      const createdAt = new Date(user.created_at);
      const daysAgo = (today - createdAt) / (1000 * 60 * 60 * 24);

      if (daysAgo < 1) byDate.today++;
      else if (daysAgo < 7) byDate.last7days++;
      else if (daysAgo < 30) byDate.last30days++;
      else byDate.older++;
    });

    console.log('📅 Breakdown by age:');
    console.log(`   Today: ${byDate.today}`);
    console.log(`   Last 7 days: ${byDate.last7days}`);
    console.log(`   Last 30 days: ${byDate.last30days}`);
    console.log(`   Older than 30 days: ${byDate.older}\n`);

    // Ask for confirmation (in production, you might want to skip very recent ones)
    console.log('⚠️  This will delete users older than 1 day with no activity.');
    console.log('   Recent users (< 1 day) will be preserved in case they are legitimate.\n');

    // Delete users older than 1 day with no activity
    const usersToDelete = usersWithNoActivity.filter(user => {
      const createdAt = new Date(user.created_at);
      const hoursAgo = (today - createdAt) / (1000 * 60 * 60);
      return hoursAgo > 24; // Only delete if older than 24 hours
    });

    if (usersToDelete.length === 0) {
      console.log('✓ No users old enough to delete (all are < 24 hours old)');
      return;
    }

    console.log(`🗑️  Deleting ${usersToDelete.length} spurious users...`);

    const userIds = usersToDelete.map(u => u.id);

    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .in('id', userIds);

    if (deleteError) {
      console.error('❌ Error deleting users:', deleteError);
      return;
    }

    console.log(`✅ Successfully deleted ${usersToDelete.length} spurious users\n`);

    // Show remaining stats
    const remaining = usersWithNoActivity.length - usersToDelete.length;
    if (remaining > 0) {
      console.log(`ℹ️  ${remaining} recent users (< 24 hours) were preserved`);
    }

    console.log('\n🎉 Cleanup complete!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the cleanup
cleanupSpuriousUsers();
