/**
 * Refresh Supabase Schema Cache
 *
 * This script helps diagnose and fix schema cache issues where
 * Supabase's PostgREST layer hasn't picked up database changes.
 */

console.log('\n🔍 Supabase Schema Cache Refresh Guide\n');
console.log('═'.repeat(60));

console.log('\n❌ ERROR DETECTED:');
console.log('   "Could not find the \'speed\' column of \'scores\' in the schema cache"');
console.log('   PGRST204 - Column not found in schema cache\n');

console.log('📋 DIAGNOSIS:');
console.log('   The database has the column, but PostgREST hasn\'t refreshed its cache.');
console.log('   This commonly happens after running migrations directly in SQL.\n');

console.log('✅ SOLUTION - Choose ONE of these options:\n');

console.log('─'.repeat(60));
console.log('OPTION 1: Automatic Schema Reload (Recommended)');
console.log('─'.repeat(60));
console.log('\n1. Open Supabase Dashboard → Settings → API');
console.log('2. Scroll to "PostgREST Configuration"');
console.log('3. Click "Reload schema cache" button');
console.log('4. Wait 5-10 seconds for the cache to refresh');
console.log('5. Test your API calls again\n');

console.log('─'.repeat(60));
console.log('OPTION 2: NOTIFY Command (SQL Editor)');
console.log('─'.repeat(60));
console.log('\n1. Open Supabase Dashboard → SQL Editor');
console.log('2. Run this command:\n');
console.log('   NOTIFY pgrst, \'reload schema\';\n');
console.log('3. Wait a few seconds');
console.log('4. Test your API calls again\n');

console.log('─'.repeat(60));
console.log('OPTION 3: Verify Column Exists (Diagnostic)');
console.log('─'.repeat(60));
console.log('\n1. Open Supabase Dashboard → SQL Editor');
console.log('2. Run this query to verify the speed column exists:\n');
console.log('   SELECT column_name, data_type, column_default');
console.log('   FROM information_schema.columns');
console.log('   WHERE table_name = \'scores\';');
console.log('\n3. You should see the "speed" column with type "numeric"\n');

console.log('─'.repeat(60));
console.log('OPTION 4: Restart Database Connection (Last Resort)');
console.log('─'.repeat(60));
console.log('\n1. Open Supabase Dashboard → Settings → Database');
console.log('2. Click "Restart database" (may cause brief downtime)');
console.log('3. Wait for restart to complete');
console.log('4. Test your API calls again\n');

console.log('═'.repeat(60));
console.log('\n🔄 AFTER REFRESH:');
console.log('   1. Try playing a game and submitting a score');
console.log('   2. Check for 500 errors in browser console');
console.log('   3. If still failing, check npm dev server logs for new errors\n');

console.log('📝 NOTE:');
console.log('   This is a common issue after manual migrations.');
console.log('   Using Supabase\'s migration tools can prevent this in the future.\n');

console.log('═'.repeat(60));
