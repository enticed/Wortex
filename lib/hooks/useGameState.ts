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
        vortexWords: initialWords.slice(0, 5), // Start with 5 words visible
        totalWordsSeen: 5,
      }));
    }
  }, [puzzle]);

  // Add new words to vortex periodically
  useEffect(() => {
    if (!puzzle || gameState.isComplete || gameState.isPaused) return;

    const interval = setInterval(() => {
      setGameState((prev) => {
        // Check if we need to add more words
        if (prev.vortexWords.length < 8) {
          // Keep 8 words in vortex at a time
          const allWords = createVortexWords(puzzle);
          const nextWord = allWords[prev.totalWordsSeen % allWords.length];

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
        return prev;
      });
    }, 2000); // Add new word every 2 seconds

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

  return {
    gameState,
    grabWord,
    placeWord,
    removeWord,
  };
}
