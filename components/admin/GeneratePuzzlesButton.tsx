'use client';

import { useState } from 'react';

export default function GeneratePuzzlesButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [count, setCount] = useState(7);
  const [startDate, setStartDate] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/puzzles/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate || new Date().toISOString().split('T')[0],
          count: count,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate puzzles');
      }

      setResult(data);

      // Refresh the page after successful generation
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Set default start date to tomorrow
  useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setStartDate(tomorrow.toISOString().split('T')[0]);
  });

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        AI Generate
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Generate AI Puzzles
            </h2>

            {!result && !error && (
              <>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      disabled={isGenerating}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Number of Puzzles
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={count}
                      onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      disabled={isGenerating}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Generate 1-30 puzzles (takes ~1 second per puzzle)
                    </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-sm">
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Auto-scheduling:</strong> Puzzles will alternate between historical quotes and literature quotes.
                      Difficulty increases Mon (1) to Sun (5).
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
                  >
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {result && (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    ✓ Success!
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Generated {result.generated} puzzle{result.generated !== 1 ? 's' : ''}
                    <br />
                    Saved {result.saved} puzzle{result.saved !== 1 ? 's' : ''} to database
                  </p>
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-3 text-sm text-orange-700 dark:text-orange-300">
                      <strong>Warnings:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {result.errors.map((err: any, idx: number) => (
                          <li key={idx}>{err.date}: {err.error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            )}

            {error && (
              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                    ✗ Error
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {error}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setError(null);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
