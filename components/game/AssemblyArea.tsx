'use client';

import { useDroppable } from '@dnd-kit/core';
import { useDroppable as useWordDroppable } from '@dnd-kit/core';
import { useEffect, useState } from 'react';
import Word from './Word';
import type { PlacedWord } from '@/types/game';

// Droppable wrapper for Phase 2 words
function DroppableWord({
  word,
  colorVariant,
  isHighlighted,
  hintType
}: {
  word: PlacedWord;
  colorVariant?: 'default' | 'correct' | 'incorrect';
  isHighlighted?: boolean;
  hintType?: 'unnecessary' | 'correctString' | 'nextWord';
}) {
  const { setNodeRef, isOver } = useWordDroppable({
    id: word.id,
  });

  return (
    <div ref={setNodeRef}>
      <Word
        id={word.id}
        text={word.word}
        isPlaced={false}
        colorVariant={colorVariant}
        isHighlighted={isHighlighted}
        hintType={hintType}
      />
    </div>
  );
}

interface AssemblyAreaProps {
  id: string;
  title: string;
  placedWords: PlacedWord[];
  expectedLength: number;
  expectedWords?: string[]; // For Phase 1 counter calculation
  bgColor: string;
  borderColor: string;
  isAutoAssembly?: boolean;
  isComplete?: boolean;
  completedText?: string;
  onReorder?: (reorderedWords: PlacedWord[]) => void;
  dropIndicatorIndex?: number | null; // Phase 2: insertion indicator position
  activeHint?: { type: 'unnecessary' | 'correctString' | 'nextWord', wordIds: string[] } | null; // Phase 2: hint highlighting
  onUseUnnecessaryWordHint?: () => void; // Phase 2: hint callbacks
  onUseCorrectStringHint?: () => void;
  onUseNextWordHint?: () => void;
  hintsUsed?: number; // Phase 2: total hints used for display
  reorderMoves?: number; // Phase 2: number of reordering moves made
  phase?: 1 | 2; // Game phase
  showCompletionAnimation?: boolean; // Trigger completion animation
  totalWordsSeen?: number; // For score calculation
  totalUniqueWords?: number; // Total unique words in both phrases for score calculation
  speed?: number; // Vortex speed for score adjustment
}

export default function AssemblyArea({
  id,
  title,
  placedWords,
  expectedLength,
  expectedWords = [],
  bgColor,
  borderColor,
  isAutoAssembly = false,
  isComplete = false,
  completedText = '',
  onReorder,
  dropIndicatorIndex = null,
  activeHint = null,
  onUseUnnecessaryWordHint,
  onUseCorrectStringHint,
  onUseNextWordHint,
  hintsUsed = 0,
  reorderMoves = 0,
  phase = 1,
  showCompletionAnimation = false,
  totalWordsSeen = 0,
  totalUniqueWords = 0,
  speed = 1.0,
}: AssemblyAreaProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const isSortable = !!onReorder;

  // State for completion animation
  const [animatingCompletion, setAnimatingCompletion] = useState(false);

  // Trigger completion animation when showCompletionAnimation becomes true
  useEffect(() => {
    if (showCompletionAnimation && !animatingCompletion) {
      setAnimatingCompletion(true);
      // Animation lasts 1.2 seconds
      const timer = setTimeout(() => {
        setAnimatingCompletion(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [showCompletionAnimation, animatingCompletion]);

  // Sort words by position
  const sortedWords = [...placedWords].sort((a, b) => a.position - b.position);

  // Phase 1 target area: Calculate W / X + N
  const calculatePhase1Stats = () => {
    if (!expectedWords.length || isAutoAssembly) return null;

    // X: Total words needed
    const X = expectedLength;

    // W: Number of correct/necessary words placed (count each word type up to how many times it's needed)
    let W = 0;
    const expectedWordCounts = new Map<string, number>();

    // Count how many times each word appears in expected phrase
    expectedWords.forEach(word => {
      const key = word.toLowerCase();
      expectedWordCounts.set(key, (expectedWordCounts.get(key) || 0) + 1);
    });

    // Count placed words that match expected, but only up to needed count
    const placedWordCounts = new Map<string, number>();
    placedWords.forEach(placed => {
      const key = placed.word.toLowerCase();
      const needed = expectedWordCounts.get(key) || 0;
      const currentCount = placedWordCounts.get(key) || 0;

      if (needed > 0 && currentCount < needed) {
        placedWordCounts.set(key, currentCount + 1);
        W++;
      }
    });

    // N: Number of unnecessary/wrong words (total placed - necessary placed)
    const N = placedWords.length - W;

    // Check if all required words are present (considering duplicates)
    const allRequiredPresent = Array.from(expectedWordCounts.entries()).every(([word, count]) =>
      (placedWordCounts.get(word) || 0) >= count
    );

    return { W, X, N, allRequiredPresent };
  };

  const phase1Stats = calculatePhase1Stats();

  // Helper function to determine if a word is correct (needed) or incorrect (unnecessary)
  const getWordColorVariant = (word: PlacedWord): 'default' | 'correct' | 'incorrect' => {
    // Only apply color coding in Phase 1 target area (not auto-assembly, not Phase 2)
    if (isAutoAssembly || !expectedWords.length) return 'default';

    // Count how many times this word type is needed
    const wordLower = word.word.toLowerCase();
    const neededCount = expectedWords.filter(w => w.toLowerCase() === wordLower).length;

    if (neededCount === 0) {
      // Word doesn't belong in this phrase at all
      return 'incorrect';
    }

    // Count how many times this word type has been placed BEFORE this word
    const placedBeforeCount = placedWords
      .filter((w, idx) => {
        const wLower = w.word.toLowerCase();
        const currentIdx = placedWords.findIndex(pw => pw.id === word.id);
        return wLower === wordLower && idx < currentIdx;
      })
      .length;

    // If we've already placed enough of this word type, this one is extra
    if (placedBeforeCount >= neededCount) {
      return 'incorrect';
    }

    return 'correct';
  };

  // Calculate dynamic sizing based on number of words
  // Scale down for longer phrases
  const getWordScale = () => {
    if (expectedLength <= 15) return 'text-base leading-tight'; // Normal size
    if (expectedLength <= 30) return 'text-sm leading-tight'; // Medium
    if (expectedLength <= 50) return 'text-xs leading-tight'; // Smaller
    return 'text-[11px] leading-tight'; // Very small for extremely long phrases
  };

  const getGapSize = () => {
    if (expectedLength <= 15) return 'gap-1.5';
    if (expectedLength <= 30) return 'gap-1';
    return 'gap-0.5';
  };

  // Calculate ongoing score
  const calculateOngoingScore = () => {
    if (isAutoAssembly || !totalUniqueWords) return null;

    // Phase 1: Speed-adjusted score = (totalWordsSeen / totalUniqueWords) / speed
    const baseScore = totalUniqueWords > 0 ? totalWordsSeen / totalUniqueWords : 0;
    const phase1Score = baseScore / speed;

    if (phase === 1) {
      return phase1Score;
    } else {
      // Phase 2: Only show Phase 2 score (moves + hints)
      return reorderMoves + hintsUsed;
    }
  };

  const ongoingScore = calculateOngoingScore();

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {title}
        </h2>
        {/* Center Counters Display */}
        <span className="flex-1 flex justify-center text-base font-bold flex items-center gap-1">
          {isComplete ? (
            <span className="text-green-600 dark:text-green-400 font-semibold">✓ Complete</span>
          ) : phase === 2 && !isAutoAssembly ? (
            // Phase 2 target area: M + H format (Moves + Hints)
            <>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">{reorderMoves}</span>
              <span className="text-gray-500 dark:text-gray-400">+</span>
              <span className="text-orange-600 dark:text-orange-400 font-semibold">{hintsUsed}</span>
            </>
          ) : phase1Stats ? (
            // Phase 1 target area: W / X + N format
            <>
              {phase1Stats.allRequiredPresent && (
                <span className="text-green-600 dark:text-green-400 font-semibold mr-1">✓ DONE!</span>
              )}
              <span className="text-green-600 dark:text-green-400 font-semibold">{phase1Stats.W}</span>
              <span className="text-gray-500 dark:text-gray-400">/</span>
              <span className="text-gray-700 dark:text-gray-300">{phase1Stats.X}</span>
              {phase1Stats.N > 0 && (
                <>
                  <span className="text-gray-500 dark:text-gray-400">+</span>
                  <span className="text-red-600 dark:text-red-400">{phase1Stats.N}</span>
                </>
              )}
            </>
          ) : (
            // Auto-assembly: Simple counter
            <span className={`${
              placedWords.length > expectedLength
                ? 'text-red-600 dark:text-red-400'
                : placedWords.length === expectedLength
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              {placedWords.length} / {expectedLength} words
            </span>
          )}
        </span>
        {/* Right-aligned Score Display - only for target area */}
        {!isAutoAssembly && ongoingScore !== null && (
          <span className="text-base font-bold text-purple-600 dark:text-purple-400">
            {ongoingScore.toFixed(2)}
          </span>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={`
          flex-1 border-2 rounded-lg p-1.5
          flex items-start justify-center
          overflow-x-auto overflow-y-hidden
          transition-all duration-500
          ${isComplete ? 'border-solid bg-gradient-to-br' : 'border-dashed'}
          ${isComplete && id === 'target' ? 'from-blue-200 to-blue-300 dark:from-blue-800 dark:to-blue-900 border-blue-500 dark:border-blue-400' : ''}
          ${isComplete && id === 'facsimile' ? 'from-green-200 to-green-300 dark:from-green-800 dark:to-green-900 border-green-500 dark:border-green-400' : ''}
          ${!isComplete ? bgColor : ''}
          ${!isComplete ? borderColor : ''}
          ${isOver && !isComplete ? 'ring-2 ring-blue-400 dark:ring-blue-600' : ''}
        `}
      >
        {isComplete ? (
          // Completed phrase - show as solid block with punctuation, auto-sized to fit
          // Phase 1 facsimile: single line with horizontal scroll animation
          id === 'facsimile' && phase === 1 ? (
            <div className="text-center animate-fade-in w-full h-full flex items-center justify-center overflow-hidden p-2">
              <div className="animate-scroll-horizontal whitespace-nowrap">
                <p className="font-serif italic text-lg text-green-900 dark:text-green-100 inline-block px-4">
                  &ldquo;{completedText}&rdquo;
                </p>
                {/* Duplicate for seamless loop */}
                <p className="font-serif italic text-lg text-green-900 dark:text-green-100 inline-block px-4">
                  &ldquo;{completedText}&rdquo;
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center animate-fade-in w-full h-full flex items-center justify-center p-2">
              <p className={`font-serif italic leading-relaxed ${
                id === 'target'
                  ? 'text-blue-900 dark:text-blue-100'
                  : 'text-green-900 dark:text-green-100'
              } ${
                // Dynamic sizing based on text length
                completedText.length <= 50 ? 'text-2xl' :
                completedText.length <= 100 ? 'text-xl' :
                completedText.length <= 150 ? 'text-lg' :
                completedText.length <= 200 ? 'text-base' :
                'text-sm'
              }`}>
                &ldquo;{completedText}&rdquo;
              </p>
            </div>
          )
        ) : sortedWords.length === 0 ? (
          <div className="text-gray-400 dark:text-gray-600 text-sm">
            {isSortable
              ? 'Drag words to reorder them'
              : isAutoAssembly
              ? 'Drag words here - they will auto-arrange'
              : 'Drag words here to assemble the quote'}
          </div>
        ) : isSortable ? (
          // Phase 2: Manual drag-and-drop with reordering (allow wrapping)
          <div className={`flex flex-wrap gap-1 items-start content-start w-full ${getWordScale()}`}>
            {sortedWords.map((word, index) => {
              // Check if this word should be highlighted
              const isHintHighlighted = activeHint?.wordIds.includes(word.id) || false;
              const isCompletionAnimating = animatingCompletion && index < expectedLength;
              const isHighlighted = isHintHighlighted || isCompletionAnimating;
              const hintType = isHintHighlighted ? activeHint?.type : (isCompletionAnimating ? 'correctString' : undefined);

              return (
                <div key={word.id} className="flex items-center gap-0">
                  {/* Invisible hover zone before word - larger area for detection */}
                  <div className="relative w-1 h-12 flex items-center justify-center">
                    {dropIndicatorIndex === index && (
                      <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20">
                        {/* Triangle arrow pointing down - split difference between -top-3 and top-1/2 */}
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-blue-500 dark:border-t-blue-400" />
                      </div>
                    )}
                  </div>
                  <DroppableWord
                    word={word}
                    colorVariant={getWordColorVariant(word)}
                    isHighlighted={isHighlighted}
                    hintType={hintType}
                  />
                </div>
              );
            })}
            {/* End-of-phrase drop indicator */}
            <div className="relative w-1 h-12 flex items-center justify-center">
              {dropIndicatorIndex === sortedWords.length && (
                <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20">
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-blue-500 dark:border-t-blue-400" />
                </div>
              )}
            </div>
          </div>
        ) : (
          // Phase 1 or auto-assembly: Words just display in position
          <div className={`flex flex-wrap ${getGapSize()} items-start content-start w-full ${getWordScale()}`}>
            {sortedWords.map((word) => (
              <Word key={word.id} id={word.id} text={word.word} isPlaced={true} colorVariant={getWordColorVariant(word)} />
            ))}
          </div>
        )}
      </div>

      {/* Phase 2 Hint Buttons */}
      {phase === 2 && isSortable && !isComplete && (
        <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
          <div className="flex flex-col gap-2">
            {/* Hint Buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={onUseUnnecessaryWordHint}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
              >
                Remove Unnecessary +1
              </button>
              <button
                onClick={onUseCorrectStringHint}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
              >
                Show Correct String +1
              </button>
              <button
                onClick={onUseNextWordHint}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors"
              >
                Show Next Word +1
              </button>
            </div>
            {/* Hints Used Counter */}
            {hintsUsed > 0 && (
              <div className="text-center text-xs text-gray-600 dark:text-gray-400">
                Hints used: {hintsUsed} (+{hintsUsed} point{hintsUsed > 1 ? 's' : ''} penalty)
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
