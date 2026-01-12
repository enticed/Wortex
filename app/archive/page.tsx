import AppLayout from '@/components/layout/AppLayout';

export default function ArchivePage() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Archive
          </h1>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <p className="text-gray-600 dark:text-gray-400">
              Coming soon: Play past puzzles
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
