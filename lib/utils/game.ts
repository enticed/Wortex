/**
 * Core game logic utilities
 */

import type { Phrase, WordInVortex, PlacedWord, Puzzle } from '@/types/game';

/**
 * Parse a phrase into individual words, preserving apostrophes.
 * Normalizes sentence-case capitalization (first letter of sentence) to lowercase
 * while preserving proper nouns and words that are consistently capitalized.
 */
export function parsePhrase(text: string): string[] {
  const words = text
    // Split on whitespace AND em/en dashes (treating dashes as word separators)
    .split(/[\s—–]+/)
    .filter((word) => word.length > 0)
    .map((word) => {
      const cleaned = word.trim();
      // Remove punctuation EXCEPT apostrophes (preserve contractions like "I'll", "don't", etc.)
      // Remove: . , ! ? ; : " ( ) [ ] { } but KEEP apostrophes (')
      const bareWord = cleaned.replace(/[.,!?;:"()[\]{}]/g, '');
      if (bareWord.length === 0) return null; // Skip if only punctuation
      return bareWord;
    })
    .filter((word): word is string => word !== null); // Remove nulls

  // Normalize sentence-case capitalization while preserving proper nouns
  // Strategy: If a word appears both capitalized and lowercase in the text,
  // assume the lowercase version is correct (capitalized was just sentence-initial)
  const wordMap = new Map<string, string>(); // lowercase -> canonical form

  words.forEach((word) => {
    const lower = word.toLowerCase();
    const existing = wordMap.get(lower);

    if (!existing) {
      // First occurrence - use this form
      wordMap.set(lower, word);
    } else {
      // Word already exists - check if we should update the canonical form
      // If existing is capitalized and current is lowercase, prefer lowercase
      // (This handles sentence-initial capitalization)
      const existingFirstChar = existing.charAt(0);
      const currentFirstChar = word.charAt(0);

      if (existingFirstChar === existingFirstChar.toUpperCase() &&
          currentFirstChar === currentFirstChar.toLowerCase() &&
          existing.substring(1) === word.substring(1)) {
        // Existing is capitalized, current is lowercase, rest matches
        // Prefer the lowercase version (normalize sentence case)
        wordMap.set(lower, word);
      }
      // Otherwise keep existing (preserve proper nouns that are consistently capitalized)
    }
  });

  // Return words with normalized capitalization
  return words.map(word => wordMap.get(word.toLowerCase()) || word);
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
 * Normalize capitalization across multiple texts.
 * Strategy: Convert to lowercase UNLESS the word is ALWAYS capitalized across ALL occurrences
 * (indicating a proper noun like "Shakespeare" or "America").
 * This handles sentence-initial capitalization by defaulting to lowercase.
 */
export function normalizeCapitalizationAcrossTexts(texts: string[]): Map<string, string> {
  const allWords: string[] = [];

  // Collect all words from all texts
  texts.forEach(text => {
    const words = text
      .split(/[\s—–]+/)
      .filter((word) => word.length > 0)
      .map((word) => {
        const cleaned = word.trim();
        const bareWord = cleaned.replace(/[.,!?;:"()[\]{}]/g, '');
        return bareWord;
      })
      .filter((word) => word.length > 0);

    allWords.push(...words);
  });

  // Track capitalization patterns for each unique word (case-insensitive)
  const wordOccurrences = new Map<string, { capitalized: number; lowercase: number }>();

  allWords.forEach((word) => {
    const lower = word.toLowerCase();
    const firstChar = word.charAt(0);
    const isCapitalized = firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase();

    if (!wordOccurrences.has(lower)) {
      wordOccurrences.set(lower, { capitalized: 0, lowercase: 0 });
    }

    const counts = wordOccurrences.get(lower)!;
    if (isCapitalized) {
      counts.capitalized++;
    } else {
      counts.lowercase++;
    }
  });

  // Build capitalization map: use lowercase UNLESS word is ALWAYS capitalized
  const wordMap = new Map<string, string>();

  wordOccurrences.forEach((counts, lower) => {
    // If word appears lowercase at least once OR never appears capitalized, use lowercase
    // Only preserve capitalization if word is ALWAYS capitalized (proper noun)
    if (counts.lowercase > 0 || counts.capitalized === 0) {
      wordMap.set(lower, lower); // Always use lowercase
    } else {
      // Word is ALWAYS capitalized - find the capitalized version to preserve
      const capitalizedVersion = allWords.find(w => w.toLowerCase() === lower && w.charAt(0) === w.charAt(0).toUpperCase());
      wordMap.set(lower, capitalizedVersion || lower);
    }
  });

  return wordMap;
}

/**
 * Create a phrase object with normalized capitalization using a provided word map
 */
export function createPhraseWithNormalizedCaps(
  text: string,
  type: 'target' | 'facsimile',
  capMap: Map<string, string>
): Phrase {
  const words = text
    .split(/[\s—–]+/)
    .filter((word) => word.length > 0)
    .map((word) => {
      const cleaned = word.trim();
      const bareWord = cleaned.replace(/[.,!?;:"()[\]{}]/g, '');
      if (bareWord.length === 0) return null;
      // Use the normalized capitalization from the map
      return capMap.get(bareWord.toLowerCase()) || bareWord;
    })
    .filter((word): word is string => word !== null);

  return {
    id: `${type}-${Date.now()}`,
    text,
    words,
    type,
  };
}

/**
 * Calculate game score: total words seen / number of unique words
 * Adjusted by speed to account for difficulty (lower score = better)
 */
export function calculateScore(totalWordsSeen: number, uniqueWords: number, speed: number = 1.0): number {
  if (uniqueWords === 0) return 0;

  // Base score: totalWordsSeen / uniqueWords (lower is better)
  const baseScore = totalWordsSeen / uniqueWords;

  // Speed adjustment: divide by speed to compensate for difficulty
  // Faster speeds (harder) = lower adjusted score
  // Slower speeds (easier) = higher adjusted score
  const adjustedScore = baseScore / speed;

  return Math.round(adjustedScore * 100) / 100;
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

  // Create sets of words in each phrase (case-insensitive)
  const targetWordsSet = new Set(puzzle.targetPhrase.words.map(w => w.toLowerCase()));
  const facsimileWordsSet = new Set(puzzle.facsimilePhrase.words.map(w => w.toLowerCase()));

  // Add target phrase words
  puzzle.targetPhrase.words.forEach((word, index) => {
    const seed = timestamp + index;
    const wordLower = word.toLowerCase();
    // Mark as spurious if it appears in both phrases
    const belongsTo = facsimileWordsSet.has(wordLower) ? 'spurious' : 'target';

    allWords.push({
      id: generateWordId(word, seed),
      word,
      belongsTo,
      sourceIndex: index, // Track original position for duplicate handling
      angle: seededRandom(seed) * 360,
      radius: 0.8 + seededRandom(seed + 1000) * 0.2, // Start near outer edge
      appearanceCount: 0,
      isGrabbed: false,
      totalRotation: 0, // Start with no rotation
    });
  });

  // Add facsimile phrase words
  puzzle.facsimilePhrase.words.forEach((word, index) => {
    const seed = timestamp + index + 1000;
    const wordLower = word.toLowerCase();
    // Mark as spurious if it appears in both phrases
    const belongsTo = targetWordsSet.has(wordLower) ? 'spurious' : 'facsimile';

    allWords.push({
      id: generateWordId(word, seed),
      word,
      belongsTo,
      sourceIndex: index, // Track original position for duplicate handling
      angle: seededRandom(seed) * 360,
      radius: 0.8 + seededRandom(seed + 2000) * 0.2,
      appearanceCount: 0,
      isGrabbed: false,
      totalRotation: 0, // Start with no rotation
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
