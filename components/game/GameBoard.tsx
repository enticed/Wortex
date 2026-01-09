'use client';

import { DndContext, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useState } from 'react';
import Vortex from './Vortex';
import AssemblyArea from './AssemblyArea';
import { useGameState } from '@/lib/hooks/useGameState';
import type { Puzzle } from '@/types/game';

interface GameBoardProps {
  puzzle: Puzzle;
}

export default function GameBoard({ puzzle }: GameBoardProps) {
  const { gameState, grabWord, placeWord, removeWord } = useGameState(puzzle);
  const [draggedWordId, setDraggedWordId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setDraggedWordId(event.active.id as string);
    grabWord(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over) {
      const wordId = active.id as string;
      const areaId = over.id as string;

      if (areaId === 'target' || areaId === 'facsimile') {
        placeWord(wordId, areaId);
      }
    }

    setDraggedWordId(null);
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Top 25% - Target Phrase Assembly Area */}
        <div className="h-1/4 border-b-2 border-gray-300 dark:border-gray-700 p-4 bg-blue-50 dark:bg-blue-950">
          <AssemblyArea
            id="target"
            title="Famous Quote (Manual Assembly)"
            placedWords={gameState.targetPhraseWords}
            expectedLength={puzzle.targetPhrase.words.length}
            bgColor="bg-blue-50 dark:bg-blue-950"
            borderColor="border-blue-300 dark:border-blue-700"
            isAutoAssembly={false}
          />
        </div>

        {/* Middle 50% - Vortex Area */}
        <div className="h-1/2 relative bg-gradient-to-b from-purple-100 to-indigo-100 dark:from-purple-950 dark:to-indigo-950">
          <Vortex
            words={gameState.vortexWords}
            onWordGrab={grabWord}
            isActive={!gameState.isComplete && !gameState.isPaused}
          />
        </div>

        {/* Bottom 25% - Facsimile Phrase Assembly Area */}
        <div className="h-1/4 border-t-2 border-gray-300 dark:border-gray-700 p-4 bg-green-50 dark:bg-green-950">
          <AssemblyArea
            id="facsimile"
            title="AI Facsimile (Auto Assembly)"
            placedWords={gameState.facsimilePhraseWords}
            expectedLength={puzzle.facsimilePhrase.words.length}
            bgColor="bg-green-50 dark:bg-green-950"
            borderColor="border-green-300 dark:border-green-700"
            isAutoAssembly={true}
          />
        </div>

        {/* Game Complete Overlay */}
        {gameState.isComplete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md mx-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Congratulations!
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You completed today's puzzle!
              </p>
              <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-4 mb-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Your Score
                </div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {gameState.score?.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  (Lower is better)
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Total words seen: {gameState.totalWordsSeen}
              </p>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                Continue to Bonus Round
              </button>
            </div>
          </div>
        )}

        {/* Debug Info (remove in production) */}
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-2 rounded shadow text-xs">
          <div>Vortex Words: {gameState.vortexWords.length}</div>
          <div>Target: {gameState.targetPhraseWords.length} / {puzzle.targetPhrase.words.length}</div>
          <div>Facsimile: {gameState.facsimilePhraseWords.length} / {puzzle.facsimilePhrase.words.length}</div>
          <div>Total Seen: {gameState.totalWordsSeen}</div>
        </div>
      </div>
    </DndContext>
  );
}
