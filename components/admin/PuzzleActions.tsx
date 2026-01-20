'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface PuzzleActionsProps {
  id: string;
  date: string;
}

export default function PuzzleActions({ id, date }: PuzzleActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete puzzle for ${date}? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/puzzles/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete puzzle');
      }

      // Refresh the page to show updated list
      router.refresh();
    } catch (error) {
      console.error('Error deleting puzzle:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete puzzle');
    } finally {
      setIsDeleting(false);
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
        className="text-red-600 dark:text-red-400 hover:underline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  );
}
