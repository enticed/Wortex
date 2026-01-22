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
import { createClient } from '@/lib/supabase/client';
import type { Puzzle } from '@/types/game';

interface GameBoardProps {
  puzzle: Puzzle;
  isArchiveMode?: boolean;
}

export default function GameBoard({ puzzle, isArchiveMode = false }: GameBoardProps) {
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
  const dragOverlayRef = useRef<{ x: number; y: number } | null>(null); // Track drag position

  // Configure sensors for both mouse and touch input
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10, // 10px movement before drag starts
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 50, // Reduced to 50ms for more responsive flicking
      tolerance: 10, // Increased tolerance to prevent accidental indicator movement
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
    const { active, over, collisions } = event;

    // Phase 2: Show insertion indicator without reordering
    if (gameState.phase === 2 && over) {
      const activeId = active.id as string;
      const overId = over.id as string;

      const isActiveInTarget = gameState.targetPhraseWords.some((w) => w.id === activeId);

      if (isActiveInTarget) {
        let targetIndex: number | null = null;

        // If dropping on target area itself (not a word), place at end
        if (overId === 'target') {
          targetIndex = gameState.targetPhraseWords.length;
        } else if (overId.startsWith('after-')) {
          // Hovering over "after word" zone - extract word ID and place after it
          const wordId = overId.substring(6); // Remove 'after-' prefix
          const wordIndex = gameState.targetPhraseWords.findIndex((w) => w.id === wordId);
          if (wordIndex !== -1) {
            // Show indicator after the word (at index + 1)
            targetIndex = wordIndex + 1;
          }
        } else {
          // Find the index of the word being hovered over
          const overIndex = gameState.targetPhraseWords.findIndex((w) => w.id === overId);
          if (overIndex !== -1) {
            // Show indicator before the hovered word
            targetIndex = overIndex;
          }
        }

        // Vertical collision detection: If dragged element is within 30px above the indicator position,
        // move the indicator to the next line up
        if (targetIndex !== null && active.rect.current?.translated) {
          const draggedY = active.rect.current.translated.top;

          // Get the target word element at the indicator position to check its Y position
          const wordAtIndicator = gameState.targetPhraseWords[targetIndex - 1];
          if (wordAtIndicator) {
            const wordElement = document.querySelector(`[data-word-id="${wordAtIndicator.id}"]`);
            if (wordElement) {
              const wordRect = wordElement.getBoundingClientRect();
              const verticalDistance = wordRect.top - draggedY;

              // If dragged word is within 30px above the indicator, move indicator to previous position
              if (verticalDistance > 0 && verticalDistance < 30) {
                // Move indicator up by one position (closer to start)
                targetIndex = Math.max(0, targetIndex - 1);
              }
            }
          }
        }

        setDropIndicatorIndex(targetIndex);
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

  // Submit score when bonus is answered (skip in archive mode)
  useEffect(() => {
    async function submitScore() {
      // CRITICAL: Check if user is loaded before submitting
      if (gameState.bonusAnswered && !scoreSubmitted && gameState.finalScore !== null && !isArchiveMode) {
        if (!userId) {
          console.error('[GameBoard] CRITICAL: Cannot submit score - userId is null!');
          console.error('[GameBoard] This indicates UserContext failed to initialize properly');
          console.error('[GameBoard] Score will be LOST unless user refreshes and replays');
          alert('Warning: Your account did not load properly. Your score may not be saved. Please refresh the page before playing again.');
          return;
        }

        setScoreSubmitted(true);

        const timeTakenSeconds = Math.floor((Date.now() - gameStartTime.current) / 1000);
        const supabase = createClient();

        try {
          console.log('[GameBoard] Submitting score for user:', userId.substring(0, 12));

          // Check if this is the user's first play of this puzzle
          const { data: existingScore } = await supabase
            .from('scores')
            .select('id, first_play_of_day')
            .eq('user_id', userId)
            .eq('puzzle_id', puzzle.id)
            .maybeSingle();

          const isFirstPlay = !existingScore;
          // @ts-ignore - TypeScript doesn't infer maybeSingle return type correctly
          const firstPlayOfDay = isFirstPlay ? true : (existingScore?.first_play_of_day ?? false);

          console.log('[GameBoard] Is first play:', isFirstPlay, 'First play of day:', firstPlayOfDay);

          // Submit score (upsert to handle replays)
          const { error: scoreError } = await supabase
            .from('scores')
            .upsert({
              user_id: userId,
              puzzle_id: puzzle.id,
              score: gameState.finalScore,
              bonus_correct: gameState.bonusCorrect || false,
              time_taken_seconds: timeTakenSeconds,
              speed: gameState.speed,
              first_play_of_day: firstPlayOfDay,
            }, {
              onConflict: 'user_id,puzzle_id'
            });

          if (scoreError) {
            console.error('[GameBoard] Error submitting score:', scoreError);
          } else {
            console.log('[GameBoard] Score submitted successfully');

            // Update streak
            await supabase.rpc('update_user_streak', {
              p_user_id: userId,
              p_puzzle_date: puzzle.date,
            });

            // Refresh user stats
            await refreshStats();
          }
        } catch (error) {
          console.error('[GameBoard] Error submitting score:', error);
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
        reorderWords(updatedWords, true); // Pass true to skip move count increment
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

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="h-[calc(100dvh-2.5rem)] w-full flex flex-col bg-gray-50 dark:bg-gray-900 touch-none overscroll-none">
        {/* Top Area - Hint Phrase (always shown completed) - Phase 1: 15%, Phase 2: 20%, Hidden during bonus round and final results */}
        {!gameState.isComplete && !(gameState.phase === 2 && gameState.bonusAnswered) && (
          <div className={`border-b-2 border-gray-300 dark:border-gray-700 bg-purple-50 dark:bg-purple-950 transition-all duration-500 ${
            gameState.phase === 2 ? 'h-[20%] p-1' : 'h-[15%] p-1.5'
          }`}>
            <AssemblyArea
              id="facsimile"
              title="Hint Phrase"
              placedWords={gameState.facsimilePhraseWords}
              expectedLength={puzzle.facsimilePhrase.words.length}
              bgColor="bg-purple-50 dark:bg-purple-950"
              borderColor="border-purple-300 dark:border-purple-700"
              isAutoAssembly={true}
              isComplete={true}
              completedText={puzzle.facsimilePhrase.text}
              phase={gameState.phase}
              showCompletedHeader={false}
            />
          </div>
        )}

        {/* Middle Area - Mystery Quote - Phase 1: 35% (50% during bonus), Phase 2: 80%, Final Results: 40% */}
        <div className={`border-b-2 border-gray-300 dark:border-gray-700 p-3 bg-blue-50 dark:bg-blue-950 transition-all duration-500 ${
          gameState.bonusAnswered ? 'h-[40%]' :
          gameState.isComplete ? 'h-[50%]' :
          gameState.phase === 2 ? 'h-[80%]' : 'h-[35%]'
        }`}>
          <AssemblyArea
            id="target"
            title="Mystery Quote"
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
            correctStringHintsUsed={gameState.correctStringHintsUsed}
            nextWordHintsUsed={gameState.nextWordHintsUsed}
            unnecessaryWordHintsUsed={gameState.unnecessaryWordHintsUsed}
            reorderMoves={gameState.reorderMoves}
            phase={gameState.phase}
            showCompletionAnimation={gameState.showCompletionAnimation}
            totalWordsSeen={gameState.totalWordsSeen}
            totalUniqueWords={puzzle.targetPhrase.words.length + puzzle.facsimilePhrase.words.length}
            speed={gameState.speed}
            showFinalResults={gameState.phase === 2 && gameState.bonusAnswered}
            bonusAnswer={gameState.bonusAnswered ? puzzle.bonusQuestion.options.find(opt => opt.id === puzzle.bonusQuestion.correctAnswerId) : undefined}
            draggedWord={gameState.phase === 2 && draggedWordText ? draggedWordText : undefined}
          />
        </div>

        {/* Bottom Area - Vortex (Phase 1), Bonus Round, or Final Results */}
        {gameState.phase === 1 && !gameState.bonusAnswered && (
          <div className="h-[50%] relative bg-gradient-to-b from-purple-100 to-indigo-100 dark:from-purple-950 dark:to-indigo-950">
            {gameState.isComplete ? (
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
                isActive={!gameState.isComplete && !gameState.isPaused && !gameState.showPhase1CompleteDialog}
                speed={vortexSpeed}
                totalWordsSeen={gameState.totalWordsSeen}
                expectedWords={puzzle.targetPhrase.words}
                placedWords={gameState.targetPhraseWords.map(w => w.word)}
              />
            )}

          {/* Speed Slider - Center Left (z-50 keeps it above fog overlay at z-30) */}
          {!gameState.isComplete && (
            <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-50">
              <input
                type="range"
                min="0"
                max="2"
                step="0.25"
                value={vortexSpeed}
                onChange={(e) => setVortexSpeed(parseFloat(e.target.value))}
                className="speed-slider h-54 cursor-pointer"
                style={{
                  WebkitAppearance: 'slider-vertical' as any,
                  writingMode: 'vertical-lr' as any,
                  direction: 'rtl' as any,
                  width: '2px',
                }}
              />
              <div className="text-xs text-gray-700 dark:text-gray-300 font-mono font-bold">
                {vortexSpeed.toFixed(2)}x
              </div>
            </div>
          )}
          </div>
        )}

        {/* Phase 2 Complete - Show bonus/results in bottom area */}
        {gameState.phase === 2 && gameState.isComplete && allowBonusRound && !gameState.bonusAnswered && (
          <div className="h-[50%] relative bg-gradient-to-b from-purple-100 to-indigo-100 dark:from-purple-950 dark:to-indigo-950 py-2">
            <div className="h-full flex items-center justify-center px-2">
              <BonusRound
                bonusQuestion={puzzle.bonusQuestion}
                onAnswer={(selectedAnswerId, isCorrect) => {
                  answerBonus(isCorrect);
                }}
                onSkip={skipBonus}
              />
            </div>
          </div>
        )}

        {/* Final Results Section - Full-width bottom 60% when bonus is answered */}
        {gameState.bonusAnswered && (
          <div className="h-[60%] bg-gray-100 dark:bg-gray-900">
            <FinalResults
              phase1Score={gameState.score || 0}
              phase2Score={gameState.phase2Score || 0}
              finalScore={gameState.finalScore || 0}
              bonusCorrect={gameState.bonusCorrect}
              onPlayAgain={() => window.location.reload()}
              totalWordsSeen={gameState.totalWordsSeen}
              totalUniqueWords={puzzle.targetPhrase.words.length + puzzle.facsimilePhrase.words.length}
              isArchiveMode={isArchiveMode}
              reorderMoves={gameState.reorderMoves}
              hintsUsed={gameState.hintsUsed}
            />
          </div>
        )}

      </div>

      {/* Drag Overlay - Keep word visible for mouse users */}
      <DragOverlay
        dropAnimation={null}
        style={{ cursor: 'grabbing' }}
      >
        {draggedWordText ? (
          <div className="px-2 py-1 rounded-lg font-semibold text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-md">
            {draggedWordText}
          </div>
        ) : null}
      </DragOverlay>

      {/* Corner Word Display - Shows dragged word in ALL FOUR vortex corners */}
      {draggedWordText && gameState.phase === 1 && !gameState.isComplete && (
        <div className="fixed inset-0 pointer-events-none z-40">
          {/* Calculate vortex area position (bottom 50% of screen) */}
          {(() => {
            // Top area is 15% (hint phrase) + 35% (mystery quote) = 50% in Phase 1
            const topAreaHeight = 50;
            // Vortex starts after top areas
            const vortexTop = topAreaHeight;
            // Vortex height is 50%
            const vortexHeight = 50;

            return (
              <>
                {/* All words: Display in ALL FOUR corners for maximum visibility */}
                {/* Top left */}
                <div
                  className="absolute left-4"
                  style={{ top: `calc(${vortexTop}% + 3rem)` }}
                >
                  <div className="font-bold text-xl text-white dark:text-gray-200">
                    {draggedWordText}
                  </div>
                </div>

                {/* Top right */}
                <div
                  className="absolute right-4"
                  style={{ top: `calc(${vortexTop}% + 3rem)` }}
                >
                  <div className="font-bold text-xl text-white dark:text-gray-200">
                    {draggedWordText}
                  </div>
                </div>

                {/* Bottom left */}
                <div
                  className="absolute left-4"
                  style={{ bottom: `calc(${100 - vortexTop - vortexHeight}% + 0.8125rem)` }}
                >
                  <div className="font-bold text-xl text-white dark:text-gray-200">
                    {draggedWordText}
                  </div>
                </div>

                {/* Bottom right */}
                <div
                  className="absolute right-4"
                  style={{ bottom: `calc(${100 - vortexTop - vortexHeight}% + 0.8125rem)` }}
                >
                  <div className="font-bold text-xl text-white dark:text-gray-200">
                    {draggedWordText}
                  </div>
                </div>
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
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                All required words collected!<br />Ready to put them in the correct order?
              </p>
              {/* Phase 1 Score Breakdown */}
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-6">
                <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Phase 1 Score
                </div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-3">
                  {gameState.score?.toFixed(2) || '0.00'}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <div>Words seen: {gameState.totalWordsSeen}</div>
                  <div>Total words: {puzzle.targetPhrase.words.length + puzzle.facsimilePhrase.words.length}</div>
                  <div className="pt-1 border-t border-gray-300 dark:border-gray-600 mt-2">
                    Score: Words seen ÷ Total words
                  </div>
                </div>
              </div>
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
