'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface WordProps {
  id: string;
  text: string;
  isPlaced?: boolean;
  colorVariant?: 'default' | 'correct' | 'incorrect'; // Color coding for placed words
  isHighlighted?: boolean; // Temporary highlighting from hints
  hintType?: 'unnecessary' | 'correctString' | 'nextWord'; // Type of hint for different highlight colors
}

export default function Word({ id, text, isPlaced = false, colorVariant = 'default', isHighlighted = false, hintType }: WordProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled: isPlaced,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isPlaced ? 'default' : 'grab',
  };

  // Determine highlight ring color based on hint type
  const getHighlightRing = () => {
    if (!isHighlighted) return '';

    switch (hintType) {
      case 'unnecessary':
        return 'ring-4 ring-red-500 dark:ring-red-400 animate-pulse';
      case 'correctString':
        return 'ring-4 ring-green-500 dark:ring-green-400 animate-pulse';
      case 'nextWord':
        return 'ring-4 ring-yellow-500 dark:ring-yellow-400 animate-pulse';
      default:
        return 'ring-4 ring-blue-500 dark:ring-blue-400 animate-pulse';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        relative
        ${isDragging ? 'z-50' : 'z-0'}
        select-none
      `}
    >
      {/* Invisible larger touch target for mobile */}
      <div className="absolute inset-0 -m-3" />

      {/* Actual word styling */}
      <div className={`
        px-2 py-1 rounded-lg font-semibold
        ${
          isPlaced
            ? colorVariant === 'correct'
              ? 'bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100'
              : colorVariant === 'incorrect'
              ? 'bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100'
              : 'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100'
            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-md hover:shadow-lg'
        }
        ${getHighlightRing()}
        transition-shadow duration-200
      `}>
        {text}
      </div>
    </div>
  );
}
