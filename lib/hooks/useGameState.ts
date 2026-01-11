'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GameState, Puzzle, WordInVortex, PlacedWord } from '@/types/game';
import {
  createVortexWords,
  calculateScore,
  areAllPhrasesComplete,
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
    dismissedWords: new Set<string>(),
    wordQueue: [],
    totalWordsSeen: 0,
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

  // Add new words to vortex periodically using queue-based fair distribution
  useEffect(() => {
    if (!puzzle || gameState.isComplete || gameState.isPaused) return;

    const interval = setInterval(() => {
      setGameState((prev) => {
        const allWords = createVortexWords(puzzle);

        // Track placed word keys
        const placedWordKeys = new Set<string>();
        prev.targetPhraseWords.forEach(pw => {
          placedWordKeys.add(`${pw.belongsTo}-${pw.sourceIndex}`);
        });
        prev.facsimilePhraseWords.forEach(pw => {
          placedWordKeys.add(`${pw.belongsTo}-${pw.sourceIndex}`);
        });

        // Get all unplaced, non-dismissed words
        const unplacedWords = allWords.filter(w => {
          const wordKey = `${w.belongsTo}-${w.sourceIndex}`;
          return !placedWordKeys.has(wordKey) && !prev.dismissedWords.has(wordKey);
        });

        // If no unplaced words available (all dismissed), clear dismissals
        if (unplacedWords.length === 0) {
          const allUnplacedWords = allWords.filter(w => {
            const wordKey = `${w.belongsTo}-${w.sourceIndex}`;
            return !placedWordKeys.has(wordKey);
          });

          if (allUnplacedWords.length === 0) {
            return prev; // Game complete
          }

          // Clear dismissed set and refill queue
          const newQueue = shuffleArray(
            allUnplacedWords.map(w => `${w.belongsTo}-${w.sourceIndex}`)
          );

          return {
            ...prev,
            dismissedWords: new Set<string>(),
            wordQueue: newQueue,
          };
        }

        // Get words currently in vortex
        const vortexWordKeys = new Set(
          prev.vortexWords.map(vw => `${vw.belongsTo}-${vw.sourceIndex}`)
        );

        // Initialize or refill queue when empty
        let queue = prev.wordQueue;
        if (queue.length === 0) {
          // Create shuffled queue of all unplaced word keys
          queue = shuffleArray(
            unplacedWords.map(w => `${w.belongsTo}-${w.sourceIndex}`)
          );
        }

        // Find next word not currently in vortex
        let nextWordKey: string | null = null;
        let remainingQueue = [...queue];

        for (let i = 0; i < remainingQueue.length; i++) {
          if (!vortexWordKeys.has(remainingQueue[i])) {
            nextWordKey = remainingQueue[i];
            remainingQueue = remainingQueue.slice(i + 1);
            break;
          }
        }

        // If all queued words are in vortex, refill queue and try again
        if (!nextWordKey && unplacedWords.length > prev.vortexWords.length) {
          queue = shuffleArray(
            unplacedWords.map(w => `${w.belongsTo}-${w.sourceIndex}`)
          );
          remainingQueue = [...queue];

          for (let i = 0; i < remainingQueue.length; i++) {
            if (!vortexWordKeys.has(remainingQueue[i])) {
              nextWordKey = remainingQueue[i];
              remainingQueue = remainingQueue.slice(i + 1);
              break;
            }
          }
        }

        // If still no word found, skip this cycle
        if (!nextWordKey) {
          return prev;
        }

        // Find the actual word object
        const nextWord = allWords.find(w =>
          `${w.belongsTo}-${w.sourceIndex}` === nextWordKey
        );

        if (!nextWord) {
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

        // For facsimile (auto-assembly), find correct position
        if (areaId === 'facsimile') {
          const correctPosition = findCorrectPosition(
            word.word,
            expectedWords,
            currentWords
          );

          if (correctPosition === null) {
            // Word doesn't belong, return it to vortex
            return {
              ...prev,
              vortexWords: prev.vortexWords.map((w) =>
                w.id === wordId ? { ...w, isGrabbed: false } : w
              ),
            };
          }

          // Place word in correct position
          const newWord: PlacedWord = {
            id: wordId,
            word: word.word,
            position: correctPosition,
            sourceIndex: word.sourceIndex,
            belongsTo: 'facsimile',
          };

          const updatedWords = [...currentWords, newWord];

          // Check if game is complete
          const isComplete = areAllPhrasesComplete(
            prev.targetPhraseWords,
            prev.puzzle.targetPhrase.words,
            updatedWords,
            prev.puzzle.facsimilePhrase.words
          );

          const score = isComplete
            ? calculateScore(
                prev.totalWordsSeen,
                prev.puzzle.targetPhrase.words.length +
                  prev.puzzle.facsimilePhrase.words.length
              )
            : null;

          return {
            ...prev,
            facsimilePhraseWords: updatedWords,
            vortexWords: prev.vortexWords.filter((w) => w.id !== wordId),
            isComplete,
            score,
          };
        }

        // For target (manual assembly), place at end
        const newWord: PlacedWord = {
          id: wordId,
          word: word.word,
          position: currentWords.length,
          sourceIndex: word.sourceIndex,
          belongsTo: 'target',
        };

        const updatedWords = [...currentWords, newWord];

        // Check if game is complete
        const isComplete = areAllPhrasesComplete(
          updatedWords,
          prev.puzzle.targetPhrase.words,
          prev.facsimilePhraseWords,
          prev.puzzle.facsimilePhrase.words
        );

        const score = isComplete
          ? calculateScore(
              prev.totalWordsSeen,
              prev.puzzle.targetPhrase.words.length +
                prev.puzzle.facsimilePhrase.words.length
            )
          : null;

        return {
          ...prev,
          targetPhraseWords: updatedWords,
          vortexWords: prev.vortexWords.filter((w) => w.id !== wordId),
          isComplete,
          score,
        };
      });
    },
    []
  );

  // Remove a word from assembly area (send back to vortex)
  const removeWord = useCallback((wordId: string, fromArea: 'target' | 'facsimile') => {
    setGameState((prev) => {
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

  // Reorder words in target phrase (manual assembly)
  const reorderWords = useCallback((activeId: string, overId: string) => {
    setGameState((prev) => {
      const oldIndex = prev.targetPhraseWords.findIndex((w) => w.id === activeId);
      const newIndex = prev.targetPhraseWords.findIndex((w) => w.id === overId);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;

      const reordered = [...prev.targetPhraseWords];
      const [movedWord] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, movedWord);

      // Update positions
      const updatedWords = reordered.map((word, index) => ({
        ...word,
        position: index,
      }));

      // Check if game is complete after reordering
      const isComplete = prev.puzzle
        ? areAllPhrasesComplete(
            updatedWords,
            prev.puzzle.targetPhrase.words,
            prev.facsimilePhraseWords,
            prev.puzzle.facsimilePhrase.words
          )
        : false;

      const score =
        isComplete && prev.puzzle
          ? calculateScore(
              prev.totalWordsSeen,
              prev.puzzle.targetPhrase.words.length +
                prev.puzzle.facsimilePhrase.words.length
            )
          : null;

      return {
        ...prev,
        targetPhraseWords: updatedWords,
        isComplete,
        score,
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

  // Dismiss a word from vortex (swipe gesture)
  const dismissWord = useCallback((wordId: string) => {
    setGameState((prev) => {
      const word = prev.vortexWords.find((w) => w.id === wordId);
      if (!word) return prev;

      const wordKey = `${word.belongsTo}-${word.sourceIndex}`;
      const newDismissedWords = new Set(prev.dismissedWords);
      newDismissedWords.add(wordKey);

      return {
        ...prev,
        dismissedWords: newDismissedWords,
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
  };
}
