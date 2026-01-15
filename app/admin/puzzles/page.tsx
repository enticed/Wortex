import Link from 'next/link';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import PuzzleActions from '@/components/admin/PuzzleActions';

interface Puzzle {
  date: string;
  target_phrase: string;
  facsimile_phrase: string;
  difficulty: number;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  created_at: string;
}

async function getPuzzles() {
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

  const { data: puzzles, error } = await supabase
    .from('puzzles')
    .select('date, target_phrase, facsimile_phrase, difficulty, status, created_at')
    .order('date', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching puzzles:', error);
    return [];
  }

  return (puzzles || []) as Puzzle[];
}

export default async function PuzzlesPage() {
  const puzzles = await getPuzzles();
  const today = new Date().toISOString().split('T')[0];

  // Group puzzles
  const upcoming = puzzles.filter(p => p.date > today);
  const past = puzzles.filter(p => p.date <= today);
  const drafts = puzzles.filter(p => p.status === 'draft');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Puzzle Management
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {puzzles.length} total puzzles | {upcoming.length} upcoming | {drafts.length} drafts
          </p>
        </div>
        <Link
          href="/admin/puzzles/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          + Create Puzzle
        </Link>
      </div>

      {/* Drafts Section */}
      {drafts.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Drafts ({drafts.length})
          </h2>
          <PuzzleList puzzles={drafts} />
        </div>
      )}

      {/* Upcoming Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Upcoming Puzzles ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-yellow-800 dark:text-yellow-200">
              No upcoming puzzles scheduled. Consider adding some to maintain your queue buffer.
            </p>
          </div>
        ) : (
          <PuzzleList puzzles={upcoming} />
        )}
      </div>

      {/* Past Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Past Puzzles ({past.length})
        </h2>
        <PuzzleList puzzles={past.slice(0, 20)} />
        {past.length > 20 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            Showing 20 of {past.length} past puzzles
          </p>
        )}
      </div>
    </div>
  );
}

function PuzzleList({ puzzles }: { puzzles: Puzzle[] }) {
  if (puzzles.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">No puzzles found</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
              Target Phrase
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
              Difficulty
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {puzzles.map((puzzle) => (
            <tr key={puzzle.date} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                {new Date(puzzle.date + 'T12:00:00').toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                {puzzle.target_phrase.length > 60
                  ? puzzle.target_phrase.substring(0, 60) + '...'
                  : puzzle.target_phrase}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                {'★'.repeat(puzzle.difficulty)}
                {'☆'.repeat(5 - puzzle.difficulty)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={puzzle.status || 'published'} />
              </td>
              <td className="px-4 py-3">
                <PuzzleActions date={puzzle.date} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    draft: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
    scheduled: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    published: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    archived: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
  };

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-semibold ${
        colors[status as keyof typeof colors] || colors.published
      }`}
    >
      {status || 'published'}
    </span>
  );
}
