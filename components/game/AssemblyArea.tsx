'use client';

import { useDroppable } from '@dnd-kit/core';
import { useDroppable as useWordDroppable } from '@dnd-kit/core';
import Word from './Word';
import type { PlacedWord } from '@/types/game';

// Droppable wrapper for Phase 2 words
function DroppableWord({ word }: { word: PlacedWord }) {
  const { setNodeRef, isOver } = useWordDroppable({
    id: word.id,
  });

  return (
    <div ref={setNodeRef}>
      <Word id={word.id} text={word.word} isPlaced={false} />
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
}: AssemblyAreaProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const isSortable = !!onReorder;

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

  // Calculate dynamic sizing based on number of words
  // Scale down for longer phrases
  const getWordScale = () => {
    if (expectedLength <= 15) return 'text-sm'; // Normal size
    if (expectedLength <= 25) return 'text-xs'; // Slightly smaller
    return 'text-[10px]'; // Very small for long phrases
  };

  const getGapSize = () => {
    if (expectedLength <= 15) return 'gap-2';
    if (expectedLength <= 25) return 'gap-1.5';
    return 'gap-1';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {title}
        </h2>
        <span className="text-xs flex items-center gap-1">
          {isComplete ? (
            <span className="text-green-600 dark:text-green-400 font-semibold">✓ Complete</span>
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
            // Auto-assembly or Phase 2: Simple counter
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
      </div>

      <div
        ref={setNodeRef}
        className={`
          flex-1 border-2 rounded-lg p-2
          flex items-start justify-center
          overflow-y-auto
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
        ) : sortedWords.length === 0 ? (
          <div className="text-gray-400 dark:text-gray-600 text-sm">
            {isSortable
              ? 'Drag words to reorder them'
              : isAutoAssembly
              ? 'Drag words here - they will auto-arrange'
              : 'Drag words here to assemble the quote'}
          </div>
        ) : isSortable ? (
          // Phase 2: Manual drag-and-drop without auto-reordering
          <div className={`flex flex-wrap ${getGapSize()} items-start content-start w-full ${getWordScale()}`}>
            {sortedWords.map((word, index) => (
              <div key={word.id} className="flex items-center">
                {/* Gap before word - with indicator */}
                <div className="relative w-3 h-8 flex items-center justify-center">
                  {dropIndicatorIndex === index && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                      {/* Triangle arrow pointing down - positioned so only tip enters gap */}
                      <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-blue-500 dark:border-t-blue-400" />
                    </div>
                  )}
                </div>
                <DroppableWord word={word} />
              </div>
            ))}
            {/* End-of-phrase drop indicator */}
            <div className="relative w-3 h-8 flex items-center justify-center">
              {dropIndicatorIndex === sortedWords.length && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-blue-500 dark:border-t-blue-400" />
                </div>
              )}
            </div>
          </div>
        ) : (
          // Phase 1 or auto-assembly: Words just display in position
          <div className={`flex flex-wrap ${getGapSize()} items-start content-start w-full ${getWordScale()}`}>
            {sortedWords.map((word) => (
              <Word key={word.id} id={word.id} text={word.word} isPlaced={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
