import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import PuzzleEditorForm from '@/components/admin/PuzzleEditorForm';

interface PageProps {
  params: Promise<{ date: string }>;
}

async function getPuzzle(date: string) {
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

  const { data: puzzle, error } = await supabase
    .from('puzzles')
    .select('*')
    .eq('date', date)
    .single();

  if (error || !puzzle) {
    return null;
  }

  return puzzle;
}

export default async function EditPuzzlePage({ params }: PageProps) {
  const { date } = await params;
  const puzzle = await getPuzzle(date);

  if (!puzzle) {
    redirect('/admin/puzzles');
  }

  return (
    <div className="max-w-4xl pb-12">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Edit Puzzle
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Editing puzzle for {new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>

      <PuzzleEditorForm puzzle={puzzle} mode="edit" />
    </div>
  );
}
