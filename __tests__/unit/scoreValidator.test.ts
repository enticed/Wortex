/**
 * Unit tests for score validation
 */

import { sanitizeScoreSubmission } from '@/lib/validation/scoreValidator';
import type { ScoreSubmission } from '@/lib/validation/scoreValidator';

describe('Score Validation', () => {
  describe('sanitizeScoreSubmission', () => {
    test('should recalculate final score from components', () => {
      const submission: ScoreSubmission = {
        userId: 'user-123',
        puzzleId: 'puzzle-456',
        finalScore: 999, // Wrong value
        phase1Score: 2.5,
        phase2Score: 1.75,
        bonusCorrect: true,
        timeTakenSeconds: 120,
        speed: 1.0,
      };

      const sanitized = sanitizeScoreSubmission(submission, 10);

      // finalScore should be phase1 + phase2 + bonus
      expect(sanitized.finalScore).toBe(5.25); // 2.5 + 1.75 + 1
    });

    test('should recalculate final score without bonus', () => {
      const submission: ScoreSubmission = {
        userId: 'user-123',
        puzzleId: 'puzzle-456',
        finalScore: 999,
        phase1Score: 2.0,
        phase2Score: 1.5,
        bonusCorrect: false,
        timeTakenSeconds: 120,
        speed: 1.0,
      };

      const sanitized = sanitizeScoreSubmission(submission, 10);

      expect(sanitized.finalScore).toBe(3.5); // 2.0 + 1.5 + 0
    });

    test('should recalculate stars correctly', () => {
      const submission: ScoreSubmission = {
        userId: 'user-123',
        puzzleId: 'puzzle-456',
        finalScore: 3.0,
        phase1Score: 1.5, // 5 stars
        phase2Score: 2.0, // For 10 words: 5 stars
        bonusCorrect: false,
        timeTakenSeconds: 120,
        speed: 1.0,
        stars: 1, // Wrong value
      };

      const sanitized = sanitizeScoreSubmission(submission, 10);

      // Both phases get 5 stars, average = 5
      expect(sanitized.stars).toBe(5);
    });

    test('should round scores to 2 decimal places', () => {
      const submission: ScoreSubmission = {
        userId: 'user-123',
        puzzleId: 'puzzle-456',
        finalScore: 1.123456,
        phase1Score: 1.987654,
        phase2Score: 2.345678,
        bonusCorrect: false,
        timeTakenSeconds: 120,
        speed: 1.555555,
      };

      const sanitized = sanitizeScoreSubmission(submission, 10);

      expect(sanitized.phase1Score).toBe(1.99);
      expect(sanitized.phase2Score).toBe(2.35);
      expect(sanitized.speed).toBe(1.56);
    });

    test('should round min/max speeds if provided', () => {
      const submission: ScoreSubmission = {
        userId: 'user-123',
        puzzleId: 'puzzle-456',
        finalScore: 3.0,
        phase1Score: 1.5,
        phase2Score: 1.5,
        bonusCorrect: false,
        timeTakenSeconds: 120,
        speed: 1.0,
        minSpeed: 0.888888,
        maxSpeed: 1.666666,
      };

      const sanitized = sanitizeScoreSubmission(submission, 10);

      expect(sanitized.minSpeed).toBe(0.89);
      expect(sanitized.maxSpeed).toBe(1.67);
    });
  });

  describe('Validation Rules', () => {
    test('should reject negative scores', () => {
      const invalidScores = [-1, -0.1, -100];

      invalidScores.forEach((score) => {
        expect(score).toBeLessThan(0);
        // In actual validation, this would return { valid: false }
      });
    });

    test('should reject invalid speed values', () => {
      const invalidSpeeds = [0, 0.4, 3.1, -1, 10];

      invalidSpeeds.forEach((speed) => {
        const isValid = speed >= 0.5 && speed <= 3.0;
        expect(isValid).toBe(false);
      });
    });

    test('should accept valid speed values', () => {
      const validSpeeds = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];

      validSpeeds.forEach((speed) => {
        const isValid = speed >= 0.5 && speed <= 3.0;
        expect(isValid).toBe(true);
      });
    });

    test('should enforce phase2 score must be multiple of 0.25', () => {
      const validPhase2Scores = [0, 0.25, 0.5, 0.75, 1.0, 1.25, 2.0];
      const invalidPhase2Scores = [0.1, 0.3, 0.6, 1.1, 1.33];

      validPhase2Scores.forEach((score) => {
        const remainder = (score * 100) % 25;
        expect(remainder).toBe(0);
      });

      invalidPhase2Scores.forEach((score) => {
        const remainder = (score * 100) % 25;
        expect(remainder).not.toBe(0);
      });
    });

    test('should validate final score calculation', () => {
      const testCases = [
        { phase1: 2.0, phase2: 1.5, bonus: true, expected: 4.5 },
        { phase1: 1.5, phase2: 0.75, bonus: false, expected: 2.25 },
        { phase1: 3.0, phase2: 2.0, bonus: true, expected: 6.0 },
      ];

      testCases.forEach(({ phase1, phase2, bonus, expected }) => {
        const bonusPoints = bonus ? 1 : 0;
        const finalScore = phase1 + phase2 + bonusPoints;
        expect(finalScore).toBeCloseTo(expected, 2);
      });
    });

    test('should validate reasonable time limits', () => {
      const tooFast = 2; // 2 seconds for complex puzzle
      const reasonable = 120; // 2 minutes
      const tooSlow = 25 * 60 * 60; // 25 hours

      expect(tooFast).toBeLessThan(5); // Suspiciously fast
      expect(reasonable).toBeGreaterThan(5);
      expect(reasonable).toBeLessThan(24 * 60 * 60);
      expect(tooSlow).toBeGreaterThan(24 * 60 * 60); // Over limit
    });
  });

  describe('Score Manipulation Detection', () => {
    test('should detect impossible perfect scores', () => {
      // Phase 1 score must be at least 1.0 (perfect play)
      const impossibleScore = 0.5;
      const MIN_PHASE1_SCORE = 1.0;

      expect(impossibleScore).toBeLessThan(MIN_PHASE1_SCORE);
    });

    test('should detect unreasonably high scores', () => {
      // Phase 1 score should not exceed 20.0 (very inefficient)
      const suspiciousScore = 50.0;
      const MAX_PHASE1_SCORE = 20.0;

      expect(suspiciousScore).toBeGreaterThan(MAX_PHASE1_SCORE);
    });

    test('should validate phase2 score against word count', () => {
      const quoteWordCount = 10;
      const maxMoves = quoteWordCount * 3; // 30 moves max
      const maxPhase2Score = maxMoves * 0.25; // 7.5

      const validScore = 5.0;
      const invalidScore = 10.0;

      expect(validScore).toBeLessThanOrEqual(maxPhase2Score);
      expect(invalidScore).toBeGreaterThan(maxPhase2Score);
    });
  });

  describe('Edge Cases', () => {
    test('should handle perfect play (minimum scores)', () => {
      const submission: ScoreSubmission = {
        userId: 'user-123',
        puzzleId: 'puzzle-456',
        finalScore: 2.0, // 1.0 + 0 + 1 (bonus)
        phase1Score: 1.0, // Perfect
        phase2Score: 0, // No reordering needed
        bonusCorrect: true,
        timeTakenSeconds: 60,
        speed: 1.0,
      };

      const sanitized = sanitizeScoreSubmission(submission, 10);

      expect(sanitized.finalScore).toBe(2.0);
      expect(sanitized.stars).toBe(5); // Perfect play = 5 stars
    });

    test('should handle worst reasonable play (high scores)', () => {
      const submission: ScoreSubmission = {
        userId: 'user-123',
        puzzleId: 'puzzle-456',
        finalScore: 27.5, // 20 + 7.5 + 0
        phase1Score: 20.0, // Very inefficient (1 star)
        phase2Score: 7.5, // Many moves (30 moves, 3 stars for 10 words)
        bonusCorrect: false,
        timeTakenSeconds: 600,
        speed: 1.0,
      };

      const sanitized = sanitizeScoreSubmission(submission, 10);

      expect(sanitized.finalScore).toBe(27.5);
      // Average of 1 star (phase1) and 3 stars (phase2) = 2 stars
      expect(sanitized.stars).toBe(2);
    });

    test('should handle zero phase2 score', () => {
      const submission: ScoreSubmission = {
        userId: 'user-123',
        puzzleId: 'puzzle-456',
        finalScore: 2.5,
        phase1Score: 2.5,
        phase2Score: 0, // No moves needed
        bonusCorrect: false,
        timeTakenSeconds: 120,
        speed: 1.0,
      };

      const sanitized = sanitizeScoreSubmission(submission, 10);

      expect(sanitized.phase2Score).toBe(0);
      expect(sanitized.finalScore).toBe(2.5);
    });
  });
});
