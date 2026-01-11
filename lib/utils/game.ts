/**
 * Core game logic utilities
 */

import type { Phrase, WordInVortex, PlacedWord, Puzzle } from '@/types/game';

/**
 * Parse a phrase into individual words, normalizing to lowercase
 * (except for proper nouns which remain capitalized)
 */
export function parsePhrase(text: string): string[] {
  // Common proper nouns to keep capitalized (expand this list as needed)
  const properNouns = new Set([
    'Shakespeare', 'Hamlet', 'God', 'Jesus', 'Christ', 'Buddha',
    'America', 'American', 'Europe', 'European', 'Asia', 'Asian',
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ]);

  return text
    // Split on whitespace AND em/en dashes (treating dashes as word separators)
    .split(/[\s—–]+/)
    .filter((word) => word.length > 0)
    .map((word) => {
      const cleaned = word.trim();
      // Remove other punctuation (but not dashes since we split on them)
      const bareWord = cleaned.replace(/[.,!?;:'"()[\]{}]/g, '');
      if (bareWord.length === 0) return null; // Skip if only punctuation
      if (properNouns.has(bareWord)) {
        return bareWord; // Keep capitalized proper nouns
      }
      return bareWord.toLowerCase(); // Everything else lowercase
    })
    .filter((word): word is string => word !== null); // Remove nulls
}

/**
 * Create a phrase object from text
 */
export function createPhrase(text: string, type: 'target' | 'facsimile'): Phrase {
  return {
    id: `${type}-${Date.now()}`,
    text,
    words: parsePhrase(text),
    type,
  };
}

/**
 * Calculate game score: total words seen / number of unique words
 */
export function calculateScore(totalWordsSeen: number, uniqueWords: number): number {
  if (uniqueWords === 0) return 0;
  return Math.round((totalWordsSeen / uniqueWords) * 100) / 100;
}

/**
 * Check if a phrase is complete
 */
export function isPhraseComplete(placedWords: PlacedWord[], expectedWords: string[]): boolean {
  if (placedWords.length !== expectedWords.length) return false;

  // Sort words by position to ensure correct order
  const sortedWords = [...placedWords].sort((a, b) => a.position - b.position);

  // Check if all words match expected words in order (don't check position property itself)
  return sortedWords.every((placed, index) => {
    return placed.word.toLowerCase() === expectedWords[index].toLowerCase();
  });
}

/**
 * Check if both phrases are complete
 */
export function areAllPhrasesComplete(
  targetPlaced: PlacedWord[],
  targetExpected: string[],
  facsimilePlaced: PlacedWord[],
  facsimileExpected: string[]
): boolean {
  return (
    isPhraseComplete(targetPlaced, targetExpected) &&
    isPhraseComplete(facsimilePlaced, facsimileExpected)
  );
}

/**
 * Generate a unique ID for a word in the vortex
 */
export function generateWordId(word: string, timestamp: number): string {
  return `${word}-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Simple seeded random number generator (for consistent SSR/client rendering)
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Create all words for the vortex from both phrases
 */
export function createVortexWords(puzzle: Puzzle): WordInVortex[] {
  const allWords: WordInVortex[] = [];
  const timestamp = Date.now();

  // Add target phrase words
  puzzle.targetPhrase.words.forEach((word, index) => {
    const seed = timestamp + index;
    allWords.push({
      id: generateWordId(word, seed),
      word,
      belongsTo: 'target',
      sourceIndex: index, // Track original position for duplicate handling
      angle: seededRandom(seed) * 360,
      radius: 0.8 + seededRandom(seed + 1000) * 0.2, // Start near outer edge
      appearanceCount: 0,
      isGrabbed: false,
    });
  });

  // Add facsimile phrase words
  puzzle.facsimilePhrase.words.forEach((word, index) => {
    const seed = timestamp + index + 1000;
    allWords.push({
      id: generateWordId(word, seed),
      word,
      belongsTo: 'facsimile',
      sourceIndex: index, // Track original position for duplicate handling
      angle: seededRandom(seed) * 360,
      radius: 0.8 + seededRandom(seed + 2000) * 0.2,
      appearanceCount: 0,
      isGrabbed: false,
    });
  });

  // Shuffle the words using seeded random
  return shuffleArraySeeded(allWords, timestamp);
}

/**
 * Shuffle an array (Fisher-Yates algorithm)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Shuffle an array with seeded random (Fisher-Yates algorithm)
 */
export function shuffleArraySeeded<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Find the correct position for a word in the facsimile phrase (auto-assembly)
 */
export function findCorrectPosition(
  word: string,
  expectedWords: string[],
  currentlyPlaced: PlacedWord[]
): number | null {
  const normalizedWord = word.toLowerCase();

  // Find all positions where this word should appear
  const validPositions = expectedWords
    .map((expectedWord, index) => ({
      index,
      word: expectedWord.toLowerCase(),
    }))
    .filter(({ word: expectedWord }) => expectedWord === normalizedWord)
    .map(({ index }) => index);

  // Find the first position that's not already filled
  for (const position of validPositions) {
    const isOccupied = currentlyPlaced.some((placed) => placed.position === position);
    if (!isOccupied) {
      return position;
    }
  }

  return null; // Word doesn't belong or all positions filled
}

/**
 * Get the current date in YYYY-MM-DD format for a given timezone
 */
export function getCurrentDateForTimezone(timezone: string): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now);
}

/**
 * Get user's timezone
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
