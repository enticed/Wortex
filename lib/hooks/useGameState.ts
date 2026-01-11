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

export function useGameState(puzzle: Puzzle | null) {
  const [gameState, setGameState] = useState<GameState>({
    puzzle,
    vortexWords: [],
    targetPhraseWords: [],
    facsimilePhraseWords: [],
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

  // Add new words to vortex periodically
  useEffect(() => {
    if (!puzzle || gameState.isComplete || gameState.isPaused) return;

    const interval = setInterval(() => {
      setGameState((prev) => {
        const allWords = createVortexWords(puzzle);

        // Track word INSTANCES by belongsTo + sourceIndex
        // This allows duplicate words like "to" and "be" to be tracked as separate instances
        const placedWordKeys = new Set<string>();
        prev.targetPhraseWords.forEach(pw => {
          placedWordKeys.add(`${pw.belongsTo}-${pw.sourceIndex}`);
        });
        prev.facsimilePhraseWords.forEach(pw => {
          placedWordKeys.add(`${pw.belongsTo}-${pw.sourceIndex}`);
        });

        const vortexWordKeys = new Set(
          prev.vortexWords.map(vw => {
            const match = allWords.find(aw =>
              aw.word === vw.word && aw.belongsTo === vw.belongsTo
            );
            return match ? `${match.belongsTo}-${match.sourceIndex}` : null;
          }).filter(Boolean) as string[]
        );

        // Find word instances that haven't been placed yet AND aren't in vortex
        const availableWords = allWords.filter(w => {
          const wordKey = `${w.belongsTo}-${w.sourceIndex}`;
          return !placedWordKeys.has(wordKey) && !vortexWordKeys.has(wordKey);
        });

        // If vortex is not full, add new words (max 10 words in vortex at once)
        if (prev.vortexWords.length < 10 && availableWords.length > 0) {
          const nextWordIndex = prev.totalWordsSeen % availableWords.length;
          const nextWord = availableWords[nextWordIndex];

          return {
            ...prev,
            vortexWords: [
              ...prev.vortexWords,
              {
                ...nextWord,
                id: generateWordId(nextWord.word, Date.now()),
              },
            ],
            totalWordsSeen: prev.totalWordsSeen + 1,
          };
        }

        // If vortex is full (10 words), cycle through unplaced words
        if (prev.vortexWords.length >= 10) {
          // Find words that are not placed (in either target or facsimile)
          const unplacedWords = allWords.filter(w => {
            const wordKey = `${w.belongsTo}-${w.sourceIndex}`;
            return !placedWordKeys.has(wordKey);
          });

          // If all words are placed, game is complete
          if (unplacedWords.length === 0) {
            return prev;
          }

          // Cycle through unplaced words continuously
          // This ensures we keep showing words even if all are currently in vortex
          const nextWordIndex = prev.totalWordsSeen % unplacedWords.length;
          const nextWord = unplacedWords[nextWordIndex];

          // Remove oldest word (first in array) and add new word
          const timestamp = Date.now();
          return {
            ...prev,
            vortexWords: [
              ...prev.vortexWords.slice(1), // Remove first (oldest) word
              {
                ...nextWord,
                angle: 180, // Start at left entrance
                radius: 1.0, // Start at outer edge
                id: generateWordId(nextWord.word, timestamp),
              },
            ],
            totalWordsSeen: prev.totalWordsSeen + 1,
          };
        }

        return prev;
      });
    }, 1500); // Add new word every 1.5 seconds (faster pace)

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

  return {
    gameState,
    grabWord,
    placeWord,
    removeWord,
    reorderWords,
    answerBonus,
    skipBonus,
  };
}
