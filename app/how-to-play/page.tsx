'use client';

import AppLayout from '@/components/layout/AppLayout';
import { useRouter } from 'next/navigation';

export default function HowToPlayPage() {
  const router = useRouter();

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pt-16">
        <div className="max-w-4xl mx-auto relative">
          {/* Close Button */}
          <button
            onClick={() => router.push('/')}
            className="absolute top-0 right-0 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            How to Play Wortex
          </h1>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
            {/* Overview */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Game Overview
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Wortex is a daily word puzzle where you reconstruct a famous quotation from a swirling vortex of words. Each puzzle features a <span className="font-semibold text-emerald-600 dark:text-emerald-400">Mystery Quote</span> (the famous quotation you&apos;ll assemble) and a <span className="font-semibold text-purple-600 dark:text-purple-400">Hint Phrase</span> (a rephrasing that retains the original meaning while using different words) that provides clues and adds extra words to the vortex to increase the challenge.
              </p>
            </section>

            {/* Phase 1 */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Phase 1: Word Collection
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                In the first phase, your goal is to collect all the words needed for the <span className="font-semibold text-emerald-600 dark:text-emerald-400">Mystery Quote</span>:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                <li>The <span className="font-semibold text-purple-600 dark:text-purple-400">Hint Phrase</span> is displayed at the top to give you context</li>
                <li>Words from both the Mystery Quote and the Hint Phrase swirl together in the central vortex</li>
                <li>Drag words from the vortex to the <span className="font-semibold text-blue-600 dark:text-blue-400">blue collection area</span> in the middle</li>
                <li>Don&apos;t worry about word order yet - just collect all the words you think belong in the Mystery Quote</li>
                <li>Words you don&apos;t need can be dismissed by flicking them away from the vortex</li>
                <li>Phase 1 ends automatically when you&apos;ve collected all the required words for the Mystery Quote</li>
              </ul>

              {/* Vortex Speed Control - Moved here from later section */}
              <div className="mt-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Vortex Speed Control</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm">
                  The speed slider on the left side allows you to adjust vortex rotation. Each speed setting has trade-offs:
                </p>
                <div className="space-y-2">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                    <p className="font-semibold text-blue-900 dark:text-blue-300 text-sm mb-1">Slower Speeds (0.0x - 0.75x)</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Words are easier to see and grab, but increasing <span className="font-semibold">fog</span> obscures visibility.
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-600 p-2 rounded">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">Standard Speed (1.0x)</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Balanced gameplay with no fog and no color coding. Required for Pure Rankings on leaderboards.
                    </p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded">
                    <p className="font-semibold text-red-900 dark:text-red-300 text-sm mb-1">Faster Speeds (1.25x - 2.0x)</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Words are harder to catch, but <span className="font-semibold">color coding</span> appears: needed words show <span className="text-emerald-600 dark:text-emerald-400">green</span>, unnecessary words show <span className="text-red-600 dark:text-red-400">red</span>.
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-2 text-xs">
                  <span className="font-semibold">Note:</span> Playing at speeds other than 1.0x moves your score to Boosted Rankings instead of Pure Rankings.
                </p>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mt-3 text-sm">
                <span className="font-semibold">Tip:</span> The Hint Phrase provides valuable clues about the meaning and theme of the Mystery Quote!
              </p>
            </section>

            {/* Phase 2 */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Phase 2: Word Arrangement
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                In the second phase, the vortex disappears and you focus on arranging the Mystery Quote:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                <li>The <span className="font-semibold text-purple-600 dark:text-purple-400">Hint Phrase</span> remains visible at the top to guide you</li>
                <li>Your collected words appear in the <span className="font-semibold text-blue-600 dark:text-blue-400">blue assembly area</span> in the middle</li>
                <li>Drag words to reorder them into the correct sequence</li>
                <li>Arrange the quote from beginning to end, leaving any unnecessary words at the end</li>
                <li>Each word movement costs <span className="font-semibold">0.25 points</span></li>
                <li>Three hint buttons appear below to assist if you get stuck (0.5 points each)</li>
                <li>Correctly placed words highlight in <span className="text-emerald-600 dark:text-emerald-400">green</span>, while unnecessary words show in <span className="text-red-600 dark:text-red-400">red</span></li>
                <li>A thin progress bar below the Mystery Quote header shows your progress (red/yellow/green based on how many consecutive words from the start are correct)</li>
              </ul>

              {/* Hints - Integrated into Phase 2 */}
              <div className="mt-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Phase 2 Hints</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm">
                  Three hint types are available to help if you get stuck. Each hint costs <span className="font-semibold">0.5 points</span>:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4 text-sm">
                  <li><span className="font-semibold">Unneeded Word Hint:</span> Identifies a word that doesn&apos;t belong in the Mystery Quote and <span className="font-semibold">removes it</span> from the assembly area</li>
                  <li><span className="font-semibold">Correct String Hint:</span> Highlights consecutive words that are in correct order <span className="font-semibold">from the beginning</span> of the quote (even a long sequence won&apos;t be highlighted if it doesn&apos;t start from position 1)</li>
                  <li><span className="font-semibold">Next Word Hint:</span> Highlights which word should come immediately after the correct string</li>
                </ul>
              </div>
            </section>

            {/* Bonus Question */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Bonus Question
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                After assembling the Mystery Quote, you&apos;ll face a multiple-choice question about the quote&apos;s source. Answer correctly for a <span className="font-semibold text-emerald-600 dark:text-emerald-400">10% score reduction</span>!
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                <li><span className="font-semibold">Literary quotes:</span> Answer format is Author Name and Book Title</li>
                <li><span className="font-semibold">Historical & Poetry quotes:</span> Answer format is Person&apos;s Name and Year</li>
              </ul>
            </section>

            {/* Scoring */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Scoring System
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Your score is calculated based on efficiency. <span className="font-semibold">Lower scores are better!</span>
              </p>

              <div className="space-y-3">
                {/* Phase 1 Score */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Phase 1 Score (Word Collection)</p>
                  <p className="text-gray-700 dark:text-gray-300 font-mono text-sm mb-2">
                    Phase 1 Score = Words Seen / Unique Words
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400 ml-4">
                    <li><span className="font-semibold">Words Seen:</span> Total word instances viewed from the vortex (including repeats)</li>
                    <li><span className="font-semibold">Unique Words:</span> Total count of all words in both the Mystery Quote and Hint Phrase combined</li>
                  </ul>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    Perfect Phase 1 = 1.0 (saw every word exactly once)
                  </p>
                </div>

                {/* Phase 2 Score */}
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                  <p className="font-semibold text-purple-900 dark:text-purple-300 mb-1">Phase 2 Score (Word Arrangement)</p>
                  <p className="text-gray-700 dark:text-gray-300 font-mono text-sm mb-2">
                    Phase 2 Score = (Reorder Moves × 0.25) + (Hints Used × 0.5)
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400 ml-4">
                    <li><span className="font-semibold">Reorder Moves:</span> Each word movement costs 0.25 points</li>
                    <li><span className="font-semibold">Hints Used:</span> Each hint costs 0.5 points</li>
                  </ul>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    Perfect Phase 2 = 0.0 (no moves or hints needed)
                  </p>
                </div>

                {/* Final Score */}
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <p className="font-semibold text-green-900 dark:text-green-300 mb-1">Final Score</p>
                  <p className="text-gray-700 dark:text-gray-300 font-mono text-sm mb-2">
                    Final Score = (Phase 1 + Phase 2) × Bonus Multiplier
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400 ml-4">
                    <li><span className="font-semibold">Bonus Correct:</span> Reduces your final score by 10% (multiplier = 0.9)</li>
                    <li><span className="font-semibold">Bonus Incorrect:</span> No reduction (multiplier = 1.0)</li>
                  </ul>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    Perfect game = 1.0 final score. Vortex speed doesn&apos;t affect scoring, but playing at speeds other than 1.0x moves you to Boosted Rankings.
                  </p>
                </div>
              </div>
            </section>

            {/* Leaderboards */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Leaderboards & Stats
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Track your progress and compare with other players:
              </p>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Today&apos;s Puzzle & All-Time Best</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400 ml-4">
                    <li><span className="font-semibold text-emerald-600 dark:text-emerald-400">Pure Rankings:</span> First play of each puzzle at standard speed (1.0x only)</li>
                    <li><span className="font-semibold text-purple-600 dark:text-purple-400">Boosted Rankings:</span> Repeat plays or games with adjusted speed (any speed other than 1.0x)</li>
                  </ul>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    All-Time Best shows the top 100 players based on average score across all their games (minimum 10 games required for ranking).
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Personal Stats</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    View your performance history, streaks, and detailed statistics in the Stats page.
                  </p>
                </div>
              </div>
            </section>

            {/* Pro Tips */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Pro Tips
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                <li>Study the Hint Phrase carefully - it provides valuable context for the Mystery Quote&apos;s meaning</li>
                <li>At faster speeds, the color coding (green/red) helps you quickly identify needed words</li>
                <li>In Phase 2, use the progress bar to see if you&apos;re getting warmer (green) or colder (red/yellow)</li>
                <li>Plan your word arrangement carefully to minimize moves and save points</li>
                <li>The Correct String Hint only highlights words starting from position 1 - perfect for getting started</li>
              </ul>
            </section>

            {/* Daily Puzzle & Archive */}
            <section className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Daily Puzzle & Archive
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                A new Wortex puzzle is released every day at midnight in your timezone.
              </p>
              <div className="space-y-2">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Puzzle Archive (Premium Feature)</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Missed a day? The Archive lets you play previous puzzles for practice. Archive scores are tracked and displayed but <span className="font-semibold">do not count</span> towards leaderboards or stats. You can view past puzzle leaderboards to see how other players performed on each puzzle&apos;s original release date.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Visual Distinction</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Puzzles you played on their original release date show <span className="text-green-600 dark:text-green-400 font-semibold">✓ Completed</span> in green, while archive-only plays show <span className="text-amber-600 dark:text-amber-400 font-semibold">✓ Played</span> in amber.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Back Button */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Start Playing
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
