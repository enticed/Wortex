/**
 * Test data fixtures for E2E tests
 */

export const testUsers = {
  regularUser: {
    email: 'test@example.com',
    password: 'TestPassword123!',
    displayName: 'Test User',
  },
  premiumUser: {
    email: 'premium@example.com',
    password: 'PremiumPass123!',
    displayName: 'Premium User',
  },
  adminUser: {
    email: 'admin@example.com',
    password: 'AdminPass123!',
    displayName: 'Admin User',
  },
};

export const testPuzzle = {
  target: 'To be or not to be, that is the question',
  facsimile: 'To exist or not to exist, that is the query',
  date: '2024-01-01',
  speed: 1.0,
  bonusQuestion: {
    question: 'Who wrote this famous line?',
    correctAnswer: 'William Shakespeare',
    incorrectAnswers: [
      'Christopher Marlowe',
      'Ben Jonson',
      'Francis Bacon',
    ],
  },
};

export const mockScoreSubmission = {
  userId: '123e4567-e89b-12d3-a456-426614174000',
  puzzleId: '123e4567-e89b-12d3-a456-426614174001',
  phase1Score: 1.5,
  phase2Score: 2.0,
  bonusAnswerCorrect: true,
  phase1Details: {
    totalWordsSeen: 15,
    uniqueWords: 10,
  },
  phase2Details: {
    moves: 8,
  },
};
