'use client';

import { useDroppable } from '@dnd-kit/core';

export default function DismissZone() {
  const { setNodeRef, isOver } = useDroppable({
    id: 'dismiss-zone',
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        fixed right-0 top-0 bottom-0 w-16
        transition-all duration-200
        pointer-events-auto
        ${isOver
          ? 'bg-red-500/30 border-l-4 border-red-500'
          : 'bg-transparent'
        }
      `}
    >
      {isOver && (
        <div className="flex items-center justify-center h-full">
          <div className="text-red-600 dark:text-red-400 text-2xl font-bold rotate-90">
            ✕
          </div>
        </div>
      )}
    </div>
  );
}
