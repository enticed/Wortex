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
  score: number | null; // Phase 1 base score (speed-adjusted)
  phase2Score: number | null; // Phase 2 score (moves + hints)
  finalScore: number | null; // Total score (Phase 1 + Phase 2)
  bonusAnswered: boolean;
  bonusCorrect: boolean | null;
  isPaused: boolean;
  hintsUsed: number; // Total hints used for score penalty calculation
  correctStringHintsUsed: number; // Count of correct string hints used
  nextWordHintsUsed: number; // Count of next word hints used
  unnecessaryWordHintsUsed: number; // Count of unnecessary word hints used
  reorderMoves: number; // Number of reordering moves made in Phase 2
  speed: number; // Vortex speed multiplier (0.25 - 2.0)
  minSpeed: number; // Minimum speed used during the game
  maxSpeed: number; // Maximum speed used during the game
  activeHint: { type: 'unnecessary' | 'correctString' | 'nextWord' | 'phase2Complete', wordIds: string[], extraWordIds?: string[] } | null; // Currently active hint for highlighting
  showCompletionAnimation: boolean; // Brief animation when Phase 2 is completed
  showPhase1CompleteDialog: boolean; // Show confirmation dialog before transitioning to Phase 2
  showPhase2CompleteDialog: boolean; // Show confirmation dialog after Phase 2 completion
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
