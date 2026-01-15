import Link from 'next/link';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getDashboardStats() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component, ignore
          }
        },
      },
    }
  );

  // Get puzzle counts by status
  const { data: allPuzzles } = await supabase
    .from('puzzles')
    .select('date, status, difficulty');

  const today = new Date().toISOString().split('T')[0];
  const upcoming = allPuzzles?.filter(p => p.date > today) || [];
  const drafts = allPuzzles?.filter(p => p.status === 'draft') || [];
  const published = allPuzzles?.filter(p => p.status === 'published' || !p.status) || [];

  // Get today's puzzle
  const { data: todayPuzzle } = await supabase
    .from('puzzles')
    .select('target_phrase, difficulty')
    .eq('date', today)
    .single();

  return {
    totalPuzzles: allPuzzles?.length || 0,
    upcomingCount: upcoming.length,
    draftCount: drafts.length,
    publishedCount: published.length,
    todayPuzzle,
    queueDays: upcoming.length,
  };
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <Link
          href="/admin/puzzles/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          + Create Puzzle
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Puzzles"
          value={stats.totalPuzzles}
          subtitle="In database"
          color="blue"
        />
        <StatCard
          title="Queue Buffer"
          value={`${stats.queueDays} days`}
          subtitle={stats.queueDays < 7 ? '⚠️ Low buffer' : 'Good buffer'}
          color={stats.queueDays < 7 ? 'yellow' : 'green'}
        />
        <StatCard
          title="Drafts"
          value={stats.draftCount}
          subtitle="Pending approval"
          color="gray"
        />
        <StatCard
          title="Published"
          value={stats.publishedCount}
          subtitle="Live puzzles"
          color="green"
        />
      </div>

      {/* Today's Puzzle */}
      {stats.todayPuzzle && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Today's Puzzle
          </h2>
          <div className="space-y-2">
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-medium">Target:</span> "{stats.todayPuzzle.target_phrase}"
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Difficulty: {stats.todayPuzzle.difficulty}/5
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/puzzles/new"
            className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-center"
          >
            <div className="text-2xl mb-2">➕</div>
            <div className="font-semibold text-gray-900 dark:text-white">Create Puzzle</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Add new daily puzzle</div>
          </Link>
          <Link
            href="/admin/puzzles"
            className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-center"
          >
            <div className="text-2xl mb-2">📋</div>
            <div className="font-semibold text-gray-900 dark:text-white">View All Puzzles</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Manage puzzle queue</div>
          </Link>
          <Link
            href="/"
            className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-center"
          >
            <div className="text-2xl mb-2">🎮</div>
            <div className="font-semibold text-gray-900 dark:text-white">Play Today's Puzzle</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Test the game</div>
          </Link>
        </div>
      </div>

      {/* Buffer Warning */}
      {stats.queueDays < 7 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                Low Queue Buffer
              </h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                You only have {stats.queueDays} days of puzzles scheduled. Consider adding more to maintain a 30-day buffer.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  color: 'blue' | 'green' | 'yellow' | 'gray';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    gray: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
  };

  return (
    <div className={`rounded-lg border p-6 ${colorClasses[color]}`}>
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
}
