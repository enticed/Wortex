'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import GameBoard from './GameBoard';
import AppLayout from '@/components/layout/AppLayout';
import { GameErrorBoundary } from '@/components/error/GameErrorBoundary';
import { getUserTimezone } from '@/lib/utils/game';
import type { Puzzle } from '@/types/game';

interface PuzzleLoaderProps {
  fallbackPuzzle: Puzzle;
}

export default function PuzzleLoader({ fallbackPuzzle }: PuzzleLoaderProps) {
  const [puzzle, setPuzzle] = useState<Puzzle>(fallbackPuzzle);
  const [loading, setLoading] = useState(true);
  const [isArchiveMode, setIsArchiveMode] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    async function loadPuzzle() {
      try {
        const date = searchParams.get('date');
        const archive = searchParams.get('archive');
        const shouldShowResults = searchParams.get('showResults');

        // Check if we should show results
        if (shouldShowResults === 'true') {
          setShowResults(true);
        }

        // Archive mode: load specific past puzzle
        if (date && archive === 'true') {
          setIsArchiveMode(true);
          const timezone = getUserTimezone();
          const response = await fetch(`/api/puzzle/daily?timezone=${encodeURIComponent(timezone)}&date=${date}`);

          if (response.ok) {
            const data = await response.json();
            if (data.puzzle) {
              setPuzzle(data.puzzle);
            }
          } else {
            console.error('Error loading archive puzzle');
          }
        } else {
          // Normal mode: load today's puzzle
          setIsArchiveMode(false);
          const timezone = getUserTimezone();
          const response = await fetch(`/api/puzzle/daily?timezone=${encodeURIComponent(timezone)}`);

          if (response.ok) {
            const data = await response.json();
            if (data.puzzle) {
              setPuzzle(data.puzzle);
            }
          }
        }
      } catch (error) {
        console.error('Error loading puzzle:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPuzzle();
  }, [searchParams]);

  if (loading) {
    return (
      <AppLayout showHeader={true} isArchiveMode={isArchiveMode} isGamePage={true}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {isArchiveMode ? 'Loading puzzle...' : 'Loading today\'s puzzle...'}
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showHeader={true} isArchiveMode={isArchiveMode} isGamePage={true}>
      <GameErrorBoundary>
        <GameBoard puzzle={puzzle} isArchiveMode={isArchiveMode} showResults={showResults} />
      </GameErrorBoundary>
    </AppLayout>
  );
}
