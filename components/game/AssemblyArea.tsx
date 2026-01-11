'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import Word from './Word';
import SortableWord from './SortableWord';
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

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {title}
        </h2>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {placedWords.length} / {expectedLength} words
          {isComplete && ' ✓'}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`
          flex-1 border-2 rounded-lg p-4
          flex items-center justify-center
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
          // Completed phrase - show as solid block with punctuation
          <div className="text-center animate-fade-in">
            <p className={`text-2xl font-serif italic leading-relaxed ${
              id === 'target'
                ? 'text-blue-900 dark:text-blue-100'
                : 'text-green-900 dark:text-green-100'
            }`}>
              &ldquo;{completedText}&rdquo;
            </p>
            <div className="mt-3 text-sm font-semibold text-gray-600 dark:text-gray-400">
              ✓ Complete
            </div>
          </div>
        ) : sortedWords.length === 0 ? (
          <div className="text-gray-400 dark:text-gray-600 text-sm">
            {isAutoAssembly
              ? 'Drag words here - they will auto-arrange'
              : 'Drag words here to assemble the quote'}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 items-start content-start w-full">
            {isAutoAssembly ? (
              // Auto-assembly: words are not sortable, just display them
              sortedWords.map((word) => (
                <Word key={word.id} id={word.id} text={word.word} isPlaced={true} />
              ))
            ) : (
              // Manual assembly: words are sortable
              <SortableContext
                items={sortedWords.map((w) => w.id)}
                strategy={horizontalListSortingStrategy}
              >
                {sortedWords.map((word) => (
                  <SortableWord
                    key={word.id}
                    id={word.id}
                    text={word.word}
                  />
                ))}
              </SortableContext>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
