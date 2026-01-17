'use client';

import { Suspense } from 'react';
import PuzzleLoader from './PuzzleLoader';
import type { Puzzle } from '@/types/game';

interface PuzzleLoaderWrapperProps {
  fallbackPuzzle: Puzzle;
}

export default function PuzzleLoaderWrapper({ fallbackPuzzle }: PuzzleLoaderWrapperProps) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading puzzle...</p>
        </div>
      </div>
    }>
      <PuzzleLoader fallbackPuzzle={fallbackPuzzle} />
    </Suspense>
  );
}
