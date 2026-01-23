import PuzzleLoaderWrapper from '@/components/game/PuzzleLoaderWrapper';
import { createPhrase } from '@/lib/utils/game';
import type { Puzzle } from '@/types/game';

export default function PlayPage() {
  // Fallback sample puzzle if database is not available
  const fallbackPuzzle: Puzzle = {
    id: 'sample-1',
    date: new Date().toISOString().split('T')[0],
    targetPhrase: createPhrase('To be, or not to be, that is the question', 'target'),
    facsimilePhrase: createPhrase('To exist or to cease—this is what we must decide', 'facsimile'),
    difficulty: 1,
    bonusQuestion: {
      type: 'literature',
      question: 'Who wrote this famous line?',
      options: [
        { id: '1', author: 'William Shakespeare', book: 'Hamlet' },
        { id: '2', author: 'Charles Dickens', book: 'Great Expectations' },
        { id: '3', author: 'Jane Austen', book: 'Pride and Prejudice' },
        { id: '4', author: 'Mark Twain', book: 'Huckleberry Finn' },
        { id: '5', author: 'Ernest Hemingway', book: 'The Old Man and the Sea' },
      ],
      correctAnswerId: '1',
    },
    allWords: [],
  };

  return <PuzzleLoaderWrapper fallbackPuzzle={fallbackPuzzle} />;
}
