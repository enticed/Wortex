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
import { useRouter } from 'next/navigation';
import Vortex from './Vortex';
import AssemblyArea from './AssemblyArea';
import Word from './Word';
import BonusRound from './BonusRound';
import FinalResults from './FinalResults';
import { useGameState } from '@/lib/hooks/useGameState';
import { isPhraseComplete } from '@/lib/utils/game';
import { useUser } from '@/lib/contexts/UserContext';
import { useTutorial } from '@/lib/contexts/TutorialContext';
import { useTutorialSteps } from '@/lib/hooks/useTutorialSteps';
import { phase1Steps, phase2Steps, bonusRoundSteps, finalResultsSteps } from '@/lib/tutorial/tutorialSteps';
import { calculatePhase1Stars, calculatePhase2Stars } from '@/lib/utils/stars';
import { fetchWithCsrf } from '@/lib/security/csrf-client';
import type { Puzzle } from '@/types/game';

interface GameBoardProps {
  puzzle: Puzzle;
  isArchiveMode?: boolean;
  showResults?: boolean;
}

export default function GameBoard({ puzzle, isArchiveMode = false, showResults = false }: GameBoardProps) {
  const router = useRouter();
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
    showPhase1Dialog,
    confirmPhase1Complete,
    showPhase2Dialog,
    confirmPhase2Complete,
  } = useGameState(puzzle, vortexSpeed, isArchiveMode);
  const { userId, refreshStats, loading: userLoading } = useUser();
  const { hasCompletedTutorial } = useTutorial();
  const [draggedWordId, setDraggedWordId] = useState<string | null>(null);
  const [draggedWordText, setDraggedWordText] = useState<string | null>(null);
  const [draggedWordBelongsTo, setDraggedWordBelongsTo] = useState<'target' | 'facsimile' | 'spurious' | null>(null);
  const [showBonusRound, setShowBonusRound] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<number | null>(null); // Phase 2 insertion indicator
  const [allowBonusRound, setAllowBonusRound] = useState(false); // Delay showing bonus round for animation
  const gameStartTime = useRef<number>(Date.now());
  const dragOverlayRef = useRef<{ x: number; y: number } | null>(null); // Track drag position

  // State to restore final results from sessionStorage
  const [savedResults, setSavedResults] = useState<{
    phase1Score: number;
    phase2Score: number;
    finalScore: number;
    bonusCorrect: boolean | null;
    totalWordsSeen: number;
    totalUniqueWords: number;
    reorderMoves: number;
    hintsUsed: number;
    puzzleId: string;
    puzzleDate?: string;
  } | null>(null);

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

  // Check sessionStorage for saved final results on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('wortex-final-results');
    if (saved) {
      try {
        const results = JSON.parse(saved);
        // Only restore if it's for the current puzzle
        if (results.puzzleId === puzzle.id) {
          console.log('[GameBoard] Restoring final results from sessionStorage');
          setSavedResults(results);
        } else {
          console.log('[GameBoard] Saved results are for a different puzzle, clearing');
          sessionStorage.removeItem('wortex-final-results');
        }
      } catch (error) {
        console.error('[GameBoard] Error parsing saved results:', error);
        sessionStorage.removeItem('wortex-final-results');
      }
    }
  }, [puzzle.id]);

  // Fetch score data from database when showResults is true
  useEffect(() => {
    async function loadScoreResults() {
      if (!showResults || !userId) {
        return;
      }

      console.log('[GameBoard] Loading score results for puzzle:', puzzle.id);

      try {
        const response = await fetch(`/api/user/puzzle-score?puzzleId=${puzzle.id}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const scoreData = await response.json();

          if (scoreData) {
            console.log('[GameBoard] Score data loaded:', scoreData);

          // Construct savedResults object
          // Note: We don't have phase1Score and phase2Score separately in the database,
          // so we'll set phase1Score to the final score and phase2Score to 0
          const results = {
            phase1Score: scoreData.score,
            phase2Score: 0,
            finalScore: scoreData.score,
            bonusCorrect: scoreData.bonus_correct,
            totalWordsSeen: 0, // Not stored in database
            totalUniqueWords: puzzle.targetPhrase.words.length + puzzle.facsimilePhrase.words.length,
            reorderMoves: 0, // Not stored in database
            hintsUsed: 0, // Not stored in database
            puzzleId: puzzle.id,
            puzzleDate: puzzle.date,
          };

            setSavedResults(results);
          } else {
            console.warn('[GameBoard] No score data found for this puzzle - redirecting to homepage');
            router.push('/');
          }
        } else {
          console.error('[GameBoard] Error response:', response.status, '- redirecting to homepage');
          router.push('/');
        }
      } catch (error) {
        console.error('[GameBoard] Error loading score results:', error, '- redirecting to homepage');
        router.push('/');
      }
    }

    loadScoreResults();
  }, [showResults, userId, puzzle.id, puzzle.date, puzzle.targetPhrase.words.length, puzzle.facsimilePhrase.words.length, router]);

  // Tutorial: Phase 1 steps (show on game start if tutorial not completed)
  // ONLY run tutorial on the actual tutorial puzzle, not on daily puzzles
  const isTutorialPuzzle = puzzle.id === 'tutorial-puzzle';

  useTutorialSteps({
    phase: 'phase1',
    steps: phase1Steps,
    autoStart: isTutorialPuzzle && !hasCompletedTutorial && gameState.phase === 1 && !gameState.isComplete,
    delay: 1000,
  });

  // Tutorial: Phase 2 steps (show when transitioning to phase 2)
  useTutorialSteps({
    phase: 'phase2',
    steps: phase2Steps,
    autoStart: isTutorialPuzzle && !hasCompletedTutorial && gameState.phase === 2 && !savedResults,
    delay: 500,
  });

  // Tutorial: Bonus Round (step 14) - show when puzzle is complete and bonus round appears
  useTutorialSteps({
    phase: 'bonusRound',
    steps: bonusRoundSteps,
    autoStart: isTutorialPuzzle && !hasCompletedTutorial && gameState.isComplete && allowBonusRound && !gameState.bonusAnswered && !savedResults,
    delay: 500,
  });

  // Tutorial: Final Results (steps 15-19) - consolidated multi-step phase
  useTutorialSteps({
    phase: 'finalResults',
    steps: finalResultsSteps,
    autoStart: isTutorialPuzzle && !hasCompletedTutorial && (gameState.bonusAnswered || !!savedResults),
    delay: 500,
  });

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
      // IMPORTANT: Prioritize the indicator position over collision detection
      // The indicator was set during dragOver and shows where the user intends to place the word
      if (dropIndicatorIndex !== null) {
        // Use the indicator index - this is where the user positioned it
        newIndex = dropIndicatorIndex;
      } else if (overId === 'target') {
        // Dropping on target area itself - place at end (only if no indicator was set)
        newIndex = gameState.targetPhraseWords.length;
      } else {
        // Fallback - find index of drop target word
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
      // CRITICAL: Check if user is loaded before submitting
      if (gameState.bonusAnswered && !scoreSubmitted && gameState.finalScore !== null) {
        // Skip score submission for tutorial puzzles - they don't affect stats, streaks, or leaderboards
        if (isTutorialPuzzle) {
          console.log('[GameBoard] Skipping score submission for tutorial puzzle');
          setScoreSubmitted(true);
          return;
        }

        if (!userId) {
          console.error('[GameBoard] CRITICAL: Cannot submit score - userId is null!');
          console.error('[GameBoard] This indicates UserContext failed to initialize properly');
          console.error('[GameBoard] Score will be LOST unless user refreshes and replays');
          alert('Warning: Your account did not load properly. Your score may not be saved. Please refresh the page before playing again.');
          return;
        }

        setScoreSubmitted(true);

        const timeTakenSeconds = Math.floor((Date.now() - gameStartTime.current) / 1000);

        try {
          console.log('[GameBoard] Submitting score via API for user:', userId.substring(0, 12), isArchiveMode ? '(archive mode)' : '');
          console.log('[GameBoard] Puzzle ID:', puzzle.id);
          console.log('[GameBoard] Score data:', {
            finalScore: gameState.finalScore,
            phase1Score: gameState.score || 0,
            phase2Score: gameState.phase2Score || 0,
            bonusCorrect: gameState.bonusCorrect || false,
            timeTakenSeconds,
            speed: gameState.speed,
            minSpeed: gameState.minSpeed,
            maxSpeed: gameState.maxSpeed,
          });

          // Submit score via secure API endpoint with CSRF protection
          const response = await fetchWithCsrf('/api/score/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              puzzleId: puzzle.id,
              score: gameState.finalScore,
              phase1Score: gameState.score || 0,
              phase2Score: gameState.phase2Score || 0,
              bonusCorrect: gameState.bonusCorrect || false,
              timeTakenSeconds,
              speed: gameState.speed,
              minSpeed: gameState.minSpeed,
              maxSpeed: gameState.maxSpeed,
              stars: null, // Let server calculate
              isArchiveMode, // Server will set first_play_of_day based on this
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('[GameBoard] Score submission failed:', response.status, errorData);

            // Show user-friendly error message
            alert(`Failed to save your score: ${errorData.error || 'Please try again'}.`);
          } else {
            const result = await response.json();
            console.log('[GameBoard] Score submitted successfully:', result);

            // Refresh user stats to reflect the new score
            await refreshStats();
          }
        } catch (error) {
          console.error('[GameBoard] Error submitting score:', error);
          alert('Network error: Unable to save your score. Please check your connection and try refreshing the page.');
        }
      }
    }

    submitScore();
  }, [gameState.bonusAnswered, scoreSubmitted, userId, gameState.finalScore, gameState.bonusCorrect, gameState.score, gameState.phase2Score, gameState.speed, gameState.minSpeed, gameState.maxSpeed, puzzle.id, puzzle.date, refreshStats, isArchiveMode, isTutorialPuzzle]);

  // Save results to sessionStorage when bonus is answered (for both archive and normal mode)
  // This allows leaderboard to show the correct puzzle even after midnight or in archive mode
  useEffect(() => {
    if (gameState.bonusAnswered && gameState.finalScore !== null) {
      const resultsToSave = {
        phase1Score: gameState.score || 0,
        phase2Score: gameState.phase2Score || 0,
        finalScore: gameState.finalScore || 0,
        bonusCorrect: gameState.bonusCorrect,
        totalWordsSeen: gameState.totalWordsSeen,
        totalUniqueWords: puzzle.targetPhrase.words.length + puzzle.facsimilePhrase.words.length,
        reorderMoves: gameState.reorderMoves,
        hintsUsed: gameState.hintsUsed,
        puzzleId: puzzle.id,
        puzzleDate: puzzle.date,
      };
      sessionStorage.setItem('wortex-final-results', JSON.stringify(resultsToSave));
      console.log('[GameBoard] Final results saved to sessionStorage for puzzle:', puzzle.date);
    }
  }, [gameState.bonusAnswered, gameState.finalScore, gameState.bonusCorrect, gameState.score, gameState.phase2Score, gameState.totalWordsSeen, gameState.reorderMoves, gameState.hintsUsed, puzzle.id, puzzle.date, puzzle.targetPhrase.words.length, puzzle.facsimilePhrase.words.length]);

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

  // Show Phase 1 completion dialog after 4-second visual feedback
  useEffect(() => {
    if (gameState.phase1Complete && !gameState.showPhase1CompleteDialog) {
      const timer = setTimeout(() => {
        // Show the dialog after visual feedback
        showPhase1Dialog();
      }, 4000); // 4 second delay for visual feedback

      return () => clearTimeout(timer);
    }
  }, [gameState.phase1Complete, gameState.showPhase1CompleteDialog, showPhase1Dialog]);

  // Show Phase 2 completion dialog after 4-second visual feedback
  useEffect(() => {
    if (gameState.activeHint?.type === 'phase2Complete' && !gameState.showPhase2CompleteDialog) {
      const timer = setTimeout(() => {
        // Show the dialog after visual feedback
        showPhase2Dialog();
      }, 4000); // 4 second delay for visual feedback

      return () => clearTimeout(timer);
    }
  }, [gameState.activeHint, gameState.showPhase2CompleteDialog, showPhase2Dialog]);

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

  // Wait for UserContext to load before allowing gameplay
  // This prevents the race condition where users could complete the game before userId is available
  if (userLoading) {
    return (
      <div className="h-[calc(100dvh-2.5rem)] w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your account...</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="h-[calc(100dvh-2.5rem)] w-full flex flex-col bg-gray-50 dark:bg-gray-900 touch-none overscroll-none">
        {/* Top Area - Hint Phrase (always shown completed) - Phase 1: 15%, Phase 2: 20%, Hidden during bonus round and final results */}
        {!gameState.isComplete && !(gameState.phase === 2 && gameState.bonusAnswered) && !savedResults && (
          <div className={`hint-phrase-container border-b-2 border-gray-300 dark:border-gray-700 bg-purple-50 dark:bg-purple-950 transition-all duration-500 ${
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
              draggedWord={draggedWordText ? draggedWordText : undefined}
            />
          </div>
        )}

        {/* Middle Area - Mystery Quote - Phase 1: 35% (40% during bonus), Phase 2: 80%, Final Results: 40% */}
        <div className={`mystery-quote-area border-b-2 border-gray-300 dark:border-gray-700 p-3 bg-blue-50 dark:bg-blue-950 transition-all duration-500 ${
          gameState.bonusAnswered || savedResults ? 'h-[40%]' :
          gameState.isComplete ? 'h-[40%]' :
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
            isComplete={isTargetComplete || !!savedResults}
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
            showFinalResults={(gameState.phase === 2 && gameState.bonusAnswered) || !!savedResults}
            bonusAnswer={(gameState.bonusAnswered || savedResults) ? puzzle.bonusQuestion.options.find(opt => opt.id === puzzle.bonusQuestion.correctAnswerId) : undefined}
            draggedWord={draggedWordText ? draggedWordText : undefined}
            theme={puzzle.theme}
            showBonusRound={gameState.isComplete && !gameState.bonusAnswered && !savedResults}
          />
        </div>

        {/* Bottom Area - Vortex (Phase 1), Bonus Round, or Final Results */}
        {gameState.phase === 1 && !gameState.bonusAnswered && !savedResults && (
          <div className={`vortex-container relative bg-gradient-to-b from-purple-100 to-indigo-100 dark:from-purple-950 dark:to-indigo-950 ${gameState.isComplete ? 'flex-1' : 'h-[50%]'}`}>
            {gameState.isComplete ? (
              // Show bonus round in vortex area
              <div className="h-full flex flex-col">
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
                isActive={!gameState.isComplete && !gameState.isPaused && !gameState.phase1Complete && !gameState.showPhase1CompleteDialog}
                speed={vortexSpeed}
                totalWordsSeen={gameState.totalWordsSeen}
                expectedWords={puzzle.targetPhrase.words}
                placedWords={gameState.targetPhraseWords.map(w => w.word)}
              />
            )}

          {/* Speed Slider - Center Left (z-50 keeps it above fog overlay at z-30) */}
          {!gameState.isComplete && (
            <div className="speed-slider absolute left-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-50">
              <input
                type="range"
                min="0"
                max="2"
                step="0.25"
                value={vortexSpeed}
                onChange={(e) => setVortexSpeed(parseFloat(e.target.value))}
                className="speed-slider-input h-54 cursor-pointer"
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
        {gameState.phase === 2 && gameState.isComplete && allowBonusRound && !gameState.bonusAnswered && !savedResults && (
          <div className="flex-1 relative bg-gradient-to-b from-purple-100 to-indigo-100 dark:from-purple-950 dark:to-indigo-950">
            <div className="h-full flex flex-col">
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

        {/* Final Results Section - Full-width bottom 60% when bonus is answered OR when saved results exist */}
        {(gameState.bonusAnswered || savedResults) && (
          <div className="h-[60%] bg-gray-100 dark:bg-gray-900">
            <FinalResults
              phase1Score={savedResults?.phase1Score ?? gameState.score ?? 0}
              phase2Score={savedResults?.phase2Score ?? gameState.phase2Score ?? 0}
              finalScore={savedResults?.finalScore ?? gameState.finalScore ?? 0}
              bonusCorrect={savedResults?.bonusCorrect ?? gameState.bonusCorrect}
              isPure={!isArchiveMode && gameState.minSpeed === 1.0 && gameState.maxSpeed === 1.0}
              onPlayAgain={() => {
                sessionStorage.removeItem('wortex-final-results');
                window.location.reload();
              }}
              totalWordsSeen={savedResults?.totalWordsSeen ?? gameState.totalWordsSeen}
              totalUniqueWords={savedResults?.totalUniqueWords ?? (puzzle.targetPhrase.words.length + puzzle.facsimilePhrase.words.length)}
              isArchiveMode={isArchiveMode}
              reorderMoves={savedResults?.reorderMoves ?? gameState.reorderMoves}
              hintsUsed={savedResults?.hintsUsed ?? gameState.hintsUsed}
              quoteWordCount={puzzle.targetPhrase.words.length}
              puzzleDate={puzzle.date}
              facsimilePhrase={puzzle.facsimilePhrase.text}
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
                {/* Top left - raised by 15px from original 3rem */}
                <div
                  className="absolute left-4"
                  style={{ top: `calc(${vortexTop}% + 3rem - 15px)` }}
                >
                  <div className="font-bold text-xl" style={{ color: '#f97316' }}>
                    {draggedWordText}
                  </div>
                </div>

                {/* Top right - raised by 15px from original 3rem */}
                <div
                  className="absolute right-4"
                  style={{ top: `calc(${vortexTop}% + 3rem - 15px)` }}
                >
                  <div className="font-bold text-xl" style={{ color: '#f97316' }}>
                    {draggedWordText}
                  </div>
                </div>

                {/* Bottom left - keep original position */}
                <div
                  className="absolute left-4"
                  style={{ bottom: `calc(${100 - vortexTop - vortexHeight}% + 0.8125rem)` }}
                >
                  <div className="font-bold text-xl" style={{ color: '#f97316' }}>
                    {draggedWordText}
                  </div>
                </div>

                {/* Bottom right - keep original position */}
                <div
                  className="absolute right-4"
                  style={{ bottom: `calc(${100 - vortexTop - vortexHeight}% + 0.8125rem)` }}
                >
                  <div className="font-bold text-xl" style={{ color: '#f97316' }}>
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
                {/* Star Display */}
                <div className="flex items-center justify-center gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={star <= calculatePhase1Stars(gameState.score || 0) ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      width={24}
                      height={24}
                      style={{ width: '24px', height: '24px' }}
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
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

      {/* Phase 2 Complete Confirmation Dialog */}
      {gameState.showPhase2CompleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md mx-4 border-2 border-purple-400 dark:border-purple-600">
            <div className="text-center">
              <div className="text-4xl mb-4">🎉</div>
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                Mystery Quote solved!<br />Great work!
              </p>
              {/* Phase 2 Score Breakdown */}
              <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 mb-6">
                <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Phase 2 Score
                </div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-3">
                  {gameState.phase2Score?.toFixed(2) || '0.00'}
                </div>
                {/* Star Display */}
                <div className="flex items-center justify-center gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={star <= calculatePhase2Stars(gameState.phase2Score || 0, puzzle.targetPhrase.words.length) ? 'text-purple-500 dark:text-purple-400' : 'text-gray-400 dark:text-gray-600'}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      width={24}
                      height={24}
                      style={{ width: '24px', height: '24px' }}
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <div>Reorder moves: {gameState.reorderMoves}</div>
                  <div>Hints used: {gameState.hintsUsed}</div>
                  <div className="pt-1 border-t border-gray-300 dark:border-gray-600 mt-2">
                    Score: (Moves × 0.25) + (Hints × 0.5)
                  </div>
                </div>
              </div>
              <button
                onClick={confirmPhase2Complete}
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
