'use client';

import { useEffect, useState } from 'react';
import GameBoard from './GameBoard';
import { getUserTimezone } from '@/lib/utils/game';
import type { Puzzle } from '@/types/game';

interface PuzzleLoaderProps {
  fallbackPuzzle: Puzzle;
}

export default function PuzzleLoader({ fallbackPuzzle }: PuzzleLoaderProps) {
  const [puzzle, setPuzzle] = useState<Puzzle>(fallbackPuzzle);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPuzzle() {
      try {
        const timezone = getUserTimezone();
        const response = await fetch(`/api/puzzle/daily?timezone=${encodeURIComponent(timezone)}`);

        if (response.ok) {
          const data = await response.json();
          if (data.puzzle) {
            setPuzzle(data.puzzle);
          }
        }
      } catch (error) {
        console.error('Error loading daily puzzle:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPuzzle();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading today&apos;s puzzle...</p>
        </div>
      </div>
    );
  }

  return <GameBoard puzzle={puzzle} />;
}
