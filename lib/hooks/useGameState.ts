'use client';

import { useState, useEffect, useCallback } from 'react';
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

export function useGameState(puzzle: Puzzle | null) {
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
    finalScore: null,
    bonusAnswered: false,
    bonusCorrect: null,
    isPaused: false,
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

  // Add new words to vortex periodically - fair distribution with smart filtering
  // Only runs during Phase 1
  useEffect(() => {
    if (!puzzle || gameState.isComplete || gameState.isPaused || gameState.phase === 2) return;

    const interval = setInterval(() => {
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
        const newWord = {
          ...nextWord,
          angle: 180,
          radius: 1.0,
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
    }, 1500);

    return () => clearInterval(interval);
  }, [puzzle, gameState.isComplete, gameState.isPaused]);

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
            // 1. Bottom phrase complete
            // 2. Top phrase has at least one of each required word
            const isFacsimileComplete = isPhraseComplete(
              prev.facsimilePhraseWords,
              prev.puzzle.facsimilePhrase.words
            );

            const hasAllRequiredWords = prev.puzzle.targetPhrase.words.every(requiredWord =>
              newTargetWords.some(placed => placed.word.toLowerCase() === requiredWord.toLowerCase())
            );

            const phase1Complete = isFacsimileComplete && hasAllRequiredWords;

            return {
              ...prev,
              targetPhraseWords: newTargetWords,
              vortexWords: prev.vortexWords.filter((w) => w.id !== wordId),
              phase: phase1Complete ? 2 : 1,
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
            const isFacsimileComplete = isPhraseComplete(
              newFacsimileWords,
              prev.puzzle.facsimilePhrase.words
            );

            const hasAllRequiredWords = prev.puzzle.targetPhrase.words.every(requiredWord =>
              prev.targetPhraseWords.some(placed => placed.word.toLowerCase() === requiredWord.toLowerCase())
            );

            const phase1Complete = isFacsimileComplete && hasAllRequiredWords;

            return {
              ...prev,
              facsimilePhraseWords: newFacsimileWords,
              vortexWords: prev.vortexWords.filter((w) => w.id !== wordId),
              phase: phase1Complete ? 2 : 1,
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
  const reorderWords = useCallback((reorderedWords: PlacedWord[]) => {
    setGameState((prev) => {
      if (prev.phase !== 2 || !prev.puzzle) return prev;

      // Update positions based on array order
      const updatedWords = reorderedWords.map((word, index) => ({
        ...word,
        position: index,
      }));

      // Check if Phase 2 is complete:
      // Correct sequence must be at the start of the array
      const expectedWords = prev.puzzle.targetPhrase.words;
      const isPhase2Complete = expectedWords.every((expectedWord, index) => {
        const placedWord = updatedWords[index];
        return placedWord && placedWord.word.toLowerCase() === expectedWord.toLowerCase();
      });

      if (isPhase2Complete) {
        // Remove extra words at the end (keep only correct sequence)
        const correctWords = updatedWords.slice(0, expectedWords.length);

        // Calculate score
        const score = calculateScore(
          prev.totalWordsSeen,
          prev.puzzle.targetPhrase.words.length + prev.puzzle.facsimilePhrase.words.length
        );

        return {
          ...prev,
          targetPhraseWords: correctWords,
          isComplete: true,
          score,
        };
      }

      return {
        ...prev,
        targetPhraseWords: updatedWords,
      };
    });
  }, []);

  // Answer bonus question
  const answerBonus = useCallback((isCorrect: boolean) => {
    setGameState((prev) => {
      // If correct, apply 10% reduction to base score
      const finalScore = isCorrect && prev.score !== null
        ? Math.round((prev.score * 0.9) * 100) / 100
        : prev.score;

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
    setGameState((prev) => ({
      ...prev,
      bonusAnswered: true,
      bonusCorrect: false,
      finalScore: prev.score, // No reduction for skip
    }));
  }, []);

  // Auto-capture facsimile word when it reaches 240° rotation
  const autoCaptureFacsimileWord = useCallback((wordId: string) => {
    setGameState((prev) => {
      if (!prev.puzzle) return prev;

      const word = prev.vortexWords.find((w) => w.id === wordId);
      if (!word) return prev;

      // Check if this word belongs to the facsimile phrase by trying to find a position
      const correctPosition = findCorrectPosition(
        word.word,
        prev.puzzle.facsimilePhrase.words,
        prev.facsimilePhraseWords
      );

      // If word doesn't belong to facsimile or all positions filled, keep it in vortex
      if (correctPosition === null) return prev;

      // Auto-place the word
      const newWord: PlacedWord = {
        id: word.id,
        word: word.word,
        position: correctPosition,
        sourceIndex: word.sourceIndex,
        belongsTo: 'facsimile',
      };

      const newFacsimileWords = [...prev.facsimilePhraseWords, newWord];

      // Check if Phase 1 is complete
      const isFacsimileComplete = isPhraseComplete(
        newFacsimileWords,
        prev.puzzle!.facsimilePhrase.words
      );

      const hasAllRequiredWords = prev.puzzle!.targetPhrase.words.every(requiredWord =>
        prev.targetPhraseWords.some(placed => placed.word.toLowerCase() === requiredWord.toLowerCase())
      );

      const phase1Complete = isFacsimileComplete && hasAllRequiredWords;

      return {
        ...prev,
        facsimilePhraseWords: newFacsimileWords,
        vortexWords: prev.vortexWords.filter((w) => w.id !== wordId),
        phase: phase1Complete ? 2 : 1,
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

  return {
    gameState,
    grabWord,
    placeWord,
    removeWord,
    reorderWords,
    answerBonus,
    skipBonus,
    dismissWord,
    autoCaptureFacsimileWord,
  };
}
