'use client';

import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useState, useEffect, useRef } from 'react';
import Vortex from './Vortex';
import AssemblyArea from './AssemblyArea';
import Word from './Word';
import BonusRound from './BonusRound';
import { useGameState } from '@/lib/hooks/useGameState';
import { isPhraseComplete } from '@/lib/utils/game';
import { useUser } from '@/lib/contexts/UserContext';
import type { Puzzle } from '@/types/game';

interface GameBoardProps {
  puzzle: Puzzle;
}

export default function GameBoard({ puzzle }: GameBoardProps) {
  const { gameState, grabWord, placeWord, removeWord, reorderWords, answerBonus, skipBonus } = useGameState(puzzle);
  const { userId, refreshStats } = useUser();
  const [draggedWordId, setDraggedWordId] = useState<string | null>(null);
  const [draggedWordText, setDraggedWordText] = useState<string | null>(null);
  const [showBonusRound, setShowBonusRound] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const gameStartTime = useRef<number>(Date.now());

  // Configure sensors for both mouse and touch input
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10, // 10px movement before drag starts
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 100, // 100ms delay before drag starts (allows scrolling)
      tolerance: 5, // 5px movement tolerance
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragStart = (event: DragStartEvent) => {
    const wordId = event.active.id as string;
    setDraggedWordId(wordId);

    // Find the word text
    const vortexWord = gameState.vortexWords.find((w) => w.id === wordId);
    const targetWord = gameState.targetPhraseWords.find((w) => w.id === wordId);
    const wordText = vortexWord?.word || targetWord?.word || '';
    setDraggedWordText(wordText);

    grabWord(wordId);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Don't do anything - let @dnd-kit/sortable handle reordering internally
    // We'll save the final order in handleDragEnd
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setDraggedWordId(null);
    setDraggedWordText(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if reordering within target phrase area
    const isActiveInTarget = gameState.targetPhraseWords.some((w) => w.id === activeId);
    const isActiveInFacsimile = gameState.facsimilePhraseWords.some((w) => w.id === activeId);
    const isOverTargetWord = gameState.targetPhraseWords.some((w) => w.id === overId);
    const isOverFacsimileWord = gameState.facsimilePhraseWords.some((w) => w.id === overId);

    // Check if dragging a word from target back to vortex to discard it
    if (isActiveInTarget && overId === 'vortex') {
      removeWord(activeId, 'target');
      return;
    }

    // If dragging from vortex onto a word in target area, place it in target
    const isFromVortex = gameState.vortexWords.some((w) => w.id === activeId);
    if (isFromVortex && isOverTargetWord) {
      placeWord(activeId, 'target');
      return;
    }

    // If dragging from vortex onto a word in facsimile area, place it in facsimile
    if (isFromVortex && isOverFacsimileWord) {
      placeWord(activeId, 'facsimile');
      return;
    }

    // Reordering within target area
    if (isActiveInTarget && isOverTargetWord && activeId !== overId) {
      reorderWords(activeId, overId);
      return;
    }

    // Dropping directly on assembly area droppable zones
    if (overId === 'target' || overId === 'facsimile') {
      if (isFromVortex) {
        placeWord(activeId, overId);
      }
      // If it's already in target and dropped on target droppable, do nothing (keep it)
    }
  };

  // Submit score when bonus is answered
  useEffect(() => {
    async function submitScore() {
      if (gameState.bonusAnswered && !scoreSubmitted && userId && gameState.score !== null) {
        setScoreSubmitted(true);

        const timeTakenSeconds = Math.floor((Date.now() - gameStartTime.current) / 1000);

        try {
          const response = await fetch('/api/score/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              puzzleId: puzzle.id,
              score: gameState.score,
              bonusCorrect: gameState.bonusCorrect || false,
              timeTakenSeconds,
            }),
          });

          if (response.ok) {
            // Refresh user stats
            await refreshStats();
          } else {
            console.error('Failed to submit score');
          }
        } catch (error) {
          console.error('Error submitting score:', error);
        }
      }
    }

    submitScore();
  }, [gameState.bonusAnswered, scoreSubmitted, userId, gameState.score, gameState.bonusCorrect, puzzle.id, refreshStats]);

  // Check if individual phrases are complete
  const isTargetComplete = isPhraseComplete(
    gameState.targetPhraseWords,
    puzzle.targetPhrase.words
  );

  const isFacsimileComplete = isPhraseComplete(
    gameState.facsimilePhraseWords,
    puzzle.facsimilePhrase.words
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-900 touch-none overscroll-none">
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
            isComplete={isTargetComplete}
            completedText={puzzle.targetPhrase.text}
          />
        </div>

        {/* Middle 50% - Vortex Area or Bonus Round */}
        <div className="h-1/2 relative bg-gradient-to-b from-purple-100 to-indigo-100 dark:from-purple-950 dark:to-indigo-950">
          {gameState.isComplete && !gameState.bonusAnswered ? (
            // Show bonus round in vortex area
            <div className="h-full flex items-center justify-center p-4">
              <BonusRound
                bonusQuestion={puzzle.bonusQuestion}
                onAnswer={(selectedAnswerId, isCorrect) => {
                  answerBonus(isCorrect);
                }}
                onSkip={skipBonus}
              />
            </div>
          ) : (
            <Vortex
              words={gameState.vortexWords}
              onWordGrab={grabWord}
              isActive={!gameState.isComplete && !gameState.isPaused}
            />
          )}
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
            isComplete={isFacsimileComplete}
            completedText={puzzle.facsimilePhrase.text}
          />
        </div>

        {/* Final Results (after bonus) */}
        {gameState.bonusAnswered && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md mx-4">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Final Results
              </h2>
              <div className="space-y-4 mb-6">
                <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Puzzle Score
                  </div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {gameState.score?.toFixed(2)}
                  </div>
                </div>
                <div className={`rounded-lg p-4 ${
                  gameState.bonusCorrect
                    ? 'bg-green-100 dark:bg-green-900'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Bonus Question
                  </div>
                  <div className={`text-2xl font-bold ${
                    gameState.bonusCorrect
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {gameState.bonusCorrect ? '✓ Correct' : '✗ Incorrect'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Play Again Tomorrow
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

      {/* Drag Overlay - shows the word being dragged */}
      <DragOverlay dropAnimation={null}>
        {draggedWordText ? (
          <div className="px-6 py-3 rounded-lg font-bold text-lg bg-yellow-300 dark:bg-yellow-600 text-gray-900 dark:text-gray-100 shadow-2xl border-2 border-yellow-500 dark:border-yellow-400 scale-125 cursor-grabbing animate-pulse">
            {draggedWordText}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
