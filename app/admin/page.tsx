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

  return {
    totalPuzzles: allPuzzles?.length || 0,
    upcomingCount: upcoming.length,
    draftCount: drafts.length,
    publishedCount: published.length,
    queueDays: upcoming.length,
  };
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Admin Dashboard
      </h1>

      {/* Compact Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <CompactStatCard
          title="Puzzles"
          value={stats.totalPuzzles}
          icon="📋"
        />
        <CompactStatCard
          title="Queue"
          value={`${stats.queueDays}d`}
          icon={stats.queueDays < 7 ? '⚠️' : '✓'}
          warning={stats.queueDays < 7}
        />
        <CompactStatCard
          title="Drafts"
          value={stats.draftCount}
          icon="📝"
        />
        <CompactStatCard
          title="Published"
          value={stats.publishedCount}
          icon="✓"
        />
      </div>

      {/* Quick Links */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <QuickLink href="/admin/puzzles" label="Puzzles" icon="📋" />
          <QuickLink href="/admin/puzzles/new" label="New Puzzle" icon="+" />
          <QuickLink href="/admin/users" label="Users" icon="👥" />
          <QuickLink href="/" label="Play Game" icon="🎮" />
        </div>
      </div>

      {/* Buffer Warning */}
      {stats.queueDays < 7 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <div>
              <h3 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                Low Queue Buffer
              </h3>
              <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-0.5">
                Only {stats.queueDays} days scheduled. Consider adding more puzzles.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CompactStatCard({
  title,
  value,
  icon,
  warning = false,
}: {
  title: string;
  value: string | number;
  icon: string;
  warning?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-2.5 ${
      warning
        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <span className="text-xl">{icon}</span>
      </div>
    </div>
  );
}

function QuickLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
    </Link>
  );
}
