/**
 * Core game types for Wortex
 */

export interface Phrase {
  id: string;
  text: string;
  words: string[];
  type: 'target' | 'facsimile';
}

export interface Puzzle {
  id: string;
  date: string;
  targetPhrase: Phrase;
  facsimilePhrase: Phrase;
  difficulty: number;
  bonusQuestion: BonusQuestion;
  allWords: string[];
}

export interface BonusQuestion {
  type: 'quote' | 'literature';
  question: string;
  options: BonusOption[];
  correctAnswerId: string;
}

export interface BonusOption {
  id: string;
  person?: string;
  year?: number;
  author?: string;
  book?: string;
}

export interface WordInVortex {
  id: string;
  word: string;
  belongsTo: 'target' | 'facsimile' | 'spurious';
  sourceIndex: number; // Index in the original phrase (for tracking duplicates)
  angle: number; // Current angle in the vortex
  radius: number; // Distance from center (0-1, where 1 is outer edge)
  appearanceCount: number; // How many times this word has appeared
  isGrabbed: boolean;
  totalRotation: number; // Total degrees rotated since entering vortex (for auto-capture)
}

export interface PlacedWord {
  id: string;
  word: string;
  position: number; // Current position in assembly area
  sourceIndex: number; // Original position in source phrase (for tracking duplicates)
  belongsTo: 'target' | 'facsimile';
}

export interface GameState {
  puzzle: Puzzle | null;
  vortexWords: WordInVortex[];
  targetPhraseWords: PlacedWord[];
  facsimilePhraseWords: PlacedWord[];
  wordQueue: string[]; // Queue of word keys to show next (shuffled for fair distribution)
  dismissedForNextCycle: Set<string>; // Words dismissed via drag-to-right that skip next cycle
  totalWordsSeen: number;
  phase: 1 | 2; // Phase 1: collect words, Phase 2: reorder target phrase
  isComplete: boolean;
  score: number | null; // Base puzzle score
  finalScore: number | null; // Score after bonus adjustment
  bonusAnswered: boolean;
  bonusCorrect: boolean | null;
  isPaused: boolean;
  hintsUsed: number; // Total hints used for score penalty calculation
  activeHint: { type: 'unnecessary' | 'correctString' | 'nextWord', wordIds: string[] } | null; // Currently active hint for highlighting
}

export interface GameStats {
  userId: string;
  totalGames: number;
  averageScore: number;
  currentStreak: number;
  bestStreak: number;
  lastPlayedDate: string;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  score: number;
  puzzleDate: string;
  rank: number;
}
