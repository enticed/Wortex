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
  const [draggedWordBelongsTo, setDraggedWordBelongsTo] = useState<'target' | 'facsimile' | 'spurious' | null>(null);
  const [showBonusRound, setShowBonusRound] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [vortexSpeed, setVortexSpeed] = useState(1.0); // Speed multiplier for vortex rotation
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<number | null>(null); // Phase 2 insertion indicator
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

    // Find the word and determine which phrase it belongs to
    const vortexWord = gameState.vortexWords.find((w) => w.id === wordId);
    const targetWord = gameState.targetPhraseWords.find((w) => w.id === wordId);
    const facsimileWord = gameState.facsimilePhraseWords.find((w) => w.id === wordId);

    const wordText = vortexWord?.word || targetWord?.word || facsimileWord?.word || '';
    const belongsTo = vortexWord?.belongsTo || targetWord?.belongsTo || facsimileWord?.belongsTo || null;

    setDraggedWordText(wordText);
    setDraggedWordBelongsTo(belongsTo);

    grabWord(wordId);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    // Phase 2: Show insertion indicator without reordering
    if (gameState.phase === 2 && over) {
      const activeId = active.id as string;
      const overId = over.id as string;

      const isActiveInTarget = gameState.targetPhraseWords.some((w) => w.id === activeId);

      console.log('[Phase 2 Drag Over]', { activeId, overId, isActiveInTarget, wordsCount: gameState.targetPhraseWords.length });

      if (isActiveInTarget) {
        // If dropping on target area itself (not a word), place at end
        if (overId === 'target') {
          console.log('  -> Setting indicator at END');
          setDropIndicatorIndex(gameState.targetPhraseWords.length);
        } else {
          // Find the index where we would insert
          const overIndex = gameState.targetPhraseWords.findIndex((w) => w.id === overId);
          console.log('  -> Found overIndex:', overIndex);
          if (overIndex !== -1) {
            // Simply use the overIndex - show indicator before the hovered word
            setDropIndicatorIndex(overIndex);
          }
        }
      }
    } else {
      setDropIndicatorIndex(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setDraggedWordId(null);
    setDraggedWordText(null);
    setDraggedWordBelongsTo(null);
    setDropIndicatorIndex(null); // Clear insertion indicator

    const activeId = active.id as string;
    if (!over) return;

    const overId = over.id as string;

    // Check placement sources
    const isActiveInTarget = gameState.targetPhraseWords.some((w) => w.id === activeId);
    const isActiveInFacsimile = gameState.facsimilePhraseWords.some((w) => w.id === activeId);
    const isFromVortex = gameState.vortexWords.some((w) => w.id === activeId);

    // Phase 2: Handle reordering within target area
    if (gameState.phase === 2 && isActiveInTarget) {
      const oldIndex = gameState.targetPhraseWords.findIndex((w) => w.id === activeId);

      let newIndex: number;
      if (overId === 'target') {
        // Dropping on target area itself - place at end
        newIndex = gameState.targetPhraseWords.length;
      } else if (dropIndicatorIndex !== null) {
        // Use the indicator index
        newIndex = dropIndicatorIndex;
      } else {
        // Fallback - shouldn't happen
        newIndex = gameState.targetPhraseWords.findIndex((w) => w.id === overId);
      }

      if (oldIndex !== newIndex && newIndex !== -1 && oldIndex !== -1) {
        const reordered = [...gameState.targetPhraseWords];
        const [removed] = reordered.splice(oldIndex, 1);
        // Adjust insertion index if we removed from before the target position
        const adjustedIndex = oldIndex < newIndex ? newIndex - 1 : newIndex;
        reordered.splice(adjustedIndex, 0, removed);
        reorderWords(reordered);
      }
      return;
    }

    // Phase 1: Regular placement/removal
    // Remove word from assembly area back to vortex
    if (isActiveInTarget && overId === 'vortex') {
      removeWord(activeId, 'target');
      return;
    }
    if (isActiveInFacsimile && overId === 'vortex') {
      removeWord(activeId, 'facsimile');
      return;
    }

    // Place word from vortex into assembly areas
    if (overId === 'target' || overId === 'facsimile') {
      if (isFromVortex) {
        placeWord(activeId, overId);
      }
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
      <div className="h-[calc(100dvh-3rem)] w-full flex flex-col bg-gray-50 dark:bg-gray-900 touch-none overscroll-none">
        {/* Top Area - Phase 1: 25%, Phase 2: 75% */}
        <div className={`border-b-2 border-gray-300 dark:border-gray-700 p-3 bg-blue-50 dark:bg-blue-950 transition-all duration-500 ${
          gameState.phase === 2 ? 'h-[75%]' : 'h-[25%]'
        }`}>
          <AssemblyArea
            id="target"
            title={gameState.phase === 2 ? "Famous Quote (Reorder)" : "Famous Quote (Collect Words)"}
            placedWords={gameState.targetPhraseWords}
            expectedLength={puzzle.targetPhrase.words.length}
            expectedWords={puzzle.targetPhrase.words}
            bgColor="bg-blue-50 dark:bg-blue-950"
            borderColor="border-blue-300 dark:border-blue-700"
            isAutoAssembly={false}
            isComplete={isTargetComplete}
            completedText={puzzle.targetPhrase.text}
            onReorder={gameState.phase === 2 ? reorderWords : undefined}
            dropIndicatorIndex={dropIndicatorIndex}
          />
        </div>

        {/* Middle Area - Vortex (Phase 1), Bonus Round, or Final Results */}
        {gameState.phase === 1 && (
          <div className="h-[50%] relative bg-gradient-to-b from-purple-100 to-indigo-100 dark:from-purple-950 dark:to-indigo-950 py-2">
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
                speed={vortexSpeed}
              />
            )}

          {/* Speed Slider - Left Edge */}
          {!gameState.isComplete && (
            <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-2 rounded-lg shadow-lg">
              <div className="text-[10px] text-gray-600 dark:text-gray-400 font-semibold">
                FAST
              </div>
              <input
                type="range"
                min="0.25"
                max="2"
                step="0.25"
                value={vortexSpeed}
                onChange={(e) => setVortexSpeed(parseFloat(e.target.value))}
                className="h-32 cursor-pointer"
                style={{
                  WebkitAppearance: 'slider-vertical' as any,
                  appearance: 'slider-vertical' as any,
                  width: '8px',
                }}
              />
              <div className="text-[10px] text-gray-600 dark:text-gray-400 font-semibold">
                SLOW
              </div>
              <div className="text-[10px] text-gray-600 dark:text-gray-400 font-mono font-bold">
                {vortexSpeed.toFixed(2)}x
              </div>
            </div>
          )}

            {/* Debug Info - inside vortex area */}
            <div className="absolute bottom-2 left-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-1.5 rounded shadow text-[10px] leading-tight pointer-events-none">
              <div>Phase:{gameState.phase}</div>
              <div>V:{gameState.vortexWords.length}</div>
              <div>T:{gameState.targetPhraseWords.length}/{puzzle.targetPhrase.words.length}</div>
              <div>F:{gameState.facsimilePhraseWords.length}/{puzzle.facsimilePhrase.words.length}</div>
              <div>Seen:{gameState.totalWordsSeen}</div>
            </div>
          </div>
        )}

        {/* Phase 2 Complete - Show bonus/results in middle area */}
        {gameState.phase === 2 && gameState.isComplete && (
          <div className="h-[50%] relative bg-gradient-to-b from-purple-100 to-indigo-100 dark:from-purple-950 dark:to-indigo-950 py-2">
            {gameState.bonusAnswered ? (
              <FinalResults
                puzzleScore={gameState.score || 0}
                finalScore={gameState.finalScore || 0}
                bonusCorrect={gameState.bonusCorrect}
                onPlayAgain={() => window.location.reload()}
              />
            ) : (
              <div className="h-full flex items-center justify-center px-2">
                <BonusRound
                  bonusQuestion={puzzle.bonusQuestion}
                  onAnswer={(selectedAnswerId, isCorrect) => {
                    answerBonus(isCorrect);
                  }}
                  onSkip={skipBonus}
                />
              </div>
            )}
          </div>
        )}

        {/* Bottom 25% - Facsimile Phrase Assembly Area */}
        <div className="h-[25%] border-t-2 border-gray-300 dark:border-gray-700 p-3 bg-green-50 dark:bg-green-950">
          <AssemblyArea
            id="facsimile"
            title="Spoof (Auto-Assembly)"
            placedWords={gameState.facsimilePhraseWords}
            expectedLength={puzzle.facsimilePhrase.words.length}
            bgColor="bg-green-50 dark:bg-green-950"
            borderColor="border-green-300 dark:border-green-700"
            isAutoAssembly={true}
            isComplete={isFacsimileComplete}
            completedText={puzzle.facsimilePhrase.text}
          />
        </div>

      </div>

      {/* Drag Overlay - shows the word being dragged */}
      <DragOverlay
        dropAnimation={null}
        style={{ cursor: 'grabbing' }}
        modifiers={
          draggedWordBelongsTo === 'spurious' ? undefined : [
            // Only offset target/facsimile words - spurious words render at finger position
            ({ transform }) => {
              const yOffset = draggedWordBelongsTo === 'facsimile' ? 50 : -50;
              return {
                ...transform,
                y: transform.y + yOffset,
              };
            }
          ]
        }
      >
        {draggedWordText ? (
          draggedWordBelongsTo === 'spurious' ? (
            // Spurious words: show both above and below finger simultaneously
            // Centered at cursor position (not offset)
            <div className="relative pointer-events-none" style={{ width: '200px', height: '120px', marginLeft: '-100px', marginTop: '-60px' }}>
              {/* Word above cursor */}
              <div className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap" style={{ top: '0px' }}>
                <div className="px-4 py-2 rounded-lg font-semibold text-sm bg-yellow-300 dark:bg-yellow-600 text-gray-900 dark:text-gray-100 shadow-2xl border-2 border-yellow-500 dark:border-yellow-400">
                  {draggedWordText}
                </div>
              </div>

              {/* Tether line above */}
              <div className="absolute left-1/2 -translate-x-1/2 bg-yellow-400 dark:bg-yellow-500 opacity-50" style={{ top: '36px', width: '2px', height: '20px' }} />

              {/* Cursor position marker (centered) */}
              <div className="absolute left-1/2 -translate-x-1/2 bg-blue-500 rounded-full shadow-lg" style={{ top: '54px', width: '6px', height: '6px' }} />

              {/* Tether line below */}
              <div className="absolute left-1/2 -translate-x-1/2 bg-yellow-400 dark:bg-yellow-500 opacity-50" style={{ top: '62px', width: '2px', height: '20px' }} />

              {/* Word below cursor */}
              <div className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap" style={{ top: '82px' }}>
                <div className="px-4 py-2 rounded-lg font-semibold text-sm bg-yellow-300 dark:bg-yellow-600 text-gray-900 dark:text-gray-100 shadow-2xl border-2 border-yellow-500 dark:border-yellow-400">
                  {draggedWordText}
                </div>
              </div>
            </div>
          ) : (
            // Target or Facsimile words: show in appropriate direction
            <div className="relative">
              {/* Tether line connecting to finger */}
              <div
                className={`absolute left-1/2 w-0.5 h-[50px] bg-yellow-400 dark:bg-yellow-500 opacity-50 ${
                  draggedWordBelongsTo === 'facsimile' ? 'bottom-full' : 'top-full'
                }`}
                style={{ transformOrigin: draggedWordBelongsTo === 'facsimile' ? 'bottom' : 'top' }}
              />

              {/* Dragged word - matches original styling */}
              <div className="px-4 py-2 rounded-lg font-semibold text-sm bg-yellow-300 dark:bg-yellow-600 text-gray-900 dark:text-gray-100 shadow-2xl border-2 border-yellow-500 dark:border-yellow-400">
                {draggedWordText}
              </div>
            </div>
          )
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
