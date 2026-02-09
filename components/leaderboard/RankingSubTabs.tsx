'use client';

interface RankingSubTabsProps {
  activeSubTab: 'pure' | 'boosted';
  onSubTabChange: (subTab: 'pure' | 'boosted') => void;
}

export default function RankingSubTabs({ activeSubTab, onSubTabChange }: RankingSubTabsProps) {
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
      <button
        onClick={() => onSubTabChange('pure')}
        className={`
          flex-1 py-2 px-4 text-sm font-medium transition-colors relative
          ${activeSubTab === 'pure'
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
          }
        `}
      >
        Pure Rankings
        {activeSubTab === 'pure' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400" />
        )}
      </button>
      <button
        onClick={() => onSubTabChange('boosted')}
        className={`
          flex-1 py-2 px-4 text-sm font-medium transition-colors relative
          ${activeSubTab === 'boosted'
            ? 'text-purple-600 dark:text-purple-400'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
          }
        `}
      >
        Boosted Rankings
        {activeSubTab === 'boosted' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400" />
        )}
      </button>
    </div>
  );
}
