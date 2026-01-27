import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function previewInactiveUsers() {
  console.log('Checking for inactive anonymous users (30+ days, no scores)...\n');

  // Get cutoff date (30 days ago)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);
  const cutoffISO = cutoffDate.toISOString();

  // Get all anonymous users older than 30 days
  const { data: users, error } = await supabase
    .from('users')
    .select('id, display_name, created_at, is_anonymous')
    .eq('is_anonymous', true)
    .lt('created_at', cutoffISO)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  console.log(`Found ${users.length} anonymous users older than 30 days\n`);

  // Check which ones have no scores
  const usersToDelete = [];

  for (const user of users) {
    const { data: scores } = await supabase
      .from('scores')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    const hasScores = scores && scores.length > 0;
    const daysInactive = Math.floor(
      (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (!hasScores) {
      usersToDelete.push({
        id: user.id,
        display_name: user.display_name,
        created_at: user.created_at,
        days_inactive: daysInactive,
      });
    }
  }

  console.log(`\n=== USERS THAT WOULD BE DELETED ===`);
  console.log(`Total: ${usersToDelete.length} users\n`);

  if (usersToDelete.length > 0) {
    console.log('First 10 users:');
    usersToDelete.slice(0, 10).forEach((user, i) => {
      console.log(
        `${i + 1}. ${user.display_name} - ${user.days_inactive} days inactive (created ${user.created_at})`
      );
    });

    console.log(`\n... and ${Math.max(0, usersToDelete.length - 10)} more users`);
  } else {
    console.log('No users meet the deletion criteria.');
  }

  console.log('\n=== CRITERIA FOR DELETION ===');
  console.log('- Anonymous user (is_anonymous = true)');
  console.log('- Created more than 30 days ago');
  console.log('- Has never played any games (no scores)');
}

previewInactiveUsers().catch(console.error);
