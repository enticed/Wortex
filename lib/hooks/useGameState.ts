'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameState, Puzzle, WordInVortex, PlacedWord } from '@/types/game';
import {
  createVortexWords,
  calculateScore,
  areAllPhrasesComplete,
  isPhraseComplete,
  findCorrectPosition,
  generateWordId,
} from '@/lib/utils/game';

// Fisher-Yates shuffle for fair random distribution
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function useGameState(puzzle: Puzzle | null, speed: number = 1.0, isArchiveMode: boolean = false) {
  const lastWordSpawnTime = useRef<number>(0); // Track last spawn to prevent simultaneous spawns

  const [gameState, setGameState] = useState<GameState>({
    puzzle,
    vortexWords: [],
    targetPhraseWords: [],
    facsimilePhraseWords: [],
    wordQueue: [],
    dismissedForNextCycle: new Set<string>(),
    totalWordsSeen: 0,
    phase: 1,
    isComplete: false,
    score: null,
    phase2Score: null,
    finalScore: null,
    bonusAnswered: false,
    bonusCorrect: null,
    isPaused: false,
    hintsUsed: 0,
    correctStringHintsUsed: 0,
    nextWordHintsUsed: 0,
    unnecessaryWordHintsUsed: 0,
    reorderMoves: 0,
    speed: speed,
    minSpeed: speed,
    maxSpeed: speed,
    activeHint: null,
    showCompletionAnimation: false,
    phase1Complete: false,
    showPhase1CompleteDialog: false,
    showPhase2CompleteDialog: false,
  });

  // Initialize game when puzzle is loaded
  useEffect(() => {
    if (puzzle && gameState.vortexWords.length === 0) {
      const initialWords = createVortexWords(puzzle);
      setGameState((prev) => ({
        ...prev,
        puzzle,
        vortexWords: initialWords.slice(0, 3), // Start with 3 words visible (easier)
        totalWordsSeen: 3,
      }));
    }
  }, [puzzle]);

  // Update speed when it changes and track min/max
  useEffect(() => {
    setGameState((prev) => ({
      ...prev,
      speed: speed,
      minSpeed: Math.min(prev.minSpeed, speed),
      maxSpeed: Math.max(prev.maxSpeed, speed),
    }));
  }, [speed]);

  // Add new words to vortex periodically - fair distribution with smart filtering
  // Only runs during Phase 1
  useEffect(() => {
    if (!puzzle || gameState.isComplete || gameState.isPaused || gameState.phase === 2 || gameState.phase1Complete || gameState.showPhase1CompleteDialog || speed === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const minDelay = 100; // Minimum 100ms between spawns

      // Prevent simultaneous spawns when speed changes
      if (now - lastWordSpawnTime.current < minDelay) {
        return;
      }

      lastWordSpawnTime.current = now;

      setGameState((prev) => {
        const allWords = createVortexWords(puzzle);

        // NO FILTERING - all words always available for cycling
        // Player manages placement/removal manually
        const availableWords = allWords;

        // Initialize or refill queue when empty
        let queue = prev.wordQueue;
        let newDismissedSet = prev.dismissedForNextCycle;

        if (queue.length === 0) {
          // Filter out dismissed words for this cycle only
          const wordsForQueue = availableWords.filter(w => {
            const wordKey = `${w.belongsTo}-${w.sourceIndex}`;
            return !prev.dismissedForNextCycle.has(wordKey);
          });

          // If all words dismissed, clear dismissals and use all available
          if (wordsForQueue.length === 0) {
            queue = shuffleArray(
              availableWords.map(w => `${w.belongsTo}-${w.sourceIndex}`)
            );
            newDismissedSet = new Set<string>();
          } else {
            // Create shuffled queue from non-dismissed words
            queue = shuffleArray(
              wordsForQueue.map(w => `${w.belongsTo}-${w.sourceIndex}`)
            );
            // Clear dismissed set when starting new cycle
            newDismissedSet = new Set<string>();
          }
        }

        // Get next word from queue - all words are always available
        const nextWordKey = queue[0];
        const remainingQueue = queue.slice(1);

        const nextWord = availableWords.find(w =>
          `${w.belongsTo}-${w.sourceIndex}` === nextWordKey
        );

        if (!nextWord) {
          // This shouldn't happen with no filtering, but handle gracefully
          return prev;
        }

        // Add word to vortex or replace oldest
        const timestamp = Date.now();
        // Add random offset to prevent stacking when words release simultaneously
        // Using ±20° to balance stacking prevention with spiral aesthetics
        const angleOffset = (Math.random() - 0.5) * 40; // ±20 degrees
        const radiusOffset = (Math.random() - 0.5) * 0.2; // ±0.1 radius variation
        const newWord = {
          ...nextWord,
          angle: 180 + angleOffset,
          radius: 1.0 + radiusOffset,
          id: generateWordId(nextWord.word, timestamp),
        };

        const newVortexWords = prev.vortexWords.length < 10
          ? [...prev.vortexWords, newWord]
          : [...prev.vortexWords.slice(1), newWord];

        return {
          ...prev,
          vortexWords: newVortexWords,
          wordQueue: remainingQueue,
          dismissedForNextCycle: newDismissedSet,
          totalWordsSeen: prev.totalWordsSeen + 1,
        };
      });
    }, 1500 / speed); // Scale interval inversely with speed to maintain vortex density

    return () => clearInterval(interval);
  }, [puzzle, gameState.isComplete, gameState.isPaused, gameState.phase, gameState.phase1Complete, gameState.showPhase1CompleteDialog, speed]);

  // Grab a word from the vortex
  const grabWord = useCallback((wordId: string) => {
    setGameState((prev) => {
      const word = prev.vortexWords.find((w) => w.id === wordId);
      if (!word) return prev;

      return {
        ...prev,
        vortexWords: prev.vortexWords.map((w) =>
          w.id === wordId ? { ...w, isGrabbed: true } : w
        ),
      };
    });
  }, []);

  // Place a word in an assembly area
  const placeWord = useCallback(
    (wordId: string, areaId: 'target' | 'facsimile') => {
      setGameState((prev) => {
        const word = prev.vortexWords.find((w) => w.id === wordId);
        if (!word || !prev.puzzle) return prev;

        const isTarget = areaId === 'target';
        const currentWords = isTarget
          ? prev.targetPhraseWords
          : prev.facsimilePhraseWords;
        const expectedWords = isTarget
          ? prev.puzzle.targetPhrase.words
          : prev.puzzle.facsimilePhrase.words;

        // Phase 1: Different behavior for top vs bottom
        if (prev.phase === 1) {
          if (isTarget) {
            // Top area (target): Accept ANY word, add to end
            const newWord: PlacedWord = {
              id: wordId,
              word: word.word,
              position: currentWords.length, // Add to end
              sourceIndex: word.sourceIndex,
              belongsTo: areaId,
            };

            const newTargetWords = [...currentWords, newWord];

            // Check if Phase 1 is complete:
            // Target phrase has ALL required words (accounting for duplicates)
            // Note: Facsimile phrase is just a hint shown from the start, not assembled during gameplay

            // Count required instances of each word
            const requiredWordCounts = new Map<string, number>();
            prev.puzzle.targetPhrase.words.forEach(word => {
              const key = word.toLowerCase();
              requiredWordCounts.set(key, (requiredWordCounts.get(key) || 0) + 1);
            });

            // Count placed instances of each word
            const placedWordCounts = new Map<string, number>();
            newTargetWords.forEach(placed => {
              const key = placed.word.toLowerCase();
              placedWordCounts.set(key, (placedWordCounts.get(key) || 0) + 1);
            });

            // Check if all required words are present with correct counts
            const hasAllRequiredWords = Array.from(requiredWordCounts.entries()).every(([word, count]) =>
              (placedWordCounts.get(word) || 0) >= count
            );

            const phase1Complete = hasAllRequiredWords;

            // Calculate Phase 1 score when dialog appears
            const phase1Score = phase1Complete
              ? calculateScore(
                  prev.totalWordsSeen,
                  prev.puzzle.targetPhrase.words.length + prev.puzzle.facsimilePhrase.words.length,
                  prev.speed
                )
              : prev.score;

            return {
              ...prev,
              targetPhraseWords: newTargetWords,
              vortexWords: prev.vortexWords.filter((w) => w.id !== wordId),
              phase1Complete: phase1Complete,
              score: phase1Score,
            };
          } else {
            // Bottom area (facsimile): Use auto-assembly
            const correctPosition = findCorrectPosition(
              word.word,
              expectedWords,
              currentWords
            );

            if (correctPosition === null) {
              // Word doesn't belong, return to vortex
              return {
                ...prev,
                vortexWords: prev.vortexWords.map((w) =>
                  w.id === wordId ? { ...w, isGrabbed: false } : w
                ),
              };
            }

            const newWord: PlacedWord = {
              id: wordId,
              word: word.word,
              position: correctPosition,
              sourceIndex: word.sourceIndex,
              belongsTo: areaId,
            };

            const newFacsimileWords = [...currentWords, newWord];

            // Check if Phase 1 is complete
            // Target phrase has ALL required words (accounting for duplicates)
            // Note: Facsimile phrase is just a hint shown from the start, not assembled during gameplay

            // Count required instances of each word in target phrase
            const requiredWordCounts = new Map<string, number>();
            prev.puzzle.targetPhrase.words.forEach(word => {
              const key = word.toLowerCase();
              requiredWordCounts.set(key, (requiredWordCounts.get(key) || 0) + 1);
            });

            // Count placed instances in target phrase
            const placedWordCounts = new Map<string, number>();
            prev.targetPhraseWords.forEach(placed => {
              const key = placed.word.toLowerCase();
              placedWordCounts.set(key, (placedWordCounts.get(key) || 0) + 1);
            });

            // Check if all required words are present with correct counts
            const hasAllRequiredWords = Array.from(requiredWordCounts.entries()).every(([word, count]) =>
              (placedWordCounts.get(word) || 0) >= count
            );

            const phase1Complete = hasAllRequiredWords;

            // Calculate Phase 1 score when dialog appears
            const phase1Score = phase1Complete
              ? calculateScore(
                  prev.totalWordsSeen,
                  prev.puzzle.targetPhrase.words.length + prev.puzzle.facsimilePhrase.words.length,
                  prev.speed
                )
              : prev.score;

            return {
              ...prev,
              facsimilePhraseWords: newFacsimileWords,
              vortexWords: prev.vortexWords.filter((w) => w.id !== wordId),
              phase1Complete: phase1Complete,
              score: phase1Score,
            };
          }
        }

        // Phase 2: No new word placement, only reordering within target area
        return prev;
      });
    },
    []
  );

  // Remove a word from assembly area (send back to vortex) - Phase 1 only
  const removeWord = useCallback((wordId: string, fromArea: 'target' | 'facsimile') => {
    setGameState((prev) => {
      // Only allow removing words in Phase 1
      if (prev.phase !== 1) return prev;

      const isTarget = fromArea === 'target';
      const currentWords = isTarget ? prev.targetPhraseWords : prev.facsimilePhraseWords;
      const word = currentWords.find((w) => w.id === wordId);

      if (!word) return prev;

      // Create new vortex word
      const vortexWord: WordInVortex = {
        id: wordId,
        word: word.word,
        belongsTo: word.belongsTo,
        sourceIndex: word.sourceIndex,
        angle: Math.random() * 360,
        radius: 0.9,
        appearanceCount: 0,
        isGrabbed: false,
        totalRotation: 0, // Reset rotation when returning to vortex
      };

      return {
        ...prev,
        targetPhraseWords: isTarget
          ? currentWords.filter((w) => w.id !== wordId)
          : prev.targetPhraseWords,
        facsimilePhraseWords: !isTarget
          ? currentWords.filter((w) => w.id !== wordId)
          : prev.facsimilePhraseWords,
        vortexWords: [...prev.vortexWords, vortexWord],
      };
    });
  }, []);

  // Reorder words in target phrase (Phase 2 only)
  const reorderWords = useCallback((reorderedWords: PlacedWord[], skipMoveCount = false) => {
    setGameState((prev) => {
      if (prev.phase !== 2 || !prev.puzzle) return prev;

      // Update positions based on array order
      const updatedWords = reorderedWords.map((word, index) => ({
        ...word,
        position: index,
      }));

      // Check if positions actually changed (for move counting)
      const positionsChanged = prev.targetPhraseWords.some((word, idx) =>
        word.id !== updatedWords[idx]?.id
      );

      // Increment move counter (skip for hint-triggered removals)
      const newMoveCount = (positionsChanged && !skipMoveCount) ? prev.reorderMoves + 1 : prev.reorderMoves;

      // Check if Phase 2 is complete:
      // Correct sequence must be at the start of the array
      const expectedWords = prev.puzzle.targetPhrase.words;
      const isPhase2Complete = expectedWords.every((expectedWord, index) => {
        const placedWord = updatedWords[index];
        return placedWord && placedWord.word.toLowerCase() === expectedWord.toLowerCase();
      });

      if (isPhase2Complete) {
        // Calculate Phase 1 score (speed-adjusted)
        const phase1Score = calculateScore(
          prev.totalWordsSeen,
          prev.puzzle.targetPhrase.words.length + prev.puzzle.facsimilePhrase.words.length,
          prev.speed
        );

        // Calculate Phase 2 score (moves * 0.25 + hints * 0.5)
        const phase2Score = (newMoveCount * 0.25) + (prev.hintsUsed * 0.5);

        // Final score is Phase 1 + Phase 2
        const finalScore = phase1Score + phase2Score;

        // Identify correct words (green) and extra words (red) for visual feedback
        const correctWordIds = updatedWords.slice(0, expectedWords.length).map(w => w.id);
        const extraWordIds = updatedWords.slice(expectedWords.length).map(w => w.id);

        // Show visual feedback: correct words in green, extra words in red
        // This uses a new hint type 'phase2Complete' to trigger special styling
        return {
          ...prev,
          targetPhraseWords: updatedWords, // Keep all words for visual feedback
          reorderMoves: newMoveCount,
          score: phase1Score,
          phase2Score: phase2Score,
          finalScore: finalScore,
          activeHint: {
            type: 'phase2Complete' as any, // New hint type for completion feedback
            wordIds: correctWordIds,
            extraWordIds: extraWordIds, // Add extra words to hint
          },
          // Don't set isComplete yet - wait for dialog confirmation
        };
      }

      return {
        ...prev,
        targetPhraseWords: updatedWords,
        activeHint: null, // Clear highlighting on any reorder move
        reorderMoves: newMoveCount,
      };
    });
  }, []);

  // Answer bonus question
  const answerBonus = useCallback((isCorrect: boolean) => {
    setGameState((prev) => {
      // Calculate total score: Phase 1 + Phase 2
      const totalScore = (prev.score || 0) + (prev.phase2Score || 0);

      // If correct, apply 10% reduction (lower score is better in this game)
      const finalScore = isCorrect
        ? Math.round((totalScore * 0.9) * 100) / 100
        : totalScore;

      return {
        ...prev,
        bonusAnswered: true,
        bonusCorrect: isCorrect,
        finalScore,
      };
    });
  }, []);

  // Skip bonus question
  const skipBonus = useCallback(() => {
    setGameState((prev) => {
      // Calculate total score: Phase 1 + Phase 2
      const totalScore = (prev.score || 0) + (prev.phase2Score || 0);

      return {
        ...prev,
        bonusAnswered: true,
        bonusCorrect: false,
        finalScore: totalScore, // No bonus for skip
      };
    });
  }, []);

  // Confirm Phase 1 completion and transition to Phase 2
  const confirmPhase1Complete = useCallback(() => {
    setGameState((prev) => {
      let targetWords = prev.targetPhraseWords;

      // In tutorial/archive mode, shuffle the words to ensure Phase 2 always requires interaction
      if (isArchiveMode && targetWords.length > 0 && prev.puzzle) {
        const expectedWords = prev.puzzle.targetPhrase.words;
        let shuffled = shuffleArray(targetWords);

        // Keep shuffling until we get an order that's NOT correct
        // This ensures Phase 2 always requires user interaction
        let attempts = 0;
        const maxAttempts = 100; // Prevent infinite loop
        while (attempts < maxAttempts) {
          const isCorrectOrder = expectedWords.every((expectedWord, index) => {
            const word = shuffled[index];
            return word && word.word.toLowerCase() === expectedWord.toLowerCase();
          });

          if (!isCorrectOrder) {
            break; // Found a non-correct order, use it
          }

          // Shuffle again
          shuffled = shuffleArray(targetWords);
          attempts++;
        }

        targetWords = shuffled.map((word, index) => ({
          ...word,
          position: index,
        }));
        console.log('[useGameState] Tutorial mode: Shuffled Phase 2 words to incorrect order to ensure user interaction');
      }

      return {
        ...prev,
        phase: 2,
        phase1Complete: false,
        showPhase1CompleteDialog: false,
        targetPhraseWords: targetWords,
      };
    });
  }, [isArchiveMode]);

  // Show Phase 1 completion dialog (called after visual feedback delay)
  const showPhase1Dialog = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      showPhase1CompleteDialog: true,
    }));
  }, []);

  // Show Phase 2 completion dialog (called after visual feedback delay)
  const showPhase2Dialog = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      showPhase2CompleteDialog: true,
      activeHint: null, // Clear visual feedback
    }));
  }, []);

  // Confirm Phase 2 completion and transition to bonus round
  const confirmPhase2Complete = useCallback(() => {
    setGameState((prev) => {
      if (!prev.puzzle) return prev;

      // Remove extra words (keep only correct sequence)
      const expectedWords = prev.puzzle.targetPhrase.words;
      const correctWords = prev.targetPhraseWords.slice(0, expectedWords.length);

      return {
        ...prev,
        targetPhraseWords: correctWords,
        showPhase2CompleteDialog: false,
        isComplete: true,
        showCompletionAnimation: true, // Trigger completion animation
      };
    });
  }, []);

  // Dismiss a word from vortex (drag to right edge) - skips next cycle
  const dismissWord = useCallback((wordId: string) => {
    setGameState((prev) => {
      const word = prev.vortexWords.find((w) => w.id === wordId);
      if (!word) return prev;

      const wordKey = `${word.belongsTo}-${word.sourceIndex}`;
      const newDismissedSet = new Set(prev.dismissedForNextCycle);
      newDismissedSet.add(wordKey);

      return {
        ...prev,
        dismissedForNextCycle: newDismissedSet,
        vortexWords: prev.vortexWords.filter((w) => w.id !== wordId),
      };
    });
  }, []);

  // Hint 1: Remove first unnecessary word (Phase 2 only)
  const useUnnecessaryWordHint = useCallback(() => {
    setGameState((prev) => {
      if (prev.phase !== 2 || !prev.puzzle) return prev;

      const expectedWords = prev.puzzle.targetPhrase.words;

      // Find first unnecessary word
      // A word is unnecessary if it's not needed or if we already have enough of this word type
      const expectedWordCounts = new Map<string, number>();
      expectedWords.forEach(word => {
        const key = word.toLowerCase();
        expectedWordCounts.set(key, (expectedWordCounts.get(key) || 0) + 1);
      });

      let unnecessaryWordId: string | null = null;
      const placedWordCounts = new Map<string, number>();

      for (const word of prev.targetPhraseWords) {
        const key = word.word.toLowerCase();
        const needed = expectedWordCounts.get(key) || 0;
        const currentCount = placedWordCounts.get(key) || 0;

        if (needed === 0 || currentCount >= needed) {
          // This word is unnecessary
          unnecessaryWordId = word.id;
          break;
        }

        placedWordCounts.set(key, currentCount + 1);
      }

      if (!unnecessaryWordId) {
        // No unnecessary words found
        return prev;
      }

      // Briefly highlight the word before removal (will be auto-removed by UI after animation)
      return {
        ...prev,
        activeHint: { type: 'unnecessary', wordIds: [unnecessaryWordId] },
        hintsUsed: prev.hintsUsed + 1,
        unnecessaryWordHintsUsed: prev.unnecessaryWordHintsUsed + 1,
      };
    });
  }, []);

  // Hint 2: Highlight correct string from beginning (Phase 2 only)
  const useCorrectStringHint = useCallback(() => {
    setGameState((prev) => {
      if (prev.phase !== 2 || !prev.puzzle) return prev;

      const expectedWords = prev.puzzle.targetPhrase.words;
      const correctWordIds: string[] = [];

      // Find all words in correct order from the start
      for (let i = 0; i < expectedWords.length; i++) {
        const placedWord = prev.targetPhraseWords[i];
        if (!placedWord || placedWord.word.toLowerCase() !== expectedWords[i].toLowerCase()) {
          break;
        }
        correctWordIds.push(placedWord.id);
      }

      if (correctWordIds.length === 0) {
        // No correct words at the start
        return prev;
      }

      // Check if this is the same hint as currently active (prevent duplicate penalty)
      const isSameHint = prev.activeHint?.type === 'correctString' &&
        prev.activeHint.wordIds.length === correctWordIds.length &&
        prev.activeHint.wordIds.every((id, idx) => id === correctWordIds[idx]);

      return {
        ...prev,
        activeHint: { type: 'correctString', wordIds: correctWordIds },
        hintsUsed: isSameHint ? prev.hintsUsed : prev.hintsUsed + 1,
        correctStringHintsUsed: isSameHint ? prev.correctStringHintsUsed : prev.correctStringHintsUsed + 1,
      };
    });
  }, []);

  // Hint 3: Highlight next word that should follow correct string (Phase 2 only)
  const useNextWordHint = useCallback(() => {
    setGameState((prev) => {
      if (prev.phase !== 2 || !prev.puzzle) return prev;

      const expectedWords = prev.puzzle.targetPhrase.words;

      // Find length of correct string from start
      let correctStringLength = 0;
      for (let i = 0; i < expectedWords.length; i++) {
        const placedWord = prev.targetPhraseWords[i];
        if (!placedWord || placedWord.word.toLowerCase() !== expectedWords[i].toLowerCase()) {
          break;
        }
        correctStringLength++;
      }

      // If already complete, no next word
      if (correctStringLength >= expectedWords.length) {
        return prev;
      }

      // Find the word that should come next
      const nextExpectedWord = expectedWords[correctStringLength].toLowerCase();

      // Find this word in the placed words (after the correct string)
      const nextWordId = prev.targetPhraseWords
        .slice(correctStringLength)
        .find(w => w.word.toLowerCase() === nextExpectedWord)?.id;

      if (!nextWordId) {
        // Next word not found in placed words
        return prev;
      }

      // Check if this is the same hint as currently active (prevent duplicate penalty)
      const isSameHint = prev.activeHint?.type === 'nextWord' &&
        prev.activeHint.wordIds.length === 1 &&
        prev.activeHint.wordIds[0] === nextWordId;

      return {
        ...prev,
        activeHint: { type: 'nextWord', wordIds: [nextWordId] },
        hintsUsed: isSameHint ? prev.hintsUsed : prev.hintsUsed + 1,
        nextWordHintsUsed: isSameHint ? prev.nextWordHintsUsed : prev.nextWordHintsUsed + 1,
      };
    });
  }, []);

  return {
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
  };
}
