'use client';

import { useDroppable } from '@dnd-kit/core';
import Word from './Word';
import type { PlacedWord } from '@/types/game';

interface AssemblyAreaProps {
  id: string;
  title: string;
  placedWords: PlacedWord[];
  expectedLength: number;
  bgColor: string;
  borderColor: string;
  isAutoAssembly?: boolean;
  isComplete?: boolean;
  completedText?: string;
}

export default function AssemblyArea({
  id,
  title,
  placedWords,
  expectedLength,
  bgColor,
  borderColor,
  isAutoAssembly = false,
  isComplete = false,
  completedText = '',
}: AssemblyAreaProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  // Sort words by position
  const sortedWords = [...placedWords].sort((a, b) => a.position - b.position);

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
        <span className={`text-xs ${
          isComplete
            ? 'text-green-600 dark:text-green-400 font-semibold'
            : placedWords.length > expectedLength
            ? 'text-red-600 dark:text-red-400'
            : placedWords.length === expectedLength && !isComplete
            ? 'text-yellow-600 dark:text-yellow-400'
            : 'text-gray-500 dark:text-gray-400'
        }`}>
          {isComplete ? (
            <>✓ Complete</>
          ) : placedWords.length === expectedLength ? (
            <>{placedWords.length} / {expectedLength} - Check order</>
          ) : (
            <>{placedWords.length} / {expectedLength} words</>
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
            {isAutoAssembly
              ? 'Drag words here - they will auto-arrange'
              : 'Drag words here to assemble the quote'}
          </div>
        ) : (
          <div className={`flex flex-wrap ${getGapSize()} items-start content-start w-full ${getWordScale()}`}>
            {/* Both areas now use auto-assembly - words just display in position */}
            {sortedWords.map((word) => (
              <Word key={word.id} id={word.id} text={word.word} isPlaced={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
