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
}

export default function AssemblyArea({
  id,
  title,
  placedWords,
  expectedLength,
  bgColor,
  borderColor,
  isAutoAssembly = false,
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
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`
          flex-1 border-2 border-dashed rounded-lg p-2
          flex flex-wrap gap-2 items-start content-start
          transition-colors duration-200
          ${bgColor}
          ${borderColor}
          ${isOver ? 'ring-2 ring-blue-400 dark:ring-blue-600' : ''}
        `}
      >
        {sortedWords.length === 0 ? (
          <div className="text-gray-400 dark:text-gray-600 text-sm">
            {isAutoAssembly
              ? 'Drag words here - they will auto-arrange'
              : 'Drag words here to assemble the quote'}
          </div>
        ) : (
          sortedWords.map((word) => (
            <Word key={word.id} id={word.id} text={word.word} isPlaced={true} />
          ))
        )}
      </div>
    </div>
  );
}
