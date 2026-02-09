'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import ResultsViewer from '@/components/game/ResultsViewer';

function ResultsPageContent() {
  const searchParams = useSearchParams();
  const date = searchParams.get('date');

  if (!date) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No puzzle date specified
            </p>
            <a
              href="/stats"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Go to Stats
            </a>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Check if the date is today (not archive mode)
  const today = new Date().toISOString().split('T')[0];
  const isArchiveMode = date !== today;

  return (
    <AppLayout showHeader={true} isArchiveMode={isArchiveMode}>
      <ResultsViewer puzzleDate={date} />
    </AppLayout>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    }>
      <ResultsPageContent />
    </Suspense>
  );
}
