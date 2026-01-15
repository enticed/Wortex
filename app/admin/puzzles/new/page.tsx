import PuzzleEditorForm from '@/components/admin/PuzzleEditorForm';

export default function NewPuzzlePage() {
  return (
    <div className="max-w-4xl pb-12">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Create New Puzzle
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Fill in the details below to create a new daily puzzle
        </p>
      </div>

      <PuzzleEditorForm mode="create" />
    </div>
  );
}
