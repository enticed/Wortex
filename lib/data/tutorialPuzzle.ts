import type { Puzzle } from '@/types/game';

/**
 * Tutorial Puzzle - A simple, consistent puzzle for learning the game
 *
 * Quote: "Less is more" - Ludwig Mies van der Rohe
 * Hint Phrase: "Minimalist design philosophy"
 *
 * This puzzle is used exclusively for the tutorial and does not affect
 * daily stats, streaks, or leaderboards.
 */
export const tutorialPuzzle: Puzzle = {
  id: 'tutorial-puzzle',
  date: 'tutorial', // Special date identifier
  targetPhrase: {
    id: 'tutorial-target-phrase',
    text: 'Less is more',
    words: ['Less', 'is', 'more'],
    type: 'target',
  },
  facsimilePhrase: {
    id: 'tutorial-facsimile-phrase',
    text: 'Minimalist design philosophy',
    words: ['Minimalist', 'design', 'philosophy'],
    type: 'facsimile',
  },
  difficulty: 1, // Easy difficulty for tutorial
  bonusQuestion: {
    type: 'quote',
    question: 'Who is credited with the phrase "Less is more"?',
    options: [
      {
        id: 'option-1',
        person: 'Ludwig Mies van der Rohe',
        year: 1947,
      },
      {
        id: 'option-2',
        person: 'Le Corbusier',
        year: 1923,
      },
      {
        id: 'option-3',
        person: 'Frank Lloyd Wright',
        year: 1932,
      },
      {
        id: 'option-4',
        person: 'Walter Gropius',
        year: 1919,
      },
    ],
    correctAnswerId: 'option-1',
  },
  allWords: ['Less', 'is', 'more', 'Minimalist', 'design', 'philosophy'],
};
