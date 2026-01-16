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
  const [vortexSpeed, setVortexSpeed] = useState(1.0); // Speed multiplier for vortex rotation
  const {
    gameState,
    grabWord,
    placeWord,
    removeWord,
    reorderWords,
    answerBonus,
    skipBonus,
    dismissWord,
    autoCaptureFacsimileWord,
    useUnnecessaryWordHint,
    useCorrectStringHint,
    useNextWordHint,
    confirmPhase1Complete,
  } = useGameState(puzzle, vortexSpeed);
  const { userId, refreshStats } = useUser();
  const [draggedWordId, setDraggedWordId] = useState<string | null>(null);
  const [draggedWordText, setDraggedWordText] = useState<string | null>(null);
  const [draggedWordBelongsTo, setDraggedWordBelongsTo] = useState<'target' | 'facsimile' | 'spurious' | null>(null);
  const [showBonusRound, setShowBonusRound] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<number | null>(null); // Phase 2 insertion indicator
  const [allowBonusRound, setAllowBonusRound] = useState(false); // Delay showing bonus round for animation
  const gameStartTime = useRef<number>(Date.now());

  // Configure sensors for both mouse and touch input
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10, // 10px movement before drag starts
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 50, // Reduced to 50ms for more responsive flicking
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

  // Check if we're dragging a word in Phase 2 reordering mode
  const isPhase2Reordering = gameState.phase === 2 &&
    draggedWordId &&
    gameState.targetPhraseWords.some((w) => w.id === draggedWordId);

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    // Phase 2: Show insertion indicator without reordering
    if (gameState.phase === 2 && over) {
      const activeId = active.id as string;
      const overId = over.id as string;

      const isActiveInTarget = gameState.targetPhraseWords.some((w) => w.id === activeId);

      if (isActiveInTarget) {
        // If dropping on target area itself (not a word), place at end
        if (overId === 'target') {
          setDropIndicatorIndex(gameState.targetPhraseWords.length);
        } else {
          // Find the index of the word being hovered over
          const overIndex = gameState.targetPhraseWords.findIndex((w) => w.id === overId);
          if (overIndex !== -1) {
            // Show indicator before the hovered word
            setDropIndicatorIndex(overIndex);
          }
        }
      }
    } else {
      setDropIndicatorIndex(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;

    setDraggedWordId(null);
    setDraggedWordText(null);
    setDraggedWordBelongsTo(null);
    setDropIndicatorIndex(null); // Clear insertion indicator

    const activeId = active.id as string;

    // Calculate velocity from delta (movement since last frame)
    // High velocity = flicking gesture
    const velocity = Math.sqrt(delta.x * delta.x + delta.y * delta.y);
    const isFlick = velocity > 15; // Threshold for flick detection (pixels)

    // If no collision detected but flicking with upward motion, try trajectory prediction
    if (!over && isFlick) {
      const isFromVortex = gameState.vortexWords.some((w) => w.id === activeId);

      // Only handle flicks from vortex during Phase 1
      if (isFromVortex && gameState.phase === 1) {
        // Check for dismiss gesture (strong rightward flick)
        if (delta.x > 30 && Math.abs(delta.y) < 20) {
          dismissWord(activeId);
          return;
        }

        // Vertical flick detection - direction determines placement
        // Players can place ANY word in the target area (it's part of the puzzle!)
        // Facsimile area is auto-collected, so no manual placement there
        if (Math.abs(delta.y) > Math.abs(delta.x)) {
          if (delta.y < -15) {
            // Strong upward flick → target area (any word allowed)
            placeWord(activeId, 'target');
            return;
          }
          // Downward flick doesn't place (facsimile is auto-collected)
          // Word returns to vortex
        }
      }

      // No successful flick detection - word returns to vortex
      return;
    }

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
              speed: gameState.speed,
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

  // Auto-remove unnecessary word after brief highlight
  useEffect(() => {
    if (gameState.activeHint?.type === 'unnecessary' && gameState.activeHint.wordIds.length > 0) {
      const wordId = gameState.activeHint.wordIds[0];

      // Brief delay to show highlight, then remove word
      const timeout = setTimeout(() => {
        const updatedWords = gameState.targetPhraseWords.filter(w => w.id !== wordId);
        reorderWords(updatedWords);
      }, 800); // 800ms highlight duration

      return () => clearTimeout(timeout);
    }
  }, [gameState.activeHint, gameState.targetPhraseWords, reorderWords]);

  // Delay bonus round display to allow completion animation to play
  useEffect(() => {
    if (gameState.isComplete && gameState.showCompletionAnimation) {
      // Reset allowBonusRound when puzzle completes
      setAllowBonusRound(false);

      // Wait for animation to complete (1.2s) before showing bonus round
      const timer = setTimeout(() => {
        setAllowBonusRound(true);
      }, 1300); // Slightly longer than animation duration

      return () => clearTimeout(timer);
    } else if (!gameState.isComplete) {
      // Reset when puzzle is not complete
      setAllowBonusRound(false);
    }
  }, [gameState.isComplete, gameState.showCompletionAnimation]);

  // Check if individual phrases are complete
  const isTargetComplete = isPhraseComplete(
    gameState.targetPhraseWords,
    puzzle.targetPhrase.words
  );

  const isFacsimileComplete = isPhraseComplete(
    gameState.facsimilePhraseWords,
    puzzle.facsimilePhrase.words
  );

  // Create set of facsimile words for auto-capture checking
  const facsimileWordsSet = new Set(
    puzzle.facsimilePhrase.words.map(w => w.toLowerCase())
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="h-[calc(100dvh-3rem)] w-full flex flex-col bg-gray-50 dark:bg-gray-900 touch-none overscroll-none">
        {/* Top Area - Phase 1: 35%, Phase 2: 75% */}
        <div className={`border-b-2 border-gray-300 dark:border-gray-700 p-3 bg-blue-50 dark:bg-blue-950 transition-all duration-500 ${
          gameState.phase === 2 ? 'h-[75%]' : 'h-[35%]'
        }`}>
          <AssemblyArea
            id="target"
            title={gameState.phase === 2 ? "Original" : "Original"}
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
            activeHint={gameState.activeHint}
            onUseUnnecessaryWordHint={useUnnecessaryWordHint}
            onUseCorrectStringHint={useCorrectStringHint}
            onUseNextWordHint={useNextWordHint}
            hintsUsed={gameState.hintsUsed}
            reorderMoves={gameState.reorderMoves}
            phase={gameState.phase}
            showCompletionAnimation={gameState.showCompletionAnimation}
            totalWordsSeen={gameState.totalWordsSeen}
            totalUniqueWords={puzzle.targetPhrase.words.length + puzzle.facsimilePhrase.words.length}
            speed={gameState.speed}
          />
        </div>

        {/* Middle Area - Vortex (Phase 1), Bonus Round, or Final Results */}
        {gameState.phase === 1 && (
          <div className="h-[50%] relative bg-gradient-to-b from-purple-100 to-indigo-100 dark:from-purple-950 dark:to-indigo-950 py-2">
            {gameState.bonusAnswered ? (
              // Show final results in vortex area
              <FinalResults
                phase1Score={gameState.score || 0}
                phase2Score={gameState.phase2Score || 0}
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
                onAutoCapture={autoCaptureFacsimileWord}
                isActive={!gameState.isComplete && !gameState.isPaused}
                speed={vortexSpeed}
                isFacsimileComplete={isFacsimileComplete}
                facsimileWords={facsimileWordsSet}
                totalWordsSeen={gameState.totalWordsSeen}
              />
            )}

          {/* Speed Slider - Bottom Left */}
          {!gameState.isComplete && (
            <div className="absolute bottom-2 left-2 flex flex-col items-center gap-1">
              <input
                type="range"
                min="0.25"
                max="2"
                step="0.25"
                value={vortexSpeed}
                onChange={(e) => setVortexSpeed(parseFloat(e.target.value))}
                className="h-24 cursor-pointer"
                style={{
                  WebkitAppearance: 'slider-vertical' as any,
                  appearance: 'slider-vertical' as any,
                  width: '2px',
                  background: 'transparent',
                }}
              />
              <div className="text-xs text-gray-700 dark:text-gray-300 font-mono font-bold">
                {vortexSpeed.toFixed(2)}x
              </div>
            </div>
          )}
          </div>
        )}

        {/* Phase 2 Complete - Show bonus/results in middle area */}
        {gameState.phase === 2 && gameState.isComplete && allowBonusRound && (
          <div className="h-[50%] relative bg-gradient-to-b from-purple-100 to-indigo-100 dark:from-purple-950 dark:to-indigo-950 py-2">
            {gameState.bonusAnswered ? (
              <FinalResults
                phase1Score={gameState.score || 0}
                phase2Score={gameState.phase2Score || 0}
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

        {/* Bottom Area - Facsimile Phrase Assembly Area - Phase 1: 15%, Phase 2: 25% */}
        <div className={`border-t-2 border-gray-300 dark:border-gray-700 p-3 bg-green-50 dark:bg-green-950 transition-all duration-500 ${
          gameState.phase === 2 ? 'h-[25%]' : 'h-[15%]'
        }`}>
          <AssemblyArea
            id="facsimile"
            title="Spin-off"
            placedWords={gameState.facsimilePhraseWords}
            expectedLength={puzzle.facsimilePhrase.words.length}
            bgColor="bg-green-50 dark:bg-green-950"
            borderColor="border-green-300 dark:border-green-700"
            isAutoAssembly={true}
            isComplete={isFacsimileComplete}
            completedText={puzzle.facsimilePhrase.text}
            phase={gameState.phase}
          />
        </div>

      </div>

      {/* Drag Overlay - Hidden (word display moved to vortex corners) */}
      <DragOverlay
        dropAnimation={null}
        style={{ cursor: 'grabbing', opacity: 0 }}
      >
        {draggedWordText ? <div className="hidden" /> : null}
      </DragOverlay>

      {/* Corner Word Display - Shows dragged word in vortex corners */}
      {draggedWordText && gameState.phase === 1 && !gameState.isComplete && (
        <div className="fixed inset-0 pointer-events-none z-40">
          {/* Calculate vortex area position (middle 50% of screen) */}
          {(() => {
            // Top area is 35% in Phase 1
            const topAreaHeight = 35;
            // Vortex starts after top area
            const vortexTop = topAreaHeight;
            // Vortex height is 50%
            const vortexHeight = 50;

            return (
              <>
                {/* Target words: Display in TOP RIGHT corner */}
                {draggedWordBelongsTo === 'target' && (
                  <div
                    className="absolute right-3"
                    style={{ top: `${vortexTop + 2}%` }}
                  >
                    <div className="px-4 py-2 rounded-lg font-semibold text-sm bg-yellow-300 dark:bg-yellow-600 text-gray-900 dark:text-gray-100 shadow-2xl border-2 border-yellow-500 dark:border-yellow-400 animate-pulse">
                      {draggedWordText}
                    </div>
                  </div>
                )}

                {/* Facsimile words: Display in BOTTOM RIGHT corner */}
                {draggedWordBelongsTo === 'facsimile' && (
                  <div
                    className="absolute right-3"
                    style={{ top: `${vortexTop + vortexHeight - 6}%` }}
                  >
                    <div className="px-4 py-2 rounded-lg font-semibold text-sm bg-yellow-300 dark:bg-yellow-600 text-gray-900 dark:text-gray-100 shadow-2xl border-2 border-yellow-500 dark:border-yellow-400 animate-pulse">
                      {draggedWordText}
                    </div>
                  </div>
                )}

                {/* Spurious words: Display in BOTH corners */}
                {draggedWordBelongsTo === 'spurious' && (
                  <>
                    {/* Top right */}
                    <div
                      className="absolute right-3"
                      style={{ top: `${vortexTop + 2}%` }}
                    >
                      <div className="px-4 py-2 rounded-lg font-semibold text-sm bg-yellow-300 dark:bg-yellow-600 text-gray-900 dark:text-gray-100 shadow-2xl border-2 border-yellow-500 dark:border-yellow-400 animate-pulse">
                        {draggedWordText}
                      </div>
                    </div>
                    {/* Bottom right */}
                    <div
                      className="absolute right-3"
                      style={{ top: `${vortexTop + vortexHeight - 6}%` }}
                    >
                      <div className="px-4 py-2 rounded-lg font-semibold text-sm bg-yellow-300 dark:bg-yellow-600 text-gray-900 dark:text-gray-100 shadow-2xl border-2 border-yellow-500 dark:border-yellow-400 animate-pulse">
                        {draggedWordText}
                      </div>
                    </div>
                  </>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Phase 1 Complete Confirmation Dialog */}
      {gameState.showPhase1CompleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md mx-4 border-2 border-purple-400 dark:border-purple-600">
            <div className="text-center">
              <div className="text-4xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Phase 1 Complete!
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                All required words collected! Ready to put them in the correct order?
              </p>
              <button
                onClick={confirmPhase1Complete}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  );
}
