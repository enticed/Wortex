'use client';

import Link from 'next/link';

interface PuzzleActionsProps {
  date: string;
}

export default function PuzzleActions({ date }: PuzzleActionsProps) {
  const handleDelete = () => {
    if (confirm(`Delete puzzle for ${date}?`)) {
      // TODO: Implement delete
      alert('Delete functionality coming soon');
    }
  };

  return (
    <div className="flex gap-2">
      <Link
        href={`/admin/puzzles/${date}`}
        className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
      >
        Edit
      </Link>
      <button
        className="text-red-600 dark:text-red-400 hover:underline text-sm"
        onClick={handleDelete}
      >
        Delete
      </button>
    </div>
  );
}
