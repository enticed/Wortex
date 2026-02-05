'use client';

import { useDroppable } from '@dnd-kit/core';
import { useDroppable as useWordDroppable } from '@dnd-kit/core';
import { useEffect, useState } from 'react';
import Word from './Word';
import type { PlacedWord, BonusOption } from '@/types/game';

// Droppable wrapper for Phase 2 words
function DroppableWord({
  word,
  colorVariant,
  isHighlighted,
  hintType
}: {
  word: PlacedWord;
  colorVariant?: 'default' | 'correct' | 'incorrect' | 'partial';
  isHighlighted?: boolean;
  hintType?: 'unnecessary' | 'correctString' | 'nextWord' | 'phase2Complete' | 'phase2CompleteExtra';
}) {
  const { setNodeRef, isOver } = useWordDroppable({
    id: word.id,
  });

  return (
    <div ref={setNodeRef} data-word-id={word.id}>
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

// Droppable zone for "after word" positioning
function DroppableZone({
  id,
  children
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useWordDroppable({
    id,
  });

  return <div ref={setNodeRef}>{children}</div>;
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
  activeHint?: { type: 'unnecessary' | 'correctString' | 'nextWord' | 'phase2Complete', wordIds: string[], extraWordIds?: string[] } | null; // Phase 2: hint highlighting
  onUseUnnecessaryWordHint?: () => void; // Phase 2: hint callbacks
  onUseCorrectStringHint?: () => void;
  onUseNextWordHint?: () => void;
  hintsUsed?: number; // Phase 2: total hints used for display
  correctStringHintsUsed?: number; // Individual hint counts
  nextWordHintsUsed?: number;
  unnecessaryWordHintsUsed?: number;
  reorderMoves?: number; // Phase 2: number of reordering moves made
  phase?: 1 | 2; // Game phase
  showCompletionAnimation?: boolean; // Trigger completion animation
  totalWordsSeen?: number; // For score calculation
  totalUniqueWords?: number; // Total unique words in both phrases for score calculation
  speed?: number; // Vortex speed for score adjustment
  showCompletedHeader?: boolean; // Whether to show "✓ Complete" message
  showFinalResults?: boolean; // Whether showing final results (hide header stats)
  bonusAnswer?: BonusOption; // Bonus question answer to display with completed quote
  draggedWord?: string; // Phase 2: Currently dragged word to display in header
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
  correctStringHintsUsed = 0,
  nextWordHintsUsed = 0,
  unnecessaryWordHintsUsed = 0,
  reorderMoves = 0,
  phase = 1,
  showCompletionAnimation = false,
  totalWordsSeen = 0,
  totalUniqueWords = 0,
  speed = 1.0,
  showCompletedHeader = true,
  showFinalResults = false,
  bonusAnswer,
  draggedWord,
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
  const getWordColorVariant = (word: PlacedWord): 'default' | 'correct' | 'incorrect' | 'partial' => {
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

    // Count total instances of this word that are currently placed
    const totalPlacedCount = placedWords.filter(w => w.word.toLowerCase() === wordLower).length;

    // If this word is needed but we still need more instances, show as partial (orange)
    if (totalPlacedCount < neededCount) {
      return 'partial';
    }

    // All required instances are present, show as correct (green)
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
      // Phase 2: Only show Phase 2 score (moves * 0.25 + hints * 0.5)
      return (reorderMoves * 0.25) + (hintsUsed * 0.5);
    }
  };

  const ongoingScore = calculateOngoingScore();

  // Calculate Phase 2 progress (percentage of consecutive correct words from start)
  const calculatePhase2Progress = (): number => {
    // Only calculate for Phase 2 target area (not auto-assembly, not complete)
    if (isAutoAssembly || isComplete || phase !== 2 || !expectedWords.length) {
      return 0;
    }

    // Count consecutive correct words from position 0
    let correctStringLength = 0;
    for (let i = 0; i < expectedWords.length; i++) {
      const placedWord = sortedWords[i];
      if (!placedWord || placedWord.word.toLowerCase() !== expectedWords[i].toLowerCase()) {
        break;
      }
      correctStringLength++;
    }

    // Return progress percentage (0-100)
    return (correctStringLength / expectedWords.length) * 100;
  };

  const phase2Progress = calculatePhase2Progress();

  // Get progress bar color based on percentage
  const getProgressColor = (progress: number): string => {
    if (progress >= 67) return 'bg-green-500 dark:bg-green-400'; // Green for 67-100%
    if (progress >= 34) return 'bg-yellow-500 dark:bg-yellow-400'; // Yellow for 34-66%
    return 'bg-red-500 dark:bg-red-400'; // Red for 0-33%
  };

  return (
    <div className={`assembly-area h-full flex flex-col ${id === 'target' ? 'assembly-area-target' : ''}`}>
      <div className={`assembly-area-header flex items-center justify-between mb-1 ${id === 'target' ? 'assembly-area-header-target' : ''}`}>
        {/* Title - Hide "Mystery Quote" when dragging in Phase 2 */}
        {!(!isComplete && phase === 2 && !isAutoAssembly && draggedWord) && (
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {showFinalResults && id === 'target' ? 'Congratulations! You solved the Mystery Quote:' : title}
          </h2>
        )}
        {/* Center Counters Display */}
        <span className="flex-1 flex justify-center text-base font-bold flex items-center gap-1">
          {showFinalResults ? (
            // Final results mode: Hide completion message and counters
            null
          ) : isComplete && showCompletedHeader ? (
            <span className="text-green-600 dark:text-green-400 font-semibold">✓ Complete</span>
          ) : isComplete && !showCompletedHeader ? (
            // Complete but header hidden (e.g., hint phrase shown from start) - show nothing
            null
          ) : !isComplete && phase === 2 && !isAutoAssembly ? (
            // Phase 2 target area: Show dragged word in bright gold box if dragging, otherwise show nothing
            draggedWord ? (
              <span className="inline-block px-2 py-0.5 rounded-md font-semibold text-base" style={{ backgroundColor: '#f97316', color: '#ffffff' }}>
                {draggedWord}
              </span>
            ) : null
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
            // Auto-assembly: Simple counter (only when not complete)
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
        {/* Right-aligned Score Display - only for target area, hidden in final results */}
        {!isAutoAssembly && ongoingScore !== null && !showFinalResults && (
          <span className="text-base font-bold text-green-600 dark:text-green-400">
            {ongoingScore.toFixed(2)}
          </span>
        )}
      </div>

      {/* Phase 2 Progress Bar - Only show for target area during Phase 2 */}
      {phase === 2 && !isAutoAssembly && !isComplete && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden" style={{ height: '2px' }}>
          <div
            className={`h-full transition-all duration-300 ease-in-out ${getProgressColor(phase2Progress)}`}
            style={{ width: `${phase2Progress}%` }}
          />
        </div>
      )}

      {/*
        IMPORTANT SCROLL BEHAVIOR:
        - Target area (top): ONLY vertical scrolling (overflow-y-auto, overflow-x-hidden)
          Words wrap to multiple lines, user scrolls vertically to see all content
        - Facsimile area (bottom): ONLY horizontal scrolling (overflow-x-auto, overflow-y-hidden)
          Words display in single line, user scrolls horizontally to see all content
      */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 border-2 rounded-lg p-1
          flex items-start
          ${id === 'facsimile' ? 'justify-start' : 'justify-center'}
          ${id === 'target' ? 'overflow-y-auto overflow-x-hidden' : 'overflow-x-auto overflow-y-hidden'}
          transition-all duration-500
          ${isComplete ? 'border-solid bg-gradient-to-br' : 'border-dashed'}
          ${isComplete && id === 'target' ? 'from-blue-200 to-blue-300 dark:from-blue-800 dark:to-blue-900 border-blue-500 dark:border-blue-400' : ''}
          ${isComplete && id === 'facsimile' ? 'from-purple-200 to-purple-300 dark:from-purple-800 dark:to-purple-900 border-purple-500 dark:border-purple-400' : ''}
          ${!isComplete ? bgColor : ''}
          ${!isComplete ? borderColor : ''}
          ${isOver && !isComplete ? 'ring-2 ring-blue-400 dark:ring-blue-600' : ''}
        `}
      >
        {isComplete ? (
          // Completed phrase - show as solid block with punctuation, auto-sized to fit
          // Phase 1 facsimile: single line with horizontal auto-scroll animation
          id === 'facsimile' && phase === 1 ? (
            <div className="text-center animate-fade-in w-full h-full flex items-center justify-center overflow-hidden p-2">
              <div className="animate-scroll-horizontal whitespace-nowrap">
                <p className="font-serif italic text-lg text-purple-900 dark:text-purple-100 inline-block px-4">
                  &ldquo;{completedText}&rdquo;
                </p>
                {/* Duplicate for seamless loop */}
                <p className="font-serif italic text-lg text-purple-900 dark:text-purple-100 inline-block px-4">
                  &ldquo;{completedText}&rdquo;
                </p>
              </div>
            </div>
          ) : (
            <div className={`text-center animate-fade-in w-full h-full flex items-center justify-center ${
              id === 'facsimile' && phase === 2 ? 'p-1' : 'p-2'
            }`}>
              <div className="flex flex-col items-center justify-center gap-2">
                <p className={`font-serif italic leading-relaxed ${
                  id === 'target'
                    ? 'text-blue-900 dark:text-blue-100'
                    : 'text-purple-900 dark:text-purple-100'
                } ${
                  // Dynamic sizing based on text length - larger for facsimile in Phase 2
                  id === 'facsimile' && phase === 2 ? (
                    completedText.length <= 50 ? 'text-lg' :
                    completedText.length <= 100 ? 'text-base' :
                    'text-sm'
                  ) : (
                    completedText.length <= 50 ? 'text-2xl' :
                    completedText.length <= 100 ? 'text-xl' :
                    completedText.length <= 150 ? 'text-lg' :
                    completedText.length <= 200 ? 'text-base' :
                    'text-sm'
                  )
                }`}>
                  &ldquo;{completedText}&rdquo;
                </p>
                {/* Show bonus answer (author/year) in final results mode */}
                {showFinalResults && bonusAnswer && (
                  <p className={`font-serif ${
                    id === 'target'
                      ? 'text-blue-800 dark:text-blue-200'
                      : 'text-purple-800 dark:text-purple-200'
                  } ${
                    // Dynamic sizing based on text length (slightly smaller than quote)
                    completedText.length <= 50 ? 'text-lg' :
                    completedText.length <= 100 ? 'text-base' :
                    completedText.length <= 150 ? 'text-sm' :
                    'text-xs'
                  }`}>
                    - {bonusAnswer.author || bonusAnswer.person}{', '}{bonusAnswer.book || bonusAnswer.year}
                  </p>
                )}
              </div>
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
          <div className={`flex flex-wrap gap-0.5 items-start content-start w-full ${getWordScale()}`}>
            {sortedWords.map((word, index) => {
              // Check if this word should be highlighted
              const isHintHighlighted = activeHint?.wordIds.includes(word.id) || false;
              const isExtraWordHighlighted = activeHint?.extraWordIds?.includes(word.id) || false;
              const isCompletionAnimating = animatingCompletion && index < expectedLength;
              const isHighlighted = isHintHighlighted || isExtraWordHighlighted || isCompletionAnimating;

              // Determine hint type: if it's phase2Complete, distinguish between correct and extra words
              let hintType: 'unnecessary' | 'correctString' | 'nextWord' | 'phase2Complete' | 'phase2CompleteExtra' | undefined;
              if (activeHint?.type === 'phase2Complete') {
                hintType = isExtraWordHighlighted ? 'phase2CompleteExtra' : 'phase2Complete';
              } else if (isHintHighlighted) {
                hintType = activeHint?.type;
              } else if (isCompletionAnimating) {
                hintType = 'correctString';
              }

              return (
                <div key={word.id} className="flex items-center gap-0">
                  {/* Invisible hover zone before word - larger area for detection */}
                  <div className="relative w-1 h-12 flex items-center justify-center">
                    {dropIndicatorIndex === index && (
                      <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20">
                        {/* Triangle arrow pointing down - Bright orange color for better visibility */}
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px]" style={{ borderTopColor: '#f97316' }} />
                      </div>
                    )}
                  </div>
                  <DroppableWord
                    word={word}
                    colorVariant={getWordColorVariant(word)}
                    isHighlighted={isHighlighted}
                    hintType={hintType}
                  />
                  {/* Invisible hover zone after word - allows dropping at end of any line */}
                  <DroppableZone id={`after-${word.id}`}>
                    <div className="relative w-1 h-12 flex items-center justify-center">
                      {dropIndicatorIndex === index + 1 && (
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20">
                          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px]" style={{ borderTopColor: '#f97316' }} />
                        </div>
                      )}
                    </div>
                  </DroppableZone>
                </div>
              );
            })}
            {/* End-of-phrase drop indicator */}
            <div className="relative w-1 h-12 flex items-center justify-center">
              {dropIndicatorIndex === sortedWords.length && (
                <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20">
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px]" style={{ borderTopColor: '#f97316' }} />
                </div>
              )}
            </div>
          </div>
        ) : (
          // Phase 1 or auto-assembly: Words just display in position
          <div className={`flex ${id === 'facsimile' ? 'flex-nowrap' : 'flex-wrap'} ${getGapSize()} items-start content-start ${id === 'facsimile' ? '' : 'w-full'} ${getWordScale()}`}>
            {sortedWords.map((word) => (
              <Word key={word.id} id={word.id} text={word.word} isPlaced={true} colorVariant={getWordColorVariant(word)} />
            ))}
          </div>
        )}
      </div>

      {/* Phase 2 Hint Buttons */}
      {phase === 2 && isSortable && !isComplete && (
        <div className="hint-buttons mt-1.5 pt-1.5 border-t border-gray-300 dark:border-gray-600">
          <div className="flex flex-col gap-1.5">
            {/* Hint Buttons - Horizontal layout with text on right */}
            <div className="flex items-center gap-2">
              <button
                onClick={onUseCorrectStringHint}
                className="px-2 py-1 rounded-lg bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 hover:bg-green-200 dark:hover:bg-green-800 transition-colors font-semibold text-sm whitespace-nowrap w-32 flex-shrink-0"
              >
                Correct String
              </button>
              <div className="text-xs text-gray-600 dark:text-gray-400 leading-tight flex-1">
                Shows longest correct string from first word (+0.5)
                {correctStringHintsUsed > 0 && <span className="font-semibold ml-1">×{correctStringHintsUsed}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onUseNextWordHint}
                className="px-2 py-1 rounded-lg bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors font-semibold text-sm whitespace-nowrap w-32 flex-shrink-0"
              >
                Next Word
              </button>
              <div className="text-xs text-gray-600 dark:text-gray-400 leading-tight flex-1">
                Highlights word that should go after correct string (+0.5)
                {nextWordHintsUsed > 0 && <span className="font-semibold ml-1">×{nextWordHintsUsed}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onUseUnnecessaryWordHint}
                className="px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 hover:bg-red-200 dark:hover:bg-red-800 transition-colors font-semibold text-sm whitespace-nowrap w-32 flex-shrink-0"
              >
                Unneeded Word
              </button>
              <div className="text-xs text-gray-600 dark:text-gray-400 leading-tight flex-1">
                Removes first unnecessary word in list (+0.5)
                {unnecessaryWordHintsUsed > 0 && <span className="font-semibold ml-1">×{unnecessaryWordHintsUsed}</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
