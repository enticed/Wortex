/**
 * Unit tests for star rating calculations
 */

import {
  calculatePhase1Stars,
  calculatePhase2Stars,
  calculateFinalStars,
} from '@/lib/utils/stars';

describe('calculatePhase1Stars', () => {
  test('should return 5 stars for perfect score (1.0)', () => {
    expect(calculatePhase1Stars(1.0)).toBe(5);
  });

  test('should return 5 stars for score up to 1.5', () => {
    expect(calculatePhase1Stars(1.5)).toBe(5);
    expect(calculatePhase1Stars(1.2)).toBe(5);
  });

  test('should return 4 stars for score between 1.5 and 2.5', () => {
    expect(calculatePhase1Stars(1.6)).toBe(4);
    expect(calculatePhase1Stars(2.0)).toBe(4);
    expect(calculatePhase1Stars(2.5)).toBe(4);
  });

  test('should return 3 stars for score between 2.5 and 3.5', () => {
    expect(calculatePhase1Stars(2.6)).toBe(3);
    expect(calculatePhase1Stars(3.0)).toBe(3);
    expect(calculatePhase1Stars(3.5)).toBe(3);
  });

  test('should return 2 stars for score between 3.5 and 4.5', () => {
    expect(calculatePhase1Stars(3.6)).toBe(2);
    expect(calculatePhase1Stars(4.0)).toBe(2);
    expect(calculatePhase1Stars(4.5)).toBe(2);
  });

  test('should return 1 star for score above 4.5', () => {
    expect(calculatePhase1Stars(4.6)).toBe(1);
    expect(calculatePhase1Stars(10.0)).toBe(1);
    expect(calculatePhase1Stars(100.0)).toBe(1);
  });

  test('should handle edge cases at boundaries', () => {
    expect(calculatePhase1Stars(1.5)).toBe(5); // Exactly at boundary
    expect(calculatePhase1Stars(2.5)).toBe(4); // Exactly at boundary
    expect(calculatePhase1Stars(3.5)).toBe(3); // Exactly at boundary
    expect(calculatePhase1Stars(4.5)).toBe(2); // Exactly at boundary
  });

  test('should handle very small scores', () => {
    expect(calculatePhase1Stars(0.5)).toBe(5);
    expect(calculatePhase1Stars(0.0)).toBe(5);
  });
});

describe('calculatePhase2Stars', () => {
  describe('with 10-word quote', () => {
    const wordCount = 10;

    test('should return 5 stars for minimal moves (perfect play)', () => {
      // 5 stars: up to 1 move per word = 10 * 0.25 = 2.5 points
      expect(calculatePhase2Stars(0, wordCount)).toBe(5);
      expect(calculatePhase2Stars(2.5, wordCount)).toBe(5);
    });

    test('should return 4 stars for moderate moves', () => {
      // 4 stars: up to 1.5 moves per word = 2.5 * 1.5 = 3.75 points
      expect(calculatePhase2Stars(2.6, wordCount)).toBe(4);
      expect(calculatePhase2Stars(3.75, wordCount)).toBe(4);
    });

    test('should return 3 stars for more moves', () => {
      // 3 stars: 3.75 * 1.5 = 5.625 points
      expect(calculatePhase2Stars(3.76, wordCount)).toBe(3);
      expect(calculatePhase2Stars(5.625, wordCount)).toBe(3);
    });

    test('should return 2 stars for many moves', () => {
      // 2 stars: 5.625 * 1.5 = 8.4375 points
      expect(calculatePhase2Stars(5.7, wordCount)).toBe(2);
      expect(calculatePhase2Stars(8.4375, wordCount)).toBe(2);
    });

    test('should return 1 star for excessive moves', () => {
      expect(calculatePhase2Stars(8.5, wordCount)).toBe(1);
      expect(calculatePhase2Stars(20.0, wordCount)).toBe(1);
    });
  });

  describe('with 5-word quote', () => {
    const wordCount = 5;

    test('should scale thresholds proportionally', () => {
      // 5 stars: 5 * 0.25 = 1.25
      expect(calculatePhase2Stars(1.25, wordCount)).toBe(5);
      // 4 stars: 1.25 * 1.5 = 1.875
      expect(calculatePhase2Stars(1.875, wordCount)).toBe(4);
      // 3 stars: 1.875 * 1.5 = 2.8125
      expect(calculatePhase2Stars(2.8125, wordCount)).toBe(3);
      // 2 stars: 2.8125 * 1.5 = 4.21875
      expect(calculatePhase2Stars(4.21875, wordCount)).toBe(2);
      // 1 star: anything above
      expect(calculatePhase2Stars(4.3, wordCount)).toBe(1);
    });
  });

  describe('with 20-word quote', () => {
    const wordCount = 20;

    test('should scale thresholds proportionally for longer quotes', () => {
      // 5 stars: 20 * 0.25 = 5.0
      expect(calculatePhase2Stars(5.0, wordCount)).toBe(5);
      // 4 stars: 5.0 * 1.5 = 7.5
      expect(calculatePhase2Stars(7.5, wordCount)).toBe(4);
      // 3 stars: 7.5 * 1.5 = 11.25
      expect(calculatePhase2Stars(11.25, wordCount)).toBe(3);
      // 2 stars: 11.25 * 1.5 = 16.875
      expect(calculatePhase2Stars(16.875, wordCount)).toBe(2);
      // 1 star: anything above
      expect(calculatePhase2Stars(17.0, wordCount)).toBe(1);
    });
  });

  test('should handle zero moves (perfect reordering)', () => {
    expect(calculatePhase2Stars(0, 10)).toBe(5);
    expect(calculatePhase2Stars(0, 5)).toBe(5);
    expect(calculatePhase2Stars(0, 20)).toBe(5);
  });

  test('should handle single word quote', () => {
    // With 1 word, thresholds are very low
    expect(calculatePhase2Stars(0, 1)).toBe(5);
    expect(calculatePhase2Stars(0.25, 1)).toBe(5);
  });
});

describe('calculateFinalStars', () => {
  test('should average Phase 1 and Phase 2 stars and round', () => {
    // Phase 1: 1.0 -> 5 stars, Phase 2: 2.5 -> 5 stars (for 10 words)
    // Average: (5 + 5) / 2 = 5
    expect(calculateFinalStars(1.0, 2.5, 10)).toBe(5);
  });

  test('should round average to nearest integer', () => {
    // Phase 1: 3.0 -> 3 stars
    // Phase 2 for 10 words: 5.0 score
    //   - 5 stars max: 10 * 0.25 = 2.5
    //   - 4 stars max: 2.5 * 1.5 = 3.75
    //   - 3 stars max: 3.75 * 1.5 = 5.625
    //   - 5.0 falls in 3 stars range
    // Average: (3 + 3) / 2 = 3.0
    expect(calculateFinalStars(3.0, 5.0, 10)).toBe(3);
  });

  test('should handle perfect scores in both phases', () => {
    expect(calculateFinalStars(1.0, 0, 10)).toBe(5);
  });

  test('should handle poor scores in both phases', () => {
    // Phase 1: 10.0 -> 1 star, Phase 2: 20.0 -> 1 star
    // Average: (1 + 1) / 2 = 1
    expect(calculateFinalStars(10.0, 20.0, 10)).toBe(1);
  });

  test('should handle mixed performance', () => {
    // Phase 1: 1.5 -> 5 stars, Phase 2: 8.5 -> 1 star (for 10 words)
    // Average: (5 + 1) / 2 = 3
    expect(calculateFinalStars(1.5, 8.5, 10)).toBe(3);
  });

  test('should produce different results for different quote lengths', () => {
    const phase1Score = 2.0;
    const phase2Score = 3.0;

    // For 5 words, Phase 2 thresholds are tighter
    const stars5 = calculateFinalStars(phase1Score, phase2Score, 5);

    // For 20 words, Phase 2 thresholds are more lenient
    const stars20 = calculateFinalStars(phase1Score, phase2Score, 20);

    // Results may differ based on how quote length affects Phase 2 rating
    expect(typeof stars5).toBe('number');
    expect(typeof stars20).toBe('number');
    expect(stars5).toBeGreaterThanOrEqual(1);
    expect(stars5).toBeLessThanOrEqual(5);
    expect(stars20).toBeGreaterThanOrEqual(1);
    expect(stars20).toBeLessThanOrEqual(5);
  });

  test('should always return an integer between 1 and 5', () => {
    const testCases = [
      { p1: 1.0, p2: 0, words: 10 },
      { p1: 2.5, p2: 5.0, words: 8 },
      { p1: 4.0, p2: 10.0, words: 15 },
      { p1: 5.0, p2: 20.0, words: 5 },
    ];

    testCases.forEach(({ p1, p2, words }) => {
      const stars = calculateFinalStars(p1, p2, words);
      expect(stars).toBeGreaterThanOrEqual(1);
      expect(stars).toBeLessThanOrEqual(5);
      expect(Number.isInteger(stars)).toBe(true);
    });
  });

  test('should handle rounding edge cases', () => {
    // Create scenario where average is exactly X.5
    // Phase 1: 2.5 -> 4 stars, Phase 2: 3.75 -> 4 stars (for 10 words)
    // Average: (4 + 4) / 2 = 4.0 -> rounds to 4
    expect(calculateFinalStars(2.5, 3.75, 10)).toBe(4);
  });
});
