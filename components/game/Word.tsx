'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface WordProps {
  id: string;
  text: string;
  isPlaced?: boolean;
}

export default function Word({ id, text, isPlaced = false }: WordProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled: isPlaced,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isPlaced ? 'default' : 'grab',
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
        px-3 py-1.5 rounded-lg font-semibold
        ${
          isPlaced
            ? 'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100'
            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-md hover:shadow-lg'
        }
        transition-shadow duration-200
      `}>
        {text}
      </div>
    </div>
  );
}
