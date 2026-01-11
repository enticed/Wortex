'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableWordProps {
  id: string;
  text: string;
  onDiscard?: (id: string) => void;
}

export default function SortableWord({ id, text }: SortableWordProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        px-3 py-1.5 rounded-lg font-semibold
        bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100
        cursor-grab active:cursor-grabbing
        shadow-sm hover:shadow-md
        transition-shadow duration-200
        select-none
      `}
      title="Drag to reorder or drag to vortex to remove"
    >
      {text}
    </div>
  );
}
