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
  useDroppable,
} from '@dnd-kit/core';
import { useState, useEffect, useRef } from 'react';
import Vortex from './Vortex';
import AssemblyArea from './AssemblyArea';
import Word from './Word';
import BonusRound from './BonusRound';
import FinalResults from './FinalResults';
import DismissZone from './DismissZone';
import { useGameState } from '@/lib/hooks/useGameState';
import { isPhraseComplete } from '@/lib/utils/game';
import { useUser } from '@/lib/contexts/UserContext';
import type { Puzzle } from '@/types/game';

interface GameBoardProps {
  puzzle: Puzzle;
}

export default function GameBoard({ puzzle }: GameBoardProps) {
  const { gameState, grabWord, placeWord, removeWord, reorderWords, answerBonus, skipBonus, dismissWord } = useGameState(puzzle);
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

    const activeId = active.id as string;

    // Check if dragging to right edge to dismiss
    if (over && over.id === 'dismiss-zone') {
      const isFromVortex = gameState.vortexWords.some((w) => w.id === activeId);
      if (isFromVortex) {
        dismissWord(activeId);
        return;
      }
    }

    if (!over) return;

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
      if (gameState.bonusAnswered && !scoreSubmitted && userId && gameState.finalScore !== null) {
        setScoreSubmitted(true);

        const timeTakenSeconds = Math.floor((Date.now() - gameStartTime.current) / 1000);

        try {
          const response = await fetch('/api/score/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              puzzleId: puzzle.id,
              score: gameState.finalScore,
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
  }, [gameState.bonusAnswered, scoreSubmitted, userId, gameState.finalScore, gameState.bonusCorrect, puzzle.id, refreshStats]);

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
      <div className="h-[100dvh] w-full flex flex-col bg-gray-50 dark:bg-gray-900 touch-none overscroll-none">
        {/* Top 30% - Target Phrase Assembly Area */}
        <div className="h-[30%] border-b-2 border-gray-300 dark:border-gray-700 p-3 bg-blue-50 dark:bg-blue-950">
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

        {/* Middle 40% - Vortex Area, Bonus Round, or Final Results */}
        <div className="h-[40%] relative bg-gradient-to-b from-purple-100 to-indigo-100 dark:from-purple-950 dark:to-indigo-950 py-2">
          {gameState.bonusAnswered ? (
            // Show final results in vortex area
            <FinalResults
              puzzleScore={gameState.score || 0}
              finalScore={gameState.finalScore || 0}
              bonusCorrect={gameState.bonusCorrect}
              onPlayAgain={() => window.location.reload()}
            />
          ) : gameState.isComplete ? (
            // Show bonus round in vortex area
            <div className="h-full flex items-center justify-center px-2">
              <BonusRound
                bonusQuestion={puzzle.bonusQuestion}
                onAnswer={(selectedAnswerId, isCorrect) => {
                  answerBonus(isCorrect);
                }}
                onSkip={skipBonus}
              />
            </div>
          ) : (
            // Show vortex
            <Vortex
              words={gameState.vortexWords}
              onWordGrab={grabWord}
              isActive={!gameState.isComplete && !gameState.isPaused}
            />
          )}
        </div>

        {/* Bottom 30% - Facsimile Phrase Assembly Area */}
        <div className="h-[30%] border-t-2 border-gray-300 dark:border-gray-700 p-3 bg-green-50 dark:bg-green-950">
          <AssemblyArea
            id="facsimile"
            title="Spoof (Auto Assembly)"
            placedWords={gameState.facsimilePhraseWords}
            expectedLength={puzzle.facsimilePhrase.words.length}
            bgColor="bg-green-50 dark:bg-green-950"
            borderColor="border-green-300 dark:border-green-700"
            isAutoAssembly={true}
            isComplete={isFacsimileComplete}
            completedText={puzzle.facsimilePhrase.text}
          />
        </div>

        {/* Debug Info (remove in production) */}
        <div className="fixed top-2 left-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-1.5 rounded shadow text-[10px] leading-tight pointer-events-none">
          <div>V:{gameState.vortexWords.length}</div>
          <div>T:{gameState.targetPhraseWords.length}/{puzzle.targetPhrase.words.length}</div>
          <div>F:{gameState.facsimilePhraseWords.length}/{puzzle.facsimilePhrase.words.length}</div>
          <div>Seen:{gameState.totalWordsSeen}</div>
        </div>

        {/* Dismiss Zone - Right Edge */}
        {draggedWordId && gameState.vortexWords.some((w) => w.id === draggedWordId) && (
          <DismissZone />
        )}
      </div>

      {/* Drag Overlay - shows the word being dragged */}
      <DragOverlay dropAnimation={null} modifiers={[
        // Offset the preview above the touch point so finger doesn't obscure it
        ({ transform }) => ({
          ...transform,
          y: transform.y - 50, // Move 50px above finger
        })
      ]}>
        {draggedWordText ? (
          <div className="relative">
            {/* Tether line connecting to finger */}
            <div className="absolute left-1/2 top-full w-0.5 h-[50px] bg-yellow-400 dark:bg-yellow-500 opacity-50" style={{ transformOrigin: 'top' }} />

            {/* Dragged word - matches original styling */}
            <div className="px-4 py-2 rounded-lg font-semibold text-sm bg-yellow-300 dark:bg-yellow-600 text-gray-900 dark:text-gray-100 shadow-2xl border-2 border-yellow-500 dark:border-yellow-400">
              {draggedWordText}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
