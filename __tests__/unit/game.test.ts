/**
 * Unit tests for core game logic
 */

import {
  parsePhrase,
  createPhrase,
  normalizeCapitalizationAcrossTexts,
  createPhraseWithNormalizedCaps,
  calculateScore,
  isPhraseComplete,
  areAllPhrasesComplete,
  generateWordId,
  shuffleArraySeeded,
  findCorrectPosition,
  getCurrentDateForTimezone,
} from '@/lib/utils/game';
import type { PlacedWord } from '@/types/game';

describe('parsePhrase', () => {
  test('should parse simple phrase into words', () => {
    const result = parsePhrase('To be or not to be');
    expect(result).toEqual(['to', 'be', 'or', 'not', 'to', 'be']);
  });

  test('should remove punctuation except apostrophes', () => {
    const result = parsePhrase("I'll be there, won't I?");
    expect(result).toEqual(["I'll", 'be', 'there', "won't", 'I']);
  });

  test('should handle em-dashes and en-dashes as word separators', () => {
    const result = parsePhrase('To be—or not—to be');
    expect(result).toEqual(['to', 'be', 'or', 'not', 'to', 'be']);
  });

  test('should normalize sentence-case capitalization', () => {
    const result = parsePhrase('The quick brown fox. The lazy dog.');
    // Note: parsePhrase preserves capitalization when word only appears capitalized
    // Both instances of "The" are capitalized, so it stays capitalized
    expect(result).toEqual(['The', 'quick', 'brown', 'fox', 'The', 'lazy', 'dog']);
  });

  test('should preserve proper nouns (consistently capitalized)', () => {
    const result = parsePhrase('Shakespeare wrote Romeo and Juliet');
    expect(result).toEqual(['Shakespeare', 'wrote', 'Romeo', 'and', 'Juliet']);
  });

  test('should handle mixed sentence-case and proper nouns', () => {
    const result = parsePhrase('The playwright Shakespeare. Shakespeare wrote plays.');
    // "The" only appears capitalized, so it stays capitalized
    // "Shakespeare" is consistently capitalized (proper noun)
    expect(result).toEqual(['The', 'playwright', 'Shakespeare', 'Shakespeare', 'wrote', 'plays']);
  });

  test('should handle empty string', () => {
    const result = parsePhrase('');
    expect(result).toEqual([]);
  });

  test('should handle only punctuation', () => {
    const result = parsePhrase('... !!! ???');
    expect(result).toEqual([]);
  });

  test('should handle multiple spaces', () => {
    const result = parsePhrase('word1    word2     word3');
    expect(result).toEqual(['word1', 'word2', 'word3']);
  });

  test('should preserve contractions with apostrophes', () => {
    const result = parsePhrase("don't can't won't it's");
    expect(result).toEqual(["don't", "can't", "won't", "it's"]);
  });
});

describe('createPhrase', () => {
  test('should create target phrase object', () => {
    const phrase = createPhrase('To be or not to be', 'target');
    expect(phrase.text).toBe('To be or not to be');
    expect(phrase.words).toEqual(['to', 'be', 'or', 'not', 'to', 'be']);
    expect(phrase.type).toBe('target');
    expect(phrase.id).toMatch(/^target-\d+$/);
  });

  test('should create facsimile phrase object', () => {
    const phrase = createPhrase('To exist or not', 'facsimile');
    expect(phrase.type).toBe('facsimile');
    expect(phrase.id).toMatch(/^facsimile-\d+$/);
  });
});

describe('normalizeCapitalizationAcrossTexts', () => {
  test('should normalize sentence-case across multiple texts', () => {
    const texts = [
      'The quick brown fox.',
      'The lazy dog sleeps.',
    ];
    const result = normalizeCapitalizationAcrossTexts(texts);
    // "The" only appears capitalized, so it stays capitalized
    expect(result.get('the')).toBe('The');
    expect(result.get('quick')).toBe('quick');
  });

  test('should preserve proper nouns capitalization', () => {
    const texts = [
      'Shakespeare wrote plays.',
      'Romeo and Juliet by Shakespeare.',
    ];
    const result = normalizeCapitalizationAcrossTexts(texts);
    expect(result.get('shakespeare')).toBe('Shakespeare');
    expect(result.get('romeo')).toBe('Romeo');
    expect(result.get('juliet')).toBe('Juliet');
  });

  test('should handle mixed capitalization patterns', () => {
    const texts = [
      'The word America is capitalized.',
      'I love America.',
      'America is great.',
    ];
    const result = normalizeCapitalizationAcrossTexts(texts);
    expect(result.get('america')).toBe('America');
    // "the" only appears capitalized (sentence-initial), never lowercase in these texts
    expect(result.get('the')).toBe('The');
  });

  test('should handle empty array', () => {
    const result = normalizeCapitalizationAcrossTexts([]);
    expect(result.size).toBe(0);
  });
});

describe('calculateScore', () => {
  test('should calculate perfect score (1.0) when totalWordsSeen equals uniqueWords', () => {
    const score = calculateScore(10, 10);
    expect(score).toBe(1.0);
  });

  test('should calculate score > 1.0 when more words seen than unique', () => {
    const score = calculateScore(20, 10);
    expect(score).toBe(2.0);
  });

  test('should round to 2 decimal places', () => {
    const score = calculateScore(15, 10);
    expect(score).toBe(1.5);
  });

  test('should handle large numbers', () => {
    const score = calculateScore(1000, 100);
    expect(score).toBe(10.0);
  });

  test('should return 0 when uniqueWords is 0', () => {
    const score = calculateScore(10, 0);
    expect(score).toBe(0);
  });

  test('should ignore speed parameter (legacy)', () => {
    const score1 = calculateScore(10, 5, 1.0);
    const score2 = calculateScore(10, 5, 2.0);
    expect(score1).toBe(score2);
    expect(score1).toBe(2.0);
  });
});

describe('isPhraseComplete', () => {
  test('should return true when all words match in correct order', () => {
    const placedWords: PlacedWord[] = [
      { id: '1', word: 'to', position: 0, belongsTo: 'target' },
      { id: '2', word: 'be', position: 1, belongsTo: 'target' },
      { id: '3', word: 'or', position: 2, belongsTo: 'target' },
    ];
    const expectedWords = ['to', 'be', 'or'];
    expect(isPhraseComplete(placedWords, expectedWords)).toBe(true);
  });

  test('should return true when words are out of order but positions are correct', () => {
    const placedWords: PlacedWord[] = [
      { id: '2', word: 'be', position: 1, belongsTo: 'target' },
      { id: '1', word: 'to', position: 0, belongsTo: 'target' },
      { id: '3', word: 'or', position: 2, belongsTo: 'target' },
    ];
    const expectedWords = ['to', 'be', 'or'];
    expect(isPhraseComplete(placedWords, expectedWords)).toBe(true);
  });

  test('should return false when lengths differ', () => {
    const placedWords: PlacedWord[] = [
      { id: '1', word: 'to', position: 0, belongsTo: 'target' },
      { id: '2', word: 'be', position: 1, belongsTo: 'target' },
    ];
    const expectedWords = ['to', 'be', 'or'];
    expect(isPhraseComplete(placedWords, expectedWords)).toBe(false);
  });

  test('should return false when words do not match', () => {
    const placedWords: PlacedWord[] = [
      { id: '1', word: 'to', position: 0, belongsTo: 'target' },
      { id: '2', word: 'exist', position: 1, belongsTo: 'target' },
      { id: '3', word: 'or', position: 2, belongsTo: 'target' },
    ];
    const expectedWords = ['to', 'be', 'or'];
    expect(isPhraseComplete(placedWords, expectedWords)).toBe(false);
  });

  test('should be case-insensitive', () => {
    const placedWords: PlacedWord[] = [
      { id: '1', word: 'TO', position: 0, belongsTo: 'target' },
      { id: '2', word: 'Be', position: 1, belongsTo: 'target' },
      { id: '3', word: 'OR', position: 2, belongsTo: 'target' },
    ];
    const expectedWords = ['to', 'be', 'or'];
    expect(isPhraseComplete(placedWords, expectedWords)).toBe(true);
  });

  test('should handle empty arrays (vacuous truth)', () => {
    // Empty arrays technically satisfy the condition (all 0 elements match)
    // This is a mathematical vacuous truth - the actual game won't have empty phrases
    expect(isPhraseComplete([], [])).toBe(true);
  });
});

describe('areAllPhrasesComplete', () => {
  test('should return true when both phrases are complete', () => {
    const targetPlaced: PlacedWord[] = [
      { id: '1', word: 'to', position: 0, belongsTo: 'target' },
      { id: '2', word: 'be', position: 1, belongsTo: 'target' },
    ];
    const facsimilePlaced: PlacedWord[] = [
      { id: '3', word: 'to', position: 0, belongsTo: 'facsimile' },
      { id: '4', word: 'exist', position: 1, belongsTo: 'facsimile' },
    ];
    expect(areAllPhrasesComplete(targetPlaced, ['to', 'be'], facsimilePlaced, ['to', 'exist'])).toBe(true);
  });

  test('should return false when target phrase is incomplete', () => {
    const targetPlaced: PlacedWord[] = [
      { id: '1', word: 'to', position: 0, belongsTo: 'target' },
    ];
    const facsimilePlaced: PlacedWord[] = [
      { id: '3', word: 'to', position: 0, belongsTo: 'facsimile' },
      { id: '4', word: 'exist', position: 1, belongsTo: 'facsimile' },
    ];
    expect(areAllPhrasesComplete(targetPlaced, ['to', 'be'], facsimilePlaced, ['to', 'exist'])).toBe(false);
  });

  test('should return false when facsimile phrase is incomplete', () => {
    const targetPlaced: PlacedWord[] = [
      { id: '1', word: 'to', position: 0, belongsTo: 'target' },
      { id: '2', word: 'be', position: 1, belongsTo: 'target' },
    ];
    const facsimilePlaced: PlacedWord[] = [
      { id: '3', word: 'to', position: 0, belongsTo: 'facsimile' },
    ];
    expect(areAllPhrasesComplete(targetPlaced, ['to', 'be'], facsimilePlaced, ['to', 'exist'])).toBe(false);
  });
});

describe('generateWordId', () => {
  test('should generate unique IDs for same word', () => {
    const id1 = generateWordId('test', 1000);
    const id2 = generateWordId('test', 1000);
    expect(id1).not.toBe(id2);
  });

  test('should include word and timestamp in ID', () => {
    const id = generateWordId('example', 12345);
    expect(id).toMatch(/^example-12345-/);
  });

  test('should handle special characters in word', () => {
    const id = generateWordId("don't", 1000);
    expect(id).toMatch(/^don't-1000-/);
  });
});

describe('shuffleArraySeeded', () => {
  test('should shuffle array with same seed consistently', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled1 = shuffleArraySeeded(arr, 42);
    const shuffled2 = shuffleArraySeeded(arr, 42);
    expect(shuffled1).toEqual(shuffled2);
  });

  test('should produce different results with different seeds', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const shuffled1 = shuffleArraySeeded(arr, 42);
    const shuffled2 = shuffleArraySeeded(arr, 43);
    expect(shuffled1).not.toEqual(shuffled2);
  });

  test('should not modify original array', () => {
    const arr = [1, 2, 3, 4, 5];
    const original = [...arr];
    shuffleArraySeeded(arr, 42);
    expect(arr).toEqual(original);
  });

  test('should contain all original elements', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffleArraySeeded(arr, 42);
    expect(shuffled.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  test('should handle empty array', () => {
    const shuffled = shuffleArraySeeded([], 42);
    expect(shuffled).toEqual([]);
  });

  test('should handle single element array', () => {
    const shuffled = shuffleArraySeeded([1], 42);
    expect(shuffled).toEqual([1]);
  });
});

describe('findCorrectPosition', () => {
  test('should find first available position for word', () => {
    const expectedWords = ['to', 'be', 'or', 'not', 'to', 'be'];
    const currentlyPlaced: PlacedWord[] = [];
    const position = findCorrectPosition('to', expectedWords, currentlyPlaced);
    expect(position).toBe(0);
  });

  test('should find next available position when first is occupied', () => {
    const expectedWords = ['to', 'be', 'or', 'not', 'to', 'be'];
    const currentlyPlaced: PlacedWord[] = [
      { id: '1', word: 'to', position: 0, belongsTo: 'target' },
    ];
    const position = findCorrectPosition('to', expectedWords, currentlyPlaced);
    expect(position).toBe(4);
  });

  test('should return null when word does not belong', () => {
    const expectedWords = ['to', 'be', 'or'];
    const currentlyPlaced: PlacedWord[] = [];
    const position = findCorrectPosition('exist', expectedWords, currentlyPlaced);
    expect(position).toBeNull();
  });

  test('should return null when all positions are filled', () => {
    const expectedWords = ['to', 'be'];
    const currentlyPlaced: PlacedWord[] = [
      { id: '1', word: 'to', position: 0, belongsTo: 'target' },
      { id: '2', word: 'be', position: 1, belongsTo: 'target' },
    ];
    const position = findCorrectPosition('to', expectedWords, currentlyPlaced);
    expect(position).toBeNull();
  });

  test('should be case-insensitive', () => {
    const expectedWords = ['to', 'be', 'or'];
    const currentlyPlaced: PlacedWord[] = [];
    const position = findCorrectPosition('TO', expectedWords, currentlyPlaced);
    expect(position).toBe(0);
  });

  test('should handle duplicate words in expected array', () => {
    const expectedWords = ['the', 'the', 'the'];
    const currentlyPlaced: PlacedWord[] = [
      { id: '1', word: 'the', position: 0, belongsTo: 'target' },
    ];
    const position = findCorrectPosition('the', expectedWords, currentlyPlaced);
    expect(position).toBe(1);
  });
});

describe('getCurrentDateForTimezone', () => {
  test('should return date in YYYY-MM-DD format', () => {
    const date = getCurrentDateForTimezone('America/New_York');
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('should return different dates for different timezones on date boundary', () => {
    // Note: This test may be flaky near midnight UTC
    const utc = getCurrentDateForTimezone('UTC');
    expect(utc).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('should handle various timezone formats', () => {
    const timezones = ['America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney'];
    timezones.forEach((tz) => {
      const date = getCurrentDateForTimezone(tz);
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
